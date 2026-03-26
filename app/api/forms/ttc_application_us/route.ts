import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderTtcApplicationUsForm, TTC_APPLICATION_US_FORM_TITLE } from '../../../forms/ttc_application_us/render';

export async function GET() {
  const html = wrapFormShell({
    title: TTC_APPLICATION_US_FORM_TITLE,
    bodyHtml: renderTtcApplicationUsForm(),
  });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
