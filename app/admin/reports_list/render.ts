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
    (link) => `<li><a rel="admin" href="${escapeHtmlAttr(link.href)}">${escapeHtml(link.label)}</a></li>`,
  ).join('');
  return `<h1>${escapeHtml(ADMIN_REPORTS_LIST_TITLE)}</h1><ul>${linksHtml}</ul>`;
}
