export const TTC_EVALUATION_FORM_TITLE = 'TTC Evaluation';
export const TTC_EVALUATION_QUESTION_MARKER = 'TTC Evaluation Questions';

export function renderTtcEvaluationForm(): string {
  return `<h1>${TTC_EVALUATION_FORM_TITLE}</h1><div id="ttc-evaluation-form">${TTC_EVALUATION_QUESTION_MARKER}</div>`;
}
