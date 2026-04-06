import { requireAdminOrCron } from '@/app/utils/auth-middleware';
import { getUserIntegrityByUser } from '@/app/utils/reporting/user-integrity';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  const data = await getUserIntegrityByUser();
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'text/plain' },
  });
}
