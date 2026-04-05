import { escapeHtml, escapeHtmlAttr } from '../../utils/html';
import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

export const DSN_FORM_TITLE = 'DSN Application';

const DSN_CONTAINER_ID = 'dsn-question';

const fields: FieldDef[] = [
  { id: 'i_fname', label: 'First Name', type: 'text', required: true },
  { id: 'i_lname', label: 'Last Name', type: 'text', required: true },
];

export function renderDsnApplicationForm(): string {
  return `<div class="max-w-3xl mx-auto p-6 space-y-6">` +
    `<div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6">` +
    `<h1 class="text-2xl font-light text-gray-800 mb-4">${escapeHtml(DSN_FORM_TITLE)}</h1>` +
    `<div id="form-message"></div>` +
    `<form id="${escapeHtmlAttr(DSN_CONTAINER_ID)}">` +
    renderFields(fields) +
    renderSubmitButton('Submit') +
    `</form>` +
    `</div>` +
    formSubmitScript(DSN_CONTAINER_ID) +
    `</div>`;
}
