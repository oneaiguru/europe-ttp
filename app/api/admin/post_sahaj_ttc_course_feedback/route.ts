import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderPostSahajFeedback } from '../../../admin/post_sahaj_ttc_course_feedback/render';
import { requireAdminForPage } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'post_sahaj_ttc_course_feedback_summary.html', { denyMode: 'legacy_html' });
  if (auth instanceof Response) return auth;
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
