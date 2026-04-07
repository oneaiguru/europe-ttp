import { readJson, GCS_PATHS } from '../../../../../utils/gcs';
import { requireAdminOrCron } from '../../../../../utils/auth-middleware';

function isMissingFileError(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  if (code === 404 || code === '404') return true;

  const status = (error as { status?: unknown })?.status;
  if (status === 404 || status === '404') return true;

  const message = (error as { message?: unknown })?.message;
  return typeof message === 'string' && message.includes('404');
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  try {
    const data = await readJson(GCS_PATHS.USER_INTEGRITY_BY_USER);
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'text/plain' },
    });
  } catch (error) {
    if (!isMissingFileError(error)) {
      return Response.json({ error: 'Failed to load integrity data' }, { status: 500 });
    }
    return new Response('{}', {
      headers: { 'content-type': 'text/plain' },
    });
  }
}
