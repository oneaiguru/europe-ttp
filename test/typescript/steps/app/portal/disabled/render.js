"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISABLED_NOTICE_TEXT = void 0;
exports.renderDisabledPage = renderDisabledPage;
exports.DISABLED_NOTICE_TEXT = 'The TTC Portal is not available on Mobile. Please use the portal from a Desktop web browser.';
function renderDisabledPage() {
    return ['<div id="disabled_notice">', exports.DISABLED_NOTICE_TEXT, '</div>'].join('');
}
