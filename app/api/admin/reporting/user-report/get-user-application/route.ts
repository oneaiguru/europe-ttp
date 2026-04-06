import { requireAdmin } from '../../../../../utils/auth-middleware';
import { TTCPortalUser } from '../../../../../utils/ttc-portal-user';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const email = url.searchParams.get('email') || '';
  const formType = url.searchParams.get('form_type') || '';
  const formInstance = url.searchParams.get('form_instance') || '';

  const user = await TTCPortalUser.create(email);
  const formData = user.getFormData(formType, formInstance);

  // Phase 5 approach: render a simple key-value HTML table from stored form data.
  // This does NOT use country-specific form schemas (deferred to Phase 6).
  // When Phase 6 adds GCS schema loading, this renderer will be upgraded to show
  // proper question labels, field types, and display values.
  const rows = Object.entries(formData)
    .map(([key, val]) => `<tr><td>${key}</td><td>${String(val)}</td></tr>`)
    .join('');
  const html = `<table border="1" cellpadding="4"><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html' },
  });
}
