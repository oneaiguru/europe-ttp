import { requireAdminOrCron, requireAdmin } from '@/app/utils/auth-middleware';
import { loadUserIntegrity } from '@/app/utils/reporting/user-integrity';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  await loadUserIntegrity();
  return Response.json({ ok: true });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  await loadUserIntegrity();
  return Response.json({ ok: true });
}
