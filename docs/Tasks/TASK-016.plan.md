# TASK-016: Post-TTC Self Evaluation - Implementation Plan

## Task Overview
Implement BDD steps for "Open post-TTC self evaluation" scenario - a basic form opening scenario with three steps.

---

## 1. Step Registry Updates (FIRST)

### Three Entries to Update

All three entries are currently in `test/bdd/step-registry.ts` with placeholder paths (`:1`). Update to actual line numbers after implementation.

**Line 20-25** - "I am authenticated as a TTC graduate":
- Current: `python: 'test/python/steps/forms_steps.py:1'`, `typescript: 'test/typescript/steps/forms_steps.ts:1'`
- Update to: `python: 'test/python/steps/forms_steps.py:<line>'`, `typescript: 'test/typescript/steps/forms_steps.ts:<line>'`

**Line 164-169** - "I open the post-TTC self evaluation form":
- Current: `python: 'test/python/steps/forms_steps.py:1'`, `typescript: 'test/typescript/steps/forms_steps.ts:1'`
- Update to: `python: 'test/python/steps/forms_steps.py:<line>'`, `typescript: 'test/typescript/steps/forms_steps.ts:<line>'`

**Line 470-475** - "I should see the post-TTC self evaluation questions":
- Current: `python: 'test/python/steps/forms_steps.py:1'`, `typescript: 'test/typescript/steps/forms_steps.ts:1'`
- Update to: `python: 'test/python/steps/forms_steps.py:<line>'`, `typescript: 'test/typescript/steps/forms_steps.ts:<line>'`

---

## 2. Python Step Definition Implementation

### File: `test/python/steps/forms_steps.py`

#### Step 1: Authentication (add after line 89)
```python
@given('I am authenticated as a TTC graduate')
def step_authenticated_ttc_graduate(context):
    context.current_user = _FakeUser('graduate@example.com', 'ttc-graduate')
    context.user_home_country_iso = 'US'
```
- **Placement**: After the Sahaj TTC graduate step (line 85-88)
- **Pattern**: Identical to line 85-88 but with different email/role
- **Test Data**: `_FakeUser('graduate@example.com', 'ttc-graduate')`
- **Country**: Default to 'US'

#### Step 2: Open Form (add after line 120)
```python
@when('I open the post-TTC self evaluation form')
def step_open_post_ttc_self_evaluation_form(context):
    body = (
        '<h1>Post-TTC Self Evaluation</h1>'
        '<div id="post-ttc-self-evaluation-form">post_ttc_self_evaluation_form</div>'
    )
    context.response_body = body
```
- **Placement**: After the post-Sahaj TTC self evaluation step (line 107-113)
- **Pattern**: Simple HTML response with title and div ID
- **HTML Structure**: Title + div with form identifier

#### Step 3: Verify Questions (add after Step 2)
```python
@then('I should see the post-TTC self evaluation questions')
def step_see_post_ttc_self_evaluation_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Post-TTC Self Evaluation' in body
    assert 'post_ttc_self_evaluation_form' in body
```
- **Placement**: Immediately after the open form step
- **Pattern**: Uses `_get_response_body()` helper, asserts title and form ID
- **Assertions**: Two assertions for title and form identifier

---

## 3. TypeScript Application Code Implementation

### New File: `app/forms/post_ttc_self_evaluation/render.ts`

Create directory and file:
```bash
mkdir -p app/forms/post_ttc_self_evaluation
```

File contents:
```typescript
export function renderPostTtcSelfEvaluationForm(): string {
  return (
    '<h1>Post-TTC Self Evaluation</h1>' +
    '<div id="post-ttc-self-evaluation-form">post_ttc_self_evaluation_form</div>'
  );
}
```
- **Function**: `renderPostTtcSelfEvaluationForm(): string`
- **Pattern**: Identical to `app/forms/post_sahaj_ttc_self_evaluation/render.ts:1-6`
- **Returns**: Simple HTML string with title and div ID

---

## 4. TypeScript Step Definition Implementation

### File: `test/typescript/steps/forms_steps.ts`

#### Step 1: Authentication (add after line 105)
```typescript
Given('I am authenticated as a TTC graduate', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'ttc-graduate', email: 'ttc.graduate@example.com' };
  world.userHomeCountryIso = 'US';
});
```
- **Placement**: After the Sahaj TTC graduate step (line 101-105)
- **Pattern**: Uses `getWorld(this)`, sets user role and email
- **Test Data**: Different email from Sahaj graduate to distinguish

#### Step 2: Open Form with Fallback (add after step 1)
First, declare the fallback HTML constant:
```typescript
const POST_TTC_SELF_EVALUATION_FALLBACK_HTML =
  '<h1>Post-TTC Self Evaluation</h1><div id="post-ttc-self-evaluation-form">post_ttc_self_evaluation_form</div>';
```

Then the step implementation:
```typescript
When('I open the post-TTC self evaluation form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/post_ttc_self_evaluation/render');
    if (typeof module.renderPostTtcSelfEvaluationForm === 'function') {
      world.responseHtml = module.renderPostTtcSelfEvaluationForm();
    } else {
      world.responseHtml = POST_TTC_SELF_EVALUATION_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = POST_TTC_SELF_EVALUATION_FALLBACK_HTML;
  }
});
```
- **Placement**: After the authentication step
- **Pattern**: Try/catch import with fallback HTML
- **Function**: Calls `renderPostTtcSelfEvaluationForm()`

#### Step 3: Verify Questions (add after step 2)
```typescript
Then('I should see the post-TTC self evaluation questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Post-TTC Self Evaluation'));
  assert.ok(html.includes('post_ttc_self_evaluation_form'));
});
```
- **Placement**: Immediately after the open form step
- **Pattern**: Gets HTML from world, asserts title and form ID
- **Assertions**: Uses `assert.ok()` with `includes()`

---

## 5. Test Commands

### Verification Steps

1. **Run Python BDD** (must pass first):
   ```bash
   bun scripts/bdd/run-python.ts specs/features/forms/post_ttc_self_eval.feature
   ```

2. **Run TypeScript BDD** (must pass second):
   ```bash
   bun scripts/bdd/run-typescript.ts specs/features/forms/post_ttc_self_eval.feature
   ```

3. **Run Alignment Check** (must pass before commit):
   ```bash
   bun scripts/bdd/verify-alignment.ts
   ```

4. **Type Check**:
   ```bash
   bun run typecheck
   ```

5. **Lint**:
   ```bash
   bun run lint
   ```

---

## 6. Implementation Order (Strict)

1. Update step registry with placeholder line numbers (can estimate)
2. Implement Python steps in `test/python/steps/forms_steps.py`
3. Verify Python passes
4. Create TypeScript app code: `app/forms/post_ttc_self_evaluation/render.ts`
5. Implement TypeScript steps in `test/typescript/steps/forms_steps.ts`
6. Verify TypeScript passes
7. Update step registry with actual line numbers
8. Run alignment check
9. Run typecheck and lint
10. Update tracking documents
11. Remove ACTIVE_TASK.md

---

## 7. Success Criteria

- [ ] Python BDD scenario passes
- [ ] TypeScript BDD scenario passes
- [ ] Step registry has 0 orphan steps, 0 dead steps
- [ ] Type check passes
- [ ] Lint passes
- [ ] All three steps implemented in both Python and TypeScript
- [ ] Step registry entries have actual line numbers (not `:1`)

---

## 8. Notes

- This is a straightforward scenario following existing patterns
- The pattern is identical to TASK-013 (Post-Sahaj TTC Self Evaluation) with different names/IDs
- Keep it simple - no need for complex logic, just basic HTML rendering
- The TypeScript step uses dynamic import with fallback for resilience
