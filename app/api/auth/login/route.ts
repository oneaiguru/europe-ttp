import { generateSessionToken, getSessionMaxAge } from '../../../utils/auth';
import { getSessionHmacSecret } from '../../../utils/crypto';
import { createHash, timingSafeEqual } from 'node:crypto';

type DevCredentials = Record<string, string>;

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getDevLoginCredentials(raw: string | undefined): DevCredentials | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    const credentials: DevCredentials = {};
    for (const [email, password] of entries) {
      if (typeof email !== 'string' || typeof password !== 'string') {
        return null;
      }
      credentials[email.trim().toLowerCase()] = password;
    }

    return credentials;
  } catch {
    return null;
  }
}

function secureCompare(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a).digest();
  const digestB = createHash('sha256').update(b).digest();
  try {
    return timingSafeEqual(digestA, digestB);
  } catch {
    return false;
  }
}

function toIntCookieDate(seconds: number): string {
  const now = new Date();
  now.setSeconds(now.getSeconds() + seconds);
  return now.toUTCString();
}

function buildSessionCookie(token: string): string {
  const maxAge = getSessionMaxAge();
  const expires = toIntCookieDate(maxAge);
  const parts = [
    `session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    `Expires=${expires}`,
  ];

  // Avoid setting Secure for localhost dev to keep local HTTP sessions working.
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function jsonResponseWithSessionToken(token: string, email: string): Response {
  return new Response(JSON.stringify({ token, email }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': buildSessionCookie(token),
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const mode = process.env.AUTH_MODE === 'platform' ? 'platform' : 'session';
  const isDev = process.env.NODE_ENV === 'development';

  // Platform mode: login not needed (IAP handles auth)
  if (mode === 'platform') {
    return Response.json({ error: 'Login not available in platform mode' }, { status: 404 });
  }

  // Session mode
  const body = await request.json() as Record<string, unknown>;
  const email = getStringValue(body.email);

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 });
  }

  const configuredCredentials = getDevLoginCredentials(process.env.DEV_LOGIN_CREDENTIALS);
  if (configuredCredentials === null && process.env.DEV_LOGIN_CREDENTIALS) {
    return Response.json({ error: 'Invalid DEV_LOGIN_CREDENTIALS JSON format' }, { status: 500 });
  }

  const staticPassword = getStringValue(process.env.DEV_LOGIN_PASSWORD);
  const password = getStringValue(body.password);

  if (configuredCredentials && Object.keys(configuredCredentials).length > 0) {
    const expectedPassword = configuredCredentials[email.toLowerCase()];
    if (!password || !expectedPassword || !secureCompare(password, expectedPassword)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } else if (staticPassword) {
    if (!password || !secureCompare(password, staticPassword)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  }

  if (isDev) {
    const secret = getSessionHmacSecret();
    const token = generateSessionToken(email, secret);
    return jsonResponseWithSessionToken(token, email);
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
    return jsonResponseWithSessionToken(token, email);
  } catch {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
