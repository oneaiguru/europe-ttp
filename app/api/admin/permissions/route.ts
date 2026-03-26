import { renderAdminUnauthorized } from '../../../admin/permissions/render';

export async function GET() {
  const html = renderAdminUnauthorized();
  const page = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Admin Permissions</title></head>
<body>${html}</body>
</html>`;
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
