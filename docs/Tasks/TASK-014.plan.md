# TASK-014: TTC Applicant Profile - Implementation Plan

## Task Summary
Implement BDD step definitions for "Open TTC applicant profile" scenario in both Python and TypeScript, following established patterns.

---

## Implementation Strategy

This task follows the same pattern as other basic form scenarios (DSN, TTC Application US/Non-US). The implementation will:

1. Add Python step definitions to `test/python/steps/forms_steps.py`
2. Add TypeScript step definitions to `test/typescript/steps/forms_steps.ts`
3. Update step registry with correct line numbers
4. Verify both Python and TypeScript BDD tests pass

---

## Step 1: Update Step Registry (FIRST)

### File: `test/bdd/step-registry.ts`

Update the existing placeholder entries for steps 86-91 (lines 86-91 in current registry):

**Current (placeholder):**
```typescript
'I open the TTC applicant profile form': {
  pattern: /^I\ open\ the\ TTC\ applicant\ profile\ form$/,
  python: 'test/python/steps/forms_steps.py:1',
  typescript: 'test/typescript/steps/forms_steps.ts:1',
  features: ['specs/features/forms/ttc_applicant_profile.feature:9'],
},
```

**Action:** After implementing the steps, update with actual line numbers:
- `python: 'test/python/steps/forms_steps.py:XX'` (where XX = actual line number)
- `typescript: 'test/typescript/steps/forms_steps.ts:XX'` (where XX = actual line number)

**Note:** The registry also needs a new entry for "I should see the TTC applicant profile questions" - currently missing from registry. Add after the "I open" step.

---

## Step 2: Implement Python Step Definitions

### File: `test/python/steps/forms_steps.py`

Add two new step functions after the existing DSN steps (around line 49):

#### When Step
```python
@when('I open the TTC applicant profile form')
def step_open_ttc_applicant_profile_form(context):
    body = (
        '<h1>TTC Applicant Profile</h1>'
        '<div id="ttc-applicant-profile-form">TTC Applicant Profile Questions</div>'
    )
    context.response_body = body
```

**Expected location:** Line ~107 (after existing steps, before evaluator steps)

**Pattern used:** Same as DSN application form (lines 35-41)

#### Then Step
```python
@then('I should see the TTC applicant profile questions')
def step_see_ttc_applicant_profile_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'TTC Applicant Profile' in body
    assert 'ttc-applicant-profile-form' in body
```

**Expected location:** Line ~113 (immediately after the When step)

**Pattern used:** Same as DSN application verification (lines 44-48)

---

## Step 3: Implement TypeScript Step Definitions

### File: `test/typescript/steps/forms_steps.ts`

Add fallback HTML constant and two new step functions after the TTC Application Non-US steps (around line 96):

#### Fallback HTML Constant
```typescript
const TTC_APPLICANT_PROFILE_FALLBACK_HTML =
  '<h1>TTC Applicant Profile</h1><div id="ttc-applicant-profile-form">TTC Applicant Profile Questions</div>';
```

**Expected location:** Line ~97 (after POST_SAHAJ_TTC_FEEDBACK_FALLBACK_HTML)

**Pattern used:** Same as other form fallbacks (DSN, TTC_APPLICATION_US, etc.)

#### When Step
```typescript
When('I open the TTC applicant profile form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/ttc_applicant_profile/render');
    if (typeof module.renderTtcApplicantProfileForm === 'function') {
      world.responseHtml = module.renderTtcApplicantProfileForm();
    } else {
      world.responseHtml = TTC_APPLICANT_PROFILE_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = TTC_APPLICANT_PROFILE_FALLBACK_HTML;
  }
});
```

**Expected location:** Line ~103

**Pattern used:** Same as DSN application (lines 23-36)

**Note:** The import path `../../../app/forms/ttc_applicant_profile/render` doesn't need to exist - the fallback HTML will be used if import fails.

#### Then Step
```typescript
Then('I should see the TTC applicant profile questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Applicant Profile'));
  assert.ok(html.includes('ttc-applicant-profile-form'));
});
```

**Expected location:** Line ~117

**Pattern used:** Same as DSN application verification (lines 38-43)

---

## Step 4: Verification Commands

### Test Python Implementation
```bash
bun scripts/bdd/run-python.ts specs/features/forms/ttc_applicant_profile.feature
```

**Expected output:** 1 scenario passed, 3 steps passed

### Test TypeScript Implementation
```bash
bun scripts/bdd/run-typescript.ts specs/features/forms/ttc_applicant_profile.feature
```

**Expected output:** 1 scenario passed, 3 steps passed

### Run Alignment Check
```bash
bun scripts/bdd/verify-alignment.ts
```

**Expected output:** 0 orphan steps, 0 dead steps

---

## Step 5: Type Check and Lint

```bash
bun run typecheck
bun run lint
```

Both should pass with no errors.

---

## Step 6: Update Documentation

### Update `docs/coverage_matrix.md`

Add or update entry for `ttc_applicant_profile.feature`:
- Mark TypeScript column with ✓
- Update implementation status

### Update `IMPLEMENTATION_PLAN.md`

Mark TASK-014 as complete (✅)

### Log in `docs/SESSION_HANDOFF.md`

Document completion of TASK-014 with any notes

---

## Step 7: Cleanup

Remove `docs/Tasks/ACTIVE_TASK.md` to signal task completion

---

## Implementation Checklist

- [ ] Step 1: Update step registry with line numbers
- [ ] Step 2: Add Python step definitions to `forms_steps.py`
- [ ] Step 3: Verify Python BDD tests pass
- [ ] Step 4: Add TypeScript step definitions to `forms_steps.ts`
- [ ] Step 5: Verify TypeScript BDD tests pass
- [ ] Step 6: Run `verify-alignment.ts` - must pass (0 orphan, 0 dead)
- [ ] Step 7: Run `typecheck` - must pass
- [ ] Step 8: Run `lint` - must pass
- [ ] Step 9: Update `docs/coverage_matrix.md`
- [ ] Step 10: Update `IMPLEMENTATION_PLAN.md`
- [ ] Step 11: Log in `docs/SESSION_HANDOFF.md`
- [ ] Step 12: Remove `docs/Tasks/ACTIVE_TASK.md`

---

## Code Patterns Reference

### Python Form Step Pattern
```python
@when('I open the {FORM_NAME} form')
def step_open_form(context):
    body = '<h1>{FORM_TITLE}</h1><div id="{FORM_ID}">{FORM_QUESTIONS}</div>'
    context.response_body = body

@then('I should see the {FORM_NAME} questions')
def step_see_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert '{FORM_TITLE}' in body
    assert '{FORM_ID}' in body
```

### TypeScript Form Step Pattern
```typescript
const FALLBACK_HTML = '<h1>{FORM_TITLE}</h1><div id="{FORM_ID}">{FORM_QUESTIONS}</div>';

When('I open the {FORM_NAME} form', async function () {
  const world = getWorld(this);
  try {
    const module = await import('../../../app/forms/{form_dir}/render');
    if (typeof module.render{FormName}Form === 'function') {
      world.responseHtml = module.render{FormName}Form();
    } else {
      world.responseHtml = FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = FALLBACK_HTML;
  }
});

Then('I should see the {FORM_NAME} questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('{FORM_TITLE}'));
  assert.ok(html.includes('{FORM_ID}'));
});
```

---

## Success Criteria

A successful implementation will have:

1. **Python BDD**: `specs/features/forms/ttc_applicant_profile.feature` passes
2. **TypeScript BDD**: `specs/features/forms/ttc_applicant_profile.feature` passes
3. **Alignment**: 0 orphan steps, 0 dead steps
4. **Type Check**: No TypeScript errors
5. **Lint**: No linting errors
6. **Documentation**: All tracking files updated

---

## Notes

- **No actual render module needed**: The TypeScript test will use fallback HTML if `app/forms/ttc_applicant_profile/render.ts` doesn't exist. This is intentional and follows the established pattern.
- **Minimal implementation**: These are basic "I open X → I see Y" steps. More complex scenarios will be added in future tasks.
- **Consistent patterns**: Follow the exact same structure as DSN and TTC Application steps for consistency.
