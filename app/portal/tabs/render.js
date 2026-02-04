function normalizeTemplateName(name) {
    return name.replace(/^\/?tabs\//, '');
}
function resolveContactEmail(iso) {
    return iso === 'CA' ? 'ttcdesk@artofliving.ca' : 'ttc@artofliving.org';
}
export function renderPortalTab(options) {
    const templateName = normalizeTemplateName(options.templateName);
    const homeCountryName = options.userHomeCountryName;
    if (templateName === 'contact.html') {
        const email = resolveContactEmail(options.userHomeCountryIso);
        return [
            '<div class="tab-contact">',
            `<div>${homeCountryName} TTC Desk</div>`,
            `<a href="mailto:${email}">${email}</a>`,
            '</div>',
        ].join('');
    }
    return `<div>${homeCountryName} TTC Desk</div>`;
}
