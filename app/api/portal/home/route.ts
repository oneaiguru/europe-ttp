import { renderPortalHome } from '../../../portal/home/render';

export async function GET() {
  const html = renderPortalHome({
    userEmail: 'test.applicant@example.com',
    homeCountryIso: 'US',
    homeCountryName: 'United States',
    reportLinks: [
      { href: '/admin/reports_list', label: 'TTC Reports' },
      { href: '/admin/ttc_applicants_summary', label: 'Applicants Summary' },
    ],
  });
  const page = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Portal Home</title></head>
<body>${html}</body>
</html>`;
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
