import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderPostSahajTtcSelfEvaluationForm } from '../../../forms/post_sahaj_ttc_self_evaluation/render';

export async function GET() {
  const page = wrapFormShell({
    title: 'Post-Sahaj TTC Self Evaluation',
    bodyHtml: renderPostSahajTtcSelfEvaluationForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
