# TASK-E2E-011: Research Document

## Research Findings for Reporting Integrity Checks

### Feature File Location
`specs/features/e2e/reporting_integrity_checks.feature`

### Step Registry Status
All steps in this feature file are **NOT** currently in `test/bdd/step-registry.ts`. The following new steps need to be added:

1. `applicant has submitted TTC application` (variant without course parameter)
2. `applicant has NOT uploaded required photo`
3. `"{string}" should be flagged for missing photo`
4. `the integrity report should show the missing upload type`
5. `applicant has started TTC application but not submitted`
6. `"{string}" should be flagged for incomplete application`
7. `the report should show the application status as "incomplete"`
8. `evaluation was submitted with email "{string}"`
9. `applicant exists with email "{string}"`
10. `the evaluation should be flagged as unmatched`
11. `the report should show the mismatched email`
12. `I download the integrity report as CSV`
13. `the CSV should contain columns: email, flags, missing_uploads, incomplete_forms, mismatches`
14. `the CSV should be downloadable via admin dashboard`

### Existing Step (Already in Registry)
- `I run the user integrity report` - This step exists in the step registry (line 591-596) from `specs/features/e2e/post_ttc_coteaching_cycle.feature:40`. It maps to:
  - Python: `test/python/steps/e2e_api_steps.py:1` (TODO - not implemented)
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:1` (TODO - not implemented)

---

## Legacy Python Implementation Analysis

### Main Handler
**File**: `reporting/user_integrity.py`

**Class**: `Integrity` (webapp2.RequestHandler)

**Key Routes**:
- `/integrity/user-integrity/get-by-user` - Retrieves integrity data by user
- `/integrity/user-integrity/load` - Loads/integrity report generation job
- `/jobs/integrity/user-integrity/load` - Same as above (cron job endpoint)
- `/jobs/integrity/user-integrity/postload` - Post-processing job (generates enrolled list CSV)

**Line Numbers**: 34-412

### Key Behavior for Integrity Checks

1. **Missing Uploads Detection** (lines 80-223):
   - The `load_user_integrity()` method processes user config files from GCS
   - It checks `form_data['ttc_application']` entries
   - For each application, it stores fields including photo upload status
   - The integrity report structure includes `integrity` key with:
     - `enrolled_matches` - matching applicants based on enrolled people
     - `org_course_matches` - matching applicants based on organized courses
   - **Note**: Photo upload status is tracked in form data but the flagging logic for missing photos needs to be implemented

2. **Incomplete Forms Detection** (lines 165-170):
   - Uses `reporting_utils.get_reporting_status()` to determine application status
   - Checks `is_form_submitted` and `is_form_complete` flags
   - Returns `app_status` and `eval_status`
   - **Incomplete applications** are those where `is_form_submitted == False`

3. **Mismatched User IDs/Evaluations** (lines 225-337):
   - The integrity report logic compares applications across different users
   - It matches based on:
     - `i_enrolled_people` - enrolled email/name matches
     - `i_org_courses` - organized course matches (by dates, city, state, teacher name)
   - Results stored in `integrity.enrolled_matches` and `integrity.org_course_matches`
   - **For evaluations**: The code doesn't explicitly flag evaluation mismatches, but the enrolled people matching logic (lines 260-283) handles finding users who enrolled someone else who also applied

4. **CSV Generation** (lines 359-400):
   - `post_load_user_integrity()` generates enrolled list CSV
   - CSV format: "Applicant Name,Applicant Email,Enrolled Name,Enrolled Email"
   - Stored in `constants.APPLICANT_ENROLLED_LIST` GCS file
   - **Note**: A new CSV format for integrity checks with columns `email,flags,missing_uploads,incomplete_forms,mismatches` is NOT currently implemented in legacy code - this is NEW functionality

---

## Existing Test Step Patterns

### Python E2E API Steps
**File**: `test/python/steps/e2e_api_steps.py`

**Pattern for given steps** (lines 17-49):
```python
@given('I am authenticated as applicant with email "{email}"')
def step_auth_as_applicant(context, email):
    context.current_user = context.get_user(email) if hasattr(context, 'get_user') else None
    context.current_email = email
    context.current_role = 'applicant'
```

**Pattern for submission steps** (lines 93-116):
```python
@given('I submit TTC application for "{ttc}" with:')
def step_submit_ttc_application(context, ttc):
    # Parse table data
    # Store submission in context
    context.last_submission = {...}
```

### TypeScript E2E API Steps
**File**: `test/typescript/steps/e2e_api_steps.ts`

**Test Context** (lines 50-143):
```typescript
const testContext: TestContext = {
  users: new Map<string, TestUser>(),
  submissions: [],
  evaluations: [],
  whitelist: [],
  // ... other fields
};
```

**Pattern for given steps** (lines 145-175):
```typescript
Given('I am authenticated as applicant with email {string}', (email: string) => {
  testContext.currentEmail = email;
  testContext.currentRole = 'applicant';
  // ... set user context
});
```

---

## Existing User Integrity Report Steps

### Python Steps
**File**: `test/python/steps/reports_steps.py`

**Key steps** (lines 120-199):
```python
@when('I run the user integrity report load job')
def step_run_user_integrity_load_job(context):
    # Calls /integrity/user-integrity/load
    response = client.get('/integrity/user-integrity/load')
    context.integrity_load_response = response
    # ...

@then('a user integrity file should be generated')
def step_user_integrity_file_generated(context):
    # Verifies load job succeeded
    # Retrieves data via /integrity/user-integrity/get-by-user
    # ...
```

### TypeScript Steps
**File**: `test/typescript/steps/reports_steps.ts`

**Key steps** (lines 77-137):
```typescript
When('I run the user integrity report load job', async function (this: unknown) {
  const world = getWorld(this);
  world.integrityLoadStatus = 200;
  // Mock implementation
});

Then('a user integrity file should be generated', async function (this: unknown) {
  const world = getWorld(this);
  assert.strictEqual(world.integrityLoadStatus, 200);
  // Verify structure
});
```

---

## Implementation Notes

### For `I run the user integrity report` (E2E variant)
This step needs to be added as a simplified version that combines load + get operations for E2E scenarios. Unlike the unit test version in `reports_steps.py` which separates load and get, this E2E version should:
1. Execute the integrity report generation
2. Store the results in context for subsequent assertions
3. Return a structure that includes flags for missing photos, incomplete forms, and mismatches

### For Missing Photo Detection
- Need to check if `photo_url` or similar field is missing/empty in form data
- The legacy code references photo URL but doesn't explicitly flag it
- Implementation should add a `missing_photo` flag to the integrity data structure

### For Incomplete Application Detection
- Use `is_form_submitted` flag from form instance data
- When `is_form_submitted == False`, flag as incomplete

### For Mismatched User/Evaluation Detection
- Check if `integrity.enrolled_matches` or `integrity.org_course_matches` contains entries
- For evaluation mismatches specifically: compare evaluation submission email with applicant email
- Flag as `mismatched` when emails don't match but names do (fuzzy matching)

### For CSV Download
- The legacy code generates a CSV but in a different format
- Need to create a NEW CSV format with columns: `email, flags, missing_uploads, incomplete_forms, mismatches`
- This requires NEW implementation (not in legacy)

---

## Data Structures to Work With

### Integrity Data Structure (from legacy)
```python
_user_data_by_email = {
    'user@example.com': {
        'ttc_application': {
            'integrity': {
                'enrolled_matches': {
                    'other@example.com': set(['Name <email>'])
                },
                'org_course_matches': {
                    'other@example.com': set(['Date - Date (City, State - Teacher)'])
                }
            }
        }
    }
}
```

### Form Instance Structure
```python
{
    'form_instance': 'instance_id',
    'is_form_submitted': True/False,
    'is_form_complete': True/False,
    'data': {
        'i_fname': 'First',
        'i_lname': 'Last',
        'i_enrolled_people': [...],
        'i_org_courses': [...]
    }
}
```

---

## Next Steps for Planning Phase

1. Create E2E step definitions that:
   - Set up test data (submitted application, missing photo, incomplete form, mismatched evaluation)
   - Run integrity report generation
   - Assert on the report results

2. Implement Python steps that:
   - Use existing `/integrity/user-integrity/load` and `/integrity/user-integrity/get-by-user` endpoints
   - Parse the returned JSON structure
   - Extract and verify flags

3. Implement TypeScript steps that:
   - Mock the same behavior for E2E testing
   - Use test context to store and retrieve integrity data

4. Add NEW CSV download functionality:
   - Create endpoint `/integrity/user-integrity/csv` (or similar)
   - Generate CSV with specified columns
   - Implement download link in admin dashboard
