import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderTtcEvaluationForm, TTC_EVALUATION_FORM_TITLE } from '../../../forms/ttc_evaluation/render';

export async function GET() {
  const page = wrapFormShell({
    title: TTC_EVALUATION_FORM_TITLE,
    bodyHtml: renderTtcEvaluationForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
