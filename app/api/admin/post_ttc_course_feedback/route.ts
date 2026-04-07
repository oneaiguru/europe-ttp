import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderPostTtcFeedback } from '../../../admin/post_ttc_course_feedback/render';
import { requireAdminForPage } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'post_ttc_course_feedback_summary.html');
  if (auth instanceof Response) return auth;
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
