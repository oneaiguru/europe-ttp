import { requireAdminOrCron, requireAdmin } from '@/app/utils/auth-middleware';
import { loadUserSummary } from '@/app/utils/reporting/user-summary';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  await loadUserSummary();
  return new Response('OK', { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  await loadUserSummary();
  return new Response('OK', { status: 200 });
}
