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
      '<div class="tab-contact">',
      `<div>${homeCountryName} TTC Desk</div>`,
      `<a href="mailto:${escapeHtmlAttr(email)}">${escapedEmail}</a>`,
      '</div>',
    ].join('');
  }

  return `<div>${homeCountryName} TTC Desk</div>`;
}
