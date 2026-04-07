import { readJson, readText, writeJson, writeText, listFiles, GCS_PATHS } from '../gcs';
import { getTtcList, getReportingStatus } from './reporting-utils';
import { getReportableInstanceKeys } from './form-instance-normalizer';

const DATA_RETENTION_DAYS = 730;
const KEY = 'integrity';

/** Convert UTC datetime string to Eastern timezone display string. */
function utcToEastern(utcStr: string): string {
  const d = new Date(utcStr + ' UTC');
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(/(\d+)\/(\d+)\/(\d+),?\s*/, '$3-$1-$2 ');
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Recursively convert Set instances to Arrays for JSON serialization. */
function convertSetsToArrays(obj: any): void {
  if (!obj || typeof obj !== 'object') return;
  if (obj instanceof Set) return; // handled by parent
  if (Array.isArray(obj)) {
    obj.forEach(convertSetsToArrays);
  } else {
    for (const key of Object.keys(obj)) {
      if (obj[key] instanceof Set) {
        obj[key] = Array.from(obj[key]);
      } else {
        convertSetsToArrays(obj[key]);
      }
    }
  }
}

/**
 * Port of Integrity.load_user_integrity() (Python lines 80-357).
 * Reads all user data, compares enrolled people and organized courses
 * across applicants to find duplicates/matches.
 */
export async function loadUserIntegrity(): Promise<void> {
  const reportingFields: Record<string, string | string[]> = {
    'i_fname': '',
    'i_lname': '',
    'i_enrolled_people': '',
    'i_org_courses': [
      'i_org_course_from_date',
      'i_org_course_to_date',
      'i_org_course_leadteacher',
      'i_org_course_city',
      'i_org_course_state',
      'i_org_course_leadteacher',
    ],
  };

  const ttcList = await getTtcList();

  // Load existing integrity data or start fresh
  let userDataByEmail: any = {};
  try {
    userDataByEmail = await readJson(GCS_PATHS.USER_INTEGRITY_BY_USER);
  } catch {
    // File doesn't exist yet
  }

  // List all user JSON files
  const userFiles = await listFiles(GCS_PATHS.USER_CONFIG_PREFIX);
  const now = new Date();

  for (const file of userFiles) {
    if (!file.name.endsWith('.json') || file.name.includes('/summary/') || file.name.includes('/integrity/')) {
      continue;
    }

    let contents: string;
    try {
      contents = await readText(file.name);
    } catch {
      continue;
    }

    if (!contents || contents.trim() === '') continue;

    let ud: any;
    try {
      ud = JSON.parse(contents);
    } catch {
      continue;
    }

    const ue: string = ud.email || '';
    if (!ue) continue;
    if (!ud.form_data) continue;

    for (const ft of Object.keys(ud.form_data)) {
      if (ft !== 'ttc_application') continue;

      for (const fiRaw of getReportableInstanceKeys(ud.form_data[ft])) {

        const fd: any = { ...ud.form_data[ft][fiRaw] };
        fd.form_instance = fiRaw;

        // Convert last_update_datetime to Eastern (matching user-summary.ts)
        if (fd.last_update_datetime) {
          fd.last_update_datetime_est = utcToEastern(fd.last_update_datetime);
        }

        // Check retention (skip old records) — port of Python line 161
        if (fd.last_update_datetime) {
          const cutoffDate = new Date(now);
          cutoffDate.setDate(cutoffDate.getDate() - DATA_RETENTION_DAYS);
          const lastUpdate = new Date(fd.last_update_datetime);
          if (lastUpdate < cutoffDate) continue;
        }

        // Reporting status
        const [appStatus, evalStatus] = getReportingStatus(
          ft,
          fd.is_form_submitted || false,
          fd.is_form_complete || false,
        );
        fd.app_status = appStatus;
        fd.eval_status = evalStatus;

        // TTC metadata
        if (fd.form_instance_page_data?.i_ttc_country_and_dates) {
          fd.ttc_metadata = ttcList[fd.form_instance_page_data.i_ttc_country_and_dates] || {};
        }

        // Filter data to whitelisted fields only
        if (fd.data) {
          const fdData: any = {};
          for (const [q, qa] of Object.entries(fd.data)) {
            if (q in reportingFields) {
              let qa2 = qa;
              const fieldSpec = reportingFields[q];
              if (qa && typeof qa === 'object' && !Array.isArray(qa) && Array.isArray(fieldSpec)) {
                qa2 = {};
                for (const [tq, tqa] of Object.entries(qa as any)) {
                  if (fieldSpec.includes(tq)) {
                    (qa2 as any)[tq] = tqa;
                  }
                }
              }
              fdData[q] = qa2;
            }
          }
          fd.data = fdData;
        }

        // Extract instance key and optional email — port of Python lines 197-209
        let fiEmail: string | null = null;
        let fi: string;
        if (fiRaw.includes('-')) {
          const fiArr = fiRaw.split('-');
          if (!fiArr[1].includes('@')) {
            fiEmail = fiArr[0];
            fi = fiArr[1];
          } else {
            fi = fiArr[0];
            fiEmail = fiArr[1];
          }
        } else {
          fi = fiRaw;
        }

        // Store in userDataByEmail
        if (!(ue in userDataByEmail)) userDataByEmail[ue] = {};
        if (!(ft in userDataByEmail[ue])) {
          userDataByEmail[ue][ft] = {};
          userDataByEmail[ue][ft][KEY] = {};
        }
        if (!(fi in userDataByEmail[ue][ft])) userDataByEmail[ue][ft][fi] = {};

        if (fiEmail) {
          userDataByEmail[ue][ft][fi][fiEmail] = fd;
        } else {
          userDataByEmail[ue][ft][fi] = fd;
        }
      }
    }
  }

  // [KEYRESET] Clear past matches — port of Python lines 226-230
  for (const e of Object.keys(userDataByEmail)) {
    if ('ttc_application' in userDataByEmail[e]) {
      if (!(KEY in userDataByEmail[e]['ttc_application'])) {
        userDataByEmail[e]['ttc_application'][KEY] = {};
      }
      userDataByEmail[e]['ttc_application'][KEY]['enrolled_matches'] = {};
      userDataByEmail[e]['ttc_application'][KEY]['org_course_matches'] = {};
    }
  }

  // Enrolled people matching (O(n²)) — port of Python lines 235-283
  for (const c1e of Object.keys(userDataByEmail)) {
    const c1TtcApp = userDataByEmail[c1e]['ttc_application'];
    if (!c1TtcApp) continue;

    for (const c1fi of getReportableInstanceKeys(c1TtcApp, [KEY])) {

      const c1 = c1TtcApp[c1fi];
      const c1d = c1?.data || {};

      const c1fn = (c1d.i_fname || '').trim().toLowerCase();
      const c1ln = (c1d.i_lname || '').trim().toLowerCase();
      const c1n = c1fn + ' ' + c1ln;

      for (const c2e of Object.keys(userDataByEmail)) {
        if (c1e === c2e) continue;

        const c2TtcApp = userDataByEmail[c2e]['ttc_application'];
        if (!c2TtcApp) continue;

        for (const c2fi of Object.keys(c2TtcApp)) {
          const c2 = c2TtcApp[c2fi];
          const c2d = c2?.data || {};

          const c2fn = (c2d.i_fname || '').trim().toLowerCase();
          const c2ln = (c2d.i_lname || '').trim().toLowerCase();
          const c2n = c2fn + ' ' + c2ln;

          if (c1n === c2n) continue;

          // Enrolled people matching
          const c1Enrolled = c1d.i_enrolled_people;
          const c2Enrolled = c2d.i_enrolled_people;

          if (Array.isArray(c1Enrolled) && Array.isArray(c2Enrolled)) {
            for (const c1en of c1Enrolled) {
              for (const c2en of c2Enrolled) {
                let isMatched = false;
                const ee1 = (c1en.i_enrollment_email || '').trim().toLowerCase();
                const ee2 = (c2en.i_enrollment_email || '').trim().toLowerCase();
                const en1 = (c1en.i_enrollment_name || '').trim().toLowerCase();
                const en2 = (c2en.i_enrollment_name || '').trim().toLowerCase();
                const ec1 = (c1en.i_enrollment_city || '').trim().toLowerCase();
                const ec2 = (c2en.i_enrollment_city || '').trim().toLowerCase();
                const es1 = (c1en.i_enrollment_state || '').trim().toLowerCase();
                const es2 = (c2en.i_enrollment_state || '').trim().toLowerCase();

                if (ee1.includes('@') && ee1 === ee2) isMatched = true;
                if (en1 === en2 && ec1 === ec2 && es1 === es2) isMatched = true;

                if (isMatched) {
                  if (!(KEY in userDataByEmail[c1e]['ttc_application'])) {
                    userDataByEmail[c1e]['ttc_application'][KEY] = {};
                  }
                  if (!('enrolled_matches' in userDataByEmail[c1e]['ttc_application'][KEY])) {
                    userDataByEmail[c1e]['ttc_application'][KEY]['enrolled_matches'] = {};
                  }
                  const matches = userDataByEmail[c1e]['ttc_application'][KEY]['enrolled_matches'];
                  if (!(c2e in matches)) {
                    matches[c2e] = new Set<string>();
                  }
                  matches[c2e].add(`${en2} <${ee2}>`);
                }
              }
            }
          }

          // Org course matching — port of Python lines 285-337
          const c1OrgCourses = c1d.i_org_courses;
          const c2OrgCourses = c2d.i_org_courses;

          if (Array.isArray(c1OrgCourses) && Array.isArray(c2OrgCourses)) {
            for (const c1oc of c1OrgCourses) {
              const ofd1 = (c1oc.i_org_course_from_date || '').trim();
              const otd1 = (c1oc.i_org_course_to_date || '').trim();
              const oc1 = (c1oc.i_org_course_city || '').trim().toLowerCase();
              const os1 = (c1oc.i_org_course_state || '').trim().toLowerCase();
              const olt1 = (c1oc.i_org_course_leadteacher || '').trim().toLowerCase();

              const re1 = olt1.match(/^[^a-z]{0,3}([a-z]+ [a-z]+)/i);
              const oltn1 = re1 ? re1[1] : '';

              for (const c2oc of c2OrgCourses) {
                let isMatched = false;
                const ofd2 = (c2oc.i_org_course_from_date || '').trim();
                const otd2 = (c2oc.i_org_course_to_date || '').trim();
                const oc2 = (c2oc.i_org_course_city || '').trim().toLowerCase();
                const os2 = (c2oc.i_org_course_state || '').trim().toLowerCase();
                const olt2 = (c2oc.i_org_course_leadteacher || '').trim().toLowerCase();

                const re2 = olt2.match(/^[^a-z]{0,3}([a-z]+ [a-z]+)/i);
                const oltn2 = re2 ? re2[1] : '';

                if (
                  (ofd1 === ofd2 || otd1 === otd2) &&
                  oc1 === oc2 &&
                  os1 === os2 &&
                  oltn1 &&
                  oltn2 &&
                  (oltn1 === oltn2 || olt1.includes(oltn2) || olt2.includes(oltn1))
                ) {
                  isMatched = true;
                }

                if (isMatched) {
                  if (!(KEY in userDataByEmail[c1e]['ttc_application'])) {
                    userDataByEmail[c1e]['ttc_application'][KEY] = {};
                  }
                  if (!('org_course_matches' in userDataByEmail[c1e]['ttc_application'][KEY])) {
                    userDataByEmail[c1e]['ttc_application'][KEY]['org_course_matches'] = {};
                  }
                  const matches = userDataByEmail[c1e]['ttc_application'][KEY]['org_course_matches'];
                  if (!(c2e in matches)) {
                    matches[c2e] = new Set<string>();
                  }
                  matches[c2e].add(`${ofd2} - ${otd2} (${oc2}, ${os2} - ${oltn2})`);
                }
              }
            }
          }
        }
      }
    }
  }

  // Convert Sets to Arrays for JSON serialization
  convertSetsToArrays(userDataByEmail);

  await writeJson(GCS_PATHS.USER_INTEGRITY_BY_USER, userDataByEmail);
}

/**
 * Port of Integrity.post_load_user_integrity() (Python lines 359-400).
 * Generates CSV of applicants and their enrolled people.
 */
export async function postLoadUserIntegrity(): Promise<void> {
  let userDataByEmail: any = {};
  try {
    userDataByEmail = await readJson(GCS_PATHS.USER_INTEGRITY_BY_USER);
  } catch {
    // File doesn't exist
  }

  let enrolledCSV = 'Applicant Name,Applicant Email,Enrolled Name,Enrolled Email\n';

  for (const c1e of Object.keys(userDataByEmail)) {
    const ttcApp = userDataByEmail[c1e]['ttc_application'];
    if (!ttcApp) continue;

    for (const c1fi of getReportableInstanceKeys(ttcApp, [KEY])) {

      const c1 = ttcApp[c1fi];
      const c1d = c1?.data || {};

      const c1fn = (c1d.i_fname || '').trim().toLowerCase();
      const c1ln = (c1d.i_lname || '').trim().toLowerCase();
      const c1n = c1fn + ' ' + c1ln;

      enrolledCSV += `${c1n},${c1e},,\n`;

      const enrolledPeople = c1d.i_enrolled_people;
      if (Array.isArray(enrolledPeople)) {
        for (const c1en of enrolledPeople) {
          const ee1 = (c1en.i_enrollment_email || '').trim().toLowerCase();
          const en1 = (c1en.i_enrollment_name || '').trim().toLowerCase();
          enrolledCSV += `,,${en1},${ee1}\n`;
        }
      }
    }
  }

  // Normalize unicode to ASCII — port of unicodedata.normalize('NFKD', ...).encode('ascii', 'ignore')
  enrolledCSV = enrolledCSV.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  await writeText(GCS_PATHS.APPLICANT_ENROLLED_LIST, enrolledCSV);
}

/**
 * Port of Integrity.get_user_integrity_by_user() (Python lines 74-78).
 * Reads the integrity JSON from GCS.
 */
export async function getUserIntegrityByUser(): Promise<unknown> {
  return readJson(GCS_PATHS.USER_INTEGRITY_BY_USER);
}
