import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

const FORM_ID = 'ttc-evaluator-profile-form';
const HEADING = 'TTC Evaluator Profile';

const fields: FieldDef[] = [
  { id: 'ev_fname', label: 'First Name', type: 'text', required: true },
  { id: 'ev_lname', label: 'Last Name', type: 'text', required: true },
  { id: 'ev_email', label: 'Email', type: 'email', required: true },
  { id: 'ev_organization', label: 'Organization', type: 'text' },
];

export function renderTtcEvaluatorProfileForm(): string {
  return `<div class="form-container">
  <div class="form-header">${HEADING}</div>
  <form id="${FORM_ID}">
${renderFields(fields)}
${renderSubmitButton()}
  </form>
  <div id="form-message" class="form-message"></div>
</div>
${formSubmitScript(FORM_ID)}`;
}

export const TTC_EVALUATOR_PROFILE_FALLBACK_HTML = renderTtcEvaluatorProfileForm();
