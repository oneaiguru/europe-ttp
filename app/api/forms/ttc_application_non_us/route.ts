import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderTtcApplicationNonUsForm, TTC_APPLICATION_NON_US_FORM_TITLE } from '../../../forms/ttc_application_non_us/render';

export async function GET() {
  const html = wrapFormShell({
    title: TTC_APPLICATION_NON_US_FORM_TITLE,
    bodyHtml: renderTtcApplicationNonUsForm(),
  });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
