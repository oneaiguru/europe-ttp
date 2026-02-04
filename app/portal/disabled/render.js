export const DISABLED_NOTICE_TEXT = 'The TTC Portal is not available on Mobile. Please use the portal from a Desktop web browser.';
export function renderDisabledPage() {
    return ['<div id="disabled_notice">', DISABLED_NOTICE_TEXT, '</div>'].join('');
}
