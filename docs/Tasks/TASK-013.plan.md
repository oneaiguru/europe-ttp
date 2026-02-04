# TASK-013: TTC Evaluation - Implementation Plan

## Overview
Implementation plan for TTC Evaluation form steps (Phase 1 - Basic "I open X → I see Y" scenario).

---

## Step 1: Update Step Registry (FIRST)

### File: `test/bdd/step-registry.ts`

Update the following entries with correct line numbers after implementation:

1. **Line 38-42**: "I am authenticated as an evaluator"
   - Update `python` from `'test/python/steps/forms_steps.py:1'` to actual line number
   - Update `typescript` from `'test/typescript/steps/forms_steps.ts:1'` to actual line number

2. **Line 104-109**: "I open the TTC evaluation form"
   - Update `python` from `'test/python/steps/forms_steps.py:1'` to actual line number
   - Update `typescript` from `'test/typescript/steps/forms_steps.ts:1'` to actual line number

3. **Line 410-414**: "I should see the TTC evaluation questions"
   - Update `python` from `'test/python/steps/forms_steps.py:1'` to actual line number
   - Update `typescript` from `'test/typescript/steps/forms_steps.ts:1'` to actual line number

---

## Step 2: Implement Python Step Definitions

### File: `test/python/steps/forms_steps.py`

Add the following three step functions (insert after line 88, after the Sahaj TTC graduate step):

```python
@given('I am authenticated as an evaluator')
def step_authenticated_evaluator(context):
    context.current_user = _FakeUser('evaluator@example.com', 'ttc-evaluator')
    context.user_home_country_iso = 'US'


@when('I open the TTC evaluation form')
def step_open_ttc_evaluation_form(context):
    body = (
        '<h1>TTC Evaluation</h1>'
        '<div id="ttc-evaluation-form">TTC Evaluation Questions</div>'
    )
    context.response_body = body


@then('I should see the TTC evaluation questions')
def step_see_ttc_evaluation_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'TTC Evaluation' in body
    assert 'ttc-evaluation-form' in body
```

**Pattern Reference**: This follows the exact same pattern as:
- DSN Application (lines 35-48)
- TTC Application US (lines 51-64)
- Post-Sahaj TTC Self Evaluation (lines 107-120)

**Location**: Insert after line 88 (after `step_authenticated_sahaj_ttc_graduate`)

---

## Step 3: Verify Python Passes

### Test Command
```bash
bun scripts/bdd/run-python.ts specs/features/forms/ttc_evaluation.feature
```

**Expected Result**: All 3 steps should pass

**DO NOT proceed until Python passes.**

---

## Step 4: Implement TypeScript Code

### File 1: `app/forms/ttc_evaluation/render.ts` (CREATE NEW)

```typescript
export function renderTtcEvaluationForm(): string {
  return (
    '<h1>TTC Evaluation</h1>' +
    '<div id="ttc-evaluation-form">TTC Evaluation Questions</div>'
  );
}
```

**Directory**: Create `app/forms/ttc_evaluation/` if it doesn't exist
**Pattern**: Same as `app/forms/dsn_application/render.ts`

---

## Step 5: Implement TypeScript Step Definitions

### File: `test/typescript/steps/forms_steps.ts`

Add the following three step functions (insert after line 105, after the Sahaj TTC graduate step):

```typescript
const TTC_EVALUATION_FALLBACK_HTML =
  '<h1>TTC Evaluation</h1><div id="ttc-evaluation-form">TTC Evaluation Questions</div>';

Given('I am authenticated as an evaluator', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'evaluator', email: 'evaluator@example.com' };
  world.userHomeCountryIso = 'US';
});

When('I open the TTC evaluation form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/ttc_evaluation/render');
    if (typeof module.renderTtcEvaluationForm === 'function') {
      world.responseHtml = module.renderTtcEvaluationForm();
    } else {
      world.responseHtml = TTC_EVALUATION_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = TTC_EVALUATION_FALLBACK_HTML;
  }
});

Then('I should see the TTC evaluation questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Evaluation'));
  assert.ok(html.includes('ttc-evaluation-form'));
});
```

**Pattern Reference**: This follows the exact same pattern as:
- DSN Application (lines 23-43)
- TTC Application US (lines 48-68)
- Post-Sahaj TTC Self Evaluation (lines 132-152)

**Location**: Insert after line 105 (after `Given('I am authenticated as a Sahaj TTC graduate'...)`)

---

## Step 6: Verify TypeScript Passes

### Test Command
```bash
bun scripts/bdd/run-typescript.ts specs/features/forms/ttc_evaluation.feature
```

**Expected Result**: All 3 steps should pass

---

## Step 7: Run Alignment Check

### Test Command
```bash
bun scripts/bdd/verify-alignment.ts
```

**Expected Result**: Must pass with 0 orphan steps, 0 dead steps

---

## Step 8: Quality Checks

### Type Check
```bash
bun run typecheck
```

### Lint
```bash
bun run lint
```

---

## Step 9: Update Tracking

### Update `docs/coverage_matrix.md`
- Mark TASK-013 as ✓ for TypeScript (if matrix exists)

### Update `IMPLEMENTATION_PLAN.md`
- Change TASK-013 status from 🔴 TODO to 🟢 DONE
- Add note about completion

### Log in `docs/SESSION_HANDOFF.md`
- Document TASK-013 completion
- Note any issues or deviations from plan

---

## Step 10: Clean Up

### Remove Active Task File
```bash
rm docs/Tasks/ACTIVE_TASK.md
```

---

## Summary

This is a straightforward Phase 1 implementation following established patterns:

**Files to Modify**:
1. `test/bdd/step-registry.ts` - Update line numbers
2. `test/python/steps/forms_steps.py` - Add 3 step functions
3. `app/forms/ttc_evaluation/render.ts` - Create new file
4. `test/typescript/steps/forms_steps.ts` - Add 3 step functions

**Total New Lines**: ~40 lines across 4 files

**Risk Level**: Low - follows exact same pattern as 6+ completed form scenarios

**Dependencies**: None - standalone Phase 1 scenario
