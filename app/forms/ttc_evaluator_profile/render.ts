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
  return `<div class="max-w-3xl mx-auto p-6 space-y-6">
  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
  <h1 class="text-2xl font-light text-gray-800 mb-4">${HEADING}</h1>
  <form id="${FORM_ID}">
${renderFields(fields)}
${renderSubmitButton()}
  </form>
  <div id="form-message" class="form-message"></div>
</div>
</div>
${formSubmitScript(FORM_ID)}`;
}

export const TTC_EVALUATOR_PROFILE_FALLBACK_HTML = renderTtcEvaluatorProfileForm();
