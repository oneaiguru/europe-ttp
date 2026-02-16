export const TTC_APPLICATION_NON_US_FORM_TITLE = 'TTC Application';
export const TTC_APPLICATION_NON_US_QUESTION_MARKER = 'TTC Application Questions for India';
export const TTC_APPLICATION_NON_US_FORM_ID = 'ttc_application_form_non_us';

export function renderTtcApplicationNonUsForm(): string {
  return `<h1>${TTC_APPLICATION_NON_US_FORM_TITLE}</h1><div id="${
    TTC_APPLICATION_NON_US_FORM_ID
  }">${TTC_APPLICATION_NON_US_QUESTION_MARKER}</div>`;
}
