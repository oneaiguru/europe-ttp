import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderIntegrityReport } from '../../../admin/ttc_applicants_integrity/render';
import { getTtcListHtml, getLastUpdatedTimestamps } from '../../../utils/admin-helpers';

export async function GET() {
  const { html: ttcListHtml } = await getTtcListHtml();
  const timestamps = await getLastUpdatedTimestamps();
  const bodyHtml = renderIntegrityReport({
    integrityKey: 'integrity',
    ttcListHtml,
    userSummaryLastUpdatedDatetime: timestamps.user_summary_last_updated_datetime,
    userIntegrityLastUpdatedDatetime: timestamps.user_integrity_last_updated_datetime,
  });
  const page = wrapAdminShell({
    title: 'TTC Integrity Report',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
