import { escapeHtml, escapeHtmlAttr } from '../../utils/html';
import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

export const TTC_APPLICATION_NON_US_FORM_TITLE = 'TTC Application';
export const TTC_APPLICATION_NON_US_FORM_ID = 'ttc_application_form_non_us';

const fields: FieldDef[] = [
  { id: 'i_fname', label: 'First Name', type: 'text', required: true },
  { id: 'i_lname', label: 'Last Name', type: 'text', required: true },
  { id: 'i_email', label: 'Email', type: 'email', required: true },
  { id: 'i_country', label: 'Country', type: 'text' },
  { id: 'i_happiness_program_completed', label: 'Happiness Program Completed?', type: 'radio', options: ['Yes', 'No'] },
  { id: 'i_amp_completed', label: 'AMP Completed?', type: 'radio', options: ['Yes', 'No'] },
  { id: 'i_vtp_completed', label: 'VTP Completed?', type: 'radio', options: ['Yes', 'No'] },
  { id: 'i_part1_course_date', label: 'Part 1 Course Date', type: 'date' },
  { id: 'i_part2_silence_date', label: 'Part 2 Silence Date', type: 'date' },
  { id: 'i_dsn_completed', label: 'DSN Completed?', type: 'radio', options: ['Yes', 'No'] },
  { id: 'i_num_evaluators', label: 'Number of Evaluators', type: 'select', options: ['1', '2', '3'] },
  { id: 'i_eval1_email', label: 'Evaluator 1 Email', type: 'email' },
  { id: 'i_eval2_email', label: 'Evaluator 2 Email', type: 'email' },
];

function renderTtcSelect(options: Array<{ value: string; display: string }>): string {
  return `<div class="form-group"><label for="i_ttc_country_and_dates">TTC Country and Dates</label>` +
    `<select id="i_ttc_country_and_dates" name="i_ttc_country_and_dates" class="form-select">` +
    `<option value="">-- Select --</option>` +
    options.map(o => `<option value="${escapeHtmlAttr(o.value)}">${escapeHtml(o.display)}</option>`).join('') +
    `</select></div>`;
}

export function renderTtcApplicationNonUsForm(options?: { ttcOptions?: Array<{ value: string; display: string }> }): string {
  const ttcSelectHtml = options?.ttcOptions ? renderTtcSelect(options.ttcOptions) : '';

  return `<div class="form-container">` +
    `<h1>${escapeHtml(TTC_APPLICATION_NON_US_FORM_TITLE)}</h1>` +
    `<div id="form-message"></div>` +
    `<form id="${escapeHtmlAttr(TTC_APPLICATION_NON_US_FORM_ID)}">` +
    renderFields(fields) +
    ttcSelectHtml +
    renderSubmitButton('Submit') +
    `</form>` +
    formSubmitScript(TTC_APPLICATION_NON_US_FORM_ID) +
    `</div>`;
}
