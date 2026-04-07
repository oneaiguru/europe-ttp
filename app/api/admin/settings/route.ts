import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderAdminSettings } from '../../../admin/settings/render';
import { requireAdminForPage } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'admin_settings.html', { denyMode: 'legacy_html' });
  if (auth instanceof Response) return auth;
  const bodyHtml = renderAdminSettings();
  const page = wrapAdminShell({
    title: 'Admin Settings',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
