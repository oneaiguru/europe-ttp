import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderAdminDashboard } from '../../../admin/ttc_applicants_summary/render';
import { getTtcListHtml } from '../../../utils/admin-helpers';

export async function GET() {
  const { html: ttcListHtml } = await getTtcListHtml();
  const bodyHtml = renderAdminDashboard({
    ttcListHtml,
  });
  const page = wrapAdminShell({
    title: 'TTC Applicants Summary',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
