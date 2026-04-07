# Task: Port User Integrity Matching

## Goal
Port the user integrity cron job from Python to TypeScript — reads all user data, compares enrolled people and organized courses across applicants to find duplicates/matches.

## Context
The integrity report helps admins spot applicants who share enrolled people or organized courses (potential data integrity issues). It runs daily at 03:00 via cron. The matching is simpler than user_summary — exact matching on fields, no Levenshtein. Writes results to `user_integrity_by_user.json`.

## Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/user_integrity.py` (full file, ~413 lines) — the source to port. Key sections:
   - `load_user_integrity()` (lines 80-357) — main aggregation + matching
   - `post_load_user_integrity()` (lines 359-400) — CSV export
   - `get_user_integrity_by_user()` (lines 74-78) — simple GCS read
2. `/Users/m/ttp-split-experiment/app/utils/reporting/reporting-utils.ts` — `getReportingStatus()`, `getTtcList()`
3. `/Users/m/ttp-split-experiment/app/utils/gcs.ts` — `readJson()`, `writeJson()`, `writeText()`, `listFiles()`, `GCS_PATHS`
4. `/Users/m/ttp-split-experiment/app/api/admin/mock-data.ts` (lines 320-381) — `MOCK_INTEGRITY_DATA` shape to match

## Changes Required

**Create `app/utils/reporting/user-integrity.ts`:**

Port three functions:

### `async function loadUserIntegrity()`
Port of `Integrity.load_user_integrity()` (lines 80-357):

1. Read TTC list, load existing integrity data (or empty dict)
2. List all user JSON files, iterate by form_type/instance
3. For `ttc_application` only: extract whitelisted fields (`i_fname`, `i_lname`, `i_enrolled_people`, `i_org_courses` sub-fields)
4. KEYRESET: Clear past matches (lines 226-230)
5. **Enrolled people matching** (lines 235-283):
   - O(n²) comparison of all applicant pairs
   - Skip same user (`_c1e == _c2e`) and same name
   - Match by email (exact, with @) OR by name+city+state (all exact)
   - Store matches in `integrity.enrolled_matches[other_email]` as Set
6. **Org course matching** (lines 285-337):
   - Match by `(from_date == from_date OR to_date == to_date) AND city == city AND state == state AND lead_teacher name match`
   - Lead teacher name extraction: regex `^[^a-z]{0,3}([a-z]+ [a-z]+)` to get first two words
   - Teacher match: exact OR substring containment
   - Store matches in `integrity.org_course_matches[other_email]` as Set
7. Write to `USER_INTEGRITY_BY_USER` via `writeJson()`

**IMPORTANT:** Python uses `set()` for match collections, serialized via custom `json_dumps_set_default`. In TS, use `Set<string>`, convert to `Array.from(set)` before JSON serialization.

### `async function postLoadUserIntegrity()`
Port of `post_load_user_integrity()` (lines 359-400):
- Reads integrity data, generates CSV: `Applicant Name,Applicant Email,Enrolled Name,Enrolled Email`
- Writes to `GCS_PATHS.APPLICANT_ENROLLED_LIST` via `writeText()`

### `function getUserIntegrityByUser()`
Simple: `readJson(GCS_PATHS.USER_INTEGRITY_BY_USER)`

**Create route handlers:**
- `app/integrity/user-integrity/load/route.ts` — GET: `requireAdminOrCron()`, POST: `requireAdmin()`. Calls `loadUserIntegrity()`.
- `app/jobs/integrity/user-integrity/load/route.ts` — same, alias
- `app/jobs/integrity/user-integrity/postload/route.ts` — GET: `requireAdminOrCron()`, POST: `requireAdmin()`. Calls `postLoadUserIntegrity()`.
- `app/integrity/user-integrity/get-by-user/route.ts` — GET: `requireAdminOrCron()`. Reads and returns integrity JSON.

## Constraints
- Port matching logic EXACTLY — no optimization of the O(n²) loop
- `DATA_RETENTION_DAYS = 730` — skip old records (matching Python line 161)
- Do NOT create `/integrity/user-integrity/postload` without `/jobs/` prefix (legacy routing table only registers the `/jobs/` version)
- Keep `text/plain` content-type on get-by-user response
- Convert Python `set()` to TS `Set<string>` → `Array.from()` for JSON serialization

## Verification
- `npx tsc --noEmit` must pass

## Completion
- Commit with message: `feat: port user integrity matching with enrolled/course cross-checks`
- Report: files changed, verification result
