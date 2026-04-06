import { requireAdminOrCron } from '@/app/utils/auth-middleware';
import { getUserSummaryByUser } from '@/app/utils/reporting/user-summary';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  const data = await getUserSummaryByUser();
  // CRITICAL: keep text/plain — client JS does JSON.parse(data)
  return new Response(data, {
    headers: { 'content-type': 'text/plain' },
  });
}
