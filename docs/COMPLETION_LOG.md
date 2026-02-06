# Completion Log

Detailed implementation notes go here.

Keep `IMPLEMENTATION_PLAN.md` summaries <=120 chars, one sentence.

## TASK-056: fix-reporting-user-report-imports (2026-02-06)

### Changes Made

1. **reporting/user_report.py:21-22** - Added missing imports
   - `from google.appengine.ext import blobstore`
   - `from google.appengine.api import images`
   - These modules are used by `get_user_image_url()` method

2. **reporting/user_report.py:36-46** - Fixed `get_user_image_url()` method
   - Removed obsolete commented-out imports (lines 36-39)
   - Fixed line 42: `CLOUD_STORAGE_LOCATION` → `constants.CLOUD_STORAGE_LOCATION`

### Verification

- `python -m py_compile reporting/user_report.py` - PASSED
- `bun run bdd:verify` - PASSED (243 steps, 0 orphan, 0 dead)

### Impact

The `get_user_image_url()` method now has all required imports and will execute without `NameError` exceptions. This method serves resized images from Google Cloud Storage via the App Engine Images API.

## TASK-058: escape-portal-rendering-html (2026-02-06)

### Changes Made

1. **app/utils/html.ts** (new file) - Created HTML escape utility functions
   - `escapeHtml()`: Escapes `<`, `>`, `&` for text content
   - `escapeHtmlAttr()`: Escapes `<`, `>`, `&`, `"`, `'` for attribute values
   - Based on OWASP recommendations and legacy pattern in `javascript/utils.js:207-214`

2. **app/portal/home/render.ts** - Fixed XSS in `renderPortalHome()`
   - Imported `escapeHtml` and `escapeHtmlAttr` from `../../utils/html`
   - Escaped `userEmail`, `homeCountryName`, `homeCountryIso` with `escapeHtml()`
   - Escaped `link.href` with `escapeHtmlAttr()` (attribute context)
   - Escaped `link.label` with `escapeHtml()` (text content)

3. **app/portal/tabs/render.ts** - Fixed XSS in `renderPortalTab()`
   - Imported escape utilities
   - Escaped `homeCountryName` with `escapeHtml()`
   - Escaped `email` with `escapeHtmlAttr()` in `href` attribute
   - Escaped `email` with `escapeHtml()` as text content

4. **test/typescript/steps/portal_steps.ts** - Added escaping verification
   - Added new Then step: "the HTML output should have dangerous characters escaped"
   - Checks for absence of `<script>`, `<img src=x onerror`, `onclick=`, `onload=`

### Verification

- `bun run typecheck` - PASSED
- `bun run lint` - PASSED (only warnings in experimental jsPDF)
- `bun run bdd:verify` - PASSED (243 steps, 0 orphan, 0 dead)
- Manual test of escape functions confirmed correct entity encoding

### Security Impact

All user-controlled values interpolated into portal HTML are now escaped:
- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#x27;`

This prevents XSS via:
- Text content injection (e.g., email, country names)
- Attribute injection (e.g., href values)

## TASK-055: fix-db-user-common-import (2026-02-06)

### Changes Made

1. **db/user.py:2** - Fixed broken import statement
   - Changed: `from common import Utils`
   - To: `from pyutils.utils import mask`

2. **db/user.py:26** - Updated function call to use imported `mask` function
   - Changed: `d[p] = Utils.mask(d[p])`
   - To: `d[p] = mask(d[p])`

### Root Cause

The `db/user.py` file (added in commit `5f9a716`) imported `Utils` from a non-existent `common` module. The actual `mask` function is located at `pyutils/utils.py:205` as a module-level function, not as a method of the `Utils` class.

### Verification

- Syntax check: `python -m py_compile db/user.py` - PASSED
- The `mask` function exists at `pyutils/utils.py:205`
- Import pattern consistent with other files (e.g., `ttc_portal.py:17` uses `from pyutils import utils`)

### Notes

- Legacy code is read-only; this was a simple import fix
- The `Lead.dict()` method uses `mask()` to redact sensitive properties (email, phone)
- No functional changes to the masking behavior

## TASK-054: fix-legacy-xss-sinks (2026-02-06)

### Changes Made

1. **javascript/utils.js:636** - Fixed `postFSMessage` XSS vulnerability
   - Changed `$("#txtHintFS").html(msg)` to `$("#txtHintFS").text(msg)`
   - jQuery's `.text()` method automatically escapes HTML entities

2. **javascript/utils.js:207-217** - Added `escapeHTMLAttr()` helper function
   - Escapes `&`, `"`, `'`, `<`, `>` to HTML entities
   - Safe for use in HTML attribute context (like onclick attributes)

3. **javascript/utils.js:1286-1287** - Fixed `getShowHideHTML` onclick handlers (single-line branch)
   - `shShowButton` onclick: wrapped `show_button_text` and `hide_button_text` with `escapeHTMLAttr()`
   - `shHideButton` onclick: wrapped `show_button_text` and `hide_button_text` with `escapeHTMLAttr()`

4. **javascript/utils.js:1308** - Fixed `getShowHideHTML` onclick handler (multi-line branch)
   - `shButton` onclick: wrapped `show_button_text` and `hide_button_text` with `escapeHTMLAttr()`

### Security Impact

**Before:**
- `postFSMessage` accepted arbitrary HTML from `msg` parameter
- `getShowHideHTML` interpolated button text directly into onclick attributes

**After:**
- `postFSMessage` displays text content only (HTML entities escaped)
- `getShowHideHTML` button text parameters are HTML-escaped before use in onclick attributes

**Risk Assessment:**
- `postFSMessage` appears unused in current codebase (no external callers found)
- `getShowHideHTML` button texts are currently hardcoded literals (`'[+]'`, `'[-]'`, `'(show more)'`, `'(hide)'`)
- Escaping provides defense-in-depth against future misuse

### Verification
- `bun run bdd:verify`: 243 steps defined, 0 orphan, 0 dead
- `bun run typecheck`: No errors
- `bun run lint`: Only warnings in third-party jsPDF library (not our code)

### Notes
- Legacy JavaScript code (Python 2.7 era)
- No automated tests exist for these utilities
- Primary users are internal admins (reduces but doesn't eliminate risk)
- Changes are minimal and defensive

## TASK-053: reduce-test-fallbacks-typescript (2026-02-06)

### Changes Made

1. **test/typescript/steps/admin_steps.ts** - Removed fallback HTML logic
   - Deleted `ADMIN_DASHBOARD_FALLBACK_HTML`, `ADMIN_REPORTS_LIST_FALLBACK_HTML`, `ADMIN_SETTINGS_FALLBACK_HTML` constants (lines 49-62)
   - Simplified `renderAdminDashboardHtml()`, `renderAdminReportsListHtml()`, `renderAdminSettingsHtml()` to direct imports
   - Added `resetAdminStepsCache()` export function
   - Exported `cachedUsers` variable

2. **test/typescript/steps/common.ts** - CREATED shared state reset module
   - Added `Before()` hook that resets all module-level state between scenarios
   - Imports and resets: `apiContext`, `draftContext`, `userFormContext`, `configContext`, `getFormDataContext`, `reportingContext`, `eligibilityDashboardContext`, `prerequisitesContext`, `integrityContext`
   - Calls reset functions: `resetApiStepsCache()`, `resetAdminStepsCache()`, `resetUserStepsCache()`, `resetEligibilityDashboardState()`

3. **test/typescript/steps/api_steps.ts** - Exported context and cache reset
   - Exported `apiContext` object
   - Exported `cachedConfig`, `cachedSubmissions` variables
   - Added `resetApiStepsCache()` function

4. **test/typescript/steps/user_steps.ts** - Exported contexts and cache reset
   - Exported `userFormContext`, `configContext`, `getFormDataContext`, `reportingContext`
   - Exported `cachedSubmissions` variable
   - Added `resetUserStepsCache()` function

5. **test/typescript/steps/eligibility_dashboard_steps.ts** - Exported context and reset
   - Exported `eligibilityDashboardContext`
   - Exported `formAccessAttempt` variable
   - Added `resetEligibilityDashboardState()` function

6. **test/typescript/steps/integrity_steps.ts** - Exported reset function
   - Exported `getIntegrityContext()` function

### Implementation Details

**Problem Solved:**
TypeScript BDD steps had two major issues:
1. **Fallback responses masked real failures**: `admin_steps.ts` caught all import/runtime errors and returned fake HTML, causing tests to pass even when render modules were completely broken
2. **State leakage between scenarios**: Multiple step files had module-level contexts that were never reset, causing cross-scenario contamination

**Solution:**
- Removed all try/catch fallback logic from admin render functions
- Created centralized `Before()` hook in `common.ts` that resets all state before each scenario
- Used reset function pattern (not direct assignment to imports) to work around ES module read-only bindings

### Verification
- `bun run bdd:typescript`: 99 scenarios passed, 441 steps passed
- `bun run typecheck`: No errors
- `bun run lint`: Only warnings in third-party jsPDF library (not our code)

### Behavior Changes
**Before:**
- Admin tests passed with fake HTML even when render modules were missing/broken
- State from one scenario could leak into the next

**After:**
- Import errors in admin render modules cause test failures (not silent fallbacks)
- All state is reset before each scenario via the `Before()` hook

## TASK-052: reduce-test-fallbacks-python (2026-02-06)

### Changes Made
1. **test/python/steps/common.py** - CREATED shared test utilities module
   - `MOCK_MODE` flag reads from `BDD_MOCK_MODE` env var (default: false)
   - `_fake_response(body_text='')` raises `AssertionError` when `MOCK_MODE` is false
   - Clear error message: "Set BDD_MOCK_MODE=true to use fixture-only mode"

2. **test/python/steps/api_steps.py** - Updated to import from common
   - Removed local `_fake_response()` definition (lines 73-78)
   - Added `from steps.common import _fake_response` import

3. **test/python/steps/portal_steps.py** - Updated to import from common
   - Removed local `_fake_response(body_text)` definition (lines 41-46)
   - Added `from steps.common import _fake_response` import
   - Usage at lines 134, 219, 286 now uses shared version

4. **test/python/steps/auth_steps.py** - Updated to import from common
   - Removed local `_fake_response(body_text)` definition (lines 47-52)
   - Added `from steps.common import _fake_response` import
   - Usage at lines 64, 83, 102, 115, 127 now uses shared version

### Implementation Details
The new `common.py` module implements **Option A** from the research plan:
- **Fail-fast by default**: Tests now raise `AssertionError` if legacy app is unavailable
- **Explicit opt-in**: Set `BDD_MOCK_MODE=true` to enable fixture-only mode
- **Python 2.7 compatible**: No f-strings, type hints, or other Python 3+ features

This prevents the silent fallback behavior where tests would return fake 200/HTML responses even when the real application had errors (import errors, runtime errors, etc.). Now real errors will be visible unless mock mode is explicitly enabled.

### Verification
- `bun run bdd:verify` passes: 243 steps defined, 0 orphan, 0 dead
- All step files import successfully: `python -c "from steps import api_steps"`
- `_fake_response()` raises `AssertionError` by default (without `BDD_MOCK_MODE=true`)
- `_fake_response('test')` returns proper response with `BDD_MOCK_MODE=true`

### Behavior Changes
**Without `BDD_MOCK_MODE=true`** (default):
- Tests raise `AssertionError` if legacy app is unavailable
- Real application errors (import errors, runtime errors) are visible
- This is the desired default behavior - fail fast

**With `BDD_MOCK_MODE=true`**:
- Tests use fake responses as before
- Fixture-only mode works as designed
- Suitable for CI jobs that don't have legacy app dependencies

### Next Steps
- CI configuration files may need `BDD_MOCK_MODE=true` for jobs that intentionally run fixture-only tests
- This aligns Python test behavior with TypeScript tests (no silent fallbacks)

## TASK-044: remove-pii-experimental-fixtures (2026-02-06)

### Changes Made
1. **5 .zip files removed from git tracking**:
   - `backup/lib-20201219.zip` (12.7 MB backup)
   - `images/font-awesome-4.7.0.zip` (vendor lib)
   - `javascript/footable-standalone.latest.zip` (vendor lib)
   - `javascript/select2-4.0.13.zip` (vendor lib)
   - `experimental/jsPDF-master.zip` (already deleted)

2. **.gitignore updated** to prevent re-tracking:
   - Added `*.zip` pattern
   - Added `backup/` directory
   - Added Python cache patterns (`*.pyc`, `__pycache__/`, `*.pyo`)

3. **http:// links changed to https://** with security attributes:
   - `constants.py:8` - SUPPORT_WEBSITE_URL
   - `disabled.html:136-137` - Privacy/Terms links
   - `ttc_portal.html:773-774` - Privacy/Terms links
   - `form/ttc_application.html:370` - Support link
   - `tabs/form_page.html:370` - Support link
   - `tabs/ttc_application_manual-20180126.html:370` - Support link
   - `tabs/ttc_application_manual.html:397` - Support link

4. **.DS_Store handling** - Already in .gitignore, no tracked files found

### Implementation Details
The experimental HTML test files referenced in REVIEW_DRAFTS.md were already removed in a previous session. The remaining work focused on:
1. Removing vendor .zip files that can be restored from official CDNs
2. Removing a backup zip file that should not be in the repo
3. Fixing insecure http:// links in legacy code (security exception to read-only rule)

### Verification
- No .zip files tracked: `git ls-files "*.zip"` returns empty
- No .DS_Store files tracked: `git ls-files | grep .DS_Store` returns empty
- BDD alignment verification passed: 243 steps defined, 0 orphan, 0 dead
- typecheck and lint passed

### Security Rationale
1. **.zip files**: Vendored dependencies should be installed via package managers, not committed. Large zip files bloat the repo and may contain unverified code.
2. **http:// links**: Unencrypted links can be downgraded and leak user traffic. External links with `target="_blank"` without `rel="noopener noreferrer"` are vulnerable to tabnabbing.
3. **.DS_Store files**: macOS metadata files can leak directory structure and should never be tracked.

## TASK-043: scrub-secrets-in-repo-text (2026-02-06)

### Changes Made
1. **scripts/security/scan-secrets.sh** - CREATED secrets scanning script
2. **app-dev.yaml:86-88** - Redacted Google Maps and Public API keys, service account filename
3. **app-20190828.yaml:114-115** - Redacted Google Maps and Public API keys
4. **form/ttc_application.html:804** - Redacted Google Maps API key
5. **tabs/settings.html:322** - Redacted Google Maps API key
6. **tabs/form_page.html:804** - Redacted Google Maps API key
7. **tabs/ttc_application_manual.html:831** - Redacted Google Maps API key
8. **tabs/ttc_application_manual-20180126.html:804** - Redacted Google Maps API key
9. **constants.py:14-16, 20** - Redacted SendGrid and Harmony keys in comments
10. **docs/Tasks/TASK-FIX-002.md:22, 25** - Redacted secret values
11. **docs/Tasks/TASK-FIX-002.research.md:17-18, 28, 50-51** - Redacted secret values
12. **docs/Tasks/TASK-FIX-002.plan.md:15-16** - Redacted secret values

### Implementation Details
All secret values were replaced with descriptive placeholders:
- SendGrid API keys → `SG.REDACTED`
- Harmony API key → `HARMONY.REDACTED`
- Google Maps API keys → `AIza.REDACTED.GOOGLE_MAPS` / `AIza.REDACTED.GOOGLE_PUBLIC`
- Service account filename → `artofliving-ttcdesk-dev-REDACTED.json`

The scan script checks for:
1. SendGrid API keys (`SG.` prefix pattern)
2. Google API keys (`AIza` prefix pattern)
3. Harmony search keys (specific known value)
4. Service account filenames with embedded key IDs

### Verification
- Secrets scan script shows all checks passing
- BDD alignment verification passed: 243 steps defined, 0 orphan, 0 dead
- All tracked text files reviewed and redacted

### Security Rationale
Secret values in version control are a security risk because:
1. Repository history retains secrets even after removal from HEAD
2. Secret scanners flag repositories with historical secrets
3. External publication (e.g., open sourcing) would expose secrets
4. Comments with "historical" keys still contain usable secret values

Redaction with placeholders preserves documentation context while removing the actual secret values.

### Impact
- No functional change to the application
- All secrets now use environment variables (already implemented)
- Scan script provides ongoing validation before commits/publication

## TASK-048: restrict-docs-serving (2026-02-06)

### Changes Made
1. **app.yaml:63-66** - Removed `/docs` static handler (4 lines)
2. **app-dev.yaml:51-54** - Removed `/docs` static handler (4 lines)
3. **app-20190828.yaml:62-65** - Removed `/docs` static handler (4 lines)

### Implementation Details
- Removed the `/docs` static directory handlers from all three app.yaml configuration files
- Each handler block was:
  ```yaml
  - url: /docs
    static_dir: docs
    login: required
    secure: always
  ```

### Verification
- No `/docs` handlers remain in any app.yaml files
- All three app.yaml files are valid YAML
- BDD alignment verification passed: 243 steps defined, 0 orphan, 0 dead

### Security Rationale
The `/docs` directory contains internal project documentation (plans, tasks, review notes, completion logs) that should not be served via the web application. The handler was:
1. Not referenced by any application code (only GCS bucket references in ttc_portal.html)
2. Using `login: required` which would expose internal docs to any authenticated user
3. Serving non-user-facing internal project documentation

### Impact
- No functional change to the application
- Internal docs remain in the repository but are not served via the web app

