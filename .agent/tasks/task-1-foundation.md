# Phase 1 Foundation — Task Reference

## Global Rules
- All files created in this task are NEW files — do not modify any existing files
- Use TypeScript strict mode, match the existing project style (see `app/utils/auth.ts` for patterns)
- Import paths use relative paths without extensions (Next.js convention)
- Do NOT modify `app/utils/auth.ts`, `app/utils/crypto.ts`, or any existing files
- Working directory: `/Users/m/ttp-split-experiment`

## Loop
- Implement: read this file, do Task N. Run `npx tsc --noEmit`. Commit.
- Review: read this file, check Task N. Fix or say "all clean."
- Max 3 review rounds per task.

---

## Task 1: GCS Read/Write Utility

- Slug: `gcs-utility`
- Goal: Create a thin GCS wrapper that reads/writes JSON files and lists files with optional date filtering.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/utils/auth.ts` (lines 1-10) — import style, TypeScript patterns used in this project
2. `/Users/m/ttp-split-experiment/package.json` (lines 69-71) — confirms `@google-cloud/storage@^7` is in optionalDependencies
3. `/Users/m/Downloads/europe-ttp-master@44c225683f8/constants.py` (lines 30-62) — GCS bucket paths and file locations to replicate

### Changes Required

**Create `app/utils/gcs.ts`:**

```typescript
// @google-cloud/storage is an optionalDependency — use dynamic import() so the module
// loads without crashing when the package isn't installed (e.g., local dev without GCS).
// Lazy singleton pattern: first call to getStorage() does the import and caches.

let storageInstance: InstanceType<typeof import('@google-cloud/storage').Storage> | null = null;

async function getStorage() {
  if (storageInstance) return storageInstance;
  try {
    const { Storage } = await import('@google-cloud/storage');
    storageInstance = new Storage();
    return storageInstance;
  } catch {
    throw new Error('GCS not available — install @google-cloud/storage');
  }
}

function getBucketName(): string {
  const name = process.env.GCS_BUCKET_NAME;
  if (!name) throw new Error('GCS_BUCKET_NAME env var not set');
  return name;
}

// GCS path constants (ported from constants.py lines 30-62)
export const GCS_PATHS = {
  USER_CONFIG_PREFIX: 'user_data/',
  USER_SUMMARY_BY_USER: 'user_data/summary/user_summary_by_user.json',
  USER_SUMMARY_BY_FORM_TYPE: 'user_data/summary/user_summary_by_form_type.json',
  USER_INTEGRITY_BY_USER: 'user_data/integrity/user_integrity_by_user.json',
  APPLICANT_ENROLLED_LIST: 'user_data/integrity/applicant_enrolled_list.csv',
  ADMIN_CONFIG: 'config/admin_config.json',
  FORM_CONFIG_PREFIX: 'config/forms/',
  TTC_COUNTRY_AND_DATES: 'config/forms/ttc_country_and_dates.json',
  TEMP_PREFIX: 'tmp/',
} as const;

export interface FileMetadata {
  name: string;
  updated: Date;
  timeCreated: Date;
}

export async function readJson(path: string): Promise<unknown> { ... }
// Downloads file, JSON.parse, returns parsed object. Throws on not-found.

export async function writeJson(path: string, data: unknown): Promise<void> { ... }
// JSON.stringify, upload with content-type text/plain (matching legacy gcs.open 'w' pattern)

export async function readText(path: string): Promise<string> { ... }
// Downloads file, returns string. For CSV and other non-JSON.

export async function writeText(path: string, content: string): Promise<void> { ... }

export async function listFiles(prefix: string, minUpdated?: Date): Promise<FileMetadata[]> { ... }
// Lists files under prefix. If minUpdated provided, filter to files updated after that date.
// Uses file.getMetadata() — read top-level `updated` and `timeCreated` fields (NOT metadata.metadata.*).

export async function fileExists(path: string): Promise<boolean> { ... }

export async function getFileMetadata(path: string): Promise<FileMetadata> { ... }
// Calls file.getMetadata(), returns { name, updated: new Date(metadata.updated), timeCreated: new Date(metadata.timeCreated) }
```

- `@google-cloud/storage` is optional — the dynamic `import()` pattern above handles this. All functions that need Storage call `await getStorage()` which will throw if the package isn't installed.
- `writeJson` should use `JSON.stringify(data)` with no indentation (matching legacy compact JSON)
- Retry params: do NOT add retry logic — keep it simple, let callers retry

### Constraints
- Do NOT add caching — callers decide if/when to cache
- Do NOT add logging — callers decide if/when to log
- Do NOT create any test files

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add GCS read/write utility`

---

## Task 2: Login Endpoint

- Slug: `login-endpoint`
- Goal: Create a `/api/auth/login` POST endpoint that issues session tokens in dev mode and verifies Google ID tokens in production.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/utils/auth.ts` — full file. Contains `generateSessionToken()`, `getAuthMode()`, `getSessionMaxAge()`, `verifySessionToken()`. You will IMPORT from this file, not modify it.
2. `/Users/m/ttp-split-experiment/app/utils/crypto.ts` (lines 1-20) — contains `getSessionHmacSecret()` which you need for generating tokens

### Changes Required

**Create `app/api/auth/login/route.ts`:**

```typescript
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
  // Fetch Google JWKS, verify audience=GOOGLE_CLIENT_ID, issuer=https://accounts.google.com, algorithm=RS256
  // Use jose's createRemoteJWKSet for JWKS fetching with built-in caching
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
```

### Constraints
- Do NOT modify `app/utils/auth.ts` — import only
- Do NOT add GET handler — login is POST-only
- `jose` is already a dependency (`package.json` line 59)

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add login endpoint with dev and production modes`

---

## Task 3: Auth Middleware Helpers

- Slug: `auth-middleware`
- Goal: Create reusable auth middleware functions for route handlers — requireAuth, requireAdmin, requireAdminForPage, requireAdminOrCron, and variants.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/utils/auth.ts` — full file. Contains `getAuthenticatedUser()` — the unified auth entry point. You will IMPORT this function.
2. `/Users/m/Downloads/europe-ttp-master@44c225683f8/constants.py` (lines 84-150) — `LIST_OF_ADMIN_PERMISSIONS` dict. Port this data structure to TS.
3. `/Users/m/Downloads/europe-ttp-master@44c225683f8/admin.py` (lines 140-155) — `check_permissions()` method. Port this logic.

### Changes Required

**Create `app/utils/auth-middleware.ts`:**

```typescript
import { getAuthenticatedUser } from './auth';

// Port of constants.LIST_OF_ADMIN_PERMISSIONS from constants.py:84+
// NOTE: this is hardcoded for parity — will move to GCS config later
const LIST_OF_ADMIN_PERMISSIONS: Record<string, { countries: string[]; report_permissions: string[] }> = {
  'amit.nair@artofliving.org': {
    countries: ['US', 'CA'],
    report_permissions: ['ttc_applicants_summary.html', 'post_sahaj_ttc_course_feedback_summary.html', 'admin_settings.html', 'ttc_applicants_integrity.html'],
  },
  // ... (port ALL entries from constants.py lines 84-150+)
  // Read the file to get the complete list
};

// Flat list of all admin emails (keys of the permissions dict)
const LIST_OF_ADMINS = new Set(Object.keys(LIST_OF_ADMIN_PERMISSIONS));

// Map from Next.js route segments to legacy page keys
const ROUTE_TO_PAGE_KEY: Record<string, string> = {
  'ttc_applicants_summary': 'ttc_applicants_summary.html',
  'ttc_applicants_reports': 'ttc_applicants_reports.html',
  'ttc_applicants_integrity': 'ttc_applicants_integrity.html',
  'settings': 'admin_settings.html',
  'reports_list': 'ttc_applicants_reports.html',
  'post_ttc_course_feedback': 'post_ttc_course_feedback_summary.html',
  'post_sahaj_ttc_course_feedback': 'post_sahaj_ttc_course_feedback_summary.html',
};

type AuthResult = { email: string } | Response;

// Checks authenticated user
export async function requireAuth(request: Request): Promise<AuthResult> { ... }

// Checks user is in LIST_OF_ADMINS (no page-specific permission)
export async function requireAdmin(request: Request): Promise<AuthResult> { ... }

// Checks user has permission for a specific page
export async function requireAdminForPage(request: Request, page: string): Promise<AuthResult> { ... }

// Checks user has permission for ANY of the listed pages
export async function requireAdminAnyOf(request: Request, pages: string[]): Promise<AuthResult> { ... }

// Checks admin list OR cron header
// Cron trust model: if CRON_SECRET env is set, require x-cron-secret header match.
// If CRON_SECRET not set, accept x-appengine-cron header (dev mode only).
export async function requireAdminOrCron(request: Request): Promise<AuthResult> { ... }

// Checks admin with any-of page permission OR cron header
export async function requireAdminAnyOfOrCron(request: Request, pages: string[]): Promise<AuthResult> { ... }

// Helper: check if request has valid cron header
function isCronRequest(request: Request): boolean { ... }

// Helper: check page permission (port of admin.py:140-155 check_permissions)
function checkPermissions(email: string, page: string): boolean {
  const perms = LIST_OF_ADMIN_PERMISSIONS[email];
  if (!perms) return false;
  return perms.report_permissions.includes(page);
}

// Exports for other modules
export { LIST_OF_ADMINS, LIST_OF_ADMIN_PERMISSIONS, ROUTE_TO_PAGE_KEY };
```

All `require*` functions return `{ email }` on success or a `Response` (401/403 JSON) on failure.

### Constraints
- Do NOT modify `app/utils/auth.ts`
- Port ALL entries from `constants.py` `LIST_OF_ADMIN_PERMISSIONS` — read the full file to get every email/permission pair
- The `isCronRequest` helper must implement the CRON_SECRET trust model: when `CRON_SECRET` env var is set, require `x-cron-secret` header to match. When not set, accept `x-appengine-cron: true` header (dev-only fallback).

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add auth middleware with admin permissions and cron bypass`
