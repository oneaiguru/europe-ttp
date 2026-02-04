# TASK-E2E-010: Certificate Generation Gated by Completion - Implementation Plan

## Overview
This plan outlines the implementation of E2E certificate generation gating based on completion requirements for TTC applicants.

## Requirements Summary
- Certificate generation must verify all prerequisites are complete
- Block generation with specific reason messages when prerequisites are missing
- Include applicant name and completion date on successful certificates

---

## Step 1: Update Step Registry (FIRST)

### New Steps to Add to `test/bdd/step-registry.ts`

1. **`applicant has completed all TTC requirements:`** (Given with table)
   - Pattern: `/^applicant has completed all TTC requirements:$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:7`

2. **`applicant has only 1 evaluation (requires 2)`** (Given)
   - Pattern: `/^applicant has only 1 evaluation \(requires 2\)$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:21`

3. **`applicant has completed TTC and evaluations`** (Given)
   - Pattern: `/^applicant has completed TTC and evaluations$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:28`

4. **`post-TTC co-teacher feedback is missing`** (But/Given)
   - Pattern: `/^post\-TTC co\-teacher feedback is missing$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:29`

5. **`I request a certificate PDF for "{email}"`** (When - parameterized)
   - Pattern: `/^I request a certificate PDF for "([^"]*)"$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:14,23,30`

6. **`the certificate should include the applicant's name`** (Then)
   - Pattern: `/^the certificate should include the applicant's name$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:16`

7. **`the certificate should include the TTC completion date`** (Then)
   - Pattern: `/^the certificate should include the TTC completion date$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:17`

8. **`certificate generation should be blocked`** (Then)
   - Pattern: `/^certificate generation should be blocked$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:24,31`

9. **`I should see the reason: "{message}"`** (Then - parameterized)
   - Pattern: `/^I should see the reason: "([^"]*)"$/`
   - Python: `test/python/steps/certificate_steps.py:XX`
   - TypeScript: `test/typescript/steps/certificate_steps.ts:XX`
   - Features: `specs/features/e2e/certificate_gating.feature:25,32`

---

## Step 2: Python Implementation

### Create `test/python/steps/certificate_steps.py`

```python
# -*- coding: utf-8 -*-
"""
Certificate generation step definitions with completion gating.
"""
from __future__ import absolute_import
import json
from datetime import datetime
from behave import given, when, then


# ============================================================================
# COMPLETION STATUS TRACKING
# ============================================================================

def _get_applicant_requirements(context, email=None):
    """Get or create requirements tracking for an applicant."""
    if not hasattr(context, 'applicant_requirements'):
        context.applicant_requirements = {}

    applicant_email = email or getattr(context, 'current_email', 'test.applicant@example.com')

    if applicant_email not in context.applicant_requirements:
        # Default incomplete state
        context.applicant_requirements[applicant_email] = {
            'ttc_application': 'not_submitted',
            'ttc_evaluation_count': 0,
            'post_ttc_self_eval': 'not_submitted',
            'post_ttc_feedback': 'not_submitted',
            'name': 'Test Applicant',
            'completion_date': None,
        }

    return context.applicant_requirements[applicant_email]


def _check_completion_status(requirements):
    """
    Check if all requirements are met for certificate generation.

    Returns: (is_complete, blocking_reason)
    """
    eval_count = requirements.get('ttc_evaluation_count', 0)

    if requirements.get('ttc_application') != 'submitted':
        return False, 'Missing TTC application submission'

    if eval_count < 2:
        return False, 'Missing evaluations ({}/2 required)'.format(eval_count)

    if requirements.get('post_ttc_self_eval') != 'submitted':
        return False, 'Missing post-TTC self-evaluation'

    if requirements.get('post_ttc_feedback') != 'submitted':
        return False, 'Missing co-teacher feedback'

    return True, None


# ============================================================================
# GIVEN STEPS - Setup Completion Status
# ============================================================================

@given('applicant has completed all TTC requirements:')
def step_applicant_completed_all(context):
    """
    Set up an applicant with all requirements complete.
    Table columns: requirement | status
    """
    context.current_email = 'test.applicant@example.com'
    reqs = _get_applicant_requirements(context)

    # Process the table data
    for row in context.table:
        requirement = row['requirement']
        status = row['status']

        if requirement == 'ttc_application':
            reqs['ttc_application'] = status
        elif requirement == 'ttc_evaluation_count':
            reqs['ttc_evaluation_count'] = int(status)
        elif requirement == 'post_ttc_self_eval':
            reqs['post_ttc_self_eval'] = status
        elif requirement == 'post_ttc_feedback':
            reqs['post_ttc_feedback'] = status

    # Set completion date if all requirements met
    is_complete, _ = _check_completion_status(reqs)
    if is_complete:
        reqs['completion_date'] = datetime.utcnow().strftime('%Y-%m-%d')


@given('applicant has only 1 evaluation (requires 2)')
def step_applicant_one_evaluation(context):
    """Set up applicant with only 1 evaluation (below requirement)."""
    context.current_email = 'test.applicant@example.com'
    reqs = _get_applicant_requirements(context)

    reqs['ttc_application'] = 'submitted'
    reqs['ttc_evaluation_count'] = 1  # Below required 2
    reqs['post_ttc_self_eval'] = 'submitted'
    reqs['post_ttc_feedback'] = 'submitted'


@given('applicant has completed TTC and evaluations')
def step_applicant_completed_ttc_and_evals(context):
    """Set up applicant with TTC and evaluations complete, but missing feedback."""
    context.current_email = 'test.applicant@example.com'
    reqs = _get_applicant_requirements(context)

    reqs['ttc_application'] = 'submitted'
    reqs['ttc_evaluation_count'] = 2  # Meets requirement
    reqs['post_ttc_self_eval'] = 'submitted'
    # post_ttc_feedback left as 'not_submitted' - will be set by next step


@given('post-TTC co-teacher feedback is missing')
def step_feedback_missing(context):
    """Mark that co-teacher feedback is missing for the current applicant."""
    reqs = _get_applicant_requirements(context)
    reqs['post_ttc_feedback'] = 'not_submitted'


# ============================================================================
# WHEN STEPS - Certificate Request
# ============================================================================

@when('I request a certificate PDF for "{email}"')
def step_request_certificate_for_email(context, email):
    """
    Request a certificate PDF for a specific applicant email.
    Implements gating logic based on completion status.
    """
    context.certificate_request_email = email

    # Get applicant requirements
    reqs = _get_applicant_requirements(context, email)

    # Check completion status
    is_complete, blocking_reason = _check_completion_status(reqs)

    if is_complete:
        # Generate mock certificate PDF
        context.certificate_status = 200
        context.certificate_error = None

        # Include applicant data in PDF
        applicant_name = reqs.get('name', 'Test Applicant')
        completion_date = reqs.get('completion_date', datetime.utcnow().strftime('%Y-%m-%d'))

        # Mock PDF content with applicant data
        pdf_content = '''%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length {length}
>>
stream
BT
/F1 12 Tf
50 700 Td
(Certificate of Completion) Tj
0 -20 Td
(This certifies that {name}) Tj
0 -20 Td
(has completed TTC on {date}) Tj
ET
endstream
endobj
endobj
%%EOF'''.format(name=applicant_name, date=completion_date)

        context.certificate_body = pdf_content
        context.certificate_applicant_name = applicant_name
        context.certificate_completion_date = completion_date
    else:
        # Block with error
        context.certificate_status = 400
        context.certificate_error = blocking_reason
        context.certificate_body = None


# ============================================================================
# THEN STEPS - Assertions
# ============================================================================

@then('the certificate should include the applicant\'s name')
def step_certificate_includes_name(context):
    """Verify the certificate includes the applicant's name."""
    assert hasattr(context, 'certificate_applicant_name'), \
        'Certificate not generated or applicant name not set'
    assert context.certificate_applicant_name, 'Applicant name should not be empty'

    # Verify name is in the PDF content
    if hasattr(context, 'certificate_body') and context.certificate_body:
        assert context.certificate_applicant_name in context.certificate_body, \
            'Applicant name should be in certificate PDF content'


@then('the certificate should include the TTC completion date')
def step_certificate_includes_date(context):
    """Verify the certificate includes the TTC completion date."""
    assert hasattr(context, 'certificate_completion_date'), \
        'Certificate not generated or completion date not set'
    assert context.certificate_completion_date, 'Completion date should not be empty'

    # Verify date is in the PDF content
    if hasattr(context, 'certificate_body') and context.certificate_body:
        assert context.certificate_completion_date in context.certificate_body, \
            'Completion date should be in certificate PDF content'


@then('certificate generation should be blocked')
def step_certificate_blocked(context):
    """Verify certificate generation was blocked."""
    assert hasattr(context, 'certificate_status'), \
        'Certificate request was not executed'

    # Should have non-200 status
    assert context.certificate_status != 200, \
        'Certificate generation should be blocked but returned status 200'

    # Should have an error reason
    assert hasattr(context, 'certificate_error'), \
        'Blocking reason should be set'
    assert context.certificate_error is not None, \
        'Blocking reason should not be None'


@then('I should see the reason: "{message}"')
def step_should_see_reason(context, message):
    """Verify the blocking reason matches the expected message."""
    assert hasattr(context, 'certificate_error'), \
        'No error message was set'

    assert context.certificate_error == message, \
        'Expected error "{}" but got "{}"'.format(message, context.certificate_error)
```

---

## Step 3: TypeScript Implementation

### Create `test/typescript/steps/certificate_steps.ts`

```typescript
/**
 * Certificate generation step definitions with completion gating.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApplicantRequirements {
  ttc_application: string;
  ttc_evaluation_count: number;
  post_ttc_self_eval: string;
  post_ttc_feedback: string;
  name: string;
  completion_date?: string;
}

interface CertificateWorld {
  // Certificate request state
  certificateRequestEmail?: string;
  certificateStatus?: number;
  certificateError?: string;
  certificateBody?: string;
  certificateAppName?: string;
  certificateAppDate?: string;

  // Applicant requirements tracking
  applicantRequirements: Record<string, ApplicantRequirements>;
}

// Extend test context
const certWorld: CertificateWorld = {
  applicantRequirements: {},
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getApplicantRequirements(email?: string): ApplicantRequirements {
  const applicantEmail = email || testContext.currentEmail || 'test.applicant@example.com';

  if (!certWorld.applicantRequirements[applicantEmail]) {
    // Default incomplete state
    certWorld.applicantRequirements[applicantEmail] = {
      ttc_application: 'not_submitted',
      ttc_evaluation_count: 0,
      post_ttc_self_eval: 'not_submitted',
      post_ttc_feedback: 'not_submitted',
      name: 'Test Applicant',
      completion_date: undefined,
    };
  }

  return certWorld.applicantRequirements[applicantEmail];
}

function checkCompletionStatus(
  reqs: ApplicantRequirements
): { isComplete: boolean; blockingReason: string | null } {
  const evalCount = reqs.ttc_evaluation_count;

  if (reqs.ttc_application !== 'submitted') {
    return { isComplete: false, blockingReason: 'Missing TTC application submission' };
  }

  if (evalCount < 2) {
    return {
      isComplete: false,
      blockingReason: `Missing evaluations (${evalCount}/2 required)`,
    };
  }

  if (reqs.post_ttc_self_eval !== 'submitted') {
    return { isComplete: false, blockingReason: 'Missing post-TTC self-evaluation' };
  }

  if (reqs.post_ttc_feedback !== 'submitted') {
    return { isComplete: false, blockingReason: 'Missing co-teacher feedback' };
  }

  return { isComplete: true, blockingReason: null };
}

// ============================================================================
// GIVEN STEPS - Setup Completion Status
// ============================================================================

Given(
  'applicant has completed all TTC requirements:',
  function (this: unknown) {
    const table = this as DataTable;
    testContext.currentEmail = 'test.applicant@example.com';
    const reqs = getApplicantRequirements();

    // Process the table data
    table.hashes().forEach((row) => {
      const requirement = row.requirement as string;
      const status = row.status as string;

      switch (requirement) {
        case 'ttc_application':
          reqs.ttc_application = status;
          break;
        case 'ttc_evaluation_count':
          reqs.ttc_evaluation_count = parseInt(status, 10);
          break;
        case 'post_ttc_self_eval':
          reqs.post_ttc_self_eval = status;
          break;
        case 'post_ttc_feedback':
          reqs.post_ttc_feedback = status;
          break;
      }
    });

    // Set completion date if all requirements met
    const { isComplete } = checkCompletionStatus(reqs);
    if (isComplete) {
      const completionDate = new Date().toISOString().split('T')[0];
      reqs.completion_date = completionDate;
    }
  }
);

Given(
  'applicant has only 1 evaluation (requires 2)',
  function () {
    testContext.currentEmail = 'test.applicant@example.com';
    const reqs = getApplicantRequirements();

    reqs.ttc_application = 'submitted';
    reqs.ttc_evaluation_count = 1; // Below required 2
    reqs.post_ttc_self_eval = 'submitted';
    reqs.post_ttc_feedback = 'submitted';
  }
);

Given(
  'applicant has completed TTC and evaluations',
  function () {
    testContext.currentEmail = 'test.applicant@example.com';
    const reqs = getApplicantRequirements();

    reqs.ttc_application = 'submitted';
    reqs.ttc_evaluation_count = 2; // Meets requirement
    reqs.post_ttc_self_eval = 'submitted';
    // post_ttc_feedback left as 'not_submitted' - will be set by next step
  }
);

Given(
  'post-TTC co-teacher feedback is missing',
  function () {
    const reqs = getApplicantRequirements();
    reqs.post_ttc_feedback = 'not_submitted';
  }
);

// ============================================================================
// WHEN STEPS - Certificate Request
// ============================================================================

When(
  'I request a certificate PDF for {string}',
  function (this: unknown, email: string) {
    certWorld.certificateRequestEmail = email;

    // Get applicant requirements
    const reqs = getApplicantRequirements(email);

    // Check completion status
    const { isComplete, blockingReason } = checkCompletionStatus(reqs);

    if (isComplete) {
      // Generate mock certificate PDF
      certWorld.certificateStatus = 200;
      certWorld.certificateError = undefined;

      // Include applicant data in PDF
      const applicantName = reqs.name || 'Test Applicant';
      const completionDate = reqs.completion_date || new Date().toISOString().split('T')[0];

      // Mock PDF content with applicant data
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length {length}
>>
stream
BT
/F1 12 Tf
50 700 Td
(Certificate of Completion) Tj
0 -20 Td
(This certifies that ${applicantName}) Tj
0 -20 Td
(has completed TTC on ${completionDate}) Tj
ET
endstream
endobj
endobj
%%EOF`;

      certWorld.certificateBody = pdfContent;
      certWorld.certificateAppName = applicantName;
      certWorld.certificateAppDate = completionDate;
    } else {
      // Block with error
      certWorld.certificateStatus = 400;
      certWorld.certificateError = blockingReason!;
      certWorld.certificateBody = undefined;
    }
  }
);

// ============================================================================
// THEN STEPS - Assertions
// ============================================================================

Then(
  'the certificate should include the applicant\'s name',
  function () {
    assert.ok(
      certWorld.certificateAppName !== undefined,
      'Certificate not generated or applicant name not set'
    );
    assert.ok(certWorld.certificateAppName, 'Applicant name should not be empty');

    // Verify name is in the PDF content
    if (certWorld.certificateBody) {
      assert.ok(
        certWorld.certificateBody.includes(certWorld.certificateAppName),
        'Applicant name should be in certificate PDF content'
      );
    }
  }
);

Then(
  'the certificate should include the TTC completion date',
  function () {
    assert.ok(
      certWorld.certificateAppDate !== undefined,
      'Certificate not generated or completion date not set'
    );
    assert.ok(certWorld.certificateAppDate, 'Completion date should not be empty');

    // Verify date is in the PDF content
    if (certWorld.certificateBody) {
      assert.ok(
        certWorld.certificateBody.includes(certWorld.certificateAppDate),
        'Completion date should be in certificate PDF content'
      );
    }
  }
);

Then(
  'certificate generation should be blocked',
  function () {
    assert.ok(
      certWorld.certificateStatus !== undefined,
      'Certificate request was not executed'
    );

    // Should have non-200 status
    assert.notStrictEqual(
      certWorld.certificateStatus,
      200,
      'Certificate generation should be blocked but returned status 200'
    );

    // Should have an error reason
    assert.ok(
      certWorld.certificateError !== undefined,
      'Blocking reason should be set'
    );
    assert.ok(
      certWorld.certificateError !== null,
      'Blocking reason should not be null'
    );
  }
);

Then(
  'I should see the reason: {string}',
  function (expectedMessage: string) {
    assert.ok(
      certWorld.certificateError !== undefined,
      'No error message was set'
    );

    assert.strictEqual(
      certWorld.certificateError,
      expectedMessage,
      `Expected error "${expectedMessage}" but got "${certWorld.certificateError}"`
    );
  }
);
```

---

## Step 4: Test Execution Plan

### Python Tests
```bash
# Run the certificate gating feature
bun scripts/bdd/run-python.ts specs/features/e2e/certificate_gating.feature
```

### TypeScript Tests
```bash
# Run the certificate gating feature
bun scripts/bdd/run-typescript.ts specs/features/e2e/certificate_gating.feature
```

### Alignment Check
```bash
bun scripts/bdd/verify-alignment.ts
```

---

## Step 5: Verification Checklist

After implementation, verify:

- [ ] All 3 scenarios pass in Python
- [ ] All 3 scenarios pass in TypeScript
- [ ] Step registry has all 9 new steps
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes
- [ ] `coverage_matrix.md` updated
- [ ] `IMPLEMENTATION_PLAN.md` updated

---

## Implementation Order

1. **Update step registry first** - Add all 9 step patterns
2. **Implement Python steps** - Create `certificate_steps.py` and verify Python passes
3. **Implement TypeScript steps** - Create `certificate_steps.ts` and verify TypeScript passes
4. **Run alignment check** - Must pass before committing
5. **Update documentation** - coverage_matrix.md and IMPLEMENTATION_PLAN.md
6. **Clean up** - Remove ACTIVE_TASK.md

---

## Notes

- **Evaluation count**: Feature file specifies 2 evaluations required
- **Mock PDF content**: Using simple string templates for testing
- **Date format**: Using ISO format (YYYY-MM-DD) for completion dates
- **Error messages**: Exact string matching for blocking reasons
- **Context tracking**: Using `context.applicant_requirements` (Python) and `certWorld.applicantRequirements` (TypeScript)
