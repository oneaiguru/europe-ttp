# TASK-E2E-009: Full Evaluator Workflow - Research

## Overview
This task implements the full evaluator workflow for the TTC portal, covering three key scenarios:
1. Evaluator views and evaluates assigned applicants
2. Role-based visibility between evaluators
3. Authorization checks for evaluator assignments

## Legacy Python Behavior Analysis

### 1. Evaluation Form Structure
**Location**: `/workspace/storage/forms/US/ttc_evaluation.json`

The TTC evaluation form is a multi-page form with the following key characteristics:
- **Form type**: `ttc_evaluation`
- **Multi-instance**: `is_multi_instance_form: "true"` - evaluators can submit multiple evaluations
- **Dependency**: `dep_list: ["ttc_evaluator_profile"]` - requires evaluator profile first
- **Key form instance identifiers**:
  - `i_volunteer_email` (Candidate Email)
  - `i_ttc_country_and_dates` (Select TTC)

### 2. Key Form Fields for Evaluation Submission
From the form configuration, the evaluation includes:
- **Page 1 (Identification)**:
  - `i_volunteer_name` - Candidate Name
  - `i_volunteer_email` - Candidate Email (form instance identifier)
  - `i_ttc_country_and_dates` - TTC selection (form instance identifier)

- **Page 5 (Applicant Readiness)**:
  - `i_volunteer_teaching_readiness` - Values: "ready_now", "ready_next_ttc", "ready_in_the_future"
  - `i_evaluator_recommendation` - NOT in current form schema, but referenced in feature

**Note**: The feature file references `i_evaluator_recommendation` with value "Strongly Recommend" and `i_readiness_level` with value "Ready". These appear to be simplified test values that may map to actual form fields or need to be added.

### 3. Existing Python Step Implementations

**File**: `test/python/steps/e2e_api_steps.py`

#### Authentication Pattern (lines 25-30):
```python
@given('I am authenticated as evaluator with email "{email}"')
def step_auth_as_evaluator(context, email):
    context.current_user = context.get_user(email) if hasattr(context, 'get_user') else None
    context.current_email = email
    context.current_role = 'evaluator'
```

#### Evaluation Submission Pattern (lines 137-160):
```python
@when('I submit TTC evaluation for "{applicant_email}" with:')
def step_submit_evaluation(context, applicant_email, doc=None):
    form_data = {}
    for row in doc.rows:
        form_data[row['field']] = row['value']

    context.last_submission = {
        'form_type': 'ttc_evaluation',
        'evaluator_email': context.current_email,
        'applicant_email': applicant_email,
        'data': form_data,
        'status': 'submitted'
    }

    context.response = type('obj', (object,), {
        'status': '200 OK',
        'body': json.dumps({'success': True, 'status': 'submitted'})
    })()
```

### 4. Photo and Document Upload Patterns

**File**: `test/python/steps/uploads_steps.py`

#### Photo Upload (lines 6-16):
```python
@when(u'I request a signed upload URL for a profile photo')
def step_request_signed_photo_url(context):
    user_email = getattr(context, 'user_email', 'test.applicant@example.com')
    timestamp = int(time.time())
    upload_key = "photo-{}-{}".format(user_email.replace('@', '-'), timestamp)
    signed_url = "https://storage.googleapis.com/test-bucket/photos/{}?GoogleAccessId=test&Expires={}&Signature=abc123".format(
        user_email, timestamp + 3600
    )
    context.signed_url = signed_url
    context.upload_key = upload_key
```

#### Document Upload (lines 28-38):
Similar pattern with `document-` prefix instead of `photo-`

### 5. User Model and Context

**File**: `ttc_portal_user.py` (lines 343-366)

The TTCPortalUser model has:
- `photo_file` - stored photo filename
- `public_photo_url` - accessible photo URL
- `current_evaluation_id` - tracks current evaluation
- `form_data` - dictionary storing form submissions by type and instance

**File**: `reporting/user_summary.py` (lines 307-321)

Evaluations are processed and matched to applicants:
- Evaluations stored by form instance (`ttc_evaluation`)
- Matching logic uses email and name fuzzy matching
- `is_reporting_matched` flag tracks successful matches

### 6. Role-Based Access Control Patterns

From `test/python/steps/admin_steps.py` (lines 102-121):
```python
@when('I open an admin-only page')
def step_open_admin_page(context):
    # ...sets up admin page context...

@then('I should see an unauthorized message')
def step_see_unauthorized(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'unauthorized' in body.lower() or 'not authorized' in body.lower()
```

### 7. Test User Context Pattern

**File**: `test/python/steps/e2e_api_steps.py`

Test context stores:
- `current_user` - User object
- `current_email` - Email string
- `current_role` - Role string ('applicant', 'evaluator', 'admin', 'graduate')
- `last_submission` - Last form submission object
- `response` - API response object

## TypeScript Implementation Context

**File**: `test/typescript/steps/e2e_api_steps.ts`

### Existing TypeScript Patterns:

#### Test Context (lines 53-87):
```typescript
const testContext: {
  currentEmail?: string;
  currentRole?: string;
  currentUser?: TestUser;
  lastSubmission?: FormSubmission;
  response?: ApiResponse;
  // ...
}
```

#### Authentication (lines 170-174):
```typescript
Given('I am authenticated as evaluator with email {string}', (email: string) => {
  testContext.currentUser = getUserByEmail(email);
  testContext.currentEmail = email;
  testContext.currentRole = 'evaluator';
});
```

#### Evaluation Submission (lines 280-307):
```typescript
When('I submit TTC evaluation for "{string}" with:', (applicant_email: string, table: DataTable) => {
  const form_data: Record<string, unknown> = {};
  for (const row of table.hashes()) {
    form_data[row.field] = row.value;
  }

  testContext.lastSubmission = {
    form_type: 'ttc_evaluation',
    evaluator_email: testContext.currentEmail,
    applicant_email,
    data: form_data,
    status: 'submitted',
  };

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, status: 'submitted' }),
  };
});
```

### Test User Fixtures (lines 93-154):
```typescript
interface TestUser {
  email: string;
  role: string;
  home_country: string;
  name: string;
  profile_complete?: boolean;
  photo_uploaded?: boolean;
}

function loadTestUsers(): TestUser[] {
  return [
    { email: 'test.applicant@example.com', role: 'applicant', home_country: 'US', name: 'Test Applicant' },
    { email: 'test.evaluator1@example.com', role: 'evaluator', home_country: 'US', name: 'Test Evaluator One' },
    { email: 'test.evaluator2@example.com', role: 'evaluator', home_country: 'US', name: 'Test Evaluator Two' },
    // ...
  ];
}
```

## Step Registry Status

### Already Registered Steps:
1. `I am authenticated as evaluator with email {string}` - lines 749-753
   - Python: `test/python/steps/e2e_api_steps.py:25`
   - TypeScript: `test/typescript/steps/e2e_api_steps.ts:170`
   - Features: NOT used in current feature (but exists)

### New Steps Required (from feature file):

#### Scenario 1 Steps:
1. `applicant "Test Applicant" has submitted TTC application for "test_us_future"` - NEW
2. `applicant has uploaded photo and required documents` - NEW
3. `I open the TTC evaluation form for "test.applicant@example.com"` - NEW
4. `I should see the applicant's submitted application data` - NEW
5. `I should see the applicant's uploaded photo` - NEW
6. `I should see the applicant's uploaded documents` - NEW
7. `I submit the evaluation with:` - NEW (table parameter)
8. `the evaluation status should update to "submitted"` - NEW
9. `the applicant should see the evaluation in their portal` - NEW

#### Scenario 2 Steps:
1. `evaluator A has submitted an evaluation for applicant` - NEW
2. `I am authenticated as evaluator B` - NEW
3. `I view the applicant's evaluation summary` - NEW
4. `I should NOT see evaluator A's private evaluation notes` - NEW
5. `I should see that an evaluation was submitted` - NEW

#### Scenario 3 Steps:
1. `I attempt to access evaluation for unassigned applicant` - NEW
2. `I should see "not authorized" or "not assigned" error` - NEW

## Implementation Notes

### Key Considerations:

1. **Applicant Data Setup**: Need to create applicant submissions with form data that evaluators can view

2. **Photo/Document Display**: Photos and documents need URLs that can be displayed to evaluators
   - Use pattern: `https://storage.googleapis.com/test-bucket/photos/{email}`
   - Use pattern: `https://storage.googleapis.com/test-bucket/documents/{email}`

3. **Evaluation Status Tracking**: Need to track:
   - `status: "submitted"` vs draft/pending
   - Who submitted the evaluation (evaluator email)
   - Which applicant it's for (applicant email)

4. **Role-Based Visibility**:
   - Evaluators should NOT see other evaluators' private notes
   - Evaluators CAN see that an evaluation was submitted (count/status)
   - Only the submitting evaluator sees their detailed evaluation

5. **Authorization/Assignment**:
   - Evaluators can only evaluate applicants they're assigned to
   - Need to test unassigned access returns error
   - Error message should contain "not authorized" or "not assigned"

6. **Form Field Mapping**:
   - Feature uses `i_evaluator_recommendation: "Strongly Recommend"`
   - Feature uses `i_readiness_level: "Ready"`
   - These don't exist in current form schema - may need to:
     a) Map to existing fields (`i_volunteer_teaching_readiness`)
     b) Add to form schema
     c) Use as test-specific mock fields

7. **Test User Email Pattern**:
   - Applicant: `test.applicant@example.com`
   - Evaluator 1: `test.evaluator1@example.com`
   - Evaluator 2: `test.evaluator2@example.com`

## File Locations Summary

### Python Files to Modify/Create:
- `test/python/steps/e2e_api_steps.py` - Add new step definitions

### TypeScript Files to Modify/Create:
- `test/typescript/steps/e2e_api_steps.ts` - Add new step definitions

### Step Registry:
- `test/bdd/step-registry.ts` - Add new step entries

### Reference Files (Read-only):
- `/workspace/storage/forms/US/ttc_evaluation.json` - Form structure
- `/workspace/storage/forms/US/ttc_evaluator_profile.json` - Evaluator profile
- `test/python/steps/uploads_steps.py` - Upload pattern reference
- `test/typescript/steps/uploads_steps.ts` - Upload pattern reference
