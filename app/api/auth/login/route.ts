import { generateSessionToken, getSessionMaxAge } from '../../../utils/auth';
import { getSessionHmacSecret } from '../../../utils/crypto';
import { createHash, timingSafeEqual } from 'node:crypto';

type CredentialMap = Record<string, string>;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseCredentialMap(raw: string | undefined): CredentialMap | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    const credentials: CredentialMap = {};
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

async function verifyBcryptPassword(password: string, hash: string): Promise<boolean> {
  const { compare } = await import('bcryptjs');
  return compare(password, hash);
}

function hasOnlyBcryptHashes(credentials: CredentialMap): boolean {
  return Object.values(credentials).every((hash) => BCRYPT_HASH_REGEX.test(hash));
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
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

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
  const normalizedEmail = email.toLowerCase();
  const password = getStringValue(body.password);

  if (isDev) {
    const configuredCredentials = parseCredentialMap(process.env.DEV_LOGIN_CREDENTIALS);
    if (configuredCredentials === null && process.env.DEV_LOGIN_CREDENTIALS) {
      return Response.json({ error: 'Invalid DEV_LOGIN_CREDENTIALS JSON format' }, { status: 500 });
    }
    const staticPassword = getStringValue(process.env.DEV_LOGIN_PASSWORD);

    if (configuredCredentials && Object.keys(configuredCredentials).length > 0) {
      const expectedPassword = configuredCredentials[normalizedEmail];
      if (!password || !expectedPassword || !secureCompare(password, expectedPassword)) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } else if (staticPassword) {
      if (!password || !secureCompare(password, staticPassword)) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    const secret = getSessionHmacSecret();
    const token = generateSessionToken(normalizedEmail, secret);
    return jsonResponseWithSessionToken(token, normalizedEmail);
  }

  const hashAlgorithm = getStringValue(process.env.SESSION_LOGIN_HASH_ALGORITHM || 'bcrypt').toLowerCase();
  if (hashAlgorithm !== 'bcrypt') {
    return Response.json(
      { error: 'Server misconfigured: SESSION_LOGIN_HASH_ALGORITHM must be bcrypt' },
      { status: 500 },
    );
  }

  const bcryptCredentialMapRaw = process.env.SESSION_LOGIN_CREDENTIALS_BCRYPT;
  if (!bcryptCredentialMapRaw || bcryptCredentialMapRaw.trim() === '') {
    return Response.json(
      { error: 'Server misconfigured: SESSION_LOGIN_CREDENTIALS_BCRYPT must be set in production session mode' },
      { status: 500 },
    );
  }

  const bcryptCredentials = parseCredentialMap(bcryptCredentialMapRaw);
  if (bcryptCredentials === null) {
    return Response.json(
      { error: 'Server misconfigured: Invalid SESSION_LOGIN_CREDENTIALS_BCRYPT JSON format' },
      { status: 500 },
    );
  }

  if (!bcryptCredentials || Object.keys(bcryptCredentials).length === 0) {
    return Response.json(
      { error: 'Server misconfigured: SESSION_LOGIN_CREDENTIALS_BCRYPT must define at least one user' },
      { status: 500 },
    );
  }

  if (!hasOnlyBcryptHashes(bcryptCredentials)) {
    return Response.json(
      { error: 'Server misconfigured: SESSION_LOGIN_CREDENTIALS_BCRYPT must contain valid bcrypt hashes' },
      { status: 500 },
    );
  }

  const expectedHash = bcryptCredentials[normalizedEmail];
  if (!password || !expectedHash) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  let validPassword = false;
  try {
    validPassword = await verifyBcryptPassword(password, expectedHash);
  } catch {
    return Response.json(
      { error: 'Server misconfigured: bcrypt dependency unavailable' },
      { status: 500 },
    );
  }

  if (!validPassword) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const secret = getSessionHmacSecret();
  const token = generateSessionToken(normalizedEmail, secret);
  return jsonResponseWithSessionToken(token, normalizedEmail);
}
