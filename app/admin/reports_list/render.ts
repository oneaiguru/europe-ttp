import { escapeHtml, escapeHtmlAttr } from '../../utils/html';

export const ADMIN_REPORTS_LIST_TITLE = 'Admin';

export const ADMIN_REPORTS_LIST_LINKS = [
  { href: '/api/admin/ttc_applicants_reports', label: 'TTC Report' },
  { href: '/api/admin/ttc_applicants_integrity', label: 'TTC Integrity Report' },
  { href: '/api/admin/post_ttc_course_feedback', label: 'Post TTC Report' },
  { href: '/api/admin/post_sahaj_ttc_course_feedback', label: 'Post Sahaj TTC Report' },
  { href: '/api/admin/settings', label: 'Admin Settings' },
];

export function renderAdminReportsList(): string {
  const linksHtml = ADMIN_REPORTS_LIST_LINKS.map(
    (link) => `
    <a
      rel="admin"
      class="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
      href="${escapeHtmlAttr(link.href)}">
      <span class="text-blue-600 hover:text-blue-800 font-medium">${escapeHtml(link.label)}</span>
    </a>`,
  ).join('');
  return `<div class="max-w-4xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-light text-gray-800 mb-6">${escapeHtml(ADMIN_REPORTS_LIST_TITLE)}</h1>
    <div class="space-y-3">
      ${linksHtml}
    </div>
  </div>`;
}
