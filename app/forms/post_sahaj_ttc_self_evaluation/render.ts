import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

const FIELDS: FieldDef[] = [
  { id: 'i_course_start_date', label: 'Course Start Date', type: 'date' },
  { id: 'i_course_location', label: 'Course Location', type: 'text' },
  { id: 'i_co_teacher_email', label: 'Co-Teacher Email', type: 'email' },
  { id: 'i_teaching_hours', label: 'Teaching Hours', type: 'number' },
  { id: 'i_courses_taught', label: 'Courses Taught', type: 'number' },
  { id: 'i_self_rating', label: 'Self Rating', type: 'select', options: ['Good', 'Average', 'Below Average'] },
];

const FORM_ID = 'post-sahaj-ttc-self-evaluation-form';

export function renderPostSahajTtcSelfEvaluationForm(): string {
  return (
    '<div class="form-container">' +
    '<h1 class="form-header">Post-Sahaj TTC Self Evaluation</h1>' +
    `<form id="${FORM_ID}"><span class="form-type" style="display:none;">post_sahaj_ttc_self_evaluation_form</span>` +
    renderFields(FIELDS) +
    renderSubmitButton() +
    '</form>' +
    '<div id="form-message" class="form-message"></div>' +
    '</div>' +
    formSubmitScript(FORM_ID)
  );
}
