import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderPostTtcFeedbackForm } from '../../../forms/post_ttc_feedback/render';

export async function GET() {
  const page = wrapFormShell({
    title: 'Post-TTC Feedback',
    bodyHtml: renderPostTtcFeedbackForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
