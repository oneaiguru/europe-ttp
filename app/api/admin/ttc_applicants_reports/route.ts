import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderReports, REPORTS_EXTRA_HEAD_CSS, REPORTS_EXTRA_CDN_JS } from '../../../admin/ttc_applicants_reports/render';
import { getTtcListHtml } from '../../../utils/admin-helpers';

export async function GET() {
  const { html: ttcListHtml, json: ttcCountryAndDates } = await getTtcListHtml();
  const bodyHtml = renderReports({
    reportingKey: 'reporting',
    ttcCountryAndDates,
    ttcListHtml,
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
