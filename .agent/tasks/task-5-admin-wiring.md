# Phase 5 Admin Wiring — Task Reference

## Global Rules
- Working directory: `/Users/m/ttp-split-experiment`
- These tasks depend on Phases 1-4 being complete
- Do NOT modify `app/utils/auth.ts`
- Do NOT remove `mock-data.ts` until ALL mock imports are eliminated
- Group 7 ordering (`5.1` → `5.2` → `5.3` and `5.5` after `5.1-5.4`) is binding for execution and should not be changed here.

## Loop
- Implement: read this file, do Task N. Run `npx tsc --noEmit`. Commit.
- Review: read this file, check Task N. Fix or say "all clean."
- Max 3 review rounds per task.

---

## Task 1: Wire Dynamic TTC List on Admin Pages

- Slug: `ttc-list-wiring`
- Goal: Replace hardcoded TTC list placeholders with dynamic GCS-backed TTC list on all 3 admin pages.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/api/admin/ttc_applicants_summary/route.ts` (full file) — has `DEFAULT_TTC_LIST_HTML` placeholder
2. `/Users/m/ttp-split-experiment/app/api/admin/ttc_applicants_integrity/route.ts` (full file) — same pattern
3. `/Users/m/ttp-split-experiment/app/api/admin/ttc_applicants_reports/route.ts` (full file) — same + `ttcCountryAndDates: '[]'`
4. `/Users/m/Downloads/europe-ttp-master@44c225683f8/admin.py` (lines 82-138) — `get_ttc_list_html()` to port
5. `/Users/m/ttp-split-experiment/app/utils/gcs.ts` — `readJson()`, `GCS_PATHS`

### Changes Required

**Create `app/utils/admin-helpers.ts`:**
Port `get_ttc_list_html()` from `admin.py:82-138`. Reads TTC list from GCS, generates `<option>` HTML. Also return raw JSON for `ttcCountryAndDates` parameter.

```typescript
import { readJson, GCS_PATHS } from './gcs';

/**
 * Port of admin.py:82-138 get_ttc_list_html().
 * @param userHomeCountry - ISO country code for filtering (optional). Legacy uses display_countries
 *   field on each option to filter by user's home country (admin.py:102-105).
 */
export async function getTtcListHtml(userHomeCountry?: string): Promise<{ html: string; json: string }> {
  const allOptions = await readJson(GCS_PATHS.TTC_COUNTRY_AND_DATES) as Array<Record<string, unknown>>;

  // Filter options by display_countries (matching admin.py:102-105)
  const options = allOptions.filter(option => {
    if (userHomeCountry && Array.isArray(option.display_countries)) {
      return (option.display_countries as string[]).includes(userHomeCountry);
    }
    return true; // no filtering if no country or no display_countries field
  });

  let optionsHtml = '';
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const selected = i === options.length - 1 ? 'selected' : '';
    optionsHtml += `<option value="${option.value}" ${selected}>${option.display}</option>`;
  }
  // Wrap in the same div structure as legacy admin.py:116-131
  const html = `<div class="mt-[15px] mb-[23px]">
    <div class="tablebody"><div name="ttc_list" class="tablerow">
      <div class="tablecell"><label for="ttc_list">TTC</label>
        <span class="smallertext">Select the TTC from the dropdown</span></div>
      <div class="tablecell">
        <select class="textbox" id="ttc_list" name="ttc_list" onchange="load_table_data()">
          ${optionsHtml}
        </select></div>
    </div></div></div>`;
  return { html, json: JSON.stringify(allOptions) }; // json uses ALL options (unfiltered, for client-side use)
}
```

**Modify each of the 3 route files:** Replace hardcoded `DEFAULT_TTC_LIST_HTML` with `await getTtcListHtml()`.

For the reports page route (`ttc_applicants_reports/route.ts`), ALSO replace the hardcoded `ttcCountryAndDates: '[]'` with the `json` value returned from `getTtcListHtml()`:
```typescript
const { html, json } = await getTtcListHtml();
// ... use html for DEFAULT_TTC_LIST_HTML replacement
// ... use json for ttcCountryAndDates: json
```

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: wire dynamic TTC list from GCS on admin pages`

---

## Task 2: Wire Last Updated Timestamps

- Slug: `timestamps`
- Goal: Add real last-updated timestamps to admin pages (currently hardcoded or missing).

### Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/admin.py` (lines 158-174) — `get_user_reporting_last_updated_datetime()` to port
2. `/Users/m/ttp-split-experiment/app/utils/gcs.ts` — `getFileMetadata()` function

### Changes Required

**Step 1: Add helper to `app/utils/admin-helpers.ts`:**
```typescript
export async function getLastUpdatedTimestamps(): Promise<{
  user_summary_last_updated_datetime: string;
  user_integrity_last_updated_datetime: string;
}> {
  // Read file metadata for summary (by_form_type) and integrity (by_user) files
  // Use file.getMetadata() → top-level `updated` field
  // Format as 'YYYY-MM-DD HH:MM:SS'
  // Handle file-not-found gracefully (return empty string)
}
```

**Note:** Integrity reads from `_by_user` (not `_by_form_type`) — see plan for legacy inconsistency note.

**Step 2: Wire timestamps into admin page route files.**

Task 5.1 already modifies these 3 route files to add TTC list. Now also pass timestamps into the render calls. For each of these routes:
- `app/api/admin/ttc_applicants_summary/route.ts`
- `app/api/admin/ttc_applicants_integrity/route.ts`
- `app/api/admin/ttc_applicants_reports/route.ts`

Add `await getLastUpdatedTimestamps()` call and pass the result to the render function. The render functions accept these as template parameters — check each render.ts file's function signature to see where they go. Legacy passes them as `user_summary_last_updated_datetime` and `user_integrity_last_updated_datetime` (see `admin.py:239-240`).

### Read These Files (for Step 2)
3. `/Users/m/ttp-split-experiment/app/admin/ttc_applicants_summary/render.ts` (first 20 lines) — render function signature
4. `/Users/m/ttp-split-experiment/app/admin/ttc_applicants_integrity/render.ts` (first 20 lines) — render function signature
5. `/Users/m/ttp-split-experiment/app/admin/ttc_applicants_reports/render.ts` (first 20 lines) — render function signature
6. `/Users/m/ttp-split-experiment/.agent/tasks/TASK_ORDER.md` (Group 7 entry) — confirm execution sequence before coding.

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add GCS-backed last-updated timestamps to admin pages`

---

## Task 3: Add Auth to Admin HTML Page Routes

- Slug: `admin-page-auth`
- Goal: Add page-specific authentication to all admin HTML page routes.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/utils/auth-middleware.ts` — `requireAdminForPage()` function
2. All admin route files under `app/api/admin/*/route.ts` — identify which serve HTML pages (import from `render.ts`) vs which serve JSON data

### Changes Required

Add `requireAdminForPage()` to each HTML page route. The pattern:
```typescript
import { requireAdminForPage } from '../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'PAGE_KEY.html');
  if (auth instanceof Response) return auth;

  // ... existing render logic ...
}
```

**Page-specific auth mapping:**

| Route file | Page key |
|---|---|
| `app/api/admin/ttc_applicants_summary/route.ts` | `ttc_applicants_summary.html` |
| `app/api/admin/ttc_applicants_reports/route.ts` | `ttc_applicants_reports.html` |
| `app/api/admin/ttc_applicants_integrity/route.ts` | `ttc_applicants_integrity.html` |
| `app/api/admin/settings/route.ts` | `admin_settings.html` |
| `app/api/admin/post_ttc_course_feedback/route.ts` | `post_ttc_course_feedback_summary.html` |
| `app/api/admin/post_sahaj_ttc_course_feedback/route.ts` | `post_sahaj_ttc_course_feedback_summary.html` |
| `app/api/admin/reports_list/route.ts` | `ttc_applicants_reports.html` |
| `app/api/admin/permissions/route.ts` | **NO AUTH — skip this one** |

**`/api/admin/permissions`** must remain publicly reachable — it IS the unauthorized UX page.
Do not add `requireAdminForPage()` (or any other auth guard) to this route.

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add page-specific auth to admin HTML page routes`

---

## Task 4: Auth + New Routes for User-Report Endpoints

- Slug: `user-report-routes`
- Goal: Add auth to existing user-report route and create 2 missing user-report routes that admin pages need.

### Read These Files First
1. `/Users/m/ttp-split-experiment/app/api/admin/reporting/user-report/get-user-application-html/route.ts` (full file) — existing route, needs auth added
2. `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/user_report.py` (lines 271-498) — `get_user_application()` and route handlers
3. `/Users/m/ttp-split-experiment/app/utils/ttc-portal-user.ts` — `TTCPortalUser` for loading user data
4. `/Users/m/ttp-split-experiment/app/utils/auth-middleware.ts` — `requireAdmin()`
5. `/Users/m/ttp-split-experiment/app/admin/ttc_applicants_summary/render.ts` (lines 190-210) — shows how admin JS calls these endpoints (relative URLs)

### Changes Required

**Modify `app/api/admin/reporting/user-report/get-user-application-html/route.ts`:**
Add `requireAdmin(request)` check at the start of GET handler.

**Create `app/api/admin/reporting/user-report/get-user-application/route.ts`:**

**IMPORTANT:** This route returns RENDERED HTML, not raw JSON. Legacy `user_report.py:271-467` renders form questions with user's answers as an HTML page using Jinja templates.

**DEPENDENCY NOTE:** Full legacy-parity rendering requires country-specific form schemas from GCS (`config/forms/{country}/{form_type}.json`), which the plan defers to Phase 6. For Phase 5, use a simplified approach:

```typescript
import { requireAdmin } from '../../../../../utils/auth-middleware';
import { TTCPortalUser } from '../../../../../utils/ttc-portal-user';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const email = url.searchParams.get('email') || '';
  const formType = url.searchParams.get('form_type') || '';
  const formInstance = url.searchParams.get('form_instance') || '';

  const user = await TTCPortalUser.create(email);
  const formData = user.getFormData(formType, formInstance);

  // Phase 5 approach: render a simple key-value HTML table from stored form data.
  // This does NOT use country-specific form schemas (deferred to Phase 6).
  // When Phase 6 adds GCS schema loading, this renderer will be upgraded to show
  // proper question labels, field types, and display values.
  const rows = Object.entries(formData)
    .map(([key, val]) => `<tr><td>${key}</td><td>${String(val)}</td></tr>`)
    .join('');
  const html = `<table border="1" cellpadding="4"><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html' },
  });
}
```

**Create `app/api/admin/reporting/user-report/get-user-application-combined/route.ts`:**

Same simplified approach — accepts multiple forms via `forms` query param (JSON array of `{email, form_type, form_instance}`), loads each user's form data, renders all as concatenated HTML tables. Full schema-driven rendering comes in Phase 6.

This route is actively called by admin pages (`ttc_applicants_summary/render.ts:202`, `ttc_applicants_reports/render.ts:444`). It MUST return valid HTML — the admin page embeds it in an iframe/modal. The simplified key-value table is functional (shows all data) even without pretty question labels.

### Constraints
- Auth is `requireAdmin()` — no cron bypass, no page-specific permission (matching legacy `user_report.py:478`)
- Routes MUST be under `/api/admin/reporting/user-report/` — admin page JS calls them via relative URLs
- Return content as `text/html` for the `get-user-application` and `get-user-application-combined` endpoints.

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: add auth and missing user-report routes for admin pages`

---

## Task 5: Fix Test Fixture Endpoint Path

- Slug: `fixture-fix`
- Goal: Fix incorrect endpoint path in test fixture.

### Read These Files First
1. `/Users/m/ttp-split-experiment/test/fixtures/test-config.json` (line 26) — incorrect endpoint namespace

### Changes Required

**Modify `test/fixtures/test-config.json:26`:**

Change:
```json
"user_integrity_load": "/jobs/reporting/user-integrity/load"
```

To:
```json
"user_integrity_load": "/jobs/integrity/user-integrity/load"
```

The legacy namespace is `/jobs/integrity/user-integrity/load`, not `/jobs/reporting/user-integrity/load`. The correct JSON key is `user_integrity_load` (not `integrity_load`).

### Verification
- Run fixture-driven tests: they should no longer fail due to endpoint mismatch
- Commit message: `fix: correct test fixture endpoint path for integrity load`

---

## Task 6: Validate Data Shape Compatibility

- Slug: `data-shape-validation`
- Goal: Verify that real GCS data shape matches what the client-side JS expects (DataTables, Select2).

### Overview

This is a **verification-only task** (no code changes except fixes if mismatches found). Before removing `mock-data.ts`, we must confirm that the JSON payloads returned by the real reporting/integrity jobs match the shape of the mock data, field-by-field. Mismatches will silently break the admin UI.

### Steps

1. **Seed test data:** Upload form responses for 3+ test users via `/users/upload-form-data` with diverse form types and nested structures (repeaters, checkbox groups, etc.). Include at least one TTC evaluation form to trigger matching logic.

2. **Run jobs:** Execute both reporting pipelines:
   - POST to `/jobs/reporting/user-summary/load` to generate `user_summary_by_form_type.json` and `user_summary_by_user.json`
   - POST to `/jobs/integrity/user-integrity/load` to generate `user_integrity_by_user.json`

3. **Extract GCS outputs:** Download the generated JSON files from GCS:
   - `user_data/summary/user_summary_by_form_type.json` → compare against `MOCK_SUMMARY_DATA`
   - GET `/api/admin/reporting/user-summary/get-by-user` response → compare against the combined shape consumed by all three reporting pages (`MOCK_REPORTS_DATA`, `MOCK_POST_TTC_FEEDBACK_DATA`, and `MOCK_POST_SAHAJ_FEEDBACK_DATA`).  
     If the Phase 5+ implementation has become a direct read of `user_summary_by_user.json`, that file must already contain this combined shape.
   - `user_data/integrity/user_integrity_by_user.json` → compare against `MOCK_INTEGRITY_DATA`
   - GET `/api/admin/admin/get-config` response → compare against `MOCK_SETTINGS_DATA` shape (NOT the raw `config/admin_config.json` GCS file, which is a wrapper; the API response returns `raw_config` contents that match the mock shape)

4. **Field-by-field comparison:** For each exported file, verify:
   - Top-level keys match (same field names in real vs mock)
   - Nested object/array structures match (properties on nested objects, array item shapes)
   - Data types are consistent (string, number, boolean, array, object — no unexpected nulls or mismatched types)
   - Example: if `MOCK_SUMMARY_DATA['form_type_x'][0]` has fields `{email, form_instance, reporting_status, ...}`, verify the real output has exactly those fields
   - If a field in the mock is a number (e.g., `evaluations_submitted_count`), the real output must produce a number, not a string

5. **Fix mismatches (if any):** If the shape differs, it's likely a bug in the user-summary.ts or user-integrity.ts logic. Investigate and fix the job logic. Do NOT work around it by changing the mock data — the mock is the canonical shape spec.

6. **Log findings:** Document any shape discrepancies, fixes applied, and confirmation that the final outputs match exactly.

### Verification

- All GCS-generated JSON files have the same shape as their mock equivalents
- No uncommitted code changes (verification only — if bugs were found and fixed, those would be separate commits on their own tasks)
- Commit message: None needed (verification task — no code to commit unless fixes were required in user-summary.ts or user-integrity.ts, in which case those are bug fixes on separate tasks)
