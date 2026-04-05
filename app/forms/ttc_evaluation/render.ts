import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

export const TTC_EVALUATION_FORM_TITLE = 'TTC Evaluation';

const FORM_ID = 'ttc-evaluation-form';

const fields: FieldDef[] = [
  { id: 'i_evaluator_name', label: 'Evaluator Name', type: 'text', required: true },
  { id: 'i_volunteer_email', label: 'Volunteer Email', type: 'email', required: true },
  { id: 'i_volunteer_name', label: 'Volunteer Name', type: 'text', required: true },
  {
    id: 'i_evaluator_recommendation',
    label: 'Evaluator Recommendation',
    type: 'select',
    options: ['Strongly Recommend', 'Recommend', 'Recommend with Reservations', 'Do Not Recommend'],
  },
  {
    id: 'i_readiness_level',
    label: 'Readiness Level',
    type: 'select',
    options: ['Ready', 'Not Ready'],
  },
  {
    id: 'i_teaching_experience',
    label: 'Teaching Experience',
    type: 'select',
    options: ['1-3 years', '3-5 years', '5+ years'],
  },
  { id: 'i_strengths', label: 'Strengths', type: 'textarea' },
  { id: 'i_areas_for_improvement', label: 'Areas for Improvement', type: 'textarea' },
];

export function renderTtcEvaluationForm(): string {
  return `<div class="max-w-3xl mx-auto p-6 space-y-6">
  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
  <h1 class="text-2xl font-light text-gray-800 mb-4">${TTC_EVALUATION_FORM_TITLE}</h1>
  <form id="${FORM_ID}">
${renderFields(fields)}
${renderSubmitButton()}
  </form>
  <div id="form-message" class="form-message"></div>
</div>
</div>
${formSubmitScript(FORM_ID)}`;
}
