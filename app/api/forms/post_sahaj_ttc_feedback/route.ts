import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderPostSahajTtcFeedbackForm } from '../../../forms/post_sahaj_ttc_feedback/render';

export async function GET() {
  const page = wrapFormShell({
    title: 'Sahaj TTC Graduate feedback from Co-Teacher',
    bodyHtml: renderPostSahajTtcFeedbackForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
