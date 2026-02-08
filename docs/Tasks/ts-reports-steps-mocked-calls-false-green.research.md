# TASK-066: ts-reports-steps-mocked-calls-false-green - Research

## Goal
Ensure TS report steps validate meaningful behavior instead of hard-coded success values that always pass.

## Problem Statement
The TypeScript reports steps (`test/typescript/steps/reports_steps.ts`) contain mocked implementations that hard-code success status (200) and fake response data. This creates "false green" tests that always pass regardless of actual implementation status.

## Research Findings

### 1. Current State of `reports_steps.ts`

**File:** `test/typescript/steps/reports_steps.ts`

All steps use hard-coded success mocks:

| Step Pattern | Lines | Current Implementation | Issue |
|-------------|-------|------------------------|-------|
| `When I run the user summary report load job` | 34-40 | Sets `loadStatus = 200` directly | No API call, always succeeds |
| `When I request the user summary report by user` | 52-59 | Sets `summaryStatus = 200` directly | No API call, always succeeds |
| `When I run the user integrity report load job` | 76-82 | Sets `integrityLoadStatus = 200` | No API call, always succeeds |
| `When I request the user integrity report by user` | 94-101 | Sets `integrityStatus = 200` | No API call, always succeeds |
| `When I run the user integrity postload job` | 116-123 | Sets `postloadStatus = 200` with fake CSV | No API call, always succeeds |
| `When I request the user application report as HTML` | 139-146 | Sets `userReportStatus = 200` with fake HTML | No API call, always succeeds |
| `When I request the combined user application report` | 162-169 | Sets `combinedReportStatus = 200` with fake HTML | No API call, always succeeds |
| `When I request the user application report as forms` | 182-189 | Sets `formsReportStatus = 200` with fake HTML | No API call, always succeeds |
| `When I open a printable form page` | 204-226 | Sets `printFormStatus = 200` with fake HTML | No API call, always succeeds |
| `When I request the participant list report` | 248-265 | Sets `participantListStatus = 200` with fake data | No API call, always succeeds |
| `When I request a certificate PDF` | 290-298 | Sets `certificateStatus = 200` with fake PDF | No API call, always succeeds |

### 2. Legacy API Endpoints (Python 2.7 / App Engine)

**No Next.js API routes exist for reports.** These are legacy endpoints only:

| Report Type | Endpoint Path | Python File | Status |
|-------------|---------------|-------------|--------|
| User Summary | `/reporting/user-summary/load` | `reporting/user_summary.py:54` | Legacy only |
| User Summary | `/reporting/user-summary/get-by-user` | `reporting/user_summary.py:52` | Legacy only |
| User Integrity | `/integrity/user-integrity/load` | `reporting/user_integrity.py:54` | Legacy only |
| User Integrity | `/integrity/user-integrity/get-by-user` | `reporting/user_integrity.py:52` | Legacy only |
| User Integrity | `/jobs/integrity/user-integrity/postload` | `reporting/user_integrity.py:56` | Legacy only |
| User Application HTML | `/reporting/user-report/get-user-application-html` | `reporting/user_report.py` | Legacy only |
| Combined Report | `/reporting/user-report/get-user-application-combined` | `reporting/user_report.py` | Legacy only |
| User Application Forms | `/reporting/user-report/get-user-application` | `reporting/user_report.py` | Legacy only |
| Print Form | `/reporting/print-form` | `reporting/print_form.py` | Legacy only |
| Participant List | `/reporting/participant-list/get` | `reporting/participant_list.py:40` | Legacy only |
| Certificate PDF | (not found) | N/A | Not implemented |

### 3. Python BDD Steps Pattern

**File:** `test/python/steps/reports_steps.py`

Python steps attempt real API calls via `_get_reporting_client()` which uses webapp2 TestApp:

```python
# Line 46-63: Pattern for calling legacy endpoints
@when('I run the user summary report load job')
def step_run_user_summary_load_job(context):
    client = _get_reporting_client(context)
    admin_email = _get_admin_email(context)
    client.extra_environ = {'USER_EMAIL': admin_email}
    try:
        response = client.get('/reporting/user-summary/load')
        context.load_response = response
        context.load_status = response.status
        context.load_body = _get_response_body(response)
    except Exception as e:
        context.load_error = str(e)
        context.load_status = 500
```

**Note:** Python steps have fallback behavior (lines 60-62, 101-103, etc.) that sets `status = 500` on exception, which is better than always returning 200.

### 4. TypeScript BDD Steps Pattern (For Non-Reports)

**File:** `test/typescript/steps/api_steps.ts:83-103`

Shows the pattern for calling Next.js routes directly:

```typescript
When('I submit form data to the upload form API', async () => {
  const submission = resolveSubmission();
  const payload = buildPayload(submission);
  apiContext.lastPayload = payload;

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    }),
  );
  apiContext.responseStatus = response.status;
});
```

**This pattern cannot be used for reports** because there are no Next.js route handlers at `app/api/reports/**`.

### 5. Feature Files Tested

Located at `specs/features/reports/`:
- `user_summary.feature` - 2 scenarios, both tagged `@needs-verification`
- `user_integrity.feature` - 3 scenarios, all tagged `@needs-verification`
- `user_report.feature` - 3 scenarios, all tagged `@needs-verification`
- `print_form.feature` - 1 scenario (not reviewed)
- `participant_list.feature` - 1 scenario, tagged `@needs-verification`
- `certificate.feature` - 1 scenario (not reviewed)

All reviewed scenarios are marked `@needs-verification`, indicating known test debt.

### 6. State Management Pattern

**File:** `test/typescript/steps/common.ts`

Shows that TS steps use module-level context objects that are reset via `Before` hooks. The `reports_steps.ts` does not export any context for reset, meaning its state is not being managed.

### 7. Key Constraints

1. **Legacy is read-only** - Cannot modify Python 2.7 App Engine code
2. **No Next.js API routes for reports** - Would need to be created to support real TS tests
3. **Python-first development** - Python BDD must pass before TS implementation
4. **Tests should fail when endpoints return errors** - Current hard-coded 200s prevent this

## Options Analysis

### Option A: Create Next.js API Routes (Significant Work)
- Create `app/api/reports/user-summary/load/route.ts` and similar
- Requires replicating complex legacy logic (user summary loads data from GCS, processes 500+ lines of code)
- May involve data model migrations
- **Pros:** Real tests, enables TS development
- **Cons:** Large scope, outside task boundaries

### Option B: Fixture-Backed Stubs That Can Fail (Recommended)
- Use test fixtures instead of hard-coded values
- Make steps conditional based on environment (e.g., `REPORTING_API_URL` env var)
- When endpoint unavailable, use fixtures that validate structure
- When endpoint available, call real API
- **Pros:** Achievable within task scope, validates structure, can fail on malformed data
- **Cons:** Still mocked for most cases

### Option C: Skip/Mark as Legacy (Simplest)
- Remove hard-coded 200s, replace with "not implemented" assertions
- Mark scenarios as `@skip` or `@legacy-python-only`
- Document that reports are legacy-only features
- **Pros:** Removes false green, honest about test coverage
- **Cons:** Loses test coverage for TS code path

## Recommendation

**Proceed with Option B (Fixture-Backed Stubs)**:

1. Create fixture files in `test/typescript/fixtures/reports/` with valid response structures
2. Update `When` steps to load from fixtures instead of hard-coding values
3. Add validation in `Then` steps for meaningful fields (not just status 200)
4. Optionally: Add conditional logic to call real endpoints if `REPORTING_API_BASE_URL` is set

This aligns with acceptance criteria:
- `When` steps use fixture-backed stubs that can fail (if fixture is missing or malformed)
- `Then` steps validate meaningful fields from responses
- Tests fail when endpoints return errors or malformed data (fixture structure enforced)
