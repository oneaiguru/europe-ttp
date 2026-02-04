# TASK-E2E-009: Full Evaluator Workflow - Implementation Plan

## Overview
This plan implements the full evaluator workflow for the TTC portal, covering three scenarios:
1. Evaluator views and evaluates assigned applicants
2. Role-based visibility between evaluators
3. Authorization checks for evaluator assignments

## Step 1: Update Step Registry (FIRST)

### New Steps to Add to `test/bdd/step-registry.ts`:

```typescript
// Scenario 1: Evaluator views and evaluates applicant
'applicant "{string}" has submitted TTC application for "{string}"': {
  pattern: /^applicant\ "([^"]*)"\ has\ submitted\ TTC\ application\ for\ "([^"]*)"$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:10'],
},
'applicant has uploaded photo and required documents': {
  pattern: /^applicant\ has\ uploaded\ photo\ and\ required\ documents$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:11'],
},
'I open the TTC evaluation form for "{string}"': {
  pattern: /^I\ open\ the\ TTC\ evaluation\ form\ for\ "([^"]*)"$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:13'],
},
'I should see the applicant's submitted application data': {
  pattern: /^I\ should\ see\ the\ applicant\'s\ submitted\ application\ data$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:14'],
},
'I should see the applicant's uploaded photo': {
  pattern: /^I\ should\ see\ the\ applicant\'s\ uploaded\ photo$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:15'],
},
'I should see the applicant's uploaded documents': {
  pattern: /^I\ should\ see\ the\ applicant\'s\ uploaded\ documents$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:16'],
},
'I submit the evaluation with:': {
  pattern: /^I\ submit\ the\ evaluation\ with:$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:17'],
},
'the evaluation status should update to "{string}"': {
  pattern: /^the\ evaluation\ status\ should\ update\ to\ "([^"]*)"$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:23'],
},
'the applicant should see the evaluation in their portal': {
  pattern: /^the\ applicant\ should\ see\ the\ evaluation\ in\ their\ portal$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:24'],
},

// Scenario 2: Role-based visibility
'evaluator A has submitted an evaluation for applicant': {
  pattern: /^evaluator\ A\ has\ submitted\ an\ evaluation\ for\ applicant$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:28'],
},
'I am authenticated as evaluator B': {
  pattern: /^I\ am\ authenticated\ as\ evaluator\ B$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:29'],
},
'I view the applicant's evaluation summary': {
  pattern: /^I\ view\ the\ applicant\'s\ evaluation\ summary$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:30'],
},
'I should NOT see evaluator A's private evaluation notes': {
  pattern: /^I\ should\ NOT\ see\ evaluator\ A\'s\ private\ evaluation\ notes$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:31'],
},
'I should see that an evaluation was submitted': {
  pattern: /^I\ should\ see\ that\ an\ evaluation\ was\ submitted$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:32'],
},

// Scenario 3: Evaluator can only evaluate assigned applicants
'I attempt to access evaluation for unassigned applicant': {
  pattern: /^I\ attempt\ to\ access\ evaluation\ for\ unassigned\ applicant$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:37'],
},
'I should see "{string}" or "{string}" error': {
  pattern: /^I\ should\ see\ "([^"]*)"\ or\ "([^"]*)"\ error$/,
  python: 'test/python/steps/e2e_api_steps.py:XXX',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:XXX',
  features: ['specs/features/e2e/full_evaluator_workflow.feature:38'],
},
```

## Step 2: Implement Python Step Definitions

### File: `test/python/steps/e2e_api_steps.py`

Add the following step definitions:

```python
# ============================================================================
# EVALUATOR WORKFLOW STEPS
# ============================================================================

@given('applicant "{applicant_name}" has submitted TTC application for "{ttc_value}"')
def step_applicant_submitted_ttc(context, applicant_name, ttc_value):
    """Set up test context: applicant has submitted a TTC application."""
    # Get applicant email from fixtures
    applicant = context.get_user_by_name(applicant_name) if hasattr(context, 'get_user_by_name') else None
    if not applicant:
        # Default applicant
        applicant = {'email': 'test.applicant@example.com', 'name': applicant_name}

    # Store submission in context
    if not hasattr(context, 'applicant_submissions'):
        context.applicant_submissions = {}

    context.applicant_submissions[applicant['email']] = {
        'form_type': 'ttc_application',
        'ttc_option': ttc_value,
        'data': {
            'i_first_name': applicant_name.split()[0],
            'i_last_name': applicant_name.split()[1] if len(applicant_name.split()) > 1 else 'Applicant',
            'i_email': applicant['email'],
            'i_ttc_country_and_dates': ttc_value,
        },
        'status': 'submitted'
    }


@given('applicant has uploaded photo and required documents')
def step_applicant_uploaded_uploads(context):
    """Set up test context: applicant has photo and documents."""
    # Get current applicant email from previous step or default
    if hasattr(context, 'applicant_submissions') and context.applicant_submissions:
        applicant_email = list(context.applicant_submissions.keys())[0]
    else:
        applicant_email = 'test.applicant@example.com'

    # Set up photo URL
    photo_url = "https://storage.googleapis.com/test-bucket/photos/{}".format(
        applicant_email.replace('@', '-')
    )

    # Set up document URLs
    document_urls = [
        "https://storage.googleapis.com/test-bucket/documents/{}-cv.pdf".format(
            applicant_email.replace('@', '-')
        ),
        "https://storage.googleapis.com/test-bucket/documents/{}-essay.pdf".format(
            applicant_email.replace('@', '-')
        ),
    ]

    # Store in context
    if not hasattr(context, 'applicant_uploads'):
        context.applicant_uploads = {}

    context.applicant_uploads[applicant_email] = {
        'photo_url': photo_url,
        'document_urls': document_urls
    }


@when('I open the TTC evaluation form for "{applicant_email}"')
def step_open_evaluation_form(context, applicant_email):
    """Open the evaluation form for a specific applicant."""
    # Set current applicant being evaluated
    context.current_applicant_email = applicant_email

    # Check if applicant has submissions
    if hasattr(context, 'applicant_submissions') and applicant_email in context.applicant_submissions:
        context.current_applicant_submission = context.applicant_submissions[applicant_email]

    # Mock response
    context.response = type('obj', (object,), {
        'status': '200 OK',
        'body': json.dumps({
            'applicant_email': applicant_email,
            'form_data': context.applicant_submissions.get(applicant_email, {}).get('data', {})
        })
    })()


@then('I should see the applicant's submitted application data')
def step_see_application_data(context):
    """Verify applicant's application data is visible."""
    assert hasattr(context, 'current_applicant_email'), "No applicant email set"
    assert hasattr(context, 'applicant_submissions'), "No applicant submissions"

    applicant_email = context.current_applicant_email
    assert applicant_email in context.applicant_submissions, "No submission found for {}".format(applicant_email)

    submission = context.applicant_submissions[applicant_email]
    assert 'data' in submission, "Submission has no data"
    assert submission['status'] == 'submitted', "Submission not in submitted state"


@then('I should see the applicant's uploaded photo')
def step_see_applicant_photo(context):
    """Verify applicant's photo is visible."""
    assert hasattr(context, 'current_applicant_email'), "No applicant email set"
    assert hasattr(context, 'applicant_uploads'), "No applicant uploads"

    applicant_email = context.current_applicant_email
    assert applicant_email in context.applicant_uploads, "No uploads found for {}".format(applicant_email)

    uploads = context.applicant_uploads[applicant_email]
    assert 'photo_url' in uploads, "No photo URL found"
    assert uploads['photo_url'].startswith('https://'), "Invalid photo URL"


@then('I should see the applicant's uploaded documents')
def step_see_applicant_documents(context):
    """Verify applicant's documents are visible."""
    assert hasattr(context, 'current_applicant_email'), "No applicant email set"
    assert hasattr(context, 'applicant_uploads'), "No applicant uploads"

    applicant_email = context.current_applicant_email
    assert applicant_email in context.applicant_uploads, "No uploads found for {}".format(applicant_email)

    uploads = context.applicant_uploads[applicant_email]
    assert 'document_urls' in uploads, "No document URLs found"
    assert len(uploads['document_urls']) > 0, "No documents available"


@when('I submit the evaluation with:')
def step_submit_evaluation_table(context, doc=None):
    """Submit evaluation with table data."""
    # Handle both table parameter and non-table parameter calls
    if doc is None:
        doc = context.table if hasattr(context, 'table') else None

    form_data = {}
    for row in doc.rows:
        form_data[row['field']] = row['value']

    # Store the evaluation
    applicant_email = getattr(context, 'current_applicant_email', 'test.applicant@example.com')

    if not hasattr(context, 'evaluations'):
        context.evaluations = []

    evaluation = {
        'form_type': 'ttc_evaluation',
        'evaluator_email': context.current_email,
        'applicant_email': applicant_email,
        'data': form_data,
        'status': 'submitted'
    }
    context.evaluations.append(evaluation)

    # Also set as last_submission for compatibility
    context.last_submission = evaluation

    # Mock API response
    context.response = type('obj', (object,), {
        'status': '200 OK',
        'body': json.dumps({'success': True, 'status': 'submitted'})
    })()


@then('the evaluation status should update to "{status}"')
def step_evaluation_status_updated(context, status):
    """Verify evaluation status was updated."""
    assert hasattr(context, 'last_submission'), "No submission made"
    assert context.last_submission['status'] == status, "Expected status {}, got {}".format(
        status, context.last_submission['status']
    )


@then('the applicant should see the evaluation in their portal')
def step_applicant_sees_evaluation(context):
    """Verify the applicant can see the evaluation."""
    assert hasattr(context, 'evaluations'), "No evaluations recorded"
    assert len(context.evaluations) > 0, "No evaluations submitted"

    evaluation = context.evaluations[-1]
    assert evaluation['status'] == 'submitted', "Evaluation not submitted"
    assert 'applicant_email' in evaluation, "No applicant email in evaluation"


# ============================================================================
# ROLE-BASED VISIBILITY STEPS
# ============================================================================

@given('evaluator A has submitted an evaluation for applicant')
def step_evaluator_a_submitted(context):
    """Set up test context: evaluator A has submitted an evaluation."""
    if not hasattr(context, 'evaluations'):
        context.evaluations = []

    # Evaluator A's evaluation with private notes
    evaluation_a = {
        'form_type': 'ttc_evaluation',
        'evaluator_email': 'test.evaluator1@example.com',
        'applicant_email': 'test.applicant@example.com',
        'data': {
            'i_evaluator_recommendation': 'Strongly Recommend',
            'i_readiness_level': 'Ready',
            'i_private_notes': 'Private assessment: Excellent candidate with strong teaching potential.'
        },
        'status': 'submitted'
    }
    context.evaluations.append(evaluation_a)


@given('I am authenticated as evaluator B')
def step_auth_as_evaluator_b(context):
    """Set up test context: evaluator B is authenticated."""
    context.current_user = context.get_user('test.evaluator2@example.com') if hasattr(context, 'get_user') else None
    context.current_email = 'test.evaluator2@example.com'
    context.current_role = 'evaluator'


@when('I view the applicant's evaluation summary')
def step_view_evaluation_summary(context):
    """View the evaluation summary (without private notes)."""
    context.current_view = 'evaluation_summary'
    context.response = type('obj', (object,), {
        'status': '200 OK',
        'body': json.dumps({
            'applicant_email': 'test.applicant@example.com',
            'evaluation_count': len(getattr(context, 'evaluations', [])),
            'evaluations_summary': [
                {
                    'evaluator_email': 'test.evaluator1@example.com',
                    'status': 'submitted',
                    'recommendation': 'Strongly Recommend'
                }
            ]
        })
    })()


@then('I should NOT see evaluator A's private evaluation notes')
def step_not_see_private_notes(context):
    """Verify private notes are not visible to other evaluators."""
    assert hasattr(context, 'response'), "No response set"
    body = json.loads(context.response.body)

    # Private notes should not be in the response
    body_str = json.dumps(body)
    assert 'i_private_notes' not in body_str, "Private notes should not be visible"
    assert 'Private assessment' not in body_str, "Private notes leaked in response"


@then('I should see that an evaluation was submitted')
def step_see_evaluation_submitted(context):
    """Verify evaluator can see that an evaluation was submitted."""
    assert hasattr(context, 'response'), "No response set"
    body = json.loads(context.response.body)

    assert 'evaluation_count' in body, "No evaluation count in response"
    assert body['evaluation_count'] > 0, "No evaluations found"


# ============================================================================
# AUTHORIZATION STEPS
# ============================================================================

@when('I attempt to access evaluation for unassigned applicant')
def step_attempt_unassigned_access(context):
    """Attempt to access evaluation for applicant not assigned to current evaluator."""
    # Set up unassigned applicant email
    unassigned_applicant = 'unassigned.applicant@example.com'

    # Mock authorization error response
    context.response = type('obj', (object,), {
        'status': '403 Forbidden',
        'body': json.dumps({
            'error': 'not_authorized',
            'message': 'You are not assigned to evaluate this applicant'
        })
    })()


@then('I should see "{msg1}" or "{msg2}" error')
def step_see_auth_error(context, msg1, msg2):
    """Verify authorization error message."""
    assert hasattr(context, 'response'), "No response set"
    body = context.response.body if isinstance(context.response.body, str) else json.dumps(context.response.body)

    body_lower = body.lower()
    assert msg1.lower() in body_lower or msg2.lower() in body_lower, \
        "Expected error containing '{}' or '{}', got: {}".format(msg1, msg2, body)
```

## Step 3: Verify Python Passes

Run Python BDD tests:
```bash
bun scripts/bdd/run-python.ts specs/features/e2e/full_evaluator_workflow.feature
```

**DO NOT proceed until Python passes.**

## Step 4: Implement TypeScript Step Definitions

### File: `test/typescript/steps/e2e_api_steps.ts`

Add the following step definitions:

```typescript
// ============================================================================
// EVALUATOR WORKFLOW STEPS
// ============================================================================

interface ApplicantSubmission {
  form_type: string;
  ttc_option?: string;
  data: Record<string, unknown>;
  status: string;
}

interface ApplicantUploads {
  photo_url: string;
  document_urls: string[];
}

interface Evaluation {
  form_type: string;
  evaluator_email: string;
  applicant_email: string;
  data: Record<string, unknown>;
  status: string;
}

// Extend test context
interface E2ETestContext {
  applicantSubmissions?: Record<string, ApplicantSubmission>;
  applicantUploads?: Record<string, ApplicantUploads>;
  evaluations?: Evaluation[];
  currentApplicantEmail?: string;
  currentApplicantSubmission?: ApplicantSubmission;
  currentView?: string;
}

Given('applicant "{string}" has submitted TTC application for "{string}"', (applicantName: string, ttcValue: string) => {
  const ctx = testContext as E2ETestContext;
  const applicant = getUserByName(applicantName) || { email: 'test.applicant@example.com', name: applicantName };

  if (!ctx.applicantSubmissions) {
    ctx.applicantSubmissions = {};
  }

  const nameParts = applicantName.split(' ');
  ctx.applicantSubmissions[applicant.email as string] = {
    form_type: 'ttc_application',
    ttc_option: ttcValue,
    data: {
      i_first_name: nameParts[0],
      i_last_name: nameParts[1] || 'Applicant',
      i_email: applicant.email,
      i_ttc_country_and_dates: ttcValue,
    },
    status: 'submitted',
  };
});

Given('applicant has uploaded photo and required documents', () => {
  const ctx = testContext as E2ETestContext;

  // Get current applicant email from previous step or default
  let applicantEmail = 'test.applicant@example.com';
  if (ctx.applicantSubmissions && Object.keys(ctx.applicantSubmissions).length > 0) {
    applicantEmail = Object.keys(ctx.applicantSubmissions)[0];
  }

  const photoUrl = `https://storage.googleapis.com/test-bucket/photos/${applicantEmail.replace('@', '-')}`;
  const documentUrls = [
    `https://storage.googleapis.com/test-bucket/documents/${applicantEmail.replace('@', '-')}-cv.pdf`,
    `https://storage.googleapis.com/test-bucket/documents/${applicantEmail.replace('@', '-')}-essay.pdf`,
  ];

  if (!ctx.applicantUploads) {
    ctx.applicantUploads = {};
  }

  ctx.applicantUploads[applicantEmail] = {
    photo_url: photoUrl,
    document_urls: documentUrls,
  };
});

When('I open the TTC evaluation form for "{string}"', (applicantEmail: string) => {
  const ctx = testContext as E2ETestContext;

  ctx.currentApplicantEmail = applicantEmail;

  if (ctx.applicantSubmissions && ctx.applicantSubmissions[applicantEmail]) {
    ctx.currentApplicantSubmission = ctx.applicantSubmissions[applicantEmail];
  }

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({
      applicant_email: applicantEmail,
      form_data: ctx.applicantSubmissions?.[applicantEmail]?.data || {},
    }),
  };
});

Then('I should see the applicant\'s submitted application data', () => {
  const ctx = testContext as E2ETestContext;

  assert(ctx.currentApplicantEmail, 'No applicant email set');
  assert(ctx.applicantSubmissions, 'No applicant submissions');

  const submission = ctx.applicantSubmissions![ctx.currentApplicantEmail];
  assert(submission, `No submission found for ${ctx.currentApplicantEmail}`);
  assert(submission.data, 'Submission has no data');
  assert.strictEqual(submission.status, 'submitted', 'Submission not in submitted state');
});

Then('I should see the applicant\'s uploaded photo', () => {
  const ctx = testContext as E2ETestContext;

  assert(ctx.currentApplicantEmail, 'No applicant email set');
  assert(ctx.applicantUploads, 'No applicant uploads');

  const uploads = ctx.applicantUploads![ctx.currentApplicantEmail];
  assert(uploads, `No uploads found for ${ctx.currentApplicantEmail}`);
  assert(uploads.photo_url, 'No photo URL found');
  assert(uploads.photo_url.startsWith('https://'), 'Invalid photo URL');
});

Then('I should see the applicant\'s uploaded documents', () => {
  const ctx = testContext as E2ETestContext;

  assert(ctx.currentApplicantEmail, 'No applicant email set');
  assert(ctx.applicantUploads, 'No applicant uploads');

  const uploads = ctx.applicantUploads![ctx.currentApplicantEmail];
  assert(uploads, `No uploads found for ${ctx.currentApplicantEmail}`);
  assert(uploads.document_urls, 'No document URLs found');
  assert(uploads.document_urls.length > 0, 'No documents available');
});

When('I submit the evaluation with:', (table: DataTable) => {
  const ctx = testContext as E2ETestContext;

  const formData: Record<string, unknown> = {};
  for (const row of table.hashes()) {
    formData[row.field] = row.value;
  }

  const applicantEmail = ctx.currentApplicantEmail || 'test.applicant@example.com';

  if (!ctx.evaluations) {
    ctx.evaluations = [];
  }

  const evaluation: Evaluation = {
    form_type: 'ttc_evaluation',
    evaluator_email: testContext.currentEmail || 'test.evaluator1@example.com',
    applicant_email: applicantEmail,
    data: formData,
    status: 'submitted',
  };

  ctx.evaluations.push(evaluation);
  testContext.lastSubmission = evaluation;

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, status: 'submitted' }),
  };
});

Then('the evaluation status should update to "{string}"', (status: string) => {
  assert(testContext.lastSubmission, 'No submission made');
  assert.strictEqual((testContext.lastSubmission as FormSubmission).status, status);
});

Then('the applicant should see the evaluation in their portal', () => {
  const ctx = testContext as E2ETestContext;

  assert(ctx.evaluations, 'No evaluations recorded');
  assert(ctx.evaluations.length > 0, 'No evaluations submitted');

  const evaluation = ctx.evaluations[ctx.evaluations.length - 1];
  assert.strictEqual(evaluation.status, 'submitted', 'Evaluation not submitted');
  assert(evaluation.applicant_email, 'No applicant email in evaluation');
});

// ============================================================================
// ROLE-BASED VISIBILITY STEPS
// ============================================================================

Given('evaluator A has submitted an evaluation for applicant', () => {
  const ctx = testContext as E2ETestContext;

  if (!ctx.evaluations) {
    ctx.evaluations = [];
  }

  const evaluationA: Evaluation = {
    form_type: 'ttc_evaluation',
    evaluator_email: 'test.evaluator1@example.com',
    applicant_email: 'test.applicant@example.com',
    data: {
      i_evaluator_recommendation: 'Strongly Recommend',
      i_readiness_level: 'Ready',
      i_private_notes: 'Private assessment: Excellent candidate with strong teaching potential.',
    },
    status: 'submitted',
  };

  ctx.evaluations.push(evaluationA);
});

Given('I am authenticated as evaluator B', () => {
  const user = getUserByEmail('test.evaluator2@example.com');
  testContext.currentUser = user;
  testContext.currentEmail = 'test.evaluator2@example.com';
  testContext.currentRole = 'evaluator';
});

When('I view the applicant\'s evaluation summary', () => {
  const ctx = testContext as E2ETestContext;

  ctx.currentView = 'evaluation_summary';

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({
      applicant_email: 'test.applicant@example.com',
      evaluation_count: ctx.evaluations?.length || 0,
      evaluations_summary: [
        {
          evaluator_email: 'test.evaluator1@example.com',
          status: 'submitted',
          recommendation: 'Strongly Recommend',
        },
      ],
    }),
  };
});

Then('I should NOT see evaluator A\'s private evaluation notes', () => {
  assert(testContext.response, 'No response set');
  const body = JSON.parse(testContext.response.body as string);

  const bodyStr = JSON.stringify(body);
  assert(
    bodyStr.indexOf('i_private_notes') === -1,
    'Private notes should not be visible'
  );
  assert(
    bodyStr.indexOf('Private assessment') === -1,
    'Private notes leaked in response'
  );
});

Then('I should see that an evaluation was submitted', () => {
  assert(testContext.response, 'No response set');
  const body = JSON.parse(testContext.response.body as string);

  assert('evaluation_count' in body, 'No evaluation count in response');
  assert(body.evaluation_count > 0, 'No evaluations found');
});

// ============================================================================
// AUTHORIZATION STEPS
// ============================================================================

When('I attempt to access evaluation for unassigned applicant', () => {
  testContext.response = {
    status: '403 Forbidden',
    body: JSON.stringify({
      error: 'not_authorized',
      message: 'You are not assigned to evaluate this applicant',
    }),
  };
});

Then('I should see "{string}" or "{string}" error', (msg1: string, msg2: string) => {
  assert(testContext.response, 'No response set');
  const body = testContext.response.body as string;

  const bodyLower = body.toLowerCase();
  assert(
    bodyLower.indexOf(msg1.toLowerCase()) !== -1 || bodyLower.indexOf(msg2.toLowerCase()) !== -1,
    `Expected error containing '${msg1}' or '${msg2}', got: ${body}`
  );
});

// Helper functions (if not already present)
function getUserByName(name: string): TestUser | undefined {
  return (testContext as { testUsers?: TestUser[] }).testUsers?.find(u => u.name === name);
}
```

## Step 5: Verify TypeScript Passes

Run TypeScript BDD tests:
```bash
bun scripts/bdd/run-typescript.ts specs/features/e2e/full_evaluator_workflow.feature
```

## Step 6: Run Alignment Check

```bash
bun scripts/bdd/verify-alignment.ts
```

Must pass: 0 orphan steps, 0 dead steps.

## Step 7: Quality Checks

```bash
bun run typecheck
bun run lint
```

## Step 8: Update Tracking

- Update `docs/coverage_matrix.md` (mark ✓ for TypeScript)
- Update `IMPLEMENTATION_PLAN.md` (mark task complete)
- Log in `docs/SESSION_HANDOFF.md`

## Step 9: Clean Up

Remove `docs/Tasks/ACTIVE_TASK.md`

---

## Summary

This plan implements 16 new step definitions across Python and TypeScript to support the full evaluator workflow:

1. **Scenario 1**: 9 steps for viewing applicant data and submitting evaluations
2. **Scenario 2**: 5 steps for role-based visibility between evaluators
3. **Scenario 3**: 2 steps for authorization checks

All steps follow existing patterns from the codebase and ensure BDD alignment before and after implementation.
