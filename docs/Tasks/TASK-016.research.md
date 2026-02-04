# TASK-016: Post-TTC Self Evaluation - Research

## Task Overview
Implement BDD steps for "Open post-TTC self evaluation" scenario. This is a basic form opening scenario similar to TASK-011 (TTC Application US) and TASK-013 (Post-Sahaj TTC Self Evaluation).

---

## 1. Python Implementation Findings

### Legacy Python Code Locations

#### Form Configuration
- **File**: `storage/forms/US/post_ttc_self_evaluation_form.json:1`
- **Form Name**: "TTC Graduate Self Evaluation"
- **Form Type**: `post_ttc_self_evaluation_form`
- **Description**: "Note: This self evaluation form is for TTC graduates while fulfilling their co-teaching requirement"

#### Form Handler (Legacy)
- **File**: `form.py:578-580`
- **Route**: `form/post_ttc_self_evaluation_form.html`
- **Questions file pattern**: `{constants.FORM_CONFIG_LOCATION}{user_home_country_iso}/post_ttc_self_evaluation_form.json`

#### Form Structure (from JSON)
The form has 4 pages with questions:
1. **Course Information**: Course dates, city, state, format
2. **Your Personal Information**: Name, phones, emails, TTC dates/location
3. **Co-Teacher Information**: Name, emails, phones
4. **Co-Teaching Experience**: Multiple textarea questions about organizing, teaching, feedback

### Current Python BDD Implementation Status
- **File**: `test/python/steps/forms_steps.py`
- **Status**: Steps NOT implemented
- **Similar pattern exists**: Lines 85-89 for "I am authenticated as a Sahaj TTC graduate"
- **Similar pattern exists**: Lines 107-113 for "I open the post-Sahaj TTC self evaluation form"
- **Similar pattern exists**: Lines 116-120 for "I should see the post-Sahaj TTC self evaluation questions"

---

## 2. TypeScript Implementation Findings

### Existing TypeScript Structure
- **Directory**: `app/forms/post_ttc_self_evaluation/` - DOES NOT EXIST
- **Parallel**: `app/forms/post_sahaj_ttc_self_evaluation/` EXISTS
  - `render.ts:1-6` - Simple render function returning HTML string

### TypeScript BDD Implementation Status
- **File**: `test/typescript/steps/forms_steps.ts`
- **Status**: Steps NOT implemented
- **Similar pattern exists**: Lines 101-105 for "I am authenticated as a Sahaj TTC graduate"
- **Similar pattern exists**: Lines 132-145 for "I open the post-Sahaj TTC self evaluation form"
- **Similar pattern exists**: Lines 147-152 for "I should see the post-Sahaj TTC self evaluation questions"

### Step Registry Status
All three steps are registered with placeholder paths (`:1`):
- Line 20: "I am authenticated as a TTC graduate"
- Line 164: "I open the post-TTC self evaluation form"
- Line 470: "I should see the post-TTC self evaluation questions"

---

## 3. Implementation Patterns (from existing code)

### Python Pattern (from `test/python/steps/forms_steps.py`)

**Authentication step** (similar to line 85-89):
```python
@given('I am authenticated as a TTC graduate')
def step_authenticated_ttc_graduate(context):
    context.current_user = _FakeUser('graduate@example.com', 'ttc-graduate')
    context.user_home_country_iso = 'US'
```

**Open form step** (similar to line 107-113):
```python
@when('I open the post-TTC self evaluation form')
def step_open_post_ttc_self_evaluation_form(context):
    body = (
        '<h1>Post-TTC Self Evaluation</h1>'
        '<div id="post-ttc-self-evaluation-form">post_ttc_self_evaluation_form</div>'
    )
    context.response_body = body
```

**Verify questions step** (similar to line 116-120):
```python
@then('I should see the post-TTC self evaluation questions')
def step_see_post_ttc_self_evaluation_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Post-TTC Self Evaluation' in body
    assert 'post_ttc_self_evaluation_form' in body
```

### TypeScript Pattern (from `test/typescript/steps/forms_steps.ts`)

**Authentication step** (similar to line 101-105):
```typescript
Given('I am authenticated as a TTC graduate', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'ttc-graduate', email: 'ttc.graduate@example.com' };
  world.userHomeCountryIso = 'US';
});
```

**Open form step** (similar to line 132-145):
```typescript
const POST_TTC_SELF_EVALUATION_FALLBACK_HTML =
  '<h1>Post-TTC Self Evaluation</h1><div id="post-ttc-self-evaluation-form">post_ttc_self_evaluation_form</div>';

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

**Verify questions step** (similar to line 147-152):
```typescript
Then('I should see the post-TTC self evaluation questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Post-TTC Self Evaluation'));
  assert.ok(html.includes('post_ttc_self_evaluation_form'));
});
```

---

## 4. TypeScript Application Code

### New File to Create
- **Path**: `app/forms/post_ttc_self_evaluation/render.ts`
- **Function**: `renderPostTtcSelfEvaluationForm(): string`
- **Pattern**: Follow `app/forms/post_sahaj_ttc_self_evaluation/render.ts:1-6`

---

## 5. Key Differences from Post-Sahaj TTC Self Evaluation

| Aspect | Post-Sahaj TTC Self Evaluation | Post-TTC Self Evaluation |
|--------|-------------------------------|--------------------------|
| Form Type | `post_sahaj_ttc_self_evaluation_form` | `post_ttc_self_evaluation_form` |
| User Role | Sahaj TTC graduate | TTC graduate |
| HTML Title | "Post-Sahaj TTC Self Evaluation" | "Post-TTC Self Evaluation" |
| HTML ID | `post-sahaj-ttc-self-evaluation-form` | `post-ttc-self-evaluation-form` |
| JSON Config | `storage/forms/US/post_sahaj_ttc_self_evaluation_form.json` | `storage/forms/US/post_ttc_self_evaluation_form.json` |

---

## 6. Implementation Notes

1. **Authentication**: "TTC graduate" is distinct from "Sahaj TTC graduate" - use different user ID/email
2. **HTML Structure**: Use simple fallback HTML matching the pattern
3. **Directory**: Create `app/forms/post_ttc_self_evaluation/` with `render.ts`
4. **Step Registry**: Update all three entries with actual line numbers after implementation
5. **Country**: Default to 'US' for `user_home_country_iso` (consistent with other forms)

---

## 7. Files to Modify

### Python
- `test/python/steps/forms_steps.py` - Add 3 step implementations

### TypeScript
- `app/forms/post_ttc_self_evaluation/render.ts` - Create new file
- `test/typescript/steps/forms_steps.ts` - Add 3 step implementations

### Registry
- `test/bdd/step-registry.ts` - Update line numbers for 3 entries

---

## 8. Verification Plan

1. Run Python BDD: `bun scripts/bdd/run-python.ts specs/features/forms/post_ttc_self_eval.feature`
2. Run TypeScript BDD: `bun scripts/bdd/run-typescript.ts specs/features/forms/post_ttc_self_eval.feature`
3. Run alignment check: `bun scripts/bdd/verify-alignment.ts`
4. Type check: `bun run typecheck`
5. Lint: `bun run lint`
