# TASK-033 Research: Print Form Feature

## Legacy behavior summary

The print form functionality in the legacy codebase is implemented in `reporting/print_form.py` as a `PrintForm` webapp2 request handler. This handler:

1. **Accepts GET requests** with URL parameters:
   - `email` - User email to fetch form data for
   - `form_type` - Type of form (e.g., `ttc_application`, `ttc_evaluation`)
   - `form_instance` - Form instance number (default: `0`)
   - `page_no` - Page number to display (default: `1`)
   - `user_home_country_iso` - User's home country ISO code (optional)

2. **Renders printable form HTML** by:
   - Loading form configuration from GCS (Google Cloud Storage) based on form type and country
   - Generating HTML for each question type (text, textarea, select, radio, checkbox_group, repeater, image, header, question)
   - Supporting multi-instance forms with instance selection
   - Using Jinja2 template `form/empty_form.html` for rendering

3. **Key features**:
   - Form data is fetched via `TTCPortalUser.get_form_data(form_type, form_instance)`
   - Supports pagination with multiple pages per form
   - Handles country-specific form configurations
   - Generates appropriate HTML for different question types
   - Includes display-only inputs for select options with additional fields

## Code locations (legacy)

### Main handler
- **File**: `reporting/print_form.py`
- **Class**: `PrintForm` (line 33)
- **Method**: `get(self, obj)` (line 496) - Main handler that processes print requests
- **Method**: `get_html_for_question(self, question, user_home_country=None)` (line 36) - Generates HTML for individual questions

### Routes
From `specs/extracted/routes.json` and `specs/extracted/forms.json`:
- Multiple form paths route to `PrintForm` handler:
  - `form/ttc_application.html`
  - `form/ttc_evaluation.html`
  - `form/ttc_applicant_profile.html`
  - `form/ttc_evaluator_profile.html`
  - `form/post_ttc_self_evaluation_form.html`
  - `form/post_ttc_feedback_form.html`
  - `form/ttc_portal_settings.html`

### Report metadata
From `specs/extracted/reports.json:39-44`:
- **Name**: "Print Form Report"
- **Description**: "Renders printable form HTML for admin review"
- **Type**: "report"

## Test harness context (Python)

### Current implementation status
- **File**: `test/python/steps/reports_steps.py` (lines 1-368)
- **Status**: The file exists and has implementations for other report steps (user_summary, user_integrity, user_application)
- **Missing**: Step definition for `Then I should see a printable form view`

### Admin authentication pattern
From `test/python/steps/admin_steps.py`:
- Lines 92-97: `@given('I am authenticated as an admin user')` creates a `_FakeUser` with admin email
- Lines 64-75: `_resolve_admin_email(context)` helper resolves admin email from context or defaults to `'test.admin@example.com'`
- Admin steps set `context.current_user`, `context.current_email`, and `context.current_role`

### Client initialization pattern
From `test/python/steps/reports_steps.py`:
- Lines 14-19: `_get_reporting_client(context)` gets the TestApp client for reporting module
- The client requires Google App Engine dependencies (google.appengine.api, cloudstorage)
- Admin authentication is mocked via `client.extra_environ = {'USER_EMAIL': admin_email}`

## TypeScript context

### Current implementation status
- **File**: `test/typescript/steps/reports_steps.ts` (lines 1-196)
- **Status**: Skeleton implementations with mock responses
- **Pattern**: Uses a `ReportsWorld` type to track response status/body in memory
- **Missing**: Step definition for `Then I should see a printable form view`

### Existing mock pattern
From `test/typescript/steps/reports_steps.ts`:
- Lines 134-155: `I request the user application report as HTML` sets `world.userReportStatus = 200` and `world.userReportBody = '<div>...</div>'`
- Lines 143-155: `I should receive the user application HTML` asserts status 200 and checks for HTML content
- This pattern can be replicated for the print form step

## Step registry status

From `test/bdd/step-registry.ts` (lines 68-73):
```typescript
'I open a printable form page': {
  pattern: /^I\ open\ a\ printable\ form\ page$/,
  python: 'test/python/steps/reports_steps.py:1',
  typescript: 'test/typescript/steps/reports_steps.ts:1',
  features: ['specs/features/reports/print_form.feature:9'],
},
```

**Issue**: The registry points to line 1 in both files, which is incorrect. The actual steps should be:
- Python: `test/python/steps/reports_steps.py` (new step needed)
- TypeScript: `test/typescript/steps/reports_steps.ts` (new step needed)

The step `Then I should see a printable form view` is NOT in the registry and needs to be added.

## Implementation notes

### Python implementation
1. **Add `@when` step** for `I open a printable form page`:
   - Should set up a mock print form response or call the legacy `PrintForm` handler
   - Based on the existing pattern in `reports_steps.py`, this should:
     - Get the reporting client
     - Set admin email in `extra_environ`
     - Call a print form endpoint (likely with test data)
     - Store response in context

2. **Add `@then` step** for `I should see a printable form view`:
   - Verify the response status is 200
   - Verify the response contains HTML content
   - Check for expected printable form elements (form structure, questions, etc.)

### TypeScript implementation
1. **Add `When` step** for `I open a printable form page`:
   - Mock the print form request
   - Set `world.printFormStatus = 200` and `world.printFormBody = '<div class="printable-form">...</div>'`

2. **Add `Then` step** for `I should see a printable form view`:
   - Assert status is 200
   - Verify HTML content exists
   - Check for printable form structure

### Step registry updates
1. Add entry for `I open a printable form page` with correct line numbers
2. Add entry for `Then I should see a printable form view` with correct line numbers
3. Both entries should reference `specs/features/reports/print_form.feature:9` and `:10`

### Testing considerations
- The legacy `PrintForm` handler requires Google App Engine dependencies (cloudstorage, users API)
- The test may need to mock GCS file reads and TTCPortalUser data retrieval
- Similar to other report steps, a minimal mock approach may be more practical than full integration testing
- The feature file is marked `@p3 @needs-verification`, indicating it's a lower priority item

### Related files
- `reporting/print_form.py` - Legacy print form handler (749 lines)
- `test/python/steps/admin_steps.py` - Admin authentication pattern
- `test/python/steps/reports_steps.py` - Other report step implementations
- `test/typescript/steps/reports_steps.ts` - TypeScript report steps (skeleton)
- `test/bdd/step-registry.ts` - Step definitions registry
- `specs/features/reports/print_form.feature` - Feature file with single scenario
