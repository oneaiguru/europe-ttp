import { renderPortalTab } from '../../../portal/tabs/render';

export async function GET() {
  const html = renderPortalTab({
    templateName: 'contact.html',
    userHomeCountryIso: 'US',
    userHomeCountryName: 'United States',
  });
  const page = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Portal Tab</title></head>
<body>${html}</body>
</html>`;
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
