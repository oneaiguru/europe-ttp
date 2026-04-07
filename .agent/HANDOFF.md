# Session Handoff — Europe TTP Parity Implementation

## Current State

### Workspace
- **Single worktree:** `/Users/m/ttp-split-experiment` on branch `experiment/trpi-split`
- **Remote:** `oneaiguru/europe-ttp`, default branch changed to `main` (matches trpi-split content, 27 commits from ancestor)
- **Deployment:** Vercel at `https://ttp-split-experiment.vercel.app` — all 19 pages + upload endpoints live
- **Archived traces:** `~/Desktop/europe-ttp-claude-traces-2026-04-06/` (split-worktree and integrity-worktree subdirs)
- **Worktrees:** Integrity worktree deleted; only split worktree remains

### Code Snapshot
- **TS app architecture:** Next.js 16, React 19, Tailwind + shadcn/ui, 19 pages with hardcoded HTML shells
- **TS app status:** Render-only. Forms validate input then discard (see `/users/upload-form-data/route.ts` line 304-307: *"Form data persistence is intentionally deferred"*). All admin pages return hardcoded mock data from `app/api/admin/mock-data.ts` (6 constants: MOCK_SUMMARY_DATA, MOCK_REPORTS_DATA, MOCK_INTEGRITY_DATA, MOCK_SETTINGS_DATA, MOCK_POST_TTC_FEEDBACK_DATA, MOCK_POST_SAHAJ_FEEDBACK_DATA).
- **Backend code that EXISTS:** Auth infrastructure (auth.ts with session+platform modes, generateSessionToken, verifySessionToken, getAuthenticatedUser), crypto (upload tokens, HMAC-SHA256), HTML safety (escapeHtml, escapeHtmlAttr, sanitizeHref), upload signed-URL and verify endpoints. All production-quality, not stubs.
- **What's missing:** No persistence layer, no login endpoint, no auth enforcement on routes, no matching logic, no reporting ETL, no email, no cron jobs.

## Key Discoveries

### The Codebase is Complete — Just Disconnected

**Python reference code is in-repo:**
- File: `/Users/m/Downloads/europe-ttp-master@44c225683f8/` — Bitbucket clone of legacy Python app
- Also on branch `origin/session/8b7771dc-1f9e-480a-8645-dc2a724578dd` (130+ commits, 437K insertions)
- Includes: `reporting/user_summary.py`, `reporting/user_integrity.py`, `reporting/user_report.py`, `reporting/reporting_utils.py` (status state machine), `admin.py`, form schemas in `storage/forms/` per country (CA/, IN/, US/), cron.yaml with scheduled jobs

**TypeScript backend code exists and is wired (partially):**
- Auth: `app/utils/auth.ts` (190+ lines, full session token generation + verification)
- Crypto: `app/utils/crypto.ts` (269 lines, upload token signing + verification)
- HTML safety: `app/utils/html.ts` (116 lines, XSS-safe escaping + URL sanitization)
- Upload: `/api/upload/signed-url/route.ts` and `/api/upload/verify/route.ts` (working)
- Form upload: `/users/upload-form-data/route.ts` (validates, then discards)

**What UI agents did wrong:**
- Told to "connect Tailwind UI to existing backend"
- Created prototype shells returning mock data instead
- Example: `app/api/admin/ttc_applicants_summary/route.ts` imports `MOCK_SUMMARY_DATA` from mock-data.ts instead of calling any real logic

**BDD contract for what was supposed to exist:**
- 61 feature files in `specs/features/` covering: admin access, auth, forms, reports, uploads, security, e2e scenarios
- Step definitions in `test/typescript/steps/` (20+ files): `admin_steps.ts`, `auth_steps.ts`, `forms_steps.ts`, `reports_steps.ts`, `uploads_steps.ts`, etc.
- Test fixtures in `test/typescript/fixtures/reports/` with sample data shapes

### What the Gap Analysis Found

From GLM gap analysis (file: `/private/tmp/claude-501/-Users-m-ttp-integrity-experiment/580b274d-5ec2-4d1c-982a-65fa1eafba00/tasks/bupovcdow.output`):

1. **Mock data vs real persistence (total gap):**
   - Legacy: GCS JSON per user + form config by country
   - TS: Hardcoded mock in one file, discards submissions
   - All form persistence missing

2. **Auth state (no login endpoint):**
   - Legacy: Google login + user bootstrap on first save
   - TS: Auth infrastructure exists but no `/api/login` route, no auth enforcement on admin/form pages
   - Persona switching for tests: **not possible without login endpoint**

3. **Missing 12+ routes from legacy:**
   - `GET /` (portal home), `/tabs/*`, `/createpdf/*`, `/users/get-form-data`, `/users/get-form-instances`, `POST /users/set-config`, `GET /users/get-config`, `POST /upload/postdownload/*`, combined reports

4. **Form rendering (hardcoded vs config-driven):**
   - Legacy: JSON schemas loaded from GCS per country, supports 8+ field types, dynamic select options with display_until dates
   - TS: Hardcoded TypeScript FieldDef arrays, no country-specific loading, ttc_application_us and ttc_application_non_us have **identical fields**

5. **Evaluation matching (non-trivial algorithm):**
   - Legacy: Email variants + Levenshtein distance (1-2 chars) + multi-word name decomposition in `reporting/user_summary.py`
   - TS: No matching logic exists

6. **Reporting and integrity (materialized jobs):**
   - Legacy: Cron jobs (hourly summary, daily integrity) write aggregated data stores
   - TS: Static mock JSON regardless of actions

7. **Email, PDF, multi-instance forms:**
   - Legacy: SendGrid integration, xhtml2pdf + PyPDF2, instance selector UI
   - TS: Not implemented

**Implementation priority to unlock testing (from gap analysis):**
1. Auth + login endpoint
2. Form data persistence
3. Admin config persistence
4. Reporting status state machine
5. Evaluation matching
6. Email, cron jobs, PDF, multi-instance

## Artifacts on Disk

### Plans and Test Data
- **Deep parity plan:** `/Users/m/Downloads/parity_e2e_orchestration_plan.md` — GPT Pro's plan with 10 bundles (B00-B09), 70+ scenarios, exact ChatGPT Agent prompts, evidence contracts, seed pack requirements. Section §Seed pack that both environments must share specifies:
  - **5 TTC sessions:** TTC_OPEN_US_2026, TTC_EXPIRED_CA_2026, TTC_GRACE_IN_2026, TTC_CLOSED_IN_2026, TTC_PRIOR_EU_2025
  - **16 personas:** superadmin@ttc.test, summaryadmin@ttc.test, outsider@ttc.test, applicant.alpha/beta/gamma/multi@ttc.test, evaluator.1-4@ttc.test, graduate.post@ttc.test, teacher.post@ttc.test, graduate.sahaj@ttc.test, teacher.sahaj@ttc.test, upload.attacker@ttc.test
  - **Data relationships:** alpha/beta overlap on enrolled persons, alpha has prior TTC, one unmatched teacher feedback, one low-rating evaluation, one not-ready-now case
  - **Upload fixtures:** valid-photo.jpg, valid-photo-large.jpg, oversize-photo.jpg, polyglot-html.jpg, simple-png.png
- **Seed manifest template:** `/Users/m/Downloads/parity_seed_manifest_template.json` — same personas and TTCs in JSON format, fixture file list, data relationship array
- **Shallow test plan (reference only):** `/Users/m/Downloads/TEST_PLAN-zork_202604051100.md` — Alexey's checkbox test with Russian comments. Status: garbage (only tested mock rendering, misunderstood setup, couldn't create second account)

### GLM Outputs (May Still Be in /tmp)

**Line-range map (CRITICAL):**
- Task ID: `b651eo1je` 
- Output path: `/private/tmp/claude-501/-Users-m-ttp-integrity-experiment/580b274d-5ec2-4d1c-982a-65fa1eafba00/tasks/b651eo1je.output`
- Purpose: Maps exact line ranges for:
  - Python reporting modules (reporting_utils.py, user_summary.py, user_integrity.py, user_report.py, print_form.py) — function locations and purposes
  - mock-data.ts — line ranges of each export (MOCK_SUMMARY_DATA, MOCK_REPORTS_DATA, etc.)
  - Route handlers (app/api/admin/*/route.ts, app/api/forms/*/route.ts) — which import mock, which call render
  - Step definitions (test/typescript/steps/*.ts) — count of Given/When/Then per file, implementation status (real code vs TODO stubs)
  - Test fixtures (test/typescript/fixtures/reports/*.json) — data shapes and first-record samples
  - Shared helpers (form-fields.ts, admin-shell.ts, datatables-helpers.ts, date-helpers.ts)
- **Action:** Read before tmp cleanup; save to `/Users/m/ttp-split-experiment/.agent/glm-line-ranges.md`

**Gap analysis (ALREADY READ):**
- Task ID: `bupovcdow` (output path: `/private/tmp/claude-501/-Users-m-ttp-integrity-experiment/580b274d-5ec2-4d1c-982a-65fa1eafba00/tasks/bupovcdow.output`)
- Findings already summarized in this document under "What the Gap Analysis Found"
- **Action:** Can be regenerated if lost; not critical to recover

### Git State
- **Total commits locally:** 356 across all branches (full history available, no need for GitHub API)
- **Branch audit findings (from GLM task b358n3ayz):**
  - `origin/session/8b7771dc-1f9e-480a-8645-dc2a724578dd`: 130+ commits, contains complete Python legacy codebase, reporting module (user_summary.py, user_integrity.py, user_report.py, reporting_utils.py, print_form.py), form schemas in storage/forms/ (CA, IN, US), BDD test infrastructure, all TS backend code already merged to base
  - `origin/legacy-uploads-storage`, `origin/legacy-portal`, `origin/legacy-forms`, `origin/legacy-api-db`: 4 legacy-* branches are strict subsets of session branch (same code, all safe to delete)
  - `origin/main` and `origin/experiment/trpi-split`: both have 7 extra API routes not in legacy-admin-reporting base (admin get-config, set-config, integrity get-by-user, mock-data.ts, reporting routes)
  - ~170 import-artifact branches (files-*, pr-*, more-*, final-*, tiny-*, pk-*): file batches and vendored libraries, no backend code, all safe to delete
- **Remote branches to preserve:** 
  - `origin/main` (current, 27 commits from ancestor `experiment/trpi-split`)
  - `origin/session/8b7771dc...` (reference for Python legacy code and form schemas)
  - `origin/experiment/trpi-split` (active development)
- **Remote branches to delete:** ~174 import-artifact branches + 4 legacy-* subsets
- **Default branch:** Changed to `main` via `gh api repos/oneaiguru/europe-ttp -X PATCH -f default_branch=main`
- **Node version changes for Vercel only:** `package.json` and `scripts/check-node-version.mjs` were changed to accept Node >=20 (Vercel uses 24). **MUST REVERT before client delivery** to match repo's Node 20.20.0 requirement

## Next Steps

### Immediate (New Session)
1. **Recover GLM outputs** before /tmp cleanup:
   - Line-range map task `b651eo1je`: `/private/tmp/claude-501/-Users-m-ttp-integrity-experiment/580b274d-5ec2-4d1c-982a-65fa1eafba00/tasks/b651eo1je.output`
   - Gap analysis task `bupovcdow`: `/private/tmp/claude-501/-Users-m-ttp-integrity-experiment/580b274d-5ec2-4d1c-982a-65fa1eafba00/tasks/bupovcdow.output`
   - Save both to `/Users/m/ttp-split-experiment/.agent/`
2. **Read line-range map** to understand:
   - Which lines in Python reporting modules contain each function
   - Data shapes in mock-data.ts exports (MOCK_SUMMARY_DATA, MOCK_REPORTS_DATA, MOCK_INTEGRITY_DATA, MOCK_SETTINGS_DATA, MOCK_POST_TTC_FEEDBACK_DATA, MOCK_POST_SAHAJ_FEEDBACK_DATA)
   - Implementation status of test/typescript/steps/*.ts files (real code vs stubs/TODOs)
3. **Enter plan mode** — read precise line ranges from GLM map, understand exact wiring points
4. **Write implementation plan** — interconnect render shells to existing backend modules

### Implementation Order
1. Login endpoint (`/api/auth/login`)
2. Auth middleware on all routes
3. Form data persistence (even file-based is fine initially)
4. Admin config persistence (whitelist, settings)
5. Reporting status calculation (Python reporting_utils.py → TS)
6. Evaluation matching (Levenshtein, name decomposition)
7. Email, cron jobs, PDF, multi-instance forms (lower priority)

### Testing After Implementation
1. Verify TS app against Python baseline side-by-side (requires legacy Python deployed, see parity_e2e_orchestration_plan.md §Setup instructions for legacy)
2. Run ChatGPT Agent mode with parity plan prompts
3. Fix gaps, redeploy, re-run until agent reports full parity
4. Prepare final test plan for Alexey (human tester)

### GitHub Cleanup
- Change default branch back from `main` to something stable before client delivery (or leave main — decision pending)
- Delete ~174 stale import-artifact branches
- Do NOT merge or change Python legacy code — it's reference only

## Key File Paths for Next Session
- Worktree root: `/Users/m/ttp-split-experiment`
- Agent outputs: `/Users/m/ttp-split-experiment/.agent/`
- TypeScript backend: `app/utils/auth.ts`, `app/utils/crypto.ts`, `app/utils/html.ts`
- Render shells: `app/api/admin/*/route.ts`, `app/forms/*/render.ts`
- Mock data: `app/api/admin/mock-data.ts`
- Python reference: `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/`, `admin.py`
- BDD specs: `specs/features/`
- Step definitions: `test/typescript/steps/`
- Parity plan: `/Users/m/Downloads/parity_e2e_orchestration_plan.md`

## Session Statistics
- **Branches analyzed:** 356 commits across all branches, 181 remote branches audited (task b358n3ayz)
- **Files discovered:** 61 BDD feature files, 20+ TypeScript step definition files, 7 Python reporting modules, 100+ form schema JSON files, 19 UI pages rendered
- **Gaps identified:** 12+ missing routes, 6+ critical features (auth, persistence, matching, reporting, email, jobs)
- **Code quality assessment:** Backend infrastructure is production-grade; disconnect is architectural, not quality
- **Worktree consolidation:** Started with 3 worktrees (bare repo at /Users/m/git/clients/aol/europe-ttp, integrity at /Users/m/ttp-integrity-experiment, split at /Users/m/ttp-split-experiment). Consolidated to 1 (split) by removing integrity worktree with `git worktree remove --force` + `rm -rf`
- **Traces archived:** `.claude-trace` from both worktrees moved to `~/Desktop/europe-ttp-claude-traces-2026-04-06/` before cleanup
- **Time estimate for implementation:** Wiring phase (1-2 weeks GLM), testing phase (1 week agent runs), client handoff (1 week human testing)
