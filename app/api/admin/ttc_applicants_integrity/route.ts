import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderIntegrityReport } from '../../../admin/ttc_applicants_integrity/render';

// TODO: In production, ttcListHtml and integrityKey come from config/storage layer.
const DEFAULT_TTC_LIST_HTML = `
<div style="margin-top:15px;">
  <label for="ttc_list" style="font-weight:300;">Select TTC:</label>
  <select id="ttc_list" style="width:100%;max-width:600px;">
    <option value="default">Default TTC</option>
  </select>
</div>`;

export async function GET() {
  const bodyHtml = renderIntegrityReport({
    integrityKey: 'integrity',
    ttcListHtml: DEFAULT_TTC_LIST_HTML,
  });
  const page = wrapAdminShell({
    title: 'TTC Integrity Report',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
