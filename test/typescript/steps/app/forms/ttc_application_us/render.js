"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTC_APPLICATION_US_FORM_ID = exports.TTC_APPLICATION_US_QUESTION_MARKER = exports.TTC_APPLICATION_US_FORM_TITLE = void 0;
exports.renderTtcApplicationUsForm = renderTtcApplicationUsForm;
exports.TTC_APPLICATION_US_FORM_TITLE = 'TTC Application';
exports.TTC_APPLICATION_US_QUESTION_MARKER = 'TTC Application Questions';
exports.TTC_APPLICATION_US_FORM_ID = 'ttc_application_form';
function renderTtcApplicationUsForm() {
    return `<h1>${exports.TTC_APPLICATION_US_FORM_TITLE}</h1><div id="${exports.TTC_APPLICATION_US_FORM_ID}">${exports.TTC_APPLICATION_US_QUESTION_MARKER}</div>`;
}
