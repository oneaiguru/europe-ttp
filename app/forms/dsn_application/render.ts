export const DSN_FORM_TITLE = 'DSN Application';
export const DSN_QUESTION_MARKER = 'DSN Application Questions';

export function renderDsnApplicationForm(): string {
  return `<h1>${DSN_FORM_TITLE}</h1><div id="dsn-question">${DSN_QUESTION_MARKER}</div>`;
}
