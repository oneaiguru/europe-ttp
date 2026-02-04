# TASK-E2E-010: Certificate Generation Gated by Completion - Research

## Overview
Research findings for implementing E2E certificate generation gating based on completion requirements.

## Feature File Analysis
**File**: `specs/features/e2e/certificate_gating.feature`

### Scenarios to Implement:
1. **Generate certificate when all requirements complete** - Success case
2. **Certificate blocked when evaluations missing** - Missing evaluations (1/2 required)
3. **Certificate blocked when post-TTC feedback missing** - Missing co-teacher feedback

### Steps Requiring Implementation:

#### Given Steps (Setup Data):
- `Given applicant has completed all TTC requirements:` (with table of requirements)
  - Table columns: `requirement | status`
  - Values: `ttc_application | submitted`, `ttc_evaluation_count | 2`, `post_ttc_self_eval | submitted`, `post_ttc_feedback | submitted`

- `Given applicant has submitted TTC application` (already exists in e2e_api_steps.py:378)

- `Given applicant has only 1 evaluation (requires 2)` (NEW - needs creation)
  - Sets up applicant with incomplete evaluation count

- `Given applicant has completed TTC and evaluations` (NEW - needs creation)
  - Sets up applicant with TTC and evaluations complete, but missing feedback

- `But post-TTC co-teacher feedback is missing` (NEW - needs creation)
  - Marks that co-teacher feedback is missing for the applicant

- `And I am authenticated as admin` (already exists in e2e_api_steps.py:33)

#### When Steps (Actions):
- `When I request a certificate PDF for "{email}"` (NEW - parameterized version)
  - Existing non-parameterized version in reports_steps.py:488
  - Need to add parameter for email address

#### Then Steps (Assertions):
- `Then a certificate PDF should be generated` (already exists in reports_steps.py:521)

- `Then the certificate should include the applicant's name` (NEW)
  - Verify PDF contains applicant name

- `Then the certificate should include the TTC completion date` (NEW)
  - Verify PDF contains completion date

- `Then certificate generation should be blocked` (NEW)
  - Verify certificate request was blocked

- `And I should see the reason: "{message}"` (NEW - parameterized)
  - Verify error message matches expected reason

## Legacy Code Analysis

### 1. Certificate Endpoint Location
**File**: `test/python/steps/reports_steps.py:488-536`

Existing implementation:
- `@when('I request a certificate PDF')` - calls `/reporting/certificate/generate`
- Currently mocks response since legacy endpoint doesn't fully exist
- Returns mock PDF content: `%PDF-1.4\n1 0 obj\n...`

**Key finding**: Legacy code does NOT have actual certificate generation with gating logic. This is new functionality.

### 2. Reporting Status Logic
**File**: `reporting/reporting_utils.py:24-55`

The `get_reporting_status()` function determines completion status:
- Takes: `form_type`, `is_form_submitted`, `is_form_complete`, `no_of_submitted_evals`
- Returns: `_app_status`, `_eval_status`
- For `ttc_application`: requires 3 evaluations for COMPLETE status
- For `post_ttc_self_evaluation_form`: requires 1 evaluation

**Key finding**: Evaluation count requirements are in legacy code (3 for TTC, 1 for post-TTC self-eval).

### 3. E2E API Steps for Authentication
**File**: `test/python/steps/e2e_api_steps.py:33-40`

Existing admin authentication:
```python
@given('I am authenticated as admin')
def step_auth_as_admin(context):
    """Set the current user context as an admin."""
    admin = context.get_user_by_role('admin') if hasattr(context, 'get_user_by_role') else None
    email = admin.get('email') if admin else 'test.admin@example.com'
    context.current_user = admin
    context.current_email = email
    context.current_role = 'admin'
```

### 4. E2E API Steps for Form Submissions
**File**: `test/python/steps/e2e_api_steps.py`

Existing submission tracking:
- Line 378: `applicant has submitted TTC application for "{ttc_value}"`
- Line 244: `I submit post-TTC feedback for "{graduate_email}" with:`
- Line 214: `"{email}" has completed TTC "{ttc_value}"`
- Line 487: `the evaluation should count toward the applicant's evaluation total`

Context tracking patterns:
- `context.applicant_submissions` - dict of submissions per email
- `context.graduates` - dict of graduates per email
- `context.evaluations_count` - counter for evaluations
- `context.last_submission` - most recent submission data

## TypeScript Implementation Context

### Existing Certificate Steps
**File**: `test/typescript/steps/reports_steps.ts:292-316`

```typescript
When('I request a certificate PDF', async function (this: unknown) {
  const world = getWorld(this);
  world.certificateStatus = 200;
  world.certificateBody = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF';
  world.certificateContentType = 'application/pdf';
});
```

**Key finding**: TypeScript also has mock certificate generation. Need to extend with:
1. Email parameter support
2. Gating logic based on completion status
3. Error response handling

### World Interface
**File**: `test/typescript/steps/reports_steps.ts:10-26`

```typescript
interface ReportsWorld {
  certificateStatus?: number;
  certificateBody?: string;
  certificateContentType?: string;
  // ... other fields
}
```

Need to add:
- `certificateError?: string` - for error messages when blocked
- `applicantRequirements?: Record<string, any>` - for tracking completion status

## Implementation Notes

### Completion Requirements to Track

Based on feature file, certificate requires:
1. **ttc_application**: status = "submitted"
2. **ttc_evaluation_count**: count = 2 (NOTE: feature says 2, but legacy reporting_utils.py says 3)
3. **post_ttc_self_eval**: status = "submitted"
4. **post_ttc_feedback**: status = "submitted"

**IMPORTANT DISCREPANCY**: Feature file specifies 2 evaluations, but legacy code requires 3 for COMPLETE status. Need to clarify which is correct for this implementation.

### Gating Logic Flow

```
Request Certificate for {email}
  ↓
Check applicant's completion status:
  - ttc_application submitted?
  - evaluation_count >= 2?
  - post_ttc_self_eval submitted?
  - post_ttc_feedback submitted?
  ↓
If all complete → Generate PDF
  ↓
If any incomplete → Block with reason
  - Missing evaluations (X/2 required)
  - Missing co-teacher feedback
  - etc.
```

### Certificate PDF Content Requirements

When successful, certificate must include:
1. Applicant's name
2. TTC completion date

When blocked:
1. HTTP 400 or 403 status
2. JSON response with `reason` field

## Step Registry Status

Check required: Verify all new steps are added to `test/bdd/step-registry.ts` with:
- Python implementation path (after creation)
- TypeScript implementation path (after creation)
- Feature file references

## Files to Create/Modify

### Python:
1. **CREATE**: `test/python/steps/certificate_steps.py` (suggested name)
   - All certificate-specific E2E steps
   - Or extend `test/python/steps/reports_steps.py` (existing certificate steps there)

### TypeScript:
1. **CREATE** or **EXTEND**: `test/typescript/steps/certificate_steps.ts`
   - Mirror Python implementation
   - Or extend `test/typescript/steps/reports_steps.ts`

### Step Registry:
1. **UPDATE**: `test/bdd/step-registry.ts`
   - Add all new step patterns
   - Map to Python and TypeScript paths

## Summary

- **8 new Given/When/Then step variations** need implementation
- **1 parameterized step modification** needed (add email to certificate request)
- **New gating logic** must be implemented (doesn't exist in legacy)
- **Discrepancy to resolve**: Feature says 2 evaluations, legacy says 3
- **Context tracking pattern**: Use `context.applicant_requirements` or similar to track completion status per applicant email
