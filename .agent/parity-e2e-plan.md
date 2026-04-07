# TTC Portal Migration: Deep E2E Parity Orchestration Plan

## Why this replaces the shallow plan

The existing repo-level parity material is useful, but it is not enough for signoff. It mostly proves that feature files and step definitions line up. It does not prove that a real deployed system, with seeded data and real role switching, behaves like the legacy Python system end to end.

This replacement plan is stricter. It is built to catch the failures that shallow plans miss:

- pages that render but do not load real data
- forms that look present but are missing legacy fields or state transitions
- admin pages whose embedded scripts call legacy endpoints that do not exist in the TypeScript deployment
- report shells that render but are not backed by refreshed materialized data
- upload, auth, and cross-user authorization flows that only fail under real browser sessions
- differences between legacy and TypeScript behavior that only appear after several actions in sequence

This plan treats the legacy Python app as the source of truth and makes the TypeScript app earn parity scenario by scenario.

## What I already verified in the TypeScript repo before the archive flipped back

Earlier in this session I unpacked the TypeScript archive and verified these concrete facts:

- the app is a Next.js / TypeScript codebase with route families under `app/api/admin/*`, `app/api/forms/*`, `app/api/upload/*`, and `app/users/upload-form-data`
- the repo includes `docs/migration-parity/PARITY_REPORT.md`, which claims 375 BDD steps across 61 feature files
- auth utilities support two modes: `session` and `platform`
- session auth is HMAC-based and uses env-controlled secrets and max age
- the upload-form-data route enforces request-size limits, rate limiting, multipart duplicate-key rejection, and auth
- the form renderers I inspected are simpler HTML shells, so field-inventory and state-transition checks are mandatory
- at least one admin render module still embeds legacy jQuery/DataTables logic and calls legacy-style relative AJAX endpoints from inside the page script

That last point is important. Static HTML smoke is not enough. The agent must open the page, watch every network call, and verify that the backing data endpoints actually exist and return correct data.

## Ground truth and pass criteria

The migration is considered acceptable only if all three conditions hold:

1. A real user can complete the same end-to-end flows in the TypeScript system as in the legacy Python system.
2. The same actions produce equivalent side effects in persistence, uploads, email, and reporting.
3. Any remaining differences are explicitly classified as one of these:
   - intentional approved improvement
   - known regression that blocks release
   - legacy bug intentionally not ported

A scenario is not a pass just because the page renders. It passes only when:

- the browser flow works
- the expected network calls complete successfully
- the saved data is correct
- the downstream reporting or side effects appear correctly
- the result matches the legacy baseline or an approved intentional delta

## Environment topology to prepare before any agent starts

Prepare a small manifest file for the orchestrator with these values:

- `legacyUrl`: deployed or tunneled URL for the Python system
- `tsUrl`: deployed or tunneled URL for the TypeScript system
- `mailSinkUrl`: URL or CLI command to inspect outbound email in test
- `storageInspector`: URL or CLI command to inspect uploaded files
- `dbReadOnlyInspector`: SQL console command or script for read-only verification
- `summaryJobTrigger`: command or endpoint to refresh summary reporting
- `integrityJobTrigger`: command or endpoint to refresh integrity reporting
- `seedResetLegacy`: one command that restores the legacy environment to the baseline fixture state
- `seedResetTs`: one command that restores the TypeScript environment to the baseline fixture state
- `personaManifest`: list of accounts, tokens, and permissions
- `fixtureManifest`: TTC options, dates, whitelist entries, expected report counts, and upload fixtures

The whole plan depends on deterministic reset. Do not start browser-agent testing until both systems can be restored to the same baseline state in one command.

## Exact setup instructions for the TypeScript system

### 1. Run the app locally or in a preview deployment

The repo README I inspected supports two standard run modes.

For Docker:

```bash
docker compose up --build
```

For local Node:

```bash
nvm install 20.20.0
nvm use 20.20.0
npm install
cp .env.example .env
npm run dev
```

Open the app on `http://localhost:3000` unless your deployment uses another URL.

### 2. Use session mode for parity testing

For agent-driven testing, the cleanest primary setup is session mode, not platform mode.

In `.env`, set at minimum:

```bash
AUTH_MODE=session
SESSION_HMAC_SECRET=<long-random-secret>
SESSION_MAX_AGE_SECONDS=3600
NODE_ENV=test
```

Why this matters:

- it lets the agent switch personas cleanly
- it keeps auth deterministic in local and preview environments
- it avoids coupling parity testing to cloud-specific IAP plumbing

Keep platform mode for a separate deployment-specific smoke run only.

### 3. Configure full-backend features for parity runs

The README says pages can render without secrets, but that is not enough for parity. For real E2E parity, the TypeScript environment must also have:

- working persistence against your seeded mock dataset
- working upload storage for signed URL and verify flows
- a safe email sink or stub transport
- job hooks for summary and integrity refresh

If those pieces are still stubbed, the first run should explicitly classify the environment as `render-only` and stop after the reality-check bundle.

### 4. Use direct route URLs, not assumptions about app pages

The TypeScript repo exposes HTML through routes like these:

Admin pages:
- `/api/admin/reports_list`
- `/api/admin/permissions`
- `/api/admin/settings`
- `/api/admin/ttc_applicants_summary`
- `/api/admin/ttc_applicants_integrity`
- `/api/admin/ttc_applicants_reports`
- `/api/admin/post_ttc_course_feedback`
- `/api/admin/post_sahaj_ttc_course_feedback`

Form pages:
- `/api/forms/ttc_application_us`
- `/api/forms/ttc_application_non_us`
- `/api/forms/ttc_evaluation`
- `/api/forms/ttc_applicant_profile`
- `/api/forms/ttc_evaluator_profile`
- `/api/forms/dsn_application`
- `/api/forms/post_ttc_self_evaluation`
- `/api/forms/post_ttc_feedback`
- `/api/forms/post_sahaj_ttc_self_evaluation`
- `/api/forms/post_sahaj_ttc_feedback`
- `/api/forms/ttc_portal_settings`

Upload and user endpoints:
- `/api/upload/signed-url`
- `/api/upload/verify`
- `/users/upload-form-data`

The orchestrator should test these exact routes first, because the app is not organized like a normal page-based Next frontend.

### 5. Recommended validation commands before agent mode

Run these before giving the deployment to ChatGPT Agent:

```bash
npm run typecheck
npm run lint
npm run bdd:verify
npm run bdd:typescript
```

Treat these only as preflight checks. They do not replace browser parity verification.

Also note a setup caveat: the repo’s `npm test` script chains `bdd:all`, which includes Python-side expectations. Do not treat a green or skipped result there as runtime parity proof.

## Setup instructions for the legacy Python baseline

For the legacy app, the simplest reliable baseline is a frozen deployed environment, not a fresh local recreation. The Python stack is tied to old App Engine assumptions, storage-backed configs, and scheduled jobs. If you already have a stable legacy URL, use that as the baseline for side-by-side comparison.

If you must run legacy locally, only do it if you already have the original App Engine dev tooling and the supporting storage/config assets. The baseline environment must include:

- storage-backed form configs by country
- seeded user JSON / user data structures
- whitelist config
- TTC list and deadlines
- admin permissions data
- upload bucket access
- the reporting refresh paths or equivalent manual job execution

For side-by-side human comparison, a deployed legacy URL is strongly preferred.

## Seed pack that both environments must share

Use a canonical seed pack. The same TTC identifiers, dates, personas, and expected counts must exist in both systems.

### TTC sessions to seed

Use at least these five sessions:

1. `TTC_OPEN_US_2026`
   - country: US
   - state: open
   - used for normal application flow

2. `TTC_EXPIRED_CA_2026`
   - country: CA
   - state: expired
   - used to confirm deadline blocking

3. `TTC_GRACE_IN_2026`
   - country: IN
   - state: expired for normal users, still allowed for whitelisted late applicant inside grace window

4. `TTC_CLOSED_IN_2026`
   - country: IN
   - state: fully closed even for whitelisted user

5. `TTC_PRIOR_EU_2025`
   - country: EU
   - state: historical
   - used for lifetime evaluation matching

Each seeded session should include the exact fields needed for display name, value key, deadline, and any additional display-until logic the legacy system uses.

### Personas to seed

Use consistent emails so the agent can switch roles deterministically.

- `superadmin@ttc.test`
  - full admin access
  - can edit whitelist and open all reports

- `summaryadmin@ttc.test`
  - only summary/report access
  - blocked from settings and integrity

- `outsider@ttc.test`
  - non-admin user
  - used for access-control checks

- `applicant.alpha@ttc.test`
  - US home country
  - open TTC flow
  - no application at baseline snapshot

- `applicant.beta@ttc.test`
  - CA home country
  - expired TTC blocked
  - integrity overlap with alpha after seeded data is loaded

- `applicant.gamma@ttc.test`
  - IN home country
  - whitelisted late applicant

- `applicant.multi@ttc.test`
  - has one submitted TTC application instance already seeded
  - used for copy, edit, duplicate-instance detection

- `evaluator.1@ttc.test`
- `evaluator.2@ttc.test`
- `evaluator.3@ttc.test`
- `evaluator.4@ttc.test`
  - used for current and lifetime evaluation coverage

- `graduate.post@ttc.test`
- `teacher.post@ttc.test`
  - used for post-TTC self-evaluation and teacher feedback

- `graduate.sahaj@ttc.test`
- `teacher.sahaj@ttc.test`
  - used for post-Sahaj flows

- `upload.attacker@ttc.test`
  - used for cross-user upload authorization checks

### Data relationships that must exist in the seed

Seed these relationships up front so the reports and integrity bundles have something real to verify.

- `applicant.alpha` and `applicant.beta` share at least one enrolled-person signature so the integrity report must flag them
- `applicant.alpha` has one prior TTC record for lifetime evaluation matching
- one seeded evaluation should use perfect matching data
- one seeded evaluation should use messy but still matchable data, such as trimmed or differently cased name/email inputs
- one teacher feedback record should be intentionally unmatched to verify orphan handling
- one application should contain a missing prerequisite case
- one application should contain a low evaluator rating case
- one application should contain a not-ready-now evaluator case

### Upload fixtures

Prepare these files in a known folder for both the agent and the human tester:

- `valid-photo.jpg` under 500 KB
- `valid-photo-large.jpg` just under the size limit
- `oversize-photo.jpg` over the size limit
- `polyglot-html.jpg` or equivalent suspicious file for content handling checks
- `simple-png.png` for deterministic upload smoke

## Snapshot strategy

Mutating scenarios must not share the same state unless intended. Use reset points.

Create at least these snapshots or reset commands:

- `S0_BASELINE`: seed only, no new actions taken by the agent
- `S1_AFTER_WHITELIST_EDIT`: used for late-applicant tests if you want to avoid editing whitelist repeatedly
- `S2_AFTER_ALPHA_SUBMIT`: applicant alpha has completed TTC application
- `S3_AFTER_EVALS_COMPLETE`: applicant alpha has three current evaluations and one lifetime evaluation
- `S4_AFTER_POST_COURSE`: post-TTC and Sahaj records exist for reporting bundles

Simplest rule: reset to `S0_BASELINE` before every bundle, not before every single scenario.

## Orchestrator design

Use one orchestrator agent and several specialist agents. Do not let every agent mutate shared data independently.

### Agent A0: environment and seed verifier

This agent confirms:

- both URLs are reachable
- all personas can authenticate or receive a session token
- reset commands work
- mail sink is readable
- storage inspector is readable
- job triggers work

If A0 fails, nothing else should run.

### Agent A1: reality-check and route mapper

This agent does not try to prove parity yet. It answers a simpler question: does the TypeScript environment actually execute real flows, or is it still mostly rendering shells?

It must:

- open every documented route in both environments
- watch console output
- watch network calls
- record every XHR/fetch call made by each admin and form page
- detect missing backing endpoints, JS errors, and empty-data placeholders

If A1 proves the TypeScript environment is still render-only for a bundle, the orchestrator should stop that bundle and mark it as `implementation incomplete`, not `parity failed`.

### Agent A2: legacy baseline executor

This agent runs the scenario bundle only on the legacy system and records the baseline evidence.

### Agent A3: TypeScript executor

This agent runs the same bundle on the TypeScript system after reset to the matching snapshot.

### Agent A4: diff and verdict writer

This agent compares outputs and classifies each scenario as:

- exact parity
- acceptable intentional delta
- regression
- missing implementation
- inconclusive because baseline data or environment was wrong

## Bundle order

Run bundles in this order:

1. `B00 Reality Check`
2. `B01 Auth and Session`
3. `B02 Portal and Settings`
4. `B03 Applicant Prerequisites and TTC Application`
5. `B04 Evaluator and Matching`
6. `B05 Post-TTC and Sahaj`
7. `B06 Uploads and API Robustness`
8. `B07 Admin, Reports, Integrity, Certificates`
9. `B08 Security and UI Regression`
10. `B09 Final Legacy-vs-TS Diff`

Reset between bundles.

## Detailed scenario catalog

### B00 Reality Check

`RC-01 Route inventory smoke`
- Open every documented TypeScript route and the corresponding legacy route.
- Assert status 200 or expected auth redirect.
- Capture page title and first meaningful heading.

`RC-02 Embedded dependency check`
- For each admin page, capture all network calls triggered by page load and by the first meaningful interaction.
- Flag any relative AJAX endpoint that 404s, 401s unexpectedly, or returns placeholder content.

`RC-03 Console-clean requirement`
- No uncaught JS errors on page load.
- No missing global dependency errors such as jQuery/DataTables/select2 failures.

`RC-04 Minimal submit wiring`
- On each form page, attempt a minimal valid submission with a throwaway persona or snapshot.
- Confirm whether submission reaches persistence or stops at a not-implemented boundary.

### B01 Auth and Session

`AU-01 Protected-route unauthenticated behavior`
- Open protected admin and user routes without auth.
- Compare redirect/block behavior between legacy and TS.

`AU-02 Valid session token login`
- Use session mode in TS and confirm persona identity is reflected correctly in UI and API.

`AU-03 Expired or tampered session`
- Use expired and tampered tokens.
- Confirm access is denied cleanly.

`AU-04 Admin-only route enforcement`
- Use `outsider@ttc.test` against admin routes.
- Confirm settings, summary, integrity, and reports are blocked.

`AU-05 Upload endpoint auth`
- Confirm `/users/upload-form-data`, `/api/upload/signed-url`, and `/api/upload/verify` reject unauthorized requests.

`AU-06 Session isolation`
- Switch from applicant to admin to outsider in one test run.
- Confirm no state or identity leakage across sessions.

### B02 Portal and Settings

`PO-01 Portal home renders current user and country`
- Confirm logged-in identity and home country appear correctly.

`PO-02 Home-country change affects available TTCs`
- Change home country and confirm the available TTC options and form routing change accordingly.

`PO-03 Disabled or unavailable mode`
- Verify any disabled route or maintenance behavior expected by the legacy system.

`PO-04 Report link rendering`
- Confirm safe report links render.
- Confirm unsafe schemes are rejected or sanitized.

`PO-05 Tab navigation`
- Open tabbed or linked portal content and confirm navigation works without breaking history or loading behavior.

### B03 Applicant Prerequisites and TTC Application

`APP-01 US vs non-US form inventory`
- Compare visible fields, labels, required markers, and TTC selector behavior between the US and non-US application forms.
- Compare both environments, not just within TS.

`APP-02 Applicant profile prerequisites`
- Complete or omit prerequisite fields and verify downstream eligibility and completeness calculations.

`APP-03 Dependent fields do not corrupt completeness`
- Toggle conditional fields repeatedly.
- Confirm completeness and saved data remain correct.

`APP-04 Validation errors`
- Submit with missing required fields and invalid formats.
- Confirm errors are shown and no invalid persistence occurs.

`APP-05 Draft save and resume`
- Save partial application, reload, and confirm exact data restoration.

`APP-06 Multi-instance create and load`
- Create more than one instance where allowed.
- Confirm instance selection, loading, and display labels work.

`APP-07 Duplicate instance detection`
- Attempt to create a duplicate TTC instance and confirm the system loads the existing one instead of silently duplicating.

`APP-08 Submit and read-only state`
- Submit successfully.
- Confirm read-only behavior or equivalent submitted-state behavior.

`APP-09 Edit submitted form`
- Re-open a submitted record through the explicit edit path.
- Change a non-key field and confirm persistence.

`APP-10 Copy submitted form`
- Copy a submitted application into a new instance.
- Confirm correct fields carry forward and key instance selectors reset where appropriate.

`APP-11 Expired TTC blocked`
- Use `applicant.beta@ttc.test` against expired TTC.
- Confirm selection or submission is blocked.

`APP-12 Whitelist grace`
- Use `applicant.gamma@ttc.test` for grace-period TTC.
- Confirm access is allowed where a normal applicant is blocked.

`APP-13 Whitelist beyond grace`
- Use the same user against a fully closed TTC.
- Confirm it is still blocked.

`APP-14 DSN application flow`
- Open, validate, save, and submit the DSN application if it exists in both systems.

`APP-15 Portal settings form`
- Confirm home country or equivalent settings persistence.

### B04 Evaluator and Matching

`EVAL-01 Evaluator profile`
- Open and save evaluator profile data.
- Confirm later evaluation flows can use that identity consistently.

`EVAL-02 Current TTC evaluation`
- Submit evaluator 1 for applicant alpha.
- Confirm it links to the correct applicant and current TTC.

`EVAL-03 Completion threshold`
- Submit evaluator 2 and evaluator 3.
- Confirm the application moves into the expected complete or reviewable state when the threshold is reached.

`EVAL-04 Lifetime evaluation`
- Submit evaluator 4 against the historical TTC record.
- Confirm lifetime counts are separate from current-TTC counts.

`EVAL-05 Messy-input matching`
- Use whitespace, case differences, or slightly messy matching input.
- Confirm matching is tolerant where legacy is tolerant.

`EVAL-06 Low rating`
- Submit at least one rating that should drive a `below 3` or equivalent filter.
- Confirm report filters pick it up.

`EVAL-07 Not-ready-now`
- Submit at least one not-ready-now signal.
- Confirm it surfaces in the expected report bucket.

`EVAL-08 Unmatched evaluation`
- Submit data that should not match any applicant.
- Confirm it remains unmapped and is not mis-linked.

### B05 Post-TTC and Sahaj

`POST-01 Post-TTC self-eval only`
- Submit self-evaluation without teacher feedback.
- Confirm the cycle remains incomplete.

`POST-02 Post-TTC teacher feedback completes cycle`
- Add the matching teacher feedback.
- Confirm the cycle becomes complete.

`POST-03 Co-teaching cycle`
- Run the post-TTC coteaching scenario if it exists in the legacy flow.

`POST-04 Post-Sahaj self-eval and feedback`
- Repeat the same logic for Sahaj forms.

`POST-05 Unmatched teacher feedback`
- Seed or submit one unmatched teacher feedback record.
- Confirm it appears as orphan or unmatched, not falsely linked.

### B06 Uploads and API Robustness

`UP-01 Signed URL success`
- Request a signed upload URL as an authenticated user.
- Upload a valid file and verify success.

`UP-02 Signed URL generation failure`
- Simulate storage-sign failure in a controlled test environment if supported.
- Confirm graceful error handling.

`UP-03 Verify endpoint`
- Confirm post-upload verification stores or acknowledges the file correctly.

`UP-04 Cross-user upload authz`
- Attempt to attach or verify another user’s file as `upload.attacker@ttc.test`.
- Confirm denial.

`UP-05 Rate limiting`
- Hit the upload-form-data endpoint repeatedly.
- Confirm rate limiting activates and exposes the right headers or messages.

`UP-06 Boundary sizes`
- Submit payloads just below and just above the limit.
- Confirm acceptance below limit and rejection above limit.

`UP-07 Missing content-length`
- For multipart/form-data where applicable, confirm the expected `411` or equivalent behavior.

`UP-08 Lying content-length`
- Claim a smaller size but actually send a bigger body.
- Confirm true-size enforcement.

`UP-09 Duplicate multipart keys`
- Send duplicate form-data keys.
- Confirm rejection.

`UP-10 Suspicious file handling`
- Upload the suspicious test file.
- Confirm it is not executed or rendered unsafely in downstream UI.

### B07 Admin, Reports, Integrity, Certificates

`AD-01 Reports list`
- Open report list page.
- Confirm available links match the persona permissions.

`AD-02 Permissions matrix`
- Compare `superadmin`, `summaryadmin`, and `outsider` access across all admin pages.

`AD-03 Settings and whitelist`
- Add and remove whitelist entries.
- Confirm the change affects runtime behavior for the late applicant scenario.

`AD-04 TTC applicants summary`
- Confirm row presence, counts, statuses, evaluator counts, and filter results.

`AD-05 TTC applicants reports`
- Open detailed report rows and combined views.
- Confirm the application and linked evaluations appear correctly.

`AD-06 Integrity report`
- Confirm the seeded overlap between alpha and beta appears.

`AD-07 Post-TTC feedback summary`
- Confirm post-TTC summary reflects seeded and newly created records.

`AD-08 Post-Sahaj feedback summary`
- Confirm same for Sahaj.

`AD-09 Combined printable report or PDF`
- Generate or open the printable report.
- Confirm stable content and deterministic output where expected.

`AD-10 Certificate gating`
- Confirm certificate or completion eligibility is only granted under the same conditions as legacy.

`AD-11 Summary job refresh`
- Trigger summary refresh.
- Confirm last-updated changes and no duplicate aggregation occurs.

`AD-12 Integrity job refresh and postload`
- Trigger integrity refresh and any postload stage.
- Confirm output is correct and idempotent.

### B08 Security and UI Regression

`SEC-01 Redirect sanitization`
- Try unsafe redirect targets.
- Confirm sanitization or rejection.

`SEC-02 Portal link schemes`
- Feed `javascript:` and similar links into any configurable link slots.
- Confirm rejection.

`SEC-03 Legacy content escaping`
- Verify short-content/show-hide HTML behavior does not create XSS.

`SEC-04 HTML escaping on rendered content`
- Confirm dangerous HTML and attributes are escaped.

`SEC-05 Carousel edge cases`
- If carousel logic still exists, verify zero, one, and multi-row behavior.

`SEC-06 Boundary rendering`
- Confirm empty, null, and oversized content blocks do not break layout or script execution.

### B09 Final parity diff

`DIFF-01 Field inventory diff`
- Compare every form field, label, required flag, and option list against legacy.

`DIFF-02 Network contract diff`
- Compare the sequence and purpose of network requests for each major action.

`DIFF-03 State transition diff`
- Compare draft, submitted, edited, copied, matched, and completed states.

`DIFF-04 Reporting diff`
- Compare report rows, counts, filters, and timestamps.

`DIFF-05 Side-effect diff`
- Compare storage objects, emails, and persistence outcomes.

`DIFF-06 Final classification`
- Classify every difference as approved delta, regression, missing implementation, or legacy-only bug.

## Evidence contract for every scenario

Every agent must return this minimum evidence set:

- scenario ID
- environment: legacy or TypeScript
- snapshot used
- persona used
- exact URL opened
- actions taken
- expected outcome
- actual outcome
- screenshot before action
- screenshot after action
- console errors if any
- network requests and responses relevant to the scenario
- DB or persistence verification summary
- storage verification summary if uploads are involved
- mail verification summary if notifications are involved
- parity verdict
- root-cause guess if failed

Use one markdown report and one machine-readable JSON report per bundle.

## Exact prompts for ChatGPT Agent mode

Use these prompts as the actual handoff to ChatGPT Agent. Replace placeholders before running.

### Prompt 1: Orchestrator

```text
You are the orchestration agent for TTC portal migration parity testing.

Inputs:
- legacyUrl: <LEGACY_URL>
- tsUrl: <TS_URL>
- seedResetLegacy: <COMMAND_OR_INSTRUCTION>
- seedResetTs: <COMMAND_OR_INSTRUCTION>
- summaryJobTrigger: <COMMAND_OR_URL>
- integrityJobTrigger: <COMMAND_OR_URL>
- mailSink: <URL_OR_COMMAND>
- storageInspector: <URL_OR_COMMAND>
- dbReadOnlyInspector: <COMMAND_OR_SQL_TOOL>
- personaManifest: <JSON>
- fixtureManifest: <JSON>

Mission:
Run bundles B00 through B09 in order. Reset both environments to the correct snapshot before each bundle. For each bundle, first run the legacy baseline, then run the TypeScript system, then compare results. Do not declare parity from static rendering alone. Watch network calls, console output, persisted data, upload side effects, email side effects, and reporting changes.

Rules:
- Stop a bundle early and label it implementation incomplete if the TypeScript system is only rendering shells without working backing endpoints.
- Do not guess. If a scenario is inconclusive, say why.
- Save evidence for every scenario.
- Output one markdown report and one JSON report per bundle, plus a final summary ranking failures by severity.
```

### Prompt 2: Reality-check agent

```text
You are the reality-check agent.

Compare the legacy and TypeScript environments for bundle B00.

Scenarios:
- RC-01 Route inventory smoke
- RC-02 Embedded dependency check
- RC-03 Console-clean requirement
- RC-04 Minimal submit wiring

Instructions:
1. Visit every documented route in the TypeScript app:
   /api/admin/reports_list
   /api/admin/permissions
   /api/admin/settings
   /api/admin/ttc_applicants_summary
   /api/admin/ttc_applicants_integrity
   /api/admin/ttc_applicants_reports
   /api/admin/post_ttc_course_feedback
   /api/admin/post_sahaj_ttc_course_feedback
   /api/forms/ttc_application_us
   /api/forms/ttc_application_non_us
   /api/forms/ttc_evaluation
   /api/forms/ttc_applicant_profile
   /api/forms/ttc_evaluator_profile
   /api/forms/dsn_application
   /api/forms/post_ttc_self_evaluation
   /api/forms/post_ttc_feedback
   /api/forms/post_sahaj_ttc_self_evaluation
   /api/forms/post_sahaj_ttc_feedback
   /api/forms/ttc_portal_settings
2. Capture console and network logs.
3. Record every XHR or fetch call triggered by each page.
4. Flag any missing backing endpoint, JS dependency error, empty-data failure, or non-functional submit path.
5. Produce a route matrix with status, title, errors, and missing dependencies.
```

### Prompt 3: Applicant-flow agent

```text
You are the applicant-flow agent.

Run bundle B03 against both environments using the provided personas and snapshots.

Scenarios:
- APP-01 US vs non-US form inventory
- APP-02 Applicant profile prerequisites
- APP-03 Dependent fields do not corrupt completeness
- APP-04 Validation errors
- APP-05 Draft save and resume
- APP-06 Multi-instance create and load
- APP-07 Duplicate instance detection
- APP-08 Submit and read-only state
- APP-09 Edit submitted form
- APP-10 Copy submitted form
- APP-11 Expired TTC blocked
- APP-12 Whitelist grace
- APP-13 Whitelist beyond grace
- APP-14 DSN application flow
- APP-15 Portal settings form

Use these personas:
- applicant.alpha@ttc.test
- applicant.beta@ttc.test
- applicant.gamma@ttc.test
- applicant.multi@ttc.test

For every scenario:
- capture visible fields and labels
- capture network requests on save and submit
- verify persistence using the DB inspector or app-visible reloading
- verify status transitions
- compare legacy and TypeScript outcomes
- classify each difference exactly
```

### Prompt 4: Evaluator and post-course agent

```text
You are the evaluator and post-course agent.

Run bundles B04 and B05 against both environments.

Scenarios:
- EVAL-01 through EVAL-08
- POST-01 through POST-05

Use these personas:
- evaluator.1@ttc.test
- evaluator.2@ttc.test
- evaluator.3@ttc.test
- evaluator.4@ttc.test
- graduate.post@ttc.test
- teacher.post@ttc.test
- graduate.sahaj@ttc.test
- teacher.sahaj@ttc.test

Your job is to prove or disprove parity in matching logic, lifetime evaluation counting, low-rating behavior, not-ready-now behavior, and post-course completion logic.

Do not stop at form submission. You must verify downstream visibility in admin or reporting views after the appropriate refresh step.
```

### Prompt 5: Upload and API agent

```text
You are the upload and API robustness agent.

Run bundle B06 and the relevant auth scenarios from B01.

Scenarios:
- AU-05 Upload endpoint auth
- UP-01 through UP-10

Use these personas:
- applicant.alpha@ttc.test
- upload.attacker@ttc.test
- outsider@ttc.test

Use these files:
- valid-photo.jpg
- valid-photo-large.jpg
- oversize-photo.jpg
- polyglot-html.jpg
- simple-png.png

Verify:
- auth enforcement
- cross-user authorization
- request-size limits
- rate limiting
- content-length enforcement
- duplicate multipart-field rejection
- signed URL and verify behavior
- unsafe file handling

Capture raw request and response evidence where possible.
```

### Prompt 6: Admin and reporting agent

```text
You are the admin and reporting agent.

Run bundle B07 after the required snapshots are prepared.

Scenarios:
- AD-01 through AD-12

Use these personas:
- superadmin@ttc.test
- summaryadmin@ttc.test
- outsider@ttc.test

Verify:
- permission matrix
- whitelist editing behavior
- summary rows and filters
- detailed reports
- integrity matches
- post-TTC and post-Sahaj summaries
- printable reports or PDFs
- certificate gating
- summary and integrity job idempotency

For any admin page that loads a data table, inspect network traffic to confirm the backing data source exists and returns the expected dataset.
```

### Prompt 7: Security and UI agent

```text
You are the security and UI regression agent.

Run bundle B08.

Scenarios:
- SEC-01 through SEC-06

Your job is to probe redirect sanitization, link-scheme sanitization, HTML escaping, show-hide content rendering, carousel edge cases, and null or oversized content rendering.

Record whether the TypeScript system preserves the legacy system's safe behavior or introduces a new weakness or a new incompatibility.
```

### Prompt 8: Final diff agent

```text
You are the final diff agent.

Inputs:
- all bundle reports from legacy baseline runs
- all bundle reports from TypeScript runs

Produce a final parity ledger with these columns:
- scenario ID
- feature area
- legacy result
- TypeScript result
- parity status: exact / acceptable delta / regression / missing implementation / inconclusive
- severity: blocker / major / minor
- suspected root cause
- recommended fix owner: frontend / backend / auth / uploads / reporting / data / infra

Then produce a ranked top-15 bug list that the coding agents should fix before the same test plan is handed to a human tester.
```

## Human handoff rule

Do not hand this plan to the human tester until:

- the TypeScript environment passes B00 without implementation-incomplete flags on the critical routes
- all blocker and major regressions from the first AI run are fixed
- the second AI run shows only approved deltas or minor issues

Only then should the human repeat the same high-value scenarios side by side.

## Bottom line

This is not a generic QA checklist. It is a migration-verification system.

It is designed to answer one hard question with evidence:

Does the TypeScript system actually behave like the Python system under real roles, real seeded data, real uploads, and real reporting refreshes?

If you want, the next step is for me to turn this into a cleaner handoff artifact with a scenario ledger table and a ready-to-fill seed manifest JSON template.
