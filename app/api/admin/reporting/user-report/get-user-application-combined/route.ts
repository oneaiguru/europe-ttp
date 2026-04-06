import { requireAdmin } from '../../../../../utils/auth-middleware';
import { TTCPortalUser } from '../../../../../utils/ttc-portal-user';

interface FormRef {
  email: string;
  form_type: string;
  form_instance: string;
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const formsParam = url.searchParams.get('forms') || '[]';
  const printOnLoad = url.searchParams.get('print_on_load');

  let forms: FormRef[];
  try {
    forms = JSON.parse(formsParam) as FormRef[];
  } catch {
    return new Response('Invalid forms parameter', { status: 400 });
  }

  const tables: string[] = [];
  for (const form of forms) {
    const user = await TTCPortalUser.create(form.email);
    const formData = user.getFormData(form.form_type, form.form_instance);

    const rows = Object.entries(formData)
      .map(([key, val]) => `<tr><td>${key}</td><td>${String(val)}</td></tr>`)
      .join('');

    tables.push(`
      <h3>${form.form_type} — ${form.email}${form.form_instance ? ` (${form.form_instance})` : ''}</h3>
      <table border="1" cellpadding="4"><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  }

  const printScript = printOnLoad === '1' ? '<script>window.onload=function(){window.print();}</script>' : '';
  const html = `<!DOCTYPE html><html><head>${printScript}</head><body>${tables.join('')}</body></html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html' },
  });
}
