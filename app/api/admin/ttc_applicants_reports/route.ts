import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderReports, REPORTS_EXTRA_HEAD_CSS, REPORTS_EXTRA_CDN_JS } from '../../../admin/ttc_applicants_reports/render';
import { getTtcListHtml, getLastUpdatedTimestamps } from '../../../utils/admin-helpers';
import { requireAdminForPage } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'ttc_applicants_reports.html', { denyMode: 'legacy_html' });
  if (auth instanceof Response) return auth;
  const { html: ttcListHtml, json: ttcCountryAndDates } = await getTtcListHtml();
  const timestamps = await getLastUpdatedTimestamps();
  const bodyHtml = renderReports({
    reportingKey: 'reporting',
    ttcCountryAndDates,
    ttcListHtml,
    userSummaryLastUpdatedDatetime: timestamps.user_summary_last_updated_datetime,
    userIntegrityLastUpdatedDatetime: timestamps.user_integrity_last_updated_datetime,
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
