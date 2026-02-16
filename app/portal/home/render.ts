import { escapeHtml, escapeHtmlAttr, sanitizeHref } from '../../utils/html';

export type PortalHomeReportLink = {
  href: string;
  label: string;
};

export type PortalHomeRenderOptions = {
  userEmail: string;
  homeCountryIso: string;
  homeCountryName: string;
  reportLinks?: PortalHomeReportLink[];
};

export function renderPortalHome(options: PortalHomeRenderOptions): string {
  const reportLinks = options.reportLinks ?? [];
  // Sanitize href values and filter out unsafe links
  const safeLinks = reportLinks.filter((link) => {
    const sanitized = sanitizeHref(link.href);
    return sanitized !== '';
  });
  const reportsHtml = safeLinks.length
    ? `<ul>${safeLinks
        .map((link) => `<li><a rel="admin" href="${escapeHtmlAttr(sanitizeHref(link.href))}">${escapeHtml(link.label)}</a></li>`)
        .join('')}</ul>`
    : '';
  return [
    '<div id="profile">',
    `<div id="logged_in_as">Logged in as ${escapeHtml(options.userEmail)}</div>`,
    '<div id="logout">LOGOUT</div>',
    `<div id="user_home_country">${escapeHtml(options.homeCountryName)}</div>`,
    `<div id="user_home_country_iso">${escapeHtml(options.homeCountryIso)}</div>`,
    '</div>',
    reportsHtml,
  ].join('');
}
