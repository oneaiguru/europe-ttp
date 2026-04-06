import { requireAuth } from '../../utils/auth-middleware';
import { TTCPortalUser } from '../../utils/ttc-portal-user';

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const contentType = request.headers.get('content-type') || '';
  let body: { config_params?: Record<string, unknown> };

  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    const configParamsStr = formData.get('config_params');
    body = {
      config_params: typeof configParamsStr === 'string'
        ? JSON.parse(configParamsStr)
        : configParamsStr,
    };
  }

  const user = await TTCPortalUser.create(auth.email);
  user.setConfig(body.config_params || {});
  await user.saveUserData();

  return Response.json({ ok: true });
}
