import { renderDisabledPage } from '../../../portal/disabled/render';

export async function GET() {
  const html = renderDisabledPage();
  const page = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Portal Disabled</title></head>
<body>${html}</body>
</html>`;
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
