export const TTC_APPLICATION_US_FORM_TITLE = 'TTC Application';
export const TTC_APPLICATION_US_QUESTION_MARKER = 'TTC Application Questions';
export const TTC_APPLICATION_US_FORM_ID = 'ttc_application_form';
export function renderTtcApplicationUsForm() {
    return `<h1>${TTC_APPLICATION_US_FORM_TITLE}</h1><div id="${TTC_APPLICATION_US_FORM_ID}">${TTC_APPLICATION_US_QUESTION_MARKER}</div>`;
}
