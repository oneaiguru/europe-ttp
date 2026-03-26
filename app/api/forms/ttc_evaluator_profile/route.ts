import { wrapFormShell } from '../../../forms/shared/form-shell';
import { renderTtcEvaluatorProfileForm } from '../../../forms/ttc_evaluator_profile/render';

export async function GET() {
  const page = wrapFormShell({
    title: 'TTC Evaluator Profile',
    bodyHtml: renderTtcEvaluatorProfileForm(),
  });
  return new Response(page, {
    headers: { 'content-type': 'text/html' },
  });
}
