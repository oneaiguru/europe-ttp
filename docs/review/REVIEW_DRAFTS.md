# REVIEW_DRAFTS

## Run Metadata (2026-02-06)
Repo: `/Users/m/git/clients/aol/europe-ttp`
Commit: `aa2db64784b7353cc040efe9c4be60cc1569ae9b`
Method: 6 parallel subagent scans with fixed scopes
Scopes:
- `test/typescript/**`
- `experimental/**`
- `test/bdd/**`, `scripts/bdd/**`, `app/**`, `javascript/**`
- `*.py` (repo root), `ttc_portal*.py`, `form.py`, `reporting/**`, `db/**`, `pyutils/**`, `cloudstorage/**`
- `test/python/**`
- `specs/**`, `docs/**`, `tasks/**`, `IMPLEMENTATION_PLAN.md`, `package.json`, `tsconfig.json`, `eslint.config.js`, `app.yaml`, `cron.yaml`, `indexes.yaml`, `requirements*.txt`

Local checks run:
- `bun run bdd:verify` (pass)
- `bun run bdd:python` (pass, with import warnings)
- `bun run bdd:typescript` (pass)
- `bun run typecheck` (pass)
- `bun run lint` (pass)

## Pending

None.

## Processed

### 2026-02-06
Task: scrub-secrets-in-repo-text
Slug: scrub-secrets-in-repo-text
Goal: Remove committed secret values from comments and documentation so secret scans and external publication are safe.
Acceptance Criteria:
1. No SendGrid (`SG.`), Harmony, or Google API keys are present anywhere in tracked text files (including docs and comments).
2. Replace any historical values with placeholders (e.g., `SG.REDACTED`, `AIza...REDACTED`).
3. Add a simple secrets-scan check (script or documented grep) that can be run before publishing.
Evidence: `constants.py:14-20`; `docs/Tasks/TASK-FIX-002.md:20-26`; `docs/Tasks/TASK-FIX-002.research.md:17-18`; `docs/Tasks/TASK-FIX-002.research.md:50-52`

Task: remove-pii-experimental-fixtures
Slug: remove-pii-experimental-fixtures
Goal: Remove or fully anonymize PII in `experimental/` fixtures and prune unsafe vendored/binary artifacts.
Acceptance Criteria:
1. `experimental/test*.html` contain only synthetic data (no real names/emails/phones/addresses/DOB/sensitive answers).
2. Remove `.DS_Store` and `*.zip` artifacts from the repo, or move them behind an explicit policy (and ensure they are never deployed).
3. Replace `http://` links with `https://` and add `rel=\"noopener noreferrer\"` for `target=\"_blank\"` if kept.
Evidence: `experimental/test-v1.html:70`; `experimental/test.html:118`; `experimental/test-v0.html:118`; `experimental/jsPDF-master.zip:1`; `experimental/.DS_Store:1`

Task: fix-api-py-or-disable-handler
Slug: fix-api-py-or-disable-handler
Goal: Ensure `/api` handler module is importable, or remove/disable it safely.
Acceptance Criteria:
1. `api.py` imports without syntax errors.
2. `app.yaml` does not reference broken handlers.
Evidence: `api.py:17`; `app.yaml:77`

Task: harden-python-signed-upload
Slug: harden-python-signed-upload
Goal: Make legacy signed-upload URL generation safe and robust.
Acceptance Criteria:
1. Validate both `filepath` and `filename` (no traversal, no reserved chars); allow only server-controlled prefixes.
2. Signed URL generation works in deployed runtime (no unsupported kwargs; handle missing `SERVICE_JSON_FILE` cleanly).
3. Post-upload handler validates key existence and ownership before using it.
Evidence: `pyutils/upload.py:44`; `pyutils/upload.py:74-96`; `pyutils/upload.py:101-106`; `pyutils/upload.py:117-124`

Task: harden-nextjs-signed-upload
Slug: harden-nextjs-signed-upload
Goal: Make Next.js signed-upload endpoint use real auth and safe object keys.
Acceptance Criteria:
1. Do not treat `x-user-email` as authentication; use session/auth provider.
2. Validate/sanitize `filename` and generate server-controlled object keys.
3. Enforce max size and encode URL components.
Evidence: `app/api/upload/signed-url/route.ts:31-36`; `app/api/upload/signed-url/route.ts:64-68`; `app/api/upload/signed-url/route.ts:73-78`

Task: restrict-docs-serving
Slug: restrict-docs-serving
Goal: Prevent serving internal docs to general authenticated users.
Acceptance Criteria:
1. `/docs` is removed from deployment or restricted to admins only.
2. Ensure no secrets/PII can be reached via static handlers.
Evidence: `app.yaml:63-66`

Task: fix-verify-alignment-js
Slug: fix-verify-alignment-js
Goal: Remove or align `scripts/bdd/verify-alignment.js` with the TypeScript implementation.
Acceptance Criteria:
1. Placeholder matching escape order matches TS, or JS file is removed/clearly marked unused.
2. Tooling references only one verifier entrypoint (`.ts`).
Evidence: `scripts/bdd/verify-alignment.js:45-63`

Task: bdd-runner-signal-exit
Slug: bdd-runner-signal-exit
Goal: Ensure BDD runners return non-zero when the child is terminated by signal.
Acceptance Criteria:
1. `run-python.ts` and `run-typescript.ts` exit non-zero when child exits with `code=null`.
2. Add a small unit test or doc note to prevent regression.
Evidence: `scripts/bdd/run-python.ts:77-84`; `scripts/bdd/run-typescript.ts:70-75`

Task: remove-node-modules-cycle
Slug: remove-node-modules-cycle
Goal: Remove `node_modules/node_modules` symlink workaround in TypeScript runner.
Acceptance Criteria:
1. Cucumber runs without creating a nested `node_modules` symlink.
2. Tooling does not create filesystem cycles.
Evidence: `scripts/bdd/run-typescript.ts:21-30`

Task: reduce-test-fallbacks-python
Slug: reduce-test-fallbacks-python
Goal: Stop Python BDD steps from masking real failures with fake 200/HTML.
Acceptance Criteria:
1. Exceptions in critical API/portal steps fail the scenario (or require explicit mock mode).
2. Remove or gate `_fake_response()` use for production endpoints.
Evidence: `test/python/steps/api_steps.py:155-163`; `test/python/steps/portal_steps.py:211-220`

Task: reduce-test-fallbacks-typescript
Slug: reduce-test-fallbacks-typescript
Goal: Stop TypeScript BDD steps from passing when implementation is missing/broken.
Acceptance Criteria:
1. Import/runtime failures fail scenarios unless explicit mock mode is enabled.
2. Shared state is reset per scenario via `Before` hooks.
Evidence: `test/typescript/steps/api_steps.ts:83`; `test/typescript/steps/forms_steps.ts:23`; `test/typescript/steps/portal_steps.ts:81`

Task: fix-legacy-xss-sinks
Slug: fix-legacy-xss-sinks
Goal: Reduce XSS risk in legacy JS utilities.
Acceptance Criteria:
1. Replace `.html(msg)` with escaped text insertion or sanitization.
2. Avoid inline `onclick` string concatenation for dynamic content.
Evidence: `javascript/utils.js:636`; `javascript/utils.js:1272-1274`

Task: fix-db-user-common-import
Slug: fix-db-user-common-import
Goal: Remove missing `common` import in db model.
Acceptance Criteria:
1. `db/user.py` imports a valid utility module or removes unused dependency.
Evidence: `db/user.py:2`

Task: fix-reporting-user-report-imports
Slug: fix-reporting-user-report-imports
Goal: Fix missing imports/constants used in user_report image serving.
Acceptance Criteria:
1. `blobstore`, `images`, and `CLOUD_STORAGE_LOCATION` are defined/imported before use.
Evidence: `reporting/user_report.py:42-46`

Task: eliminate-ds-store-pyc
Slug: eliminate-ds-store-pyc
Goal: Remove tracked OS/cache artifacts and prevent reintroduction.
Acceptance Criteria:
1. No `.DS_Store` or `*.pyc` are tracked.
2. `.gitignore` covers these patterns.
Evidence: `experimental/.DS_Store:1`; `test/python/.DS_Store:1`; `test/typescript/.DS_Store:1`

Task: escape-portal-rendering-html
Slug: escape-portal-rendering-html
Goal: Prevent XSS/HTML injection in portal HTML render helpers.
Acceptance Criteria:
1. Escape `userEmail`, `homeCountryName`, and `homeCountryIso` before interpolating into HTML.
2. Validate or encode `reportLinks` values (`href`, `label`) to prevent attribute/text injection.
3. Add a small unit test (or fixture assertion) that demonstrates escaping for `<`, `"`, and `'`.
Evidence: `app/portal/home/render.ts:16-25`; `app/portal/tabs/render.ts:23-29`

Task: upload-form-data-missing-auth-and-validation
Slug: upload-form-data-missing-auth-and-validation
Goal: Require auth and validate input on the upload-form-data POST route to prevent misuse and unsafe echoing.
Acceptance Criteria:
1. Enforce authentication and authorization on POST.
2. Validate allowed fields/types; reject unknown keys or oversized payloads.
3. Avoid echoing raw user input unless strictly necessary and safely sanitized.
Evidence: `app/users/upload-form-data/route.ts:64-76`

Task: signed-upload-key-forgeable-and-leaky
Slug: signed-upload-key-forgeable-and-leaky
Goal: Make upload keys opaque and non-forgeable (do not embed user/path in client-visible tokens).
Acceptance Criteria:
1. Replace base64 of `user:timestamp:fullFilename` with an HMAC-signed token or server-generated opaque ID.
2. Do not embed user email or path data in client-visible tokens.
3. Add verification logic wherever the token is consumed.
Evidence: `app/api/upload/signed-url/route.ts:107-108`

Task: bdd-verify-symlink-cycle
Slug: bdd-verify-symlink-cycle
Goal: Prevent `bdd:verify` from hanging or escaping the repo when feature directories contain symlink cycles.
Acceptance Criteria:
1. The feature walker does not follow symlinked directories (use `lstat`, or track visited realpaths/inodes).
2. Broken symlinks or unreadable paths do not crash the verifier (skip with warning or fail with a clear error).
Evidence: `scripts/bdd/verify-alignment.ts:9-20`

Task: bdd-verify-support-asterisk-steps
Slug: bdd-verify-support-asterisk-steps
Goal: Include Gherkin `*` steps in alignment verification to avoid false greens.
Acceptance Criteria:
1. `verify-alignment.ts` extracts `*` steps the same way it extracts `Given/When/Then/And/But`.
2. Add a fixture feature using `*` so a missing registry entry is detected by `bun run bdd:verify`.
Evidence: `scripts/bdd/verify-alignment.ts:7`

Task: bdd-verify-placeholder-semantics
Slug: bdd-verify-placeholder-semantics
Goal: Align placeholder fallback matching with Cucumber expression semantics to avoid false dead-step reports.
Acceptance Criteria:
1. `{string}` matches common quoted forms (single and double quotes) consistently with the step registry patterns.
2. `{int}` and `{float}` accept negative values and common float formats (e.g., `-1`, `-1.5`, `0.5`).
3. Placeholder matching remains deterministic across repeated matches.
Evidence: `scripts/bdd/verify-alignment.ts:52-60`

Task: ts-step-state-leakage
Slug: ts-step-state-leakage
Goal: Prevent cross-scenario state leakage in TS Cucumber steps by eliminating shared mutable module/global state.
Acceptance Criteria:
1. Replace `globalThis` contexts with a per-scenario Cucumber `World`, or add a single shared `Before` that fully resets all fields used across step files.
2. Reset `testContext` optional/extended fields (e.g., `field_errors`, `drafts`, `currentApplicantEmail`, `currentApplicantSubmission`, `currentView`, `applicantUploads`) per scenario.
3. Reset `draftContext` and `integrityContext` per scenario (or migrate them into the World).
Evidence: `test/typescript/steps/e2e_api_steps.ts:106-132`; `test/typescript/steps/draft_steps.ts:35-43`; `test/typescript/steps/integrity_steps.ts:44-67`

Task: ts-then-steps-must-assert
Slug: ts-then-steps-must-assert
Goal: Eliminate false greens by ensuring `Then` steps assert real outcomes and do not mutate state to force success.
Acceptance Criteria:
1. Remove or implement empty `Then` steps so they validate at least one concrete condition.
2. Convert `Then` steps that currently mutate shared state into `Given/When` steps, and make `Then` steps assertion-only.
Evidence: `test/typescript/steps/e2e_api_steps.ts:624-627`; `test/typescript/steps/e2e_api_steps.ts:663-665`; `test/typescript/steps/e2e_api_steps.ts:703-710`

Task: ts-reports-steps-mocked-calls-false-green
Slug: ts-reports-steps-mocked-calls-false-green
Goal: Ensure TS report steps validate meaningful behavior instead of hard-coded success.
Acceptance Criteria:
1. `When` steps either call real report endpoints or use explicit fixture-backed stubs that can fail.
2. `Then` steps validate meaningful fields from responses, not just status codes and empty objects.
Evidence: `test/typescript/steps/reports_steps.ts:34-59`; `test/typescript/steps/reports_steps.ts:61-72`

Task: tsconfig-missing-test-bdd
Slug: tsconfig-missing-test-bdd
Goal: Ensure TypeScript typecheck covers `test/bdd` sources so registry/tooling drift is caught early.
Acceptance Criteria:
1. `bun run typecheck` fails on type errors in `test/bdd/**/*.ts` (either by including it in `tsconfig.json` or using a dedicated typecheck config).
Evidence: `tsconfig.json:13-14`; `test/bdd/step-registry.ts:1`

Task: tsconfig-excludes-app-api
Slug: tsconfig-excludes-app-api
Goal: Prevent false-green typechecks for server/API code by including `app/api` in TypeScript typechecking.
Acceptance Criteria:
1. `bun run typecheck` fails on type errors in `app/api/**` (either by including it in `tsconfig.json` or using a dedicated typecheck config).
Evidence: `tsconfig.json:14`

Task: eslint-coverage-gaps
Slug: eslint-coverage-gaps
Goal: Ensure linting covers application TS/TSX and runtime JS config to avoid lint false-greens.
Acceptance Criteria:
1. ESLint runs on `app/**/*.ts` and `app/**/*.tsx` (or an equivalent lint target does).
2. JS config files like `cucumber.cjs` are linted (or explicitly justified if excluded).
Evidence: `eslint.config.js:7-17`; `cucumber.cjs:1`

### 2026-02-05
Task: remove-committed-secrets
Slug: remove-committed-secrets
Goal: Remove committed API keys and service account keys, and rotate any affected credentials.
Acceptance Criteria:
1. `constants.py` no longer contains real API keys and uses environment-based configuration instead.
2. `ttc_portal_sendgrid_key.txt` is removed from the repo and secrets are provisioned outside git.
3. `artofliving-ttcdesk-dev-b3dbc09298ee.json` is removed from the repo and replaced with secure secret provisioning.
Evidence: `constants.py:12-13`; `ttc_portal_sendgrid_key.txt:1`; `artofliving-ttcdesk-dev-b3dbc09298ee.json:2-6`

Task: fix-verify-alignment-placeholder-matching
Slug: fix-verify-alignment-placeholder-matching
Goal: Ensure `verify-alignment.ts` correctly matches registry placeholders when patterns are absent.
Acceptance Criteria:
1. Placeholder handling converts `{string}`/`{int}`/`{float}` into regex without re-escaping inserted regex tokens.
2. Add a minimal test (or fixture) that fails under the current implementation and passes after the fix.
Evidence: `scripts/bdd/verify-alignment.ts:49-63`

## Evidence Map
- scrub-secrets-in-repo-text -> `constants.py:14-20`; `docs/Tasks/TASK-FIX-002.md:20-26`; `docs/Tasks/TASK-FIX-002.research.md:17-18`; `docs/Tasks/TASK-FIX-002.research.md:50-52`
- remove-pii-experimental-fixtures -> `experimental/test-v1.html:70`; `experimental/test.html:118`; `experimental/test-v0.html:118`; `experimental/jsPDF-master.zip:1`; `experimental/.DS_Store:1`
- fix-api-py-or-disable-handler -> `api.py:17`; `app.yaml:77`
- harden-python-signed-upload -> `pyutils/upload.py:44`; `pyutils/upload.py:74-96`; `pyutils/upload.py:101-106`; `pyutils/upload.py:117-124`
- harden-nextjs-signed-upload -> `app/api/upload/signed-url/route.ts:31-36`; `app/api/upload/signed-url/route.ts:64-68`; `app/api/upload/signed-url/route.ts:73-78`
- restrict-docs-serving -> `app.yaml:63-66`
- fix-verify-alignment-js -> `scripts/bdd/verify-alignment.js:45-63`
- bdd-runner-signal-exit -> `scripts/bdd/run-python.ts:77-84`; `scripts/bdd/run-typescript.ts:70-75`
- remove-node-modules-cycle -> `scripts/bdd/run-typescript.ts:21-30`
- reduce-test-fallbacks-python -> `test/python/steps/api_steps.py:155-163`; `test/python/steps/portal_steps.py:211-220`
- reduce-test-fallbacks-typescript -> `test/typescript/steps/api_steps.ts:83`; `test/typescript/steps/forms_steps.ts:23`; `test/typescript/steps/portal_steps.ts:81`
- fix-legacy-xss-sinks -> `javascript/utils.js:636`; `javascript/utils.js:1272-1274`
- fix-db-user-common-import -> `db/user.py:2`
- fix-reporting-user-report-imports -> `reporting/user_report.py:42-46`
- eliminate-ds-store-pyc -> `experimental/.DS_Store:1`; `test/python/.DS_Store:1`; `test/typescript/.DS_Store:1`
- escape-portal-rendering-html -> `app/portal/home/render.ts:16-25`; `app/portal/tabs/render.ts:23-29`
- upload-form-data-missing-auth-and-validation -> `app/users/upload-form-data/route.ts:64-76`
- signed-upload-key-forgeable-and-leaky -> `app/api/upload/signed-url/route.ts:107-108`
- bdd-verify-symlink-cycle -> `scripts/bdd/verify-alignment.ts:9-20`
- bdd-verify-support-asterisk-steps -> `scripts/bdd/verify-alignment.ts:7`
- bdd-verify-placeholder-semantics -> `scripts/bdd/verify-alignment.ts:52-60`
- ts-step-state-leakage -> `test/typescript/steps/e2e_api_steps.ts:106-132`; `test/typescript/steps/draft_steps.ts:35-43`; `test/typescript/steps/integrity_steps.ts:44-67`
- ts-then-steps-must-assert -> `test/typescript/steps/e2e_api_steps.ts:624-627`; `test/typescript/steps/e2e_api_steps.ts:663-665`; `test/typescript/steps/e2e_api_steps.ts:703-710`
- ts-reports-steps-mocked-calls-false-green -> `test/typescript/steps/reports_steps.ts:34-59`; `test/typescript/steps/reports_steps.ts:61-72`
- tsconfig-missing-test-bdd -> `tsconfig.json:13-14`; `test/bdd/step-registry.ts:1`
- tsconfig-excludes-app-api -> `tsconfig.json:14`
- eslint-coverage-gaps -> `eslint.config.js:7-17`; `cucumber.cjs:1`
