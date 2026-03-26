import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderPostTtcSelfEvaluationForm } from '../../../forms/post_ttc_self_evaluation/render';

export async function GET() {
  const page = wrapFormShell({
    title: 'Post-TTC Self Evaluation',
    bodyHtml: renderPostTtcSelfEvaluationForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
