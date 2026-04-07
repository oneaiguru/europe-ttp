import { renderAdminReportsList } from '../../../admin/reports_list/render';
import { requireAdminForPage } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'ttc_applicants_reports.html');
  if (auth instanceof Response) return auth;
  const html = renderAdminReportsList();
  const page = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Admin Reports</title><script src="https://cdn.tailwindcss.com"></script></head>
<body>${html}</body>
</html>`;
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
