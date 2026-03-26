import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderTtcPortalSettingsForm, TTC_PORTAL_SETTINGS_FORM_TITLE } from '../../../forms/ttc_portal_settings/render';

export async function GET() {
  const page = wrapFormShell({
    title: TTC_PORTAL_SETTINGS_FORM_TITLE,
    bodyHtml: renderTtcPortalSettingsForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
