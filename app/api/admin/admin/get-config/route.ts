import { getAdminConfig } from '../../../../utils/admin-config';
import { requireAdminForPage } from '../../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'admin_settings.html');
  if (auth instanceof Response) return auth;

  const config = await getAdminConfig();
  // CRITICAL: keep text/plain — client JS does JSON.parse(data)
  return new Response(JSON.stringify(config), {
    headers: { 'content-type': 'text/plain' },
  });
}
