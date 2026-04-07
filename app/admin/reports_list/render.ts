import { escapeHtml, escapeHtmlAttr } from '../../utils/html';

export const ADMIN_REPORTS_LIST_TITLE = 'Admin';

export type AdminReportLink = {
  href: string;
  label: string;
  requiredPermission: string;
};

export const ADMIN_REPORTS_LIST_LINKS: AdminReportLink[] = [
  { href: '/api/admin/ttc_applicants_reports', label: 'TTC Report', requiredPermission: 'ttc_applicants_reports.html' },
  { href: '/api/admin/ttc_applicants_integrity', label: 'TTC Integrity Report', requiredPermission: 'ttc_applicants_integrity.html' },
  { href: '/api/admin/post_ttc_course_feedback', label: 'Post TTC Report', requiredPermission: 'post_ttc_course_feedback_summary.html' },
  { href: '/api/admin/post_sahaj_ttc_course_feedback', label: 'Post Sahaj TTC Report', requiredPermission: 'post_sahaj_ttc_course_feedback_summary.html' },
  { href: '/api/admin/settings', label: 'Admin Settings', requiredPermission: 'admin_settings.html' },
];

export function renderAdminReportsList(links: Array<Pick<AdminReportLink, 'href' | 'label'>> = ADMIN_REPORTS_LIST_LINKS): string {
  const linksHtml = links.map(
    (link) => `
    <a
      href="${escapeHtmlAttr(link.href)}"
      class="block rounded-lg border border-gray-200 bg-white p-4 mb-3 hover:shadow-md transition-shadow text-blue-600 hover:text-blue-800 font-medium text-lg">
      ${escapeHtml(link.label)}
    </a>`,
  ).join('');
  return `<div class="max-w-2xl mx-auto p-8">
    <h1 class="text-3xl font-light text-gray-800 mb-8">${escapeHtml(ADMIN_REPORTS_LIST_TITLE)}</h1>
    ${linksHtml}
  </div>`;
}
