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
  return `<div class="form-container">` +
    `<h1>${escapeHtml(DSN_FORM_TITLE)}</h1>` +
    `<div id="form-message"></div>` +
    `<form id="${escapeHtmlAttr(DSN_CONTAINER_ID)}">` +
    renderFields(fields) +
    renderSubmitButton('Submit') +
    `</form>` +
    formSubmitScript(DSN_CONTAINER_ID) +
    `</div>`;
}
