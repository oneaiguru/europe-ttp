import { renderAdminReportsList } from '../../../admin/reports_list/render';

export async function GET() {
  const html = renderAdminReportsList();
  const page = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Admin Reports</title></head>
<body>${html}</body>
</html>`;
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
