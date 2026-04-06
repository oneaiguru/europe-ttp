import { requireAuth } from '../../utils/auth-middleware';
import { TTCPortalUser } from '../../utils/ttc-portal-user';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const user = await TTCPortalUser.create(auth.email);
  return Response.json(user.getConfig());
}
