import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderPostSahajFeedback } from '../../../admin/post_sahaj_ttc_course_feedback/render';

export async function GET() {
  const bodyHtml = renderPostSahajFeedback({
    reportingKey: 'reporting',
  });
  const page = wrapAdminShell({
    title: 'Post Sahaj TTC Course Feedback',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
