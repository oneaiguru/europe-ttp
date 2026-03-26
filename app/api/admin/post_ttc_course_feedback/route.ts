import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderPostTtcFeedback } from '../../../admin/post_ttc_course_feedback/render';

export async function GET() {
  const bodyHtml = renderPostTtcFeedback({
    reportingKey: 'reporting',
  });
  const page = wrapAdminShell({
    title: 'Post TTC Course Feedback',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
