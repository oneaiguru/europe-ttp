import { ADMIN_REPORTS_LIST_LINKS, renderAdminReportsList } from '../../../admin/reports_list/render';
import { getReportPermissions, requireAdminAnyOf } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const requiredPermissions = ADMIN_REPORTS_LIST_LINKS.map((link) => link.requiredPermission);
  const auth = await requireAdminAnyOf(request, requiredPermissions, { denyMode: 'legacy_html' });
  if (auth instanceof Response) return auth;

  const allowedPermissions = new Set(getReportPermissions(auth.email));
  const filteredLinks = ADMIN_REPORTS_LIST_LINKS
    .filter((link) => allowedPermissions.has(link.requiredPermission))
    .map(({ href, label }) => ({ href, label }));

  const html = renderAdminReportsList(filteredLinks);
  const page = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Admin Reports</title><script src="https://cdn.tailwindcss.com"></script></head>
<body>${html}</body>
</html>`;
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
