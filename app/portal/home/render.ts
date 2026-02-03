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
  const reportsHtml = reportLinks.length
    ? `<ul>${reportLinks
        .map((link) => `<li><a rel="admin" href="${link.href}">${link.label}</a></li>`)
        .join('')}</ul>`
    : '';
  return [
    '<div id="profile">',
    `<div id="logged_in_as">Logged in as ${options.userEmail}</div>`,
    '<div id="logout">LOGOUT</div>',
    `<div id="user_home_country">${options.homeCountryName}</div>`,
    `<div id="user_home_country_iso">${options.homeCountryIso}</div>`,
    '</div>',
    reportsHtml,
  ].join('');
}
