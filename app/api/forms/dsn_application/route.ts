import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderDsnApplicationForm, DSN_FORM_TITLE } from '../../../forms/dsn_application/render';

export async function GET() {
  const html = wrapFormShell({
    title: DSN_FORM_TITLE,
    bodyHtml: renderDsnApplicationForm(),
  });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
