import { requireAuth } from '../../utils/auth-middleware';
import { TTCPortalUser } from '../../utils/ttc-portal-user';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const formType = url.searchParams.get('form_type') || '';
  const formInstance = url.searchParams.get('form_instance') || '';

  const user = await TTCPortalUser.create(auth.email);
  const data = user.getFormData(formType, formInstance);
  return Response.json(data);
}
