"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSN_QUESTION_MARKER = exports.DSN_FORM_TITLE = void 0;
exports.renderDsnApplicationForm = renderDsnApplicationForm;
exports.DSN_FORM_TITLE = 'DSN Application';
exports.DSN_QUESTION_MARKER = 'DSN Application Questions';
function renderDsnApplicationForm() {
    return `<h1>${exports.DSN_FORM_TITLE}</h1><div id="dsn-question">${exports.DSN_QUESTION_MARKER}</div>`;
}
