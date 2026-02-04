"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_REPORTS_LIST_LINKS = exports.ADMIN_REPORTS_LIST_TITLE = void 0;
exports.renderAdminReportsList = renderAdminReportsList;
exports.ADMIN_REPORTS_LIST_TITLE = 'Admin';
exports.ADMIN_REPORTS_LIST_LINKS = [
    { href: 'ttc_applicants_reports.html', label: 'TTC Report' },
    { href: 'ttc_applicants_integrity.html', label: 'TTC Integrity Report' },
    { href: 'post_ttc_course_feedback_summary.html', label: 'Post TTC Report' },
    { href: 'post_sahaj_ttc_course_feedback_summary.html', label: 'Post Sahaj TTC Report' },
    { href: 'admin_settings.html', label: 'Admin Settings' },
];
function renderAdminReportsList() {
    const linksHtml = exports.ADMIN_REPORTS_LIST_LINKS.map((link) => `<li><a rel="admin" href="${link.href}">${link.label}</a></li>`).join('');
    return `<h1>${exports.ADMIN_REPORTS_LIST_TITLE}</h1><ul>${linksHtml}</ul>`;
}
