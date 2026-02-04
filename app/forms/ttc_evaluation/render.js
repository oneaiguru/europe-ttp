"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTC_EVALUATION_QUESTION_MARKER = exports.TTC_EVALUATION_FORM_TITLE = void 0;
exports.renderTtcEvaluationForm = renderTtcEvaluationForm;
exports.TTC_EVALUATION_FORM_TITLE = 'TTC Evaluation';
exports.TTC_EVALUATION_QUESTION_MARKER = 'TTC Evaluation Questions';
function renderTtcEvaluationForm() {
    return "<h1>".concat(exports.TTC_EVALUATION_FORM_TITLE, "</h1><div id=\"ttc-evaluation-form\">").concat(exports.TTC_EVALUATION_QUESTION_MARKER, "</div>");
}
