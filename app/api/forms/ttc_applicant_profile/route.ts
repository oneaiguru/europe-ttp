import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderTtcApplicantProfileForm } from '../../../forms/ttc_applicant_profile/render';

export async function GET() {
  const page = wrapFormShell({
    title: 'TTC Applicant Profile',
    bodyHtml: renderTtcApplicantProfileForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
