# TASK-E2E-012: Implementation Plan

## Task: Form Prerequisites and Conditional Availability

### Feature File
`specs/features/e2e/form_prerequisites_conditional.feature`

### Planning Date
2025-02-04

---

## Overview

This task implements **NEW functionality** for form prerequisites based on course completions and home country filtering. Since the legacy codebase does not have this feature, both Python and TypeScript implementations will be test-side mock implementations.

---

## 1. Step Registry Updates (FIRST)

### Add New Step Entries

Add the following entries to `test/bdd/step-registry.ts`:

```typescript
// Course Completion State Steps
'When I have NOT completed the Happiness Program': {
  pattern: /^I\ have\ NOT\ completed\ the\ Happiness\ Program$/,
  python: 'test/python/steps/form_prerequisites_steps.py:15',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:45',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:8', 'specs/features/e2e/form_prerequisites_conditional.feature:22'],
},
'When I have completed Part 1 but NOT Part 2': {
  pattern: /^I\ have\ completed\ Part\ 1\ but\ NOT\ Part\ 2$/,
  python: 'test/python/steps/form_prerequisites_steps.py:25',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:55',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:15'],
},
'When I have NOT completed Part 1': {
  pattern: /^I\ have\ NOT\ completed\ Part\ 1$/,
  python: 'test/python/steps/form_prerequisites_steps.py:35',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:65',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:29'],
},
'When I complete the Happiness Program': {
  pattern: /^I\ complete\ the\ Happiness\ Program$/,
  python: 'test/python/steps/form_prerequisites_steps.py:45',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:75',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:10', 'specs/features/e2e/form_prerequisites_conditional.feature:24'],
},
'When I complete Part 2': {
  pattern: /^I\ complete\ Part\ 2$/,
  python: 'test/python/steps/form_prerequisites_steps.py:55',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:85',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:17'],
},
'When I complete Part 1': {
  pattern: /^I\ complete\ Part\ 1$/,
  python: 'test/python/steps/form_prerequisites_steps.py:65',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:95',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:31'],
},

// Form Availability Assertions
'Then the DSN application form should NOT be available': {
  pattern: /^the\ DSN\ application\ form\ should\ NOT\ be\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:75',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:105',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:9'],
},
'Then the DSN application form should become available': {
  pattern: /^the\ DSN\ application\ form\ should\ become\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:85',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:115',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:11'],
},
'Then the YES+ application form should NOT be available': {
  pattern: /^the\ YES\+\ application\ form\ should\ NOT\ be\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:95',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:125',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:16'],
},
'Then the YES+ application form should become available': {
  pattern: /^the\ YES\+\ application\ form\ should\ become\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:105',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:135',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:18'],
},
'Then the Part 1 course application should NOT be available': {
  pattern: /^the\ Part\ 1\ course\ application\ should\ NOT\ be\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:115',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:145',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:23'],
},
'Then the Part 1 course application should become available': {
  pattern: /^the\ Part\ 1\ course\ application\ should\ become\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:125',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:155',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:25'],
},
'Then the Part 2 course application should NOT be available': {
  pattern: /^the\ Part\ 2\ course\ application\ should\ NOT\ be\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:135',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:165',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:30'],
},
'Then the Part 2 course application should become available': {
  pattern: /^the\ Part\ 2\ course\ application\ should\ become\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:145',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:175',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:32'],
},

// Country-Based Availability Steps
'When my home country is {string}': {
  pattern: /^my\ home\ country\ is\ "([^"]*)"$/,
  python: 'test/python/steps/form_prerequisites_steps.py:155',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:185',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:36'],
},
'Then US-specific TTC options should be available': {
  pattern: /^US\-specific\ TTC\ options\ should\ be\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:165',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:195',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:37'],
},
'And India-specific TTC options should NOT be available': {
  pattern: /^India\-specific\ TTC\ options\ should\ NOT\ be\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:175',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:205',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:38'],
},
'Then India-specific TTC options should become available': {
  pattern: /^India\-specific\ TTC\ options\ should\ become\ available$/,
  python: 'test/python/steps/form_prerequisites_steps.py:185',
  typescript: 'test/typescript/steps/form_prerequisites_steps.ts:215',
  features: ['specs/features/e2e/form_prerequisites_conditional.feature:40'],
},
```

---

## 2. Python Step Implementation

### File: `test/python/steps/form_prerequisites_steps.py`

#### Data Structure
```python
from behave import given, when, then

# Initialize context for course completions
def init_prerequisites_context(context):
    if not hasattr(context, 'course_completions'):
        context.course_completions = {
            'happiness_program': False,
            'part_1': False,
            'part_2': False
        }
    if not hasattr(context, 'available_forms'):
        context.available_forms = []
    if not hasattr(context, 'home_country'):
        context.home_country = 'US'
```

#### Step 1: NOT completed Happiness Program
```python
@when('I have NOT completed the Happiness Program')
def step_not_completed_happiness(context):
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = False
```

#### Step 2: Completed Part 1 but NOT Part 2
```python
@when('I have completed Part 1 but NOT Part 2')
def step_part_1_not_part_2(context):
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = True
    context.course_completions['part_1'] = True
    context.course_completions['part_2'] = False
```

#### Step 3: NOT completed Part 1
```python
@when('I have NOT completed Part 1')
def step_not_completed_part_1(context):
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = True
    context.course_completions['part_1'] = False
    context.course_completions['part_2'] = False
```

#### Step 4: Complete Happiness Program
```python
@when('I complete the Happiness Program')
def step_complete_happiness(context):
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = True
```

#### Step 5: Complete Part 2
```python
@when('I complete Part 2')
def step_complete_part_2(context):
    init_prerequisites_context(context)
    context.course_completions['part_2'] = True
```

#### Step 6: Complete Part 1
```python
@when('I complete Part 1')
def step_complete_part_1(context):
    init_prerequisites_context(context)
    context.course_completions['part_1'] = True
```

#### Step 7: DSN form NOT available
```python
@then('the DSN application form should NOT be available')
def step_dsn_not_available(context):
    assert 'dsn_application' not in context.available_forms, \
        'DSN application should not be available'
```

#### Step 8: DSN form becomes available
```python
@then('the DSN application form should become available')
def step_dsn_available(context):
    assert context.course_completions.get('happiness_program'), \
        'Happiness Program must be completed for DSN'
    assert 'dsn_application' in context.available_forms, \
        'DSN application should be available'
```

#### Step 9: YES+ form NOT available
```python
@then('the YES+ application form should NOT be available')
def step_yes_plus_not_available(context):
    assert 'yes_plus_application' not in context.available_forms, \
        'YES+ application should not be available'
```

#### Step 10: YES+ form becomes available
```python
@then('the YES+ application form should become available')
def step_yes_plus_available(context):
    assert context.course_completions.get('part_1'), \
        'Part 1 must be completed for YES+'
    assert context.course_completions.get('part_2'), \
        'Part 2 must be completed for YES+'
    assert 'yes_plus_application' in context.available_forms, \
        'YES+ application should be available'
```

#### Step 11: Part 1 NOT available
```python
@then('the Part 1 course application should NOT be available')
def step_part_1_not_available(context):
    assert 'part_1_application' not in context.available_forms, \
        'Part 1 application should not be available'
```

#### Step 12: Part 1 becomes available
```python
@then('the Part 1 course application should become available')
def step_part_1_available(context):
    assert context.course_completions.get('happiness_program'), \
        'Happiness Program must be completed for Part 1'
    assert 'part_1_application' in context.available_forms, \
        'Part 1 application should be available'
```

#### Step 13: Part 2 NOT available
```python
@then('the Part 2 course application should NOT be available')
def step_part_2_not_available(context):
    assert 'part_2_application' not in context.available_forms, \
        'Part 2 application should not be available'
```

#### Step 14: Part 2 becomes available
```python
@then('the Part 2 course application should become available')
def step_part_2_available(context):
    assert context.course_completions.get('part_1'), \
        'Part 1 must be completed for Part 2'
    assert 'part_2_application' in context.available_forms, \
        'Part 2 application should be available'
```

#### Step 15: Set home country
```python
@when('my home country is {string}')
def step_set_home_country(context, country):
    init_prerequisites_context(context)
    context.home_country = country
```

#### Step 16: US-specific TTC options available
```python
@then('US-specific TTC options should be available')
def step_us_ttc_available(context):
    assert context.home_country == 'US', \
        'Home country should be US'
    us_options = [opt for opt in context.available_forms
                  if hasattr(opt, 'display_countries') and 'US' in opt.get('display_countries', [])]
    assert len(us_options) > 0, 'Should have US-specific TTC options'
```

#### Step 17: India-specific TTC options NOT available
```python
@then('India-specific TTC options should NOT be available')
def step_india_ttc_not_available(context):
    india_options = [opt for opt in context.available_forms
                     if hasattr(opt, 'display_countries') and 'IN' in opt.get('display_countries', [])]
    assert len(india_options) == 0, 'Should not have India-specific TTC options'
```

#### Step 18: India-specific TTC options become available
```python
@then('India-specific TTC options should become available')
def step_india_ttc_available(context):
    assert context.home_country == 'IN', \
        'Home country should be IN'
    india_options = [opt for opt in context.available_forms
                     if hasattr(opt, 'display_countries') and 'IN' in opt.get('display_countries', [])]
    assert len(india_options) > 0, 'Should have India-specific TTC options'
```

---

## 3. TypeScript Step Implementation

### File: `test/typescript/steps/form_prerequisites_steps.ts`

#### Type Definitions
```typescript
interface CourseCompletions {
  happiness_program: boolean;
  part_1: boolean;
  part_2: boolean;
}

interface TestContextWithPrerequisites {
  course_completions?: CourseCompletions;
  available_forms?: string[];
  home_country?: string;
}

const prerequisitesContext: TestContextWithPrerequisites = {
  course_completions: {
    happiness_program: false,
    part_1: false,
    part_2: false,
  },
  available_forms: [],
  home_country: 'US',
};
```

#### Step 1: NOT completed Happiness Program
```typescript
When('I have NOT completed the Happiness Program', () => {
  prerequisitesContext.course_completions = {
    happiness_program: false,
    part_1: false,
    part_2: false,
  };
});
```

#### Step 2: Completed Part 1 but NOT Part 2
```typescript
When('I have completed Part 1 but NOT Part 2', () => {
  prerequisitesContext.course_completions = {
    happiness_program: true,
    part_1: true,
    part_2: false,
  };
});
```

#### Step 3: NOT completed Part 1
```typescript
When('I have NOT completed Part 1', () => {
  prerequisitesContext.course_completions = {
    happiness_program: true,
    part_1: false,
    part_2: false,
  };
});
```

#### Step 4: Complete Happiness Program
```typescript
When('I complete the Happiness Program', () => {
  if (prerequisitesContext.course_completions) {
    prerequisitesContext.course_completions.happiness_program = true;
  }
  // Update available forms based on new state
  updateAvailableForms();
});
```

#### Step 5: Complete Part 2
```typescript
When('I complete Part 2', () => {
  if (prerequisitesContext.course_completions) {
    prerequisitesContext.course_completions.part_2 = true;
  }
  updateAvailableForms();
});
```

#### Step 6: Complete Part 1
```typescript
When('I complete Part 1', () => {
  if (prerequisitesContext.course_completions) {
    prerequisitesContext.course_completions.part_1 = true;
  }
  updateAvailableForms();
});
```

#### Helper: Update Available Forms
```typescript
function updateAvailableForms(): void {
  const completions = prerequisitesContext.course_completions;
  const forms: string[] = [];

  if (!completions) return;

  // Base forms always available
  forms.push('ttc_application_us');

  // DSN requires Happiness Program
  if (completions.happiness_program) {
    forms.push('dsn_application');
  }

  // Part 1 requires Happiness Program
  if (completions.happiness_program) {
    forms.push('part_1_application');
  }

  // Part 2 requires Part 1
  if (completions.part_1) {
    forms.push('part_2_application');
  }

  // YES++ requires both Part 1 and Part 2
  if (completions.part_1 && completions.part_2) {
    forms.push('yes_plus_application');
  }

  prerequisitesContext.available_forms = forms;
}
```

#### Step 7: DSN form NOT available
```typescript
Then('the DSN application form should NOT be available', () => {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('dsn_application')) {
    throw new Error('DSN application should not be available');
  }
});
```

#### Step 8: DSN form becomes available
```typescript
Then('the DSN application form should become available', () => {
  const completions = prerequisitesContext.course_completions;
  if (!completions?.happiness_program) {
    throw new Error('Happiness Program must be completed for DSN');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('dsn_application')) {
    throw new Error('DSN application should be available');
  }
});
```

#### Step 9: YES+ form NOT available
```typescript
Then('the YES+ application form should NOT be available', () => {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('yes_plus_application')) {
    throw new Error('YES+ application should not be available');
  }
});
```

#### Step 10: YES+ form becomes available
```typescript
Then('the YES+ application form should become available', () => {
  const completions = prerequisitesContext.course_completions;
  if (!completions?.part_1 || !completions?.part_2) {
    throw new Error('Part 1 and Part 2 must be completed for YES+');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('yes_plus_application')) {
    throw new Error('YES+ application should be available');
  }
});
```

#### Step 11: Part 1 NOT available
```typescript
Then('the Part 1 course application should NOT be available', () => {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('part_1_application')) {
    throw new Error('Part 1 application should not be available');
  }
});
```

#### Step 12: Part 1 becomes available
```typescript
Then('the Part 1 course application should become available', () => {
  const completions = prerequisitesContext.course_completions;
  if (!completions?.happiness_program) {
    throw new Error('Happiness Program must be completed for Part 1');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('part_1_application')) {
    throw new Error('Part 1 application should be available');
  }
});
```

#### Step 13: Part 2 NOT available
```typescript
Then('the Part 2 course application should NOT be available', () => {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('part_2_application')) {
    throw new Error('Part 2 application should not be available');
  }
});
```

#### Step 14: Part 2 becomes available
```typescript
Then('the Part 2 course application should become available', () => {
  const completions = prerequisitesContext.course_completions;
  if (!completions?.part_1) {
    throw new Error('Part 1 must be completed for Part 2');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('part_2_application')) {
    throw new Error('Part 2 application should be available');
  }
});
```

#### Step 15: Set home country
```typescript
When('my home country is {string}', (country: string) => {
  prerequisitesContext.home_country = country;
});
```

#### Step 16: US-specific TTC options available
```typescript
Then('US-specific TTC options should be available', () => {
  if (prerequisitesContext.home_country !== 'US') {
    throw new Error('Home country should be US');
  }
  const forms = prerequisitesContext.available_forms || [];
  const usOptions = forms.filter(f => f.includes('us') || f.includes('US'));
  if (usOptions.length === 0) {
    throw new Error('Should have US-specific TTC options');
  }
});
```

#### Step 17: India-specific TTC options NOT available
```typescript
Then('India-specific TTC options should NOT be available', () => {
  const forms = prerequisitesContext.available_forms || [];
  const indiaOptions = forms.filter(f => f.includes('in') || f.includes('IN'));
  if (indiaOptions.length > 0) {
    throw new Error('Should not have India-specific TTC options');
  }
});
```

#### Step 18: India-specific TTC options become available
```typescript
Then('India-specific TTC options should become available', () => {
  if (prerequisitesContext.home_country !== 'IN') {
    throw new Error('Home country should be IN');
  }
  const forms = prerequisitesContext.available_forms || [];
  const indiaOptions = forms.filter(f => f.includes('in') || f.includes('IN'));
  if (indiaOptions.length === 0) {
    throw new Error('Should have India-specific TTC options');
  }
});
```

---

## 4. Test Verification Commands

### Run Python BDD Tests
```bash
bun scripts/bdd/run-python.ts specs/features/e2e/form_prerequisites_conditional.feature
```

### Run TypeScript BDD Tests
```bash
bun scripts/bdd/run-typescript.ts specs/features/e2e/form_prerequisites_conditional.feature
```

### Verify Alignment
```bash
bun scripts/bdd/verify-alignment.ts
```

### Type Check
```bash
bun run typecheck
```

### Lint
```bash
bun run lint
```

---

## 5. Implementation Order

1. **Update step registry** in `test/bdd/step-registry.ts`
2. **Create Python step file** `test/python/steps/form_prerequisites_steps.py`
3. **Implement all Python steps** (18 steps total)
4. **Run Python tests** - verify all scenarios pass
5. **Create TypeScript step file** `test/typescript/steps/form_prerequisites_steps.ts`
6. **Implement all TypeScript steps** (18 steps total)
7. **Run TypeScript tests** - verify all scenarios pass
8. **Run alignment check** - verify 0 orphan/dead steps
9. **Run typecheck and lint**
10. **Update coverage matrix** and `IMPLEMENTATION_PLAN.md`

---

## 6. Success Criteria

- [ ] All 5 scenarios pass in Python BDD tests
- [ ] All 5 scenarios pass in TypeScript BDD tests
- [ ] Step registry updated with all 18 new steps
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes
- [ ] `coverage_matrix.md` updated with TypeScript implementation
- [ ] `IMPLEMENTATION_PLAN.md` marked TASK-E2E-012 complete
- [ ] `docs/Tasks/ACTIVE_TASK.md` removed

---

## 7. Notes

- Both Python and TypeScript implementations are **test-side mocks** since this is new functionality not present in the legacy codebase
- The `updateAvailableForms()` helper in TypeScript centralizes the business logic for form eligibility
- Country-based availability leverages the existing home country filtering pattern from `form.py:223-225`
- Course completion chain is: `Happiness Program → Part 1 → Part 2 → YES++`
