import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderAdminSettings } from '../../../admin/settings/render';

export async function GET() {
  const bodyHtml = renderAdminSettings();
  const page = wrapAdminShell({
    title: 'Admin Settings',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
