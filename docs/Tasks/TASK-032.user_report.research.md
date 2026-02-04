# TASK-032: User Application Report - Research Findings

## Research Summary

This task involves implementing user application report functionality with three scenarios:
1. Get user application HTML
2. Get combined user application report
3. Get user application forms

## Python Implementation (Legacy)

### Location
**File:** `reporting/user_report.py`

### Key Classes and Functions

#### Class: `UserReport` (lines 33-489)
- **Purpose:** Handles user application report generation in multiple formats
- **Handler:** `webapp2.RequestHandler`

#### Key Method: `get_user_application(self, retrieval_type)` (lines 271-467)
- **Parameters:** `retrieval_type` - One of: `'html'`, `'forms'`, `'forms_combined'`
- **Purpose:** Generates user application reports in different formats

### Endpoints (lines 491-496)
1. `/reporting/user-report/get-user-application-html` → `retrieval_type='html'`
2. `/reporting/user-report/get-user-application` → `retrieval_type='forms'`
3. `/reporting/user-report/get-user-application-combined` → `retrieval_type='forms_combined'`

### Authorization (lines 472-480)
- Checks if user email is in `constants.LIST_OF_ADMINS`
- Returns "UN-AUTHORIZED" if not admin

### Key Logic

#### HTML Report (`retrieval_type='html'`)
- Retrieves form data for a single user/form combination
- Uses query parameters: `email`, `form_type`, `form_instance`
- Generates HTML using template `reporting_tab.html`
- Returns: HTML string with form data rendered

#### Forms Report (`retrieval_type='forms'`)
- Similar to HTML but uses template `reporting_form.html`
- Returns structured form data

#### Combined Report (`retrieval_type='forms_combined'`)
- Accepts JSON array of forms via query parameter `forms`
- Processes multiple forms for a single user
- Each form in array: `{email, form_type, form_instance}`
- Uses template `reporting_combined.html`
- Returns: Combined HTML for multiple forms

### Helper Methods

#### `get_html_for_question(self, question, value_dict)` (lines 50-268)
- Generates HTML for different question types:
  - `question`, `general` - Simple text display
  - `header` - Section headers with HR
  - `text`, `select`, `radio` - Single value display
  - `checkbox_group` - Multiple selections
  - `textarea` - Multi-line text
  - `repeater` - Repeatable question groups
  - `image` - Image display (placeholder)

#### Key Dependencies
- `ttc_portal_user.TTCPortalUser` - User data access
- `constants.FORM_CONFIG_LOCATION` - Form JSON configs location
- `reporting_utils.get_reporting_status()` - Status calculation
- `cloudstorage` (gcs) - Reading form configurations
- Jinja2 templates - HTML rendering

### Response Structure
All endpoints return HTML via `self.response.write(final_html)`

---

## TypeScript Implementation Context

### Existing Structure
- **Framework:** Next.js 14 with App Router
- **Pattern:** Server components for rendering, API routes for data
- **Location:** `app/` directory structure

### Relevant Files
- `app/admin/reports_list/render.ts` - Admin reports list (already exists)
- `test/typescript/steps/reports_steps.ts` - Step definitions (needs implementation)

### Current State
1. **Step Registry:** Has placeholder entries (line 1) for all 6 steps
2. **TypeScript Steps:** File exists but no implementations for user report steps
3. **Python Steps:** File exists but no implementations for user report steps

### Implementation Location (TO BE CREATED)
Based on existing patterns, create:
- `app/api/reporting/user-report/route.ts` - API endpoint for data retrieval
- `app/admin/user_report/[type]/page.tsx` - Report pages (optional, for UI)
- Or use server components similar to existing forms

### API Design Considerations
The implementation should follow Next.js 14 patterns:
- API route: `GET /api/reporting/user-report`
- Query params: `type=html|forms|combined`, `email`, `form_type`, `form_instance`, `forms`
- Response: HTML or JSON based on type

---

## Step Registry Status

### Current Entries (test/bdd/step-registry.ts)

All 6 steps have placeholder entries pointing to line 1:

| Step Text | Line | Status |
|-----------|------|--------|
| `I request the user application report as HTML` | 242-247 | Placeholder |
| `I should receive the user application HTML` | 344-349 | Placeholder |
| `I request the combined user application report` | 224-229 | Placeholder |
| `I should receive the combined user application data` | 326-331 | Placeholder |
| `I request the user application report as forms` | 248-253 | Placeholder |
| `I should receive the user application form data` | 350-355 | Placeholder |

### Registry Update Needed
After implementation, update:
- `python: 'test/python/steps/reports_steps.py:<line>'`
- `typescript: 'test/typescript/steps/reports_steps.ts:<line>'`

---

## Implementation Notes

### Python Step Implementation
Create steps in `test/python/steps/reports_steps.py`:

1. **WHEN `I request the user application report as HTML`**
   - Call `/reporting/user-report/get-user-application-html`
   - Store response in context

2. **THEN `I should receive the user application HTML`**
   - Assert status == 200
   - Assert response contains HTML content

3. **WHEN `I request the combined user application report`**
   - Call `/reporting/user-report/get-user-application-combined`
   - Pass forms array as JSON

4. **THEN `I should receive the combined user application data`**
   - Assert status == 200
   - Assert response contains combined data

5. **WHEN `I request the user application report as forms`**
   - Call `/reporting/user-report/get-user-application`

6. **THEN `I should receive the user application form data`**
   - Assert status == 200
   - Assert response contains form data

### TypeScript Step Implementation
Create steps in `test/typescript/steps/reports_steps.ts`:
- Follow same pattern as existing report steps (user_summary, user_integrity)
- For now, can use mock responses since real implementation requires App Engine dependencies
- Match Python step behavior exactly

### Test Data Requirements
- Need test user with email
- Need submitted form data (TTC application or similar)
- Need form configuration JSON files

---

## Key Challenges

1. **App Engine Dependencies:** Legacy code relies on Google App Engine services (users, cloudstorage, blobstore, images)
2. **Jinja2 Templates:** Legacy uses Jinja2 templates for HTML rendering
3. **Form Config Storage:** Legacy stores form configs in Google Cloud Storage
4. **Authentication:** Legacy uses Google App Engine users API for admin auth

---

## Recommendations

### For Python Step Implementation
- Use existing `_get_reporting_client()` helper pattern
- Mock App Engine dependencies if testing environment doesn't support them
- Follow same assertion patterns as `user_summary` and `user_integrity` steps

### For TypeScript Implementation
- Start with mock implementations matching Python behavior
- Focus on step structure and assertions
- Defer actual API implementation to future task
- Follow Next.js 14 App Router patterns when implementing real endpoints

### Implementation Order
1. Implement Python steps first (must pass before TypeScript)
2. Implement TypeScript steps with mocks
3. Update step registry with correct line numbers
4. Verify both implementations pass BDD tests
