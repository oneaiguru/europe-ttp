import { NextRequest } from 'next/server';
import { MOCK_REPORTS_DATA, MOCK_POST_TTC_FEEDBACK_DATA, MOCK_POST_SAHAJ_FEEDBACK_DATA } from '../../../mock-data';

export async function GET(request: NextRequest) {
  // The reports, post-ttc-feedback, and post-sahaj-feedback pages all call
  // this same endpoint. The client-side JS differentiates by checking which
  // form keys exist in the response (ttc_application, post_ttc_self_evaluation_form, etc.)
  //
  // Merge all mock data so each page finds what it needs.
  const merged: Record<string, Record<string, unknown>> = {};

  for (const [email, data] of Object.entries(MOCK_REPORTS_DATA)) {
    merged[email] = { ...merged[email], ...data };
  }
  for (const [email, data] of Object.entries(MOCK_POST_TTC_FEEDBACK_DATA)) {
    merged[email] = { ...merged[email], ...data };
  }
  for (const [email, data] of Object.entries(MOCK_POST_SAHAJ_FEEDBACK_DATA)) {
    merged[email] = { ...merged[email], ...data };
  }

  return new Response(JSON.stringify(merged), {
    headers: { 'content-type': 'text/plain' },
  });
}
