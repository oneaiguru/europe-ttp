import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

export const TTC_PORTAL_SETTINGS_FORM_TITLE = 'TTC Portal Settings';
export const TTC_PORTAL_SETTINGS_FORM_ID = 'ttc-portal-settings-form';

const FIELDS: FieldDef[] = [
  { id: 'i_home_country', label: 'Home Country', type: 'select', options: ['United States', 'India', 'Canada', 'Other'] },
];

export function renderTtcPortalSettingsForm(): string {
  return (
    '<div class="max-w-3xl mx-auto p-6 space-y-6">' +
    '<div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6">' +
    `<h1 class="text-2xl font-light text-gray-800 mb-4">${TTC_PORTAL_SETTINGS_FORM_TITLE}</h1>` +
    `<form id="${TTC_PORTAL_SETTINGS_FORM_ID}">` +
    renderFields(FIELDS) +
    renderSubmitButton() +
    '</form>' +
    '<div id="form-message" class="form-message"></div>' +
    '</div>' +
    '</div>' +
    formSubmitScript(TTC_PORTAL_SETTINGS_FORM_ID)
  );
}
