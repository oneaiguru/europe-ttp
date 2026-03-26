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
    '<div class="form-container">' +
    '<h1 class="form-header">Post-TTC Feedback</h1>' +
    `<form id="${FORM_ID}"><span class="form-type" style="display:none;">post_ttc_feedback_form</span>` +
    renderFields(FIELDS) +
    renderSubmitButton() +
    '</form>' +
    '<div id="form-message" class="form-message"></div>' +
    '</div>' +
    formSubmitScript(FORM_ID)
  );
}
