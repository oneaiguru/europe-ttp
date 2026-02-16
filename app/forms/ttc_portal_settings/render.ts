export const TTC_PORTAL_SETTINGS_FORM_TITLE = 'TTC Portal Settings';
export const TTC_PORTAL_SETTINGS_QUESTION_MARKER = 'TTC Portal Settings Questions';
export const TTC_PORTAL_SETTINGS_FORM_ID = 'ttc-portal-settings-form';

export function renderTtcPortalSettingsForm(): string {
  return `<h1>${TTC_PORTAL_SETTINGS_FORM_TITLE}</h1><div id="${
    TTC_PORTAL_SETTINGS_FORM_ID
  }">${TTC_PORTAL_SETTINGS_QUESTION_MARKER}</div>`;
}
