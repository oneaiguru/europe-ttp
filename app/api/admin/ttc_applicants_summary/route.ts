import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderAdminDashboard } from '../../../admin/ttc_applicants_summary/render';
import { getTtcListHtml, getLastUpdatedTimestamps } from '../../../utils/admin-helpers';
import { requireAdminForPage } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'ttc_applicants_summary.html');
  if (auth instanceof Response) return auth;
  const { html: ttcListHtml } = await getTtcListHtml();
  const timestamps = await getLastUpdatedTimestamps();
  const bodyHtml = renderAdminDashboard({
    ttcListHtml,
    userSummaryLastUpdatedDatetime: timestamps.user_summary_last_updated_datetime,
    userIntegrityLastUpdatedDatetime: timestamps.user_integrity_last_updated_datetime,
  });
  const page = wrapAdminShell({
    title: 'TTC Applicants Summary',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
