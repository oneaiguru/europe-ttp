# Phase 2 User Routes — Task Reference

## Global Rules
- Working directory: `/Users/m/ttp-split-experiment`
- These tasks depend on Task 2.1 (TTCPortalUser) being complete
- All routes require authentication via `requireAuth()` from `app/utils/auth-middleware.ts`
- Do NOT modify `app/utils/auth.ts` or `app/utils/ttc-portal-user.ts`
- Match legacy response format exactly (JSON responses via `Response.json()`)

## Loop
- Implement: read this file, do Task N. Run `npx tsc --noEmit`. Commit.
- Review: read this file, check Task N. Fix or say "all clean."
- Max 3 review rounds per task.

---

## Task 1: Wire Form Persistence in Upload Endpoint

- Slug: `wire-upload`
- Goal: Replace the "intentionally deferred" comment in upload-form-data with real GCS persistence.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/users/upload-form-data/route.ts` (full file, ~317 lines) — the file to modify. Focus on lines 304-307 where it says "Form data persistence is intentionally deferred."
2. `/Users/m/ttp-split-experiment/app/utils/ttc-portal-user.ts` — the class to use for persistence
3. `/Users/m/Downloads/europe-ttp-master@44c225683f8/ttc_portal_user.py` (lines 403-424) — legacy `UsersService.post()` showing the upload flow

### Changes Required

**Modify `app/users/upload-form-data/route.ts`:**

Add import at top (note: upload-form-data is at `app/users/upload-form-data/`, so `app/utils/` is two levels up):
```typescript
import { TTCPortalUser } from '../../utils/ttc-portal-user';
```

Replace lines 304-307 (the deferred comment + return) with:
```typescript
  // 5. Persist form data to GCS
  const formUser = await TTCPortalUser.create(user);
  formUser.setHomeCountry(
    validation.data!.user_home_country_iso
    || request.headers.get('x-appengine-country')
    || request.headers.get('x-vercel-ip-country')
    || ''
  );

  // form_data / form_instance_page_data arrive as JSON strings from form-urlencoded
  // but as objects from JSON callers. Parse only if string.
  const formData = typeof validation.data!.form_data === 'string'
    ? JSON.parse(validation.data!.form_data) : validation.data!.form_data;
  const pageData = typeof validation.data!.form_instance_page_data === 'string'
    ? JSON.parse(validation.data!.form_instance_page_data) : validation.data!.form_instance_page_data;

  formUser.setFormData(
    validation.data!.form_type!,
    validation.data!.form_instance || '',
    formData,
    pageData,
    validation.data!.form_instance_display || ''
  );
  await formUser.saveUserData();

  return Response.json(
    {
      ok: true,
      user: user,
    },
    { status: 200 }
  );
```

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: wire form data persistence to GCS in upload endpoint`

---

## Task 2: Create User Data Routes

- Slug: `user-data-routes`
- Goal: Create 4 user-facing API routes matching legacy `/users/*` endpoints.

### Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/ttc_portal_user.py` (lines 426-462) — `UsersService.get()` showing all route handlers
2. `/Users/m/ttp-split-experiment/app/utils/ttc-portal-user.ts` — the class to use
3. `/Users/m/ttp-split-experiment/app/utils/auth-middleware.ts` — `requireAuth()` function
4. `/Users/m/ttp-split-experiment/app/users/upload-form-data/route.ts` (lines 1-30) — import style pattern for user routes

### Changes Required

**Create `app/users/get-form-data/route.ts`:**
```typescript
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
```

**Create `app/users/get-form-instances/route.ts`:**
Same pattern. Reads `form_type` from query params. Returns `user.getFormInstances(formType)`.

**Create `app/users/set-config/route.ts`:**
POST handler. Reads body (`{ config_params: {...} }`). Legacy uses jQuery `$.post()` which sends form-urlencoded by default, but also supports JSON. Handle both content types:
```typescript
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
```

**Create `app/users/get-config/route.ts`:**
GET handler. Returns `Response.json(user.getConfig())`.

### Constraints
- All routes use `requireAuth()` — these are user-facing, not admin
- Match legacy query param names exactly: `form_type`, `form_instance`, `config_params`
- Do NOT add admin-only check — any authenticated user can access their own data

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add user data routes for form-data, instances, and config`
