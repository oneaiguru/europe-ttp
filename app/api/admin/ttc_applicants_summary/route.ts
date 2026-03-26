import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderAdminDashboard } from '../../../admin/ttc_applicants_summary/render';

// TODO: In production, ttcListHtml comes from the config/storage layer.
// For now, provide a minimal select element so the page renders.
const DEFAULT_TTC_LIST_HTML = `
<div style="margin-top:15px;">
  <label for="ttc_list" style="font-weight:300;">Select TTC:</label>
  <select id="ttc_list" style="width:100%;max-width:600px;">
    <option value="default">Default TTC</option>
  </select>
</div>`;

export async function GET() {
  const bodyHtml = renderAdminDashboard({
    ttcListHtml: DEFAULT_TTC_LIST_HTML,
  });
  const page = wrapAdminShell({
    title: 'TTC Applicants Summary',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
