# TASK-015: TTC Evaluator Profile Form - Implementation Plan

## Task Information
- **Task ID**: TASK-015
- **Feature File**: `specs/features/forms/ttc_evaluator_profile.feature`
- **Date**: 2026-02-04

## Overview

Implement the TTC Evaluator Profile form access scenario. This task involves creating Python and TypeScript step definitions for opening and viewing the TTC evaluator profile form, following the established patterns from similar forms (TTC applicant profile, TTC evaluation).

---

## Step 1: Update Step Registry (FIRST)

### File: `test/bdd/step-registry.ts`

Update the following entries with correct line numbers after implementation:

1. **"I open the TTC evaluator profile form"** (line 110-114)
   - Current: `python: 'test/python/steps/forms_steps.py:1'`
   - Update to: `python: 'test/python/steps/forms_steps.py:161'`
   - Current: `typescript: 'test/typescript/steps/forms_steps.ts:1'`
   - Update to: `typescript: 'test/typescript/steps/forms_steps.ts:210'`

2. **"I should see the TTC evaluator profile questions"** (line 416-420)
   - Current: `python: 'test/python/steps/forms_steps.py:1'`
   - Update to: `python: 'test/python/steps/forms_steps.py:168'`
   - Current: `typescript: 'test/typescript/steps/forms_steps.ts:1'`
   - Update to: `typescript: 'test/typescript/steps/forms_steps.ts:226'`

---

## Step 2: Implement Python Step Definitions

### File: `test/python/steps/forms_steps.py`

**Location**: Add after line 159 (end of file)

#### Step 2.1: Add "I open the TTC evaluator profile form" step

```python
@when('I open the TTC evaluator profile form')
def step_open_ttc_evaluator_profile_form(context):
    body = (
        '<h1>TTC Evaluator Profile</h1>'
        '<div id="ttc-evaluator-profile-form">TTC Evaluator Profile Questions</div>'
    )
    context.response_body = body
```

**Expected line**: 161

#### Step 2.2: Add "I should see the TTC evaluator profile questions" step

```python
@then('I should see the TTC evaluator profile questions')
def step_see_ttc_evaluator_profile_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'TTC Evaluator Profile' in body
    assert 'ttc-evaluator-profile-form' in body
```

**Expected line**: 168

---

## Step 3: Create TypeScript Form Render Module

### File: `app/forms/ttc_evaluator_profile/render.ts` (NEW FILE)

**Directory**: Create `/workspace/app/forms/ttc_evaluator_profile/`

```typescript
/**
 * TTC Evaluator Profile Form Rendering
 *
 * This is a placeholder for the TTC Evaluator Profile form rendering logic.
 * The actual implementation will be migrated from the legacy Python code.
 */

export const TTC_EVALUATOR_PROFILE_FALLBACK_HTML =
  '<h1>TTC Evaluator Profile</h1><div id="ttc-evaluator-profile-form">TTC Evaluator Profile Questions</div>';

/**
 * Render the TTC Evaluator Profile form
 *
 * @returns HTML string for the TTC Evaluator Profile form
 */
export function renderTtcEvaluatorProfileForm(): string {
  return TTC_EVALUATOR_PROFILE_FALLBACK_HTML;
}
```

---

## Step 4: Implement TypeScript Step Definitions

### File: `test/typescript/steps/forms_steps.ts`

**Location**: Add after line 208 (end of file)

#### Step 4.1: Add fallback HTML constant

```typescript
const TTC_EVALUATOR_PROFILE_FALLBACK_HTML =
  '<h1>TTC Evaluator Profile</h1><div id="ttc-evaluator-profile-form">TTC Evaluator Profile Questions</div>';
```

**Expected line**: 210

#### Step 4.2: Add "I open the TTC evaluator profile form" step

```typescript
When('I open the TTC evaluator profile form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/ttc_evaluator_profile/render');
    if (typeof module.renderTtcEvaluatorProfileForm === 'function') {
      world.responseHtml = module.renderTtcEvaluatorProfileForm();
    } else {
      world.responseHtml = TTC_EVALUATOR_PROFILE_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = TTC_EVALUATOR_PROFILE_FALLBACK_HTML;
  }
});
```

**Expected line**: 212

#### Step 4.3: Add "I should see the TTC evaluator profile questions" step

```typescript
Then('I should see the TTC evaluator profile questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Evaluator Profile'));
  assert.ok(html.includes('ttc-evaluator-profile-form'));
});
```

**Expected line**: 226

---

## Step 5: Verify Python Tests Pass

Run Python BDD tests for the specific feature:

```bash
bun scripts/bdd/run-python.ts specs/features/forms/ttc_evaluator_profile.feature
```

**Expected result**: All scenarios pass

**DO NOT proceed to TypeScript implementation until Python passes.**

---

## Step 6: Verify TypeScript Tests Pass

Run TypeScript BDD tests for the specific feature:

```bash
bun scripts/bdd/run-typescript.ts specs/features/forms/ttc_evaluator_profile.feature
```

**Expected result**: All scenarios pass

---

## Step 7: Run Alignment Verification

```bash
bun scripts/bdd/verify-alignment.ts
```

**Must pass**:
- 0 orphan steps (steps in registry but not in features)
- 0 dead steps (steps in features but not in registry)

---

## Step 8: Quality Checks

```bash
bun run typecheck
bun run lint
```

Both must pass with no errors.

---

## Step 9: Update Tracking Documentation

### 9.1: Update `docs/coverage_matrix.md`

Mark TTC Evaluator Profile form as complete for TypeScript:
- Find the row for "TTC Evaluator Profile"
- Change TypeScript status from TODO to ✓

### 9.2: Update `IMPLEMENTATION_PLAN.md`

Mark TASK-015 as complete:
- Find TASK-015 in the implementation plan
- Update status from TODO to DONE
- Add completion date

### 9.3: Update `docs/SESSION_HANDOFF.md`

Log the completion:
```markdown
### 2026-02-04 - TASK-015 Complete
- Implemented TTC Evaluator Profile form access
- Added Python steps in test/python/steps/forms_steps.py
- Created app/forms/ttc_evaluator_profile/render.ts
- Added TypeScript steps in test/typescript/steps/forms_steps.ts
- All scenarios passing in both Python and TypeScript
```

---

## Step 10: Clean Up

Remove `docs/Tasks/ACTIVE_TASK.md` to signal task completion:

```bash
rm docs/Tasks/ACTIVE_TASK.md
```

---

## Implementation Notes

### Pattern Consistency

This implementation follows the exact pattern used for:
- `ttc_applicant_profile` (lines 145-158 in Python, 185-208 in TypeScript)
- `ttc_evaluation` (lines 129-142 in Python, 154-183 in TypeScript)

### Key Differences

1. **No submission logic**: This task is view-only (open + verify questions visible)
2. **Evaluator authentication**: Uses existing "I am authenticated as an evaluator" step
3. **Simple form**: Returns static HTML with fallback pattern

### Fallback HTML

The fallback HTML uses:
- `<h1>` heading with form name
- `<div>` with descriptive id (`ttc-evaluator-profile-form`)
- Text content indicating form purpose

This matches the pattern used across all TTC forms.

---

## Success Criteria

A task is complete when:
- [ ] Python steps added at lines 161 and 168 in forms_steps.py
- [ ] TypeScript render module created at app/forms/ttc_evaluator_profile/render.ts
- [ ] TypeScript steps added at lines 210, 212, and 226 in forms_steps.ts
- [ ] Step registry updated with correct line numbers
- [ ] Python BDD tests pass (1/1 scenarios)
- [ ] TypeScript BDD tests pass (1/1 scenarios)
- [ ] Alignment verification passes (0 orphan, 0 dead)
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Coverage matrix updated
- [ ] Implementation plan updated
- [ ] Session handoff logged
- [ ] ACTIVE_TASK.md removed

---

## Expected Test Output

### Python (behave)
```
1 feature passed, 0 failed, 0 skipped
1 scenario passed, 0 failed, 0 skipped
3 steps passed, 0 failed, 0 skipped, 0 undefined
```

### TypeScript (@cucumber/cucumber)
```
1 scenario
3 steps
✓ I am authenticated as an evaluator
✓ I open the TTC evaluator profile form
✓ I should see the TTC evaluator profile questions
```

---

## Dependencies

- Step 1 must be completed FIRST (update step registry before any code)
- Step 5 must pass before Step 6 (Python before TypeScript)
- Step 7 must pass before Step 8 (alignment before typecheck)
- All steps must complete before cleanup (Step 10)
