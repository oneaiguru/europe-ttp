import { generateSessionToken } from '../../../utils/auth';
import { getSessionHmacSecret } from '../../../utils/crypto';

export async function POST(request: Request): Promise<Response> {
  const mode = process.env.AUTH_MODE === 'platform' ? 'platform' : 'session';
  const isDev = process.env.NODE_ENV === 'development';

  // Platform mode: login not needed (IAP handles auth)
  if (mode === 'platform') {
    return Response.json({ error: 'Login not available in platform mode' }, { status: 404 });
  }

  // Session mode
  const body = await request.json() as Record<string, unknown>;

  if (isDev) {
    // Dev mode: accept email-only, no verification
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 });
    }
    const secret = getSessionHmacSecret();
    const token = generateSessionToken(email, secret);
    return Response.json({ token, email });
  }

  // Production session mode: verify Google ID token
  const idToken = typeof body.id_token === 'string' ? body.id_token : '';
  if (!idToken) {
    return Response.json({ error: 'id_token required' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: 'Server misconfigured: GOOGLE_CLIENT_ID not set' }, { status: 500 });
  }

  // Verify Google ID token using jose
  try {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
    const { payload } = await jwtVerify(idToken, JWKS, {
      audience: clientId,
      issuer: 'https://accounts.google.com',
    });
    const email = typeof payload.email === 'string' ? payload.email : null;
    if (!email) {
      return Response.json({ error: 'No email in token' }, { status: 401 });
    }
    const secret = getSessionHmacSecret();
    const token = generateSessionToken(email, secret);
    return Response.json({ token, email });
  } catch {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
