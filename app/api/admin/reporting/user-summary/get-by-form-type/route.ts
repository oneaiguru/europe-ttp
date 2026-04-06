import { readJson, GCS_PATHS } from '../../../../../utils/gcs';
import { requireAdminOrCron } from '../../../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  const data = await readJson(GCS_PATHS.USER_SUMMARY_BY_FORM_TYPE);
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'text/plain' },
  });
}
