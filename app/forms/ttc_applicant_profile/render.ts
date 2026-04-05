import { renderFields, renderSubmitButton, FieldDef } from '../shared/form-fields';
import { formSubmitScript } from '../shared/form-submit';

const FORM_ID = 'ttc-applicant-profile-form';
const HEADING = 'TTC Applicant Profile';

const fields: FieldDef[] = [
  { id: 'i_fname', label: 'First Name', type: 'text', required: true },
  { id: 'i_lname', label: 'Last Name', type: 'text', required: true },
  { id: 'i_email', label: 'Email', type: 'email', required: true },
  { id: 'i_address1', label: 'Address', type: 'text' },
  { id: 'i_city', label: 'City', type: 'text' },
  { id: 'i_state', label: 'State', type: 'text' },
  { id: 'i_zip', label: 'Zip', type: 'text' },
  { id: 'i_phone', label: 'Phone', type: 'text' },
  {
    id: 'i_gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female', 'Other'],
  },
];

export function renderTtcApplicantProfileForm(): string {
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

export const TTC_APPLICANT_PROFILE_FALLBACK_HTML = renderTtcApplicantProfileForm();
