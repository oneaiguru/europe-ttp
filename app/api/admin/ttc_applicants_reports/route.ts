import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderReports, REPORTS_EXTRA_HEAD_CSS, REPORTS_EXTRA_CDN_JS } from '../../../admin/ttc_applicants_reports/render';

// TODO: In production, ttcListHtml and ttcCountryAndDates come from config/storage layer.
const DEFAULT_TTC_LIST_HTML = `
<div style="margin-top:15px;">
  <label for="ttc_list" style="font-weight:300;">Select TTC:</label>
  <select id="ttc_list" style="width:100%;max-width:600px;">
    <option value="default">Default TTC</option>
  </select>
</div>`;

export async function GET() {
  const bodyHtml = renderReports({
    reportingKey: 'reporting',
    ttcCountryAndDates: '[]',
    ttcListHtml: DEFAULT_TTC_LIST_HTML,
  });
  const page = wrapAdminShell({
    title: 'TTC Applicants Reports',
    bodyHtml,
    extraHeadHtml: REPORTS_EXTRA_HEAD_CSS,
    extraCdnJs: REPORTS_EXTRA_CDN_JS,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
