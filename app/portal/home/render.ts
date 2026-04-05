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
    ? `<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 class="mb-3 text-lg font-semibold text-slate-900">Available Reports</h2>
          <ul class="list-disc space-y-2 pl-5">
            ${safeLinks
        .map((link) => `<li><a rel="admin" href="${escapeHtmlAttr(sanitizeHref(link.href))}">${escapeHtml(link.label)}</a></li>`)
        .join('')}
          </ul>
        </div>`
    : '';
  return [
    '<div class="max-w-4xl mx-auto p-6">',
    '<div id="profile" class="space-y-6">',
    '<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">',
    '<h1 class="text-2xl font-semibold text-slate-900">Portal Home</h1>',
    `<div id="logged_in_as" class="text-sm text-slate-700"><span class="font-medium">Logged in as</span> ${escapeHtml(options.userEmail)}</div>`,
    '<div id="logout" class="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">LOGOUT</div>',
    `<div id="user_home_country" class="text-sm text-slate-700"><span class="font-semibold">Country:</span> ${escapeHtml(options.homeCountryName)}</div>`,
    `<div id="user_home_country_iso" class="text-sm text-slate-500"><span class="font-semibold">ISO:</span> ${escapeHtml(options.homeCountryIso)}</div>`,
    '</div>',
    reportsHtml === '' ? '' : '<div class="mt-6">',
    reportsHtml,
    reportsHtml === '' ? '' : '</div>',
    '</div>',
    '</div>',
  ].join('');
}
