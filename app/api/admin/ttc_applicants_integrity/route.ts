import { wrapAdminShell } from '../../../admin/shared/admin-shell';
import { renderIntegrityReport } from '../../../admin/ttc_applicants_integrity/render';
import { getTtcListHtml } from '../../../utils/admin-helpers';

export async function GET() {
  const { html: ttcListHtml } = await getTtcListHtml();
  const bodyHtml = renderIntegrityReport({
    integrityKey: 'integrity',
    ttcListHtml,
  });
  const page = wrapAdminShell({
    title: 'TTC Integrity Report',
    bodyHtml,
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
