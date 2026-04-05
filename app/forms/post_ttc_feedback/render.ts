import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

const FIELDS: FieldDef[] = [
  { id: 'i_graduate_email', label: 'Graduate Email', type: 'email', required: true },
  { id: 'i_graduate_name', label: 'Graduate Name', type: 'text', required: true },
  { id: 'i_feedback_rating', label: 'Feedback Rating', type: 'select', options: ['Excellent', 'Good', 'Average', 'Below Average'] },
  { id: 'i_recommend_for_teaching', label: 'Recommend for Teaching', type: 'radio', options: ['Yes', 'No'] },
  { id: 'i_comments', label: 'Comments', type: 'textarea' },
];

const FORM_ID = 'post-ttc-feedback-form';

export function renderPostTtcFeedbackForm(): string {
  return (
    '<div class="max-w-3xl mx-auto p-6 space-y-6">' +
    '<div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6">' +
    '<h1 class="text-2xl font-light text-gray-800 mb-4">Post-TTC Feedback</h1>' +
    `<form id="${FORM_ID}"><span class="form-type hidden">post_ttc_feedback_form</span>` +
    renderFields(FIELDS) +
    renderSubmitButton() +
    '</form>' +
    '<div id="form-message" class="form-message"></div>' +
    '</div>' +
    '</div>' +
    formSubmitScript(FORM_ID)
  );
}
