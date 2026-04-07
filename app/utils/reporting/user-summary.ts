/**
 * Port of reporting/user_summary.py — load_user_summary()
 *
 * Reads all user data from GCS, matches evaluations to applicants using
 * Levenshtein + name decomposition, computes reporting status, and writes
 * aggregated summary files.
 */

import { readJson, writeJson, listFiles, getFileMetadata, GCS_PATHS } from '../gcs';
import { getReportingStatus, getTtcList } from './reporting-utils';
import { levenshteinB } from './matching';

const KEY = 'reporting';
const DATA_RETENTION_DAYS = 730;

// Port of pyutils/utils.py str_remove_prefix
function strRemovePrefix(str: string, prefix: string): string {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}

// UTC to Eastern timezone conversion — simplified (no DST rule replication,
// just use JS Intl for America/New_York)
function utcToEastern(utcStr: string): string {
  const d = new Date(utcStr + ' UTC');
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(/(\d+)\/(\d+)\/(\d+),?\s*/, '$3-$1-$2 ');
}

// JSON serializer that converts Set to Array (port of json_dumps_set_default)
function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Set) return Array.from(value);
  return value;
}

// Whitelist of fields to keep in reporting output (Python lines 77-117)
const REPORTING_FIELDS = new Set([
  'dates', 'Dates',
  'i_address_city', 'i_address_state', 'i_address_country',
  'i_cellphone', 'i_course_start', 'i_course_wishlist',
  'i_course_wishlist_artexcel', 'i_course_wishlist_hp',
  'i_course_wishlist_yes', 'i_course_wishlist_yp',
  'i_email_aol', 'i_email_other', 'i_enrollment',
  'i_fname', 'i_homephone', 'i_last1year_introtalks',
  'i_lname', 'i_name', 'i_prettc_date', 'i_prettc_location',
  'i_prettc_teacher', 'i_special_interest_groups',
  'i_ttc_country_and_dates', 'i_ttc_graduate_name',
  'i_volunteer_email', 'i_volunteer_name',
  'i_volunteer_teaching_readiness', 'i_youthteacher',
  'i_ttc_dates', 'i_ttc_location', 'i_date_of_birth',
  'i_gender', 'i_health_psychiatrist', 'i_volunteer_mental_fitness',
  'i_course_organized_count', 'i_course_assisted_count',
  'i_volunteer_rating_1', 'i_volunteer_rating_2', 'i_volunteer_rating_3',
  'i_volunteer_rating_4', 'i_volunteer_rating_5', 'i_volunteer_rating_6',
]);

interface FormInstanceData {
  data: Record<string, unknown>;
  form_instance_page_data?: Record<string, unknown>;
  form_instance?: string;
  last_update_datetime?: string;
  last_update_datetime_est?: string;
  is_form_submitted?: boolean;
  is_form_complete?: boolean;
  ttc_metadata?: Record<string, unknown>;
  email?: string;
  reporting: Record<string, unknown>;
  [key: string]: unknown;
}

type UserDataByEmail = Record<string, Record<string, unknown>>;

/**
 * Port of Reporting.load_user_summary()
 */
export async function loadUserSummary(): Promise<void> {
  const ttcList = await getTtcList();

  // Load existing summary (or start empty)
  let userDataByEmail: UserDataByEmail = {};
  let minUpdatedDatetime: Date | undefined;

  try {
    const fileMeta = await getFileMetadata(GCS_PATHS.USER_SUMMARY_BY_USER);
    const fileUpdated = fileMeta.timeCreated;
    minUpdatedDatetime = new Date(fileUpdated.getTime() - 60 * 60 * 1000);

    userDataByEmail = (await readJson(GCS_PATHS.USER_SUMMARY_BY_USER)) as UserDataByEmail;
  } catch {
    // NotFoundError — start with empty dict
    userDataByEmail = {};
    minUpdatedDatetime = undefined;
  }

  // List user JSON files from GCS
  const userFiles = await listFiles(GCS_PATHS.USER_CONFIG_PREFIX, minUpdatedDatetime);

  const now = new Date();
  const retentionCutoff = new Date(now.getTime() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const retentionCutoffStr = retentionCutoff.toISOString().replace('T', ' ').slice(0, 19);

  for (const file of userFiles) {
    if (!file.name.endsWith('.json') || file.name.includes('/summary/') || file.name.includes('/integrity/')) {
      continue;
    }

    try {
      // Re-read the raw JSON — we need to parse form_data structure
      const raw = await readJson(file.name) as Record<string, unknown>;
      if (!raw) continue;

      const userEmail = (raw['email'] as string) || '';

      if (!('form_data' in raw)) continue;
      const formData = raw['form_data'] as Record<string, Record<string, FormInstanceData>>;

      for (const ft of Object.keys(formData)) {
        for (const fiRaw of Object.keys(formData[ft])) {
          if (fiRaw === 'default') continue;

          const fd: FormInstanceData = { ...formData[ft][fiRaw] };
          fd['form_instance'] = fiRaw;
          fd[KEY] = {};

          // Convert last_update_datetime to Eastern
          if (fd['last_update_datetime']) {
            fd['last_update_datetime_est'] = utcToEastern(fd['last_update_datetime'] as string);
          }

          // Skip records older than retention period
          if ((fd['last_update_datetime_est'] as string) < retentionCutoffStr) {
            continue;
          }

          // Calculate initial reporting status
          const [appStatus, evalStatus] = getReportingStatus(
            ft,
            fd['is_form_submitted'] ?? false,
            fd['is_form_complete'] ?? false,
          );
          fd[KEY]['reporting_status'] = appStatus;
          fd[KEY]['evaluations_reporting_status'] = evalStatus;

          // Attach TTC metadata
          if (fd['form_instance_page_data'] && 'i_ttc_country_and_dates' in fd['form_instance_page_data']) {
            const ttcKey = (fd['form_instance_page_data'] as Record<string, unknown>)['i_ttc_country_and_dates'] as string;
            fd['ttc_metadata'] = ttcList[ttcKey] || {};
          }

          // Filter data fields to reporting whitelist + count prereqs/lists
          fd[KEY]['prereq_no_count'] = 0;
          if (fd['data']) {
            const fdData: Record<string, unknown> = {};
            for (const [q, qa] of Object.entries(fd['data'])) {
              if (REPORTING_FIELDS.has(q)) {
                fdData[q] = qa;
              }
              // Count prerequisites answered as "no"
              if (/^i_prereq\d+$/.test(q) && typeof qa === 'string' && qa === 'no') {
                fd[KEY]['prereq_no_count'] = (fd[KEY]['prereq_no_count'] as number) + 1;
              }
              // Count list lengths
              if (Array.isArray(qa)) {
                fd[KEY][strRemovePrefix(q, 'i_') + '_count'] = qa.length;
              }
            }
            fd['data'] = fdData;
          }

          // Parse form_instance key for email extraction (Python lines 223-235)
          let fiEmail: string | null = null;
          let fi: string;
          if (fiRaw.includes('-')) {
            const fiArr = fiRaw.split('-');
            if (fiArr.length >= 2 && !fiArr[1].includes('@')) {
              fiEmail = fiArr[0];
              fi = fiArr[1];
            } else {
              fi = fiArr[0];
              fiEmail = fiArr[1] || null;
            }
          } else {
            fi = fiRaw;
            // For evaluation forms without email in instance key, use the
            // logged-in user's email — matches Python pattern where evaluation
            // instance keys contain the evaluator email (e.g. TTC_KEY-email)
            if (ft === 'ttc_evaluation') {
              fiEmail = userEmail;
            }
          }

          // Build nested structure
          if (!(userEmail in userDataByEmail)) {
            userDataByEmail[userEmail] = {};
          }
          if (!(ft in userDataByEmail[userEmail])) {
            (userDataByEmail[userEmail] as Record<string, unknown>)[ft] = {};
            ((userDataByEmail[userEmail] as Record<string, Record<string, unknown>>)[ft] as Record<string, unknown>)[KEY] = {};
          }
          const ftData = (userDataByEmail[userEmail] as Record<string, Record<string, unknown>>)[ft] as Record<string, unknown>;
          if (!(fi in ftData)) {
            ftData[fi] = {};
          }

          if (fiEmail) {
            (ftData[fi] as Record<string, unknown>)[fiEmail] = fd;
          } else {
            ftData[fi] = fd;
          }
        }
      }
    } catch {
      continue;
    }
  }

  // [START KEYRESET] Clear past evaluation assignments
  for (const e of Object.keys(userDataByEmail)) {
    const userEntry = userDataByEmail[e] as Record<string, Record<string, unknown>>;
    if ('ttc_application' in userEntry) {
      const ttcApp = userEntry['ttc_application'] as Record<string, unknown>;
      const ttcAppReporting = ttcApp[KEY] as Record<string, unknown>;
      ttcAppReporting['lifetime_evaluations'] = {};
      ttcAppReporting['lifetime_eval_teaching_readiness'] = {};
      ttcAppReporting['lifetime_eval_teaching_readiness_not_ready_now_count'] = 0;
      ttcAppReporting['lifetime_evaluator_ratings_below_3'] = 0;
      ttcAppReporting['lifetime_evaluations_submitted_count'] = 0;
      ttcAppReporting['lifetime_latest_evaluation_datetime_est'] = '';

      for (const fi of Object.keys(ttcApp)) {
        const fiData = ttcApp[fi] as Record<string, unknown>;
        if (fi !== KEY && KEY in fiData) {
          const fiReporting = fiData[KEY] as Record<string, unknown>;
          fiReporting['evaluations'] = {};
          fiReporting['eval_teaching_readiness'] = {};
          fiReporting['eval_teaching_readiness_not_ready_now_count'] = 0;
          fiReporting['evaluator_ratings_below_3'] = 0;
          fiReporting['evaluations_submitted_count'] = 0;
          fiReporting['latest_evaluation_datetime_est'] = '';
        }
      }
    }

    for (const fi of Object.keys(userEntry['ttc_evaluation'] || {})) {
      const ttcEval = (userEntry['ttc_evaluation'] as Record<string, Record<string, unknown>>)[fi] as Record<string, unknown>;
      for (const ve of Object.keys(ttcEval)) {
        const veReporting = (ttcEval[ve] as Record<string, unknown>)?.[KEY] as Record<string, unknown> | undefined;
        if (!veReporting) continue;
        veReporting['lifetime_reporting_matched_ttc_list'] = new Set<string>();
        veReporting['is_reporting_matched'] = 'N';
      }
    }

    if ('post_ttc_self_evaluation_form' in userEntry) {
      const selfEval = userEntry['post_ttc_self_evaluation_form'] as Record<string, unknown>;
      const selfEvalReporting = selfEval?.[KEY] as Record<string, unknown> | undefined;
      if (selfEvalReporting) {
        selfEvalReporting['evaluations'] = {};
        selfEvalReporting['evaluations_submitted_count'] = 0;
        selfEvalReporting['latest_evaluation_datetime_est'] = '';
      }
    }

    for (const fi of Object.keys(userEntry['post_ttc_feedback_form'] || {})) {
      const feedback = (userEntry['post_ttc_feedback_form'] as Record<string, Record<string, unknown>>)[fi] as Record<string, unknown>;
      for (const ve of Object.keys(feedback)) {
        const veReporting = (feedback[ve] as Record<string, unknown>)?.[KEY] as Record<string, unknown> | undefined;
        if (!veReporting) continue;
        veReporting['is_reporting_matched'] = 'N';
      }
    }

    if ('post_sahaj_ttc_self_evaluation_form' in userEntry) {
      const selfEval = userEntry['post_sahaj_ttc_self_evaluation_form'] as Record<string, unknown>;
      const selfEvalReporting = selfEval?.[KEY] as Record<string, unknown> | undefined;
      if (selfEvalReporting) {
        selfEvalReporting['evaluations'] = {};
        selfEvalReporting['evaluations_submitted_count'] = 0;
        selfEvalReporting['latest_evaluation_datetime_est'] = '';
      }
    }

    for (const fi of Object.keys(userEntry['post_sahaj_ttc_feedback_form'] || {})) {
      const feedback = (userEntry['post_sahaj_ttc_feedback_form'] as Record<string, Record<string, unknown>>)[fi] as Record<string, unknown>;
      for (const ve of Object.keys(feedback)) {
        const veReporting = (feedback[ve] as Record<string, unknown>)?.[KEY] as Record<string, unknown> | undefined;
        if (!veReporting) continue;
        veReporting['is_reporting_matched'] = 'N';
      }
    }
  }
  // [END KEYRESET]

  // [START] Evaluation matching — O(n^2) loop
  for (const t of Object.keys(userDataByEmail)) {
    const userT = userDataByEmail[t] as Record<string, Record<string, unknown>>;

    for (const fi of Object.keys(userT['ttc_evaluation'] || {})) {
      if (fi === 'default') continue;
      const ttcEvalFi = (userT['ttc_evaluation'] as Record<string, unknown>)[fi] as Record<string, unknown>;

      for (const ve of Object.keys(ttcEvalFi)) {
        if (ve === KEY) continue;
        const eRaw = ttcEvalFi[ve];
        if (!eRaw || typeof eRaw !== 'object') continue;
        const e = eRaw as Record<string, unknown>;
        e['email'] = t;
        const ed = { ...(e['data'] as Record<string, unknown> || {}), ...(e['form_instance_page_data'] as Record<string, unknown> || {}) };
        const vn = String(ed['i_volunteer_name'] || '').trim().toLowerCase();
        const tn = String(ed['i_name'] || '').trim();
        if (!e[KEY]) e[KEY] = {};
        (e[KEY] as Record<string, unknown>)['is_reporting_matched'] = 'N';

        for (const c of Object.keys(userDataByEmail)) {
          const userC = userDataByEmail[c] as Record<string, Record<string, unknown>>;
          if (!('ttc_application' in userC)) continue;
          const ttcAppC = userC['ttc_application'] as Record<string, unknown>;

          for (const afi of Object.keys(ttcAppC)) {
            if (afi === KEY) continue;
            const a = ttcAppC[afi] as Record<string, unknown>;
            const ad = (a['data'] as Record<string, unknown>) || {};
            const afn = String(ad['i_fname'] || '').trim().toLowerCase();
            const aln = String(ad['i_lname'] || '').trim().toLowerCase();

            // Name decomposition
            const afnArr = afn.split(/\s+/);
            let afn2 = '', afn3 = '', aln2 = '';
            if (afn && afnArr.length > 1) {
              afn2 = afnArr[0].replace(/[^a-zA-Z0-9]/g, '');
              afn3 = afnArr[1].replace(/[^a-zA-Z0-9]/g, '');
              aln2 = aln.split(/\s+/).pop() || '';
            }

            const alnArr = aln.split(/\s+/);
            let aln4 = '', aln5 = '';
            if (aln && alnArr.length > 1) {
              aln4 = alnArr[0].replace(/[^a-zA-Z0-9]/g, '');
              aln5 = alnArr[1].replace(/[^a-zA-Z0-9]/g, '');
            }

            // Determine comparison names based on volunteer name word count
            let an: string, an2: string, an3: string, an4: string, an5: string;
            if (vn.split(/\s+/).length === 1 && ve.includes('@')) {
              an = afn;
              an2 = afn2;
              an3 = afn3;
              an4 = '';
              an5 = '';
            } else {
              an = afn + ' ' + aln;
              if (afn2 && afn3 && aln2) {
                an2 = afn2 + ' ' + aln2;
                an3 = afn3 + ' ' + aln2;
              } else {
                an2 = '';
                an3 = '';
              }
              if (aln4 && aln5) {
                an4 = afn + ' ' + aln4;
                an5 = afn + ' ' + aln5;
              } else {
                an4 = '';
                an5 = '';
              }
            }

            const aea = String(ad['i_email_aol'] || '').trim().toLowerCase();
            const aeo = String(ad['i_email_other'] || '').trim().toLowerCase();

            // Match criteria (port of Python lines 378-425)
            if (
              (ve.toLowerCase() === c.toLowerCase()) ||
              (aea && ve.toLowerCase() === aea) ||
              (aeo && ve.toLowerCase() === aeo) ||
              (vn && levenshteinB(an, vn, 1, true)) ||
              (ve && !ve.includes('@') && vn && levenshteinB(an, vn + ' ' + ve, 1, true)) ||
              (ve && !ve.includes('@') && levenshteinB(an, ve, 1, true)) ||
              (an2 && an2 !== an && vn && levenshteinB(an2, vn, 1, true)) ||
              (an2 && an2 !== an && ve && !ve.includes('@') && vn && levenshteinB(an2, vn + ' ' + ve, 1, true)) ||
              (an2 && an2 !== an && ve && !ve.includes('@') && levenshteinB(an2, ve, 1, true)) ||
              (an3 && an3 !== an && vn && levenshteinB(an3, vn, 1, true)) ||
              (an3 && an3 !== an && ve && !ve.includes('@') && vn && levenshteinB(an3, vn + ' ' + ve, 1, true)) ||
              (an3 && an3 !== an && ve && !ve.includes('@') && levenshteinB(an3, ve, 1, true)) ||
              (an4 && an4 !== an && vn && levenshteinB(an4, vn, 1, true)) ||
              (an4 && an4 !== an && ve && !ve.includes('@') && vn && levenshteinB(an4, vn + ' ' + ve, 1, true)) ||
              (an4 && an4 !== an && ve && !ve.includes('@') && levenshteinB(an4, ve, 1, true)) ||
              (an5 && an5 !== an && vn && levenshteinB(an5, vn, 1, true)) ||
              (an5 && an5 !== an && ve && !ve.includes('@') && vn && levenshteinB(an5, vn + ' ' + ve, 1, true)) ||
              (an5 && an5 !== an && ve && !ve.includes('@') && levenshteinB(an5, ve, 1, true))
            ) {
              // ADD to evaluations (current TTC)
              let processCurrent = false;
              if (fi === afi) {
                const afiReporting = (ttcAppC[afi] as Record<string, unknown>)[KEY] as Record<string, unknown>;
                if (!afiReporting['evaluations']) afiReporting['evaluations'] = {};
                const evaluations = afiReporting['evaluations'] as Record<string, unknown>;
                if (!(t in evaluations)) {
                  evaluations[t] = {};
                }
                if (!(ve in (evaluations[t] as Record<string, unknown>))) {
                  (evaluations[t] as Record<string, unknown>)[ve] = tn;
                  processCurrent = true;
                }
              }

              // ADD to lifetime_evaluations
              let processLifetime = false;
              const ttcAppReporting = ttcAppC[KEY] as Record<string, unknown>;
              if (!ttcAppReporting['lifetime_evaluations']) ttcAppReporting['lifetime_evaluations'] = {};
              const lifetimeEvals = ttcAppReporting['lifetime_evaluations'] as Record<string, unknown>;
              if (!(fi in lifetimeEvals)) lifetimeEvals[fi] = {};
              if (!(t in (lifetimeEvals[fi] as Record<string, unknown>))) {
                (lifetimeEvals[fi] as Record<string, unknown>)[t] = {};
              }
              if (!(ve in ((lifetimeEvals[fi] as Record<string, unknown>)[t] as Record<string, unknown>))) {
                ((lifetimeEvals[fi] as Record<string, unknown>)[t] as Record<string, unknown>)[ve] = tn;
                processLifetime = true;
              }

              // Add latest evaluation datetime
              if (e['last_update_datetime']) {
                const latestEvalDtEst = utcToEastern(e['last_update_datetime'] as string);
                if (processCurrent) {
                  const afiReporting = (ttcAppC[afi] as Record<string, unknown>)[KEY] as Record<string, unknown>;
                  if (String(afiReporting['latest_evaluation_datetime_est'] || '') < latestEvalDtEst) {
                    afiReporting['latest_evaluation_datetime_est'] = latestEvalDtEst;
                  }
                }
                if (processLifetime) {
                  if (String(ttcAppReporting['lifetime_latest_evaluation_datetime_est'] || '') < latestEvalDtEst) {
                    ttcAppReporting['lifetime_latest_evaluation_datetime_est'] = latestEvalDtEst;
                  }
                }
              }

              // If evaluation is submitted, increment counts
              if (e['is_form_submitted']) {
                if (processCurrent) {
                  const afiReporting = (ttcAppC[afi] as Record<string, unknown>)[KEY] as Record<string, unknown>;
                  afiReporting['evaluations_submitted_count'] = ((afiReporting['evaluations_submitted_count'] as number) || 0) + 1;
                }
                if (processLifetime) {
                  ttcAppReporting['lifetime_evaluations_submitted_count'] = ((ttcAppReporting['lifetime_evaluations_submitted_count'] as number) || 0) + 1;
                }

                // Teaching readiness
                const teachingReadiness = String(ed['i_volunteer_teaching_readiness'] || '');
                if (teachingReadiness) {
                  if (processCurrent) {
                    const afiReporting = (ttcAppC[afi] as Record<string, unknown>)[KEY] as Record<string, unknown>;
                    if (!afiReporting['eval_teaching_readiness']) afiReporting['eval_teaching_readiness'] = {};
                    const tr = afiReporting['eval_teaching_readiness'] as Record<string, number>;
                    tr[teachingReadiness] = (tr[teachingReadiness] || 0) + 1;
                  }
                  if (processLifetime) {
                    if (!ttcAppReporting['lifetime_eval_teaching_readiness']) ttcAppReporting['lifetime_eval_teaching_readiness'] = {};
                    const ltr = ttcAppReporting['lifetime_eval_teaching_readiness'] as Record<string, number>;
                    ltr[teachingReadiness] = (ltr[teachingReadiness] || 0) + 1;
                  }

                  if (teachingReadiness !== 'ready_now') {
                    if (processCurrent) {
                      const afiReporting = (ttcAppC[afi] as Record<string, unknown>)[KEY] as Record<string, unknown>;
                      afiReporting['eval_teaching_readiness_not_ready_now_count'] = ((afiReporting['eval_teaching_readiness_not_ready_now_count'] as number) || 0) + 1;
                    }
                    if (processLifetime) {
                      ttcAppReporting['lifetime_eval_teaching_readiness_not_ready_now_count'] = ((ttcAppReporting['lifetime_eval_teaching_readiness_not_ready_now_count'] as number) || 0) + 1;
                    }
                  }
                }

                // Ratings below 3
                for (const q of Object.keys(ed)) {
                  if (q.startsWith('i_volunteer_rating_') && !q.endsWith('_question') && !q.endsWith('_explanation')) {
                    const rating = parseInt(String(ed[q]), 10);
                    if (!isNaN(rating) && rating <= 2) {
                      if (processCurrent) {
                        const afiReporting = (ttcAppC[afi] as Record<string, unknown>)[KEY] as Record<string, unknown>;
                        afiReporting['evaluator_ratings_below_3'] = ((afiReporting['evaluator_ratings_below_3'] as number) || 0) + 1;
                      }
                      if (processLifetime) {
                        ttcAppReporting['lifetime_evaluator_ratings_below_3'] = ((ttcAppReporting['lifetime_evaluator_ratings_below_3'] as number) || 0) + 1;
                      }
                    }
                  }
                }
              }

              // Update reporting status (runs on every match, not just submitted)
              const afiReporting2 = (ttcAppC[afi] as Record<string, unknown>)[KEY] as Record<string, unknown>;
              const [appStatus2, evalStatus2] = getReportingStatus(
                'ttc_application',
                !!(a['is_form_submitted']),
                !!(a['is_form_complete']),
                (afiReporting2['evaluations_submitted_count'] as number) || 0,
                (ttcAppReporting['lifetime_evaluations_submitted_count'] as number) || 0,
              );
              afiReporting2['reporting_status'] = appStatus2;
              afiReporting2['evaluations_reporting_status'] = evalStatus2;

              // Mark evaluation as matched
              if (processCurrent) {
                (e[KEY] as Record<string, unknown>)['is_reporting_matched'] = 'Y';
              }
              (e[KEY] as Record<string, unknown>)['is_lifetime_reporting_matched'] = 'Y';
              ((e[KEY] as Record<string, unknown>)['lifetime_reporting_matched_ttc_list'] as Set<string>).add(afi);
            }
          }
        }
      }
    }

    // [START] Post-TTC feedback matching (Python lines 528-633)
    for (const fi of Object.keys(userT['post_ttc_feedback_form'] || {})) {
      if (fi === 'default') continue;
      const feedbackFi = (userT['post_ttc_feedback_form'] as Record<string, unknown>)[fi] as Record<string, unknown>;

      for (const ve of Object.keys(feedbackFi)) {
        if (ve === KEY) continue;
        const eRaw = feedbackFi[ve];
        if (!eRaw || typeof eRaw !== 'object') continue;
        const e = eRaw as Record<string, unknown>;
        e['email'] = t;
        if (!e[KEY]) e[KEY] = {};
        const ed = { ...(e['data'] as Record<string, unknown> || {}), ...(e['form_instance_page_data'] as Record<string, unknown> || {}) };
        const vn = String(ed['i_ttc_graduate_name'] || '').trim().toLowerCase();
        const tn = String(ed['i_fname'] || '').trim() + ' ' + String(ed['i_lname'] || '').trim();

        for (const c of Object.keys(userDataByEmail)) {
          const userC = userDataByEmail[c] as Record<string, Record<string, unknown>>;
          if (!('post_ttc_self_evaluation_form' in userC)) continue;
          const selfEvalForm = userC['post_ttc_self_evaluation_form'] as Record<string, unknown>;
          if (!selfEvalForm[KEY]) selfEvalForm[KEY] = {};

          for (const sefi of Object.keys(selfEvalForm)) {
            if (sefi === KEY) continue;
            const a = selfEvalForm[sefi] as Record<string, unknown>;
            const ad = (a['data'] as Record<string, unknown>) || {};
            const afn = String(ad['i_fname'] || '').trim().toLowerCase();
            const aln = String(ad['i_lname'] || '').trim().toLowerCase();
            const afn2 = afn.split(/\s+/)[0] || '';
            const aln2 = aln.split(/\s+/).pop() || '';

            let an: string, an2: string;
            if (vn.split(/\s+/).length === 1) {
              an = afn;
              an2 = afn2;
            } else {
              an = afn + ' ' + aln;
              an2 = afn2 + ' ' + aln2;
            }

            const aea = String(ad['i_email_aol'] || '').trim().toLowerCase();
            const aeo = String(ad['i_email_other'] || '').trim().toLowerCase();

            if (
              (ve.toLowerCase() === c.toLowerCase()) ||
              (aea && ve.toLowerCase() === aea) ||
              (aeo && ve.toLowerCase() === aeo) ||
              (vn && levenshteinB(an, vn, 2, true)) ||
              (ve && !ve.includes('@') && vn && levenshteinB(an, vn + ' ' + ve, 2, true)) ||
              (ve && !ve.includes('@') && levenshteinB(an, ve, 1, true)) ||
              (an2 && an !== an2 && vn && levenshteinB(an2, vn, 2, true)) ||
              (an2 && an !== an2 && ve && !ve.includes('@') && vn && levenshteinB(an2, vn + ' ' + ve, 2, true)) ||
              (an2 && an !== an2 && ve && !ve.includes('@') && levenshteinB(an2, ve, 1, true))
            ) {
              const selfEvalReporting = selfEvalForm[KEY] as Record<string, unknown>;
              if (!selfEvalReporting['evaluations']) selfEvalReporting['evaluations'] = {};
              const evals = selfEvalReporting['evaluations'] as Record<string, unknown>;
              if (!(t in evals)) evals[t] = {};
              if (!(fi in (evals[t] as Record<string, unknown>))) (evals[t] as Record<string, unknown>)[fi] = {};
              if (!(ve in ((evals[t] as Record<string, unknown>)[fi] as Record<string, unknown>))) {
                ((evals[t] as Record<string, unknown>)[fi] as Record<string, unknown>)[ve] = tn;
              }

              if (e['is_form_submitted']) {
                selfEvalReporting['evaluations_submitted_count'] = ((selfEvalReporting['evaluations_submitted_count'] as number) || 0) + 1;
                const [appStatus3, evalStatus3] = getReportingStatus(
                  'post_ttc_self_evaluation_form',
                  !!(a['is_form_submitted']),
                  !!(a['is_form_complete']),
                  selfEvalReporting['evaluations_submitted_count'] as number || 0,
                );
                selfEvalReporting['reporting_status'] = appStatus3;
                selfEvalReporting['evaluations_reporting_status'] = evalStatus3;
              }

              (e[KEY] as Record<string, unknown>)['is_reporting_matched'] = 'Y';
            }
          }
        }
      }
    }

    // [START] Post-Sahaj feedback matching (Python lines 636-728)
    for (const fi of Object.keys(userT['post_sahaj_ttc_feedback_form'] || {})) {
      if (fi === 'default') continue;
      const feedbackFi = (userT['post_sahaj_ttc_feedback_form'] as Record<string, unknown>)[fi] as Record<string, unknown>;

      for (const ve of Object.keys(feedbackFi)) {
        if (ve === KEY) continue;
        const eRaw = feedbackFi[ve];
        if (!eRaw || typeof eRaw !== 'object') continue;
        const e = eRaw as Record<string, unknown>;
        e['email'] = t;
        if (!e[KEY]) e[KEY] = {};
        const ed = { ...(e['data'] as Record<string, unknown> || {}), ...(e['form_instance_page_data'] as Record<string, unknown> || {}) };
        const vn = String(ed['i_ttc_graduate_name'] || '').trim().toLowerCase();
        const tn = String(ed['i_fname'] || '').trim() + ' ' + String(ed['i_lname'] || '').trim();

        for (const c of Object.keys(userDataByEmail)) {
          const userC = userDataByEmail[c] as Record<string, Record<string, unknown>>;
          if (!('post_sahaj_ttc_self_evaluation_form' in userC)) continue;
          const selfEvalForm = userC['post_sahaj_ttc_self_evaluation_form'] as Record<string, unknown>;
          if (!selfEvalForm[KEY]) selfEvalForm[KEY] = {};

          for (const sefi of Object.keys(selfEvalForm)) {
            if (sefi === KEY) continue;
            const a = selfEvalForm[sefi] as Record<string, unknown>;
            const ad = (a['data'] as Record<string, unknown>) || {};
            const afn = String(ad['i_fname'] || '').trim().toLowerCase();
            const aln = String(ad['i_lname'] || '').trim().toLowerCase();
            const afn2 = afn.split(/\s+/)[0] || '';
            const aln2 = aln.split(/\s+/).pop() || '';

            let an: string, an2: string;
            if (vn.split(/\s+/).length === 1) {
              an = afn;
              an2 = afn2;
            } else {
              an = afn + ' ' + aln;
              an2 = afn2 + ' ' + aln2;
            }

            const aea = String(ad['i_email_aol'] || '').trim().toLowerCase();
            const aeo = String(ad['i_email_other'] || '').trim().toLowerCase();

            if (
              (ve.toLowerCase() === c.toLowerCase()) ||
              (aea && ve.toLowerCase() === aea) ||
              (aeo && ve.toLowerCase() === aeo) ||
              (vn && levenshteinB(an, vn, 2, true)) ||
              (ve && !ve.includes('@') && vn && levenshteinB(an, vn + ' ' + ve, 2, true)) ||
              (ve && !ve.includes('@') && levenshteinB(an, ve, 1, true)) ||
              (an2 && an !== an2 && vn && levenshteinB(an2, vn, 2, true)) ||
              (an2 && an !== an2 && ve && !ve.includes('@') && vn && levenshteinB(an2, vn + ' ' + ve, 2, true)) ||
              (an2 && an !== an2 && ve && !ve.includes('@') && levenshteinB(an2, ve, 1, true))
            ) {
              const selfEvalReporting = selfEvalForm[KEY] as Record<string, unknown>;
              if (!selfEvalReporting['evaluations']) selfEvalReporting['evaluations'] = {};
              const evals = selfEvalReporting['evaluations'] as Record<string, unknown>;
              if (!(t in evals)) evals[t] = {};
              if (!(fi in (evals[t] as Record<string, unknown>))) (evals[t] as Record<string, unknown>)[fi] = {};
              if (!(ve in ((evals[t] as Record<string, unknown>)[fi] as Record<string, unknown>))) {
                ((evals[t] as Record<string, unknown>)[fi] as Record<string, unknown>)[ve] = tn;
              }

              if (e['is_form_submitted']) {
                selfEvalReporting['evaluations_submitted_count'] = ((selfEvalReporting['evaluations_submitted_count'] as number) || 0) + 1;
                const [appStatus4, evalStatus4] = getReportingStatus(
                  'post_sahaj_ttc_self_evaluation_form',
                  !!(a['is_form_submitted']),
                  !!(a['is_form_complete']),
                  selfEvalReporting['evaluations_submitted_count'] as number || 0,
                );
                selfEvalReporting['reporting_status'] = appStatus4;
                selfEvalReporting['evaluations_reporting_status'] = evalStatus4;
              }

              (e[KEY] as Record<string, unknown>)['is_reporting_matched'] = 'Y';
            }
          }
        }
      }
    }
  }

  // Write output files
  // Convert Sets to Arrays for JSON serialization
  const serialized = JSON.parse(JSON.stringify(userDataByEmail, jsonReplacer));
  await writeJson(GCS_PATHS.USER_SUMMARY_BY_USER, serialized);

  // Generate _by_form_type by inverting key hierarchy
  const byFormType = invertToByFormType(userDataByEmail);
  const serializedByFormType = JSON.parse(JSON.stringify(byFormType, jsonReplacer));
  await writeJson(GCS_PATHS.USER_SUMMARY_BY_FORM_TYPE, serializedByFormType);
}

/**
 * Transform _by_user into _by_form_type by inverting key hierarchy.
 * _by_user:  { email: { formType: { instance: { ...data } } } }
 * _by_form_type: { formType: { instance: { email: { ...data } } } }
 *
 * The legacy Python backend generated by_form_type with FLAT reporting fields at
 * top level (reporting_status, evaluations_reporting_status, etc.) and evaluations
 * as top-level arrays of full form instances. The by_user structure uses a nested
 * 'reporting' sub-key. This function flattens that key during inversion.
 */
function invertToByFormType(byUser: UserDataByEmail): Record<string, Record<string, Record<string, unknown>>> {
  const byFormType: Record<string, Record<string, Record<string, unknown>>> = {};

  for (const email of Object.keys(byUser)) {
    const userEntry = byUser[email] as Record<string, Record<string, unknown>>;
    for (const formType of Object.keys(userEntry)) {
      if (formType === KEY) continue; // Skip 'reporting' key at formType level
      if (!(formType in byFormType)) byFormType[formType] = {};
      const formTypeEntry = userEntry[formType] as Record<string, unknown>;
      for (const instance of Object.keys(formTypeEntry)) {
        if (instance === KEY) continue; // Skip 'reporting' key at instance level
        if (!(instance in byFormType[formType])) byFormType[formType][instance] = {};
        const instanceData = formTypeEntry[instance];
        (byFormType[formType][instance] as Record<string, unknown>)[email] =
          flattenForByFormType(instanceData, byUser, email, formType, instance);
      }
    }
  }

  return byFormType;
}

/**
 * Flatten the 'reporting' sub-key for by_form_type view.
 * Promotes reporting fields to top level, resolves evaluation references
 * into full evaluation form instance arrays.
 */
function flattenForByFormType(
  data: unknown,
  byUser: UserDataByEmail,
  parentEmail: string,
  formType: string,
  instance: string,
): unknown {
  if (typeof data !== 'object' || data === null) return data;

  const obj = data as Record<string, unknown>;

  // Handle fiEmail nesting: { fiEmail: { ...formData } }
  // If the object doesn't have 'data' but has exactly one key whose value has 'data',
  // unwrap one level.
  let unwrapped = obj;
  if (!('data' in obj) && !('reporting' in obj)) {
    const keys = Object.keys(obj);
    if (keys.length === 1 && typeof obj[keys[0]] === 'object' && obj[keys[0]] !== null) {
      const inner = obj[keys[0]] as Record<string, unknown>;
      if ('data' in inner || KEY in inner) {
        unwrapped = inner;
      }
    }
  }

  if (!(KEY in unwrapped)) return unwrapped; // No reporting key to flatten

  const reporting = unwrapped[KEY] as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  // Copy all top-level fields except 'reporting'
  for (const [k, v] of Object.entries(unwrapped)) {
    if (k !== KEY) result[k] = v;
  }

  // Promote reporting fields to top level
  for (const [k, v] of Object.entries(reporting)) {
    if (k === 'evaluations' && formType === 'ttc_application') {
      // Convert evaluation references to array of full evaluation instances
      result['evaluations'] = resolveEvaluationReferences(v, byUser, instance);
    } else if (k === 'lifetime_evaluations') {
      // Skip — lifetime_evaluations is at formType level, resolved separately below
    } else if (k === 'lifetime_reporting_matched_ttc_list' && v instanceof Set) {
      result[k] = Array.from(v as Set<unknown>);
    } else if (k === 'evaluations_submitted_count' || k === 'latest_evaluation_datetime_est') {
      // Only promote per-instance fields, not lifetime
    } else {
      result[k] = v;
    }
  }

  // Build lifetime_evaluations from formType-level reporting.lifetime_evaluations
  if (formType === 'ttc_application') {
    const formTypeReporting = ((byUser[parentEmail] as Record<string, Record<string, unknown>>)[formType]?.[KEY]) as Record<string, unknown> | undefined;
    if (formTypeReporting?.lifetime_evaluations) {
      result['lifetime_evaluations'] = resolveLifetimeEvaluationReferences(
        formTypeReporting.lifetime_evaluations, byUser,
      );
    }
  }

  return result;
}

/**
 * Resolve evaluation references { evaluatorEmail: { ve: name } } into
 * full evaluation form instances from the by_user ttc_evaluation data.
 */
function resolveEvaluationReferences(
  evaluationsRef: unknown,
  byUser: UserDataByEmail,
  ttcInstance: string,
): unknown[] {
  if (!evaluationsRef || typeof evaluationsRef !== 'object') return [];
  const result: unknown[] = [];
  const ref = evaluationsRef as Record<string, unknown>;

  for (const evaluatorEmail of Object.keys(ref)) {
    const veMap = ref[evaluatorEmail] as Record<string, unknown>;
    for (const veKey of Object.keys(veMap)) {
      const evalInstance = lookupEvaluation(byUser, evaluatorEmail, ttcInstance, veKey);
      if (evalInstance) result.push(evalInstance);
    }
  }

  return result;
}

/**
 * Resolve lifetime evaluation references { fi: { evaluatorEmail: { ve: name } } }
 * into full evaluation form instances.
 */
function resolveLifetimeEvaluationReferences(
  lifetimeRef: unknown,
  byUser: UserDataByEmail,
): unknown[] {
  if (!lifetimeRef || typeof lifetimeRef !== 'object') return [];
  const result: unknown[] = [];
  const ref = lifetimeRef as Record<string, unknown>;

  for (const fi of Object.keys(ref)) {
    const emailMap = ref[fi] as Record<string, unknown>;
    for (const evaluatorEmail of Object.keys(emailMap)) {
      const veMap = emailMap[evaluatorEmail] as Record<string, unknown>;
      for (const veKey of Object.keys(veMap)) {
        const evalInstance = lookupEvaluation(byUser, evaluatorEmail, fi, veKey);
        if (evalInstance) result.push(evalInstance);
      }
    }
  }

  return result;
}

/**
 * Look up a specific evaluation form instance from the by_user data
 * and flatten its reporting key for the by_form_type view.
 */
function lookupEvaluation(
  byUser: UserDataByEmail,
  evaluatorEmail: string,
  fi: string,
  veKey: string,
): unknown | null {
  try {
    const evaluatorEntry = byUser[evaluatorEmail] as Record<string, Record<string, unknown>> | undefined;
    if (!evaluatorEntry) return null;
    const ttcEval = evaluatorEntry['ttc_evaluation'] as Record<string, unknown> | undefined;
    if (!ttcEval) return null;
    const fiEntry = ttcEval[fi] as Record<string, unknown> | undefined;
    if (!fiEntry) return null;
    const evalData = fiEntry[veKey] as Record<string, unknown> | undefined;
    if (!evalData) return null;

    // Flatten reporting key for the evaluation instance
    if (KEY in evalData) {
      const reporting = evalData[KEY] as Record<string, unknown>;
      const flattened: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(evalData)) {
        if (k !== KEY) flattened[k] = v;
      }
      for (const [k, v] of Object.entries(reporting)) {
        if (k === 'lifetime_reporting_matched_ttc_list' && v instanceof Set) {
          flattened[k] = Array.from(v as Set<unknown>);
        } else {
          flattened[k] = v;
        }
      }
      return flattened;
    }
    return evalData;
  } catch {
    return null;
  }
}

/**
 * Read the user summary by user file from GCS.
 */
export async function getUserSummaryByUser(): Promise<string> {
  const data = await readJson(GCS_PATHS.USER_SUMMARY_BY_USER);
  return JSON.stringify(data);
}
