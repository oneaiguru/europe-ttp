import { readJson, GCS_PATHS } from '../gcs';

export const ReportingStatus = {
  SUBMITTED: 'submitted',
  FILLED: 'filled',
  IN_PROGRESS: 'in progress',
  PENDING: 'pending',
  COMPLETE: 'complete',
  COMPLETE_LIFETIME: 'complete (lifetime)',
  INCOMPLETE: 'incomplete',
} as const;

export type ReportingStatusValue = typeof ReportingStatus[keyof typeof ReportingStatus];

/**
 * Port of reporting_utils.get_reporting_status (lines 25-54)
 * Returns [appStatus, evalStatus]
 */
export function getReportingStatus(
  formType: string,
  isFormSubmitted: boolean,
  isFormComplete: boolean,
  noOfSubmittedEvals: number = 0,
  noOfLifetimeSubmittedEvals: number = 0,
): [string, string] {
  let appStatus: string;
  if (isFormSubmitted) {
    appStatus = ReportingStatus.SUBMITTED;
  } else if (isFormComplete) {
    appStatus = ReportingStatus.FILLED;
  } else {
    appStatus = ReportingStatus.IN_PROGRESS;
  }

  let evalStatus: string = ReportingStatus.INCOMPLETE;
  if (formType === 'ttc_application') {
    if (noOfSubmittedEvals >= 3) {
      evalStatus = ReportingStatus.COMPLETE;
      if (isFormSubmitted) {
        appStatus = ReportingStatus.COMPLETE;
      }
    } else if (noOfLifetimeSubmittedEvals >= 3) {
      evalStatus = ReportingStatus.COMPLETE_LIFETIME;
      if (isFormSubmitted) {
        appStatus = ReportingStatus.COMPLETE_LIFETIME;
      }
    }
  } else if (formType === 'post_ttc_self_evaluation_form') {
    if (noOfSubmittedEvals >= 1) {
      evalStatus = ReportingStatus.SUBMITTED;
      if (isFormSubmitted) {
        appStatus = ReportingStatus.COMPLETE;
      }
    }
  } else if (formType === 'post_sahaj_ttc_self_evaluation_form') {
    if (noOfSubmittedEvals >= 1) {
      evalStatus = ReportingStatus.SUBMITTED;
      if (isFormSubmitted) {
        appStatus = ReportingStatus.COMPLETE;
      }
    }
  }

  return [appStatus, evalStatus];
}

export async function getTtcList(): Promise<Record<string, Record<string, unknown>>> {
  const raw = (await readJson(GCS_PATHS.TTC_COUNTRY_AND_DATES)) as Array<Record<string, unknown>>;
  const ttcList: Record<string, Record<string, unknown>> = {};
  for (const ttc of raw) {
    ttcList[ttc.value as string] = ttc;
  }
  return ttcList;
}
