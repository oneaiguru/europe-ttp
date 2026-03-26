import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

export const TTC_PORTAL_SETTINGS_FORM_TITLE = 'TTC Portal Settings';
export const TTC_PORTAL_SETTINGS_FORM_ID = 'ttc-portal-settings-form';

const FIELDS: FieldDef[] = [
  { id: 'i_home_country', label: 'Home Country', type: 'select', options: ['United States', 'India', 'Canada', 'Other'] },
];

export function renderTtcPortalSettingsForm(): string {
  return (
    '<div class="form-container">' +
    `<h1 class="form-header">${TTC_PORTAL_SETTINGS_FORM_TITLE}</h1>` +
    `<form id="${TTC_PORTAL_SETTINGS_FORM_ID}">` +
    renderFields(FIELDS) +
    renderSubmitButton() +
    '</form>' +
    '<div id="form-message" class="form-message"></div>' +
    '</div>' +
    formSubmitScript(TTC_PORTAL_SETTINGS_FORM_ID)
  );
}
