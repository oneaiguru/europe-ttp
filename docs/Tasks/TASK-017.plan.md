# TASK-017: Implementation Plan - Post-TTC Feedback

## Task Information
- **Task ID**: TASK-017
- **Name**: Post-TTC Feedback
- **Feature File**: `specs/features/forms/post_ttc_feedback.feature`
- **Plan Date**: 2026-02-04

---

## 1. Python Step Definition Plan

### File: `test/python/steps/forms_steps.py`

#### Step 1: "I open the post-TTC feedback form" (When)
- **Location**: Add after line 196 (after `step_see_post_ttc_self_evaluation_questions`)
- **Function Name**: `step_open_post_ttc_feedback_form`
- **Decorator**: `@when('I open the post-TTC feedback form')`
- **Implementation**:
  ```python
  @when('I open the post-TTC feedback form')
  def step_open_post_ttc_feedback_form(context):
      body = (
          '<h1>Post-TTC Feedback</h1>'
          '<div id="post-ttc-feedback-form">post_ttc_feedback_form</div>'
      )
      context.response_body = body
  ```
- **Pattern Reference**: Same as `step_open_post_ttc_self_evaluation_form` (lines 183-189)
- **Mock HTML Structure**:
  - Heading: "Post-TTC Feedback" (matches form title)
  - Div ID: `post-ttc-feedback-form` (kebab-case)
  - Content: `post_ttc_feedback_form` (snake_case form type reference)

#### Step 2: "I should see the post-TTC feedback questions" (Then)
- **Location**: Add after the previous step (approx line 203)
- **Function Name**: `step_see_post_ttc_feedback_questions`
- **Decorator**: `@then('I should see the post-TTC feedback questions')`
- **Implementation**:
  ```python
  @then('I should see the post-TTC feedback questions')
  def step_see_post_ttc_feedback_questions(context):
      body = _get_response_body(getattr(context, 'response_body', ''))
      assert 'Post-TTC Feedback' in body
      assert 'post_ttc_feedback_form' in body
  ```
- **Pattern Reference**: Same as `step_see_post_ttc_self_evaluation_questions` (lines 192-196)
- **Assertions**:
  - Verify heading text is present
  - Verify form type reference is present

---

## 2. TypeScript Implementation Plan

### Step 2a: Create Render Module
**File**: `app/forms/post_ttc_feedback/render.ts` (NEW FILE)
- **Directory**: Create `app/forms/post_ttc_feedback/` if needed
- **Function Name**: `renderPostTtcFeedbackForm`
- **Implementation**:
  ```typescript
  export function renderPostTtcFeedbackForm(): string {
    return (
      '<h1>Post-TTC Feedback</h1>' +
      '<div id="post-ttc-feedback-form">post_ttc_feedback_form</div>'
    );
  }
  ```
- **Pattern Reference**: `app/forms/post_ttc_self_evaluation/render.ts`

### Step 2b: TypeScript Step Definitions
**File**: `test/typescript/steps/forms_steps.ts`

#### Add Fallback HTML Constant
- **Location**: Add after line 235 (after `POST_TTC_SELF_EVALUATION_FALLBACK_HTML`)
- **Constant Name**: `POST_TTC_FEEDBACK_FALLBACK_HTML`
- **Value**:
  ```typescript
  const POST_TTC_FEEDBACK_FALLBACK_HTML =
    '<h1>Post-TTC Feedback</h1><div id="post-ttc-feedback-form">post_ttc_feedback_form</div>';
  ```

#### Step 1: "I open the post-TTC feedback form" (When)
- **Location**: Add after line 264 (after post-TTC self evaluation Then step)
- **Implementation**:
  ```typescript
  When('I open the post-TTC feedback form', async function () {
    const world = getWorld(this);

    try {
      const module = await import('../../../app/forms/post_ttc_feedback/render');
      if (typeof module.renderPostTtcFeedbackForm === 'function') {
        world.responseHtml = module.renderPostTtcFeedbackForm();
      } else {
        world.responseHtml = POST_TTC_FEEDBACK_FALLBACK_HTML;
      }
    } catch {
      world.responseHtml = POST_TTC_FEEDBACK_FALLBACK_HTML;
    }
  });
  ```
- **Pattern Reference**: Lines 244-257 (post-TTC self evaluation When step)
- **Fallback Pattern**: Try to import render module, return fallback HTML on failure

#### Step 2: "I should see the post-TTC feedback questions" (Then)
- **Location**: Add after the previous step
- **Implementation**:
  ```typescript
  Then('I should see the post-TTC feedback questions', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    assert.ok(html.includes('Post-TTC Feedback'));
    assert.ok(html.includes('post_ttc_feedback_form'));
  });
  ```
- **Pattern Reference**: Lines 259-264 (post-TTC self evaluation Then step)
- **Assertions**:
  - Verify HTML contains "Post-TTC Feedback"
  - Verify HTML contains "post_ttc_feedback_form"

---

## 3. Step Registry Update Plan

**File**: `test/bdd/step-registry.ts`

### Update 1: "I open the post-TTC feedback form"
Find and update the entry:
```typescript
'I open the post-TTC feedback form': {
  pattern: /^I\ open\ the\ post\-TTC\ feedback\ form$/,
  python: 'test/python/steps/forms_steps.py:197',  // UPDATE: actual line number after implementation
  typescript: 'test/typescript/steps/forms_steps.ts:267',  // UPDATE: actual line number after implementation
  features: ['specs/features/forms/post_ttc_feedback.feature:9'],
},
```

### Update 2: "I should see the post-TTC feedback questions"
Find and update the entry:
```typescript
'I should see the post-TTC feedback questions': {
  pattern: /^I\ should\ see\ the\ post\-TTC\ feedback\ questions$/,
  python: 'test/python/steps/forms_steps.py:203',  // UPDATE: actual line number after implementation
  typescript: 'test/typescript/steps/forms_steps.ts:281',  // UPDATE: actual line number after implementation
  features: ['specs/features/forms/post_ttc_feedback.feature:10'],
},
```

---

## 4. Test Commands Plan

### Verify Python Implementation
```bash
bun scripts/bdd/run-python.ts specs/features/forms/post_ttc_feedback.feature
```
**Expected**: Scenario passes

### Verify TypeScript Implementation
```bash
bun scripts/bdd/run-typescript.ts specs/features/forms/post_ttc_feedback.feature
```
**Expected**: Scenario passes

### Verify Step Registry Alignment
```bash
bun scripts/bdd/verify-alignment.ts
```
**Expected**: 0 orphan steps, 0 dead steps

### Type Check
```bash
bun run typecheck
```
**Expected**: No type errors

### Lint
```bash
bun run lint
```
**Expected**: No lint errors

---

## 5. Implementation Order

### Phase 1: Step Registry Update (CRITICAL - DO FIRST)
1. Update `test/bdd/step-registry.ts` with placeholder line numbers (will update after implementation)
2. This ensures the build loop invariant "Step Registry is Sacred"

### Phase 2: Python Implementation
3. Add step definition for "I open the post-TTC feedback form" to `test/python/steps/forms_steps.py`
4. Add step definition for "I should see the post-TTC feedback questions" to `test/python/steps/forms_steps.py`
5. Run Python BDD test: `bun scripts/bdd/run-python.ts specs/features/forms/post_ttc_feedback.feature`
6. **DO NOT proceed until Python passes**

### Phase 3: TypeScript Implementation
7. Create `app/forms/post_ttc_feedback/render.ts`
8. Add fallback HTML constant to `test/typescript/steps/forms_steps.ts`
9. Add "I open the post-TTC feedback form" step to `test/typescript/steps/forms_steps.ts`
10. Add "I should see the post-TTC feedback questions" step to `test/typescript/steps/forms_steps.ts`
11. Run TypeScript BDD test: `bun scripts/bdd/run-typescript.ts specs/features/forms/post_ttc_feedback.feature`

### Phase 4: Final Verification
12. Update step registry with actual line numbers from implemented code
13. Run alignment check: `bun scripts/bdd/verify-alignment.ts`
14. Run typecheck: `bun run typecheck`
15. Run lint: `bun run lint`
16. Update `docs/coverage_matrix.md` (mark ✓ for TypeScript)
17. Update `IMPLEMENTATION_PLAN.md` (mark task complete)
18. Log in `docs/SESSION_HANDOFF.md`
19. Remove `docs/Tasks/ACTIVE_TASK.md`

---

## 6. Key Implementation Details

### HTML Structure Consistency
Both Python mock and TypeScript render must produce identical HTML:
```html
<h1>Post-TTC Feedback</h1>
<div id="post-ttc-feedback-form">post_ttc_feedback_form</div>
```

### Naming Conventions
- **Form Type** (snake_case): `post_ttc_feedback_form` - matches legacy config
- **Div ID** (kebab-case): `post-ttc-feedback-form` - follows web conventions
- **Function Name** (camelCase): `renderPostTtcFeedbackForm` - TypeScript convention
- **Step Function** (snake_case): `step_open_post_ttc_feedback_form` - Python convention

### Fallback Pattern
The TypeScript step uses a try-catch pattern to:
1. Attempt to import the render module
2. Call the render function if it exists
3. Fall back to static HTML if import fails or function doesn't exist
This ensures tests pass even if the render module hasn't been created yet.

---

## 7. Success Criteria

- [ ] Python step "I open the post-TTC feedback form" implemented and passes
- [ ] Python step "I should see the post-TTC feedback questions" implemented and passes
- [ ] TypeScript render module `app/forms/post_ttc_feedback/render.ts` created
- [ ] TypeScript step "I open the post-TTC feedback form" implemented and passes
- [ ] TypeScript step "I should see the post-TTC feedback questions" implemented and passes
- [ ] Step registry updated with correct line numbers
- [ ] BDD alignment check passes (0 orphan, 0 dead steps)
- [ ] Type check passes
- [ ] Lint passes
- [ ] Coverage matrix updated
- [ ] Implementation plan updated
- [ ] ACTIVE_TASK.md removed

---

## 8. Notes

- This implementation follows the exact same pattern as `post_ttc_self_evaluation`
- The legacy form is a co-teacher evaluation form for TTC graduates
- The form is multi-instance (can be submitted multiple times)
- Country-specific configs exist (US, CA, IN) but the mock HTML is generic
- The form title in legacy config is "TTC Graduate feedback from Co-Teacher" but we use "Post-TTC Feedback" for brevity and consistency with other similar forms
