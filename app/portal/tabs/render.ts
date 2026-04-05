import { escapeHtml, escapeHtmlAttr } from '../../utils/html';

export type PortalTabRenderOptions = {
  templateName: string;
  userHomeCountryIso: string;
  userHomeCountryName: string;
};

function normalizeTemplateName(name: string): string {
  return name.replace(/^\/?tabs\//, '');
}

function resolveContactEmail(iso: string): string {
  return iso === 'CA' ? 'ttcdesk@artofliving.ca' : 'ttc@artofliving.org';
}

export function renderPortalTab(options: PortalTabRenderOptions): string {
  const templateName = normalizeTemplateName(options.templateName);
  const homeCountryName = escapeHtml(options.userHomeCountryName);

  if (templateName === 'contact.html') {
    const email = resolveContactEmail(options.userHomeCountryIso);
    const escapedEmail = escapeHtml(email);
    return [
      '<div class="max-w-4xl mx-auto p-6">',
      '<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm tab-contact">',
      '<h1 class="text-2xl font-semibold text-slate-900">Contact</h1>',
      `<h2 class="mt-2 text-lg font-medium text-slate-800">${homeCountryName} TTC Desk</h2>`,
      `<a class="text-sm text-blue-700 underline" href="mailto:${escapeHtmlAttr(email)}">${escapedEmail}</a>`,
      '</div>',
      '</div>',
    ].join('');
  }

  return (
    '<div class="max-w-4xl mx-auto p-6">' +
    '<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm tab-contact">' +
    `<h2 class="text-xl font-semibold text-slate-900">${homeCountryName} TTC Desk</h2>` +
    '</div>' +
    '</div>'
  );
}
