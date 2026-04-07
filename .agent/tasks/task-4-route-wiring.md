# Phase 4 Route Wiring — Task Reference

## Global Rules
- Working directory: `/Users/m/ttp-split-experiment`
- These tasks depend on Tasks 4.3 and 4.4 being complete (summary + integrity jobs exist)
- Keep `text/plain` content-type on ALL data responses (client JS does `JSON.parse(data)`)
- Do NOT remove `mock-data.ts` — other routes may still reference it until Phase 5

## Loop
- Implement: read this file, do Task N. Run `npx tsc --noEmit`. Commit.
- Review: read this file, check Task N. Fix or say "all clean."
- Max 3 review rounds per task.

---

## Task 1: Replace Mock Data in Reporting Routes

- Slug: `wire-reporting`
- Goal: Replace mock-data imports in the 3 admin data API routes with real GCS reads.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/api/admin/reporting/user-summary/get-by-form-type/route.ts` (full file) — currently imports `MOCK_SUMMARY_DATA`
2. `/Users/m/ttp-split-experiment/app/api/admin/reporting/user-summary/get-by-user/route.ts` (full file) — currently imports `MOCK_REPORTS_DATA` + merged
3. `/Users/m/ttp-split-experiment/app/api/admin/integrity/user-integrity/get-by-user/route.ts` (full file) — currently imports `MOCK_INTEGRITY_DATA`
4. `/Users/m/ttp-split-experiment/app/utils/gcs.ts` — `readJson()`, `GCS_PATHS`
5. `/Users/m/ttp-split-experiment/app/utils/auth-middleware.ts` — `requireAdminOrCron()`, `requireAdminAnyOfOrCron()`

### Changes Required

**Replace `app/api/admin/reporting/user-summary/get-by-form-type/route.ts`:**
```typescript
import { readJson, GCS_PATHS } from '../../../../../utils/gcs';
import { requireAdminOrCron } from '../../../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  const data = await readJson(GCS_PATHS.USER_SUMMARY_BY_FORM_TYPE);
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'text/plain' },
  });
}
```

**Replace `app/api/admin/reporting/user-summary/get-by-user/route.ts`:**
```typescript
import { readJson, GCS_PATHS } from '../../../../../utils/gcs';
import { requireAdminAnyOfOrCron } from '../../../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminAnyOfOrCron(request, [
    'ttc_applicants_reports.html',
    'post_ttc_course_feedback_summary.html',
    'post_sahaj_ttc_course_feedback_summary.html',
  ]);
  if (auth instanceof Response) return auth;

  const data = await readJson(GCS_PATHS.USER_SUMMARY_BY_USER);
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'text/plain' },
  });
}
```

**Replace `app/api/admin/integrity/user-integrity/get-by-user/route.ts`:**
```typescript
import { readJson, GCS_PATHS } from '../../../../../utils/gcs';
import { requireAdminOrCron } from '../../../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminOrCron(request);
  if (auth instanceof Response) return auth;

  const data = await readJson(GCS_PATHS.USER_INTEGRITY_BY_USER);
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'text/plain' },
  });
}
```

### Constraints
- MUST keep `text/plain` content-type — do NOT use `Response.json()`
- Remove `mock-data` imports from these 3 files only
- Do NOT touch `mock-data.ts` itself (get-config still uses it until Phase 3 runs)

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: wire reporting routes to real GCS data`

---

## Task 2: Create Parity Alias Routes

- Slug: `parity-aliases`
- Goal: Create legacy-compatible route aliases so both `/reporting/...` and `/jobs/...` paths work.

### Read These Files First
1. `/Users/m/ttp-split-experiment/.agent/tasks/task-4.3-user-summary.md` — route list and auth requirements for summary aliases
2. `/Users/m/ttp-split-experiment/.agent/tasks/task-4.4-user-integrity.md` — route list and auth requirements for integrity aliases
3. `/Users/m/ttp-split-experiment/app/utils/auth-middleware.ts` — auth helpers

### Changes Required

These routes should already exist from Tasks 4.3 and 4.4. **Verify they exist and have correct auth.** If any are missing, create them:

| Route File | Method | Auth |
|---|---|---|
| `app/reporting/user-summary/load/route.ts` | GET | `requireAdminOrCron()` |
| `app/reporting/user-summary/load/route.ts` | POST | `requireAdmin()` |
| `app/jobs/reporting/user-summary/load/route.ts` | GET | `requireAdminOrCron()` |
| `app/jobs/reporting/user-summary/load/route.ts` | POST | `requireAdmin()` |
| `app/reporting/user-summary/get-by-user/route.ts` | GET | `requireAdminOrCron()` |
| `app/integrity/user-integrity/load/route.ts` | GET | `requireAdminOrCron()` |
| `app/integrity/user-integrity/load/route.ts` | POST | `requireAdmin()` |
| `app/jobs/integrity/user-integrity/load/route.ts` | GET | `requireAdminOrCron()` |
| `app/jobs/integrity/user-integrity/load/route.ts` | POST | `requireAdmin()` |
| `app/jobs/integrity/user-integrity/postload/route.ts` | GET | `requireAdminOrCron()` |
| `app/jobs/integrity/user-integrity/postload/route.ts` | POST | `requireAdmin()` |
| `app/integrity/user-integrity/get-by-user/route.ts` | GET | `requireAdminOrCron()` |

Each route delegates to the corresponding function in `user-summary.ts` or `user-integrity.ts`.

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add legacy parity route aliases for reporting and integrity`
