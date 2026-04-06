import { readJson, GCS_PATHS } from '../../../../../utils/gcs';
import { requireAdminAnyOfOrCron } from '../../../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminAnyOfOrCron(request, [
    'ttc_applicants_reports.html',
    'post_ttc_course_feedback_summary.html',
    'post_sahaj_ttc_course_feedback_summary.html',
  ]);
  if (auth instanceof Response) return auth;

  const data = await readJson(GCS_PATHS.USER_SUMMARY_BY_USER);
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'text/plain' },
  });
}
