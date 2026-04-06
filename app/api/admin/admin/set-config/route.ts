import { setAdminConfig } from '../../../../utils/admin-config';
import { requireAdminForPage } from '../../../../utils/auth-middleware';

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'admin_settings.html');
  if (auth instanceof Response) return auth;

  // Settings page sends form-urlencoded via jQuery $.post(), not JSON
  const contentType = request.headers.get('content-type') || '';
  let configParams: Record<string, unknown>;

  if (contentType.includes('application/json')) {
    const body = await request.json() as Record<string, unknown>;
    configParams = body.config_params as Record<string, unknown>;
  } else {
    // Form-urlencoded: config_params is a JSON string field
    const formData = await request.formData();
    const raw = formData.get('config_params');
    if (typeof raw !== 'string') {
      return Response.json({ error: 'config_params required' }, { status: 400 });
    }
    configParams = JSON.parse(raw) as Record<string, unknown>;
  }

  if (!configParams || typeof configParams !== 'object') {
    return Response.json({ error: 'config_params must be an object' }, { status: 400 });
  }

  await setAdminConfig(configParams);
  return Response.json({ ok: true });
}
