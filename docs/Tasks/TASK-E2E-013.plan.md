# TASK-E2E-013: Implementation Plan

## Task: Course Eligibility by User Profile

## Overview
Implement an eligibility dashboard that shows users which courses/forms they are eligible for based on their completed prerequisites. This is **NEW functionality** not present in the legacy codebase.

---

## Python Step Definition Plan

### File: `test/python/steps/eligibility_dashboard_steps.py` (NEW)

#### Context Structure
```python
context.eligibility_dashboard = {
    'courses': [
        {'name': 'TTC Application', 'prerequisite': 'None', 'status': 'Eligible'},
        {'name': 'TTC Evaluation', 'prerequisite': 'TTC Application submitted', 'status': 'Not Eligible'},
        # ...
    ],
    'form_messages': {
        'dsn_application': {
            'available': False,
            'message': 'not available',
            'explanation': 'Complete Happiness Program first'
        }
    }
}
```

#### Step Functions to Implement

1. **`@when('I view my course eligibility dashboard')`**
   - Initialize `context.eligibility_dashboard` with course list
   - Calculate eligibility based on `context.course_completions`
   - Return mock dashboard data

2. **`@then('I should see a list of available courses with prerequisites:')`**
   - Accept data table with: course, prerequisite, status
   - Compare against `context.eligibility_dashboard['courses']`
   - Assert all expected courses are present with correct status

3. **`@when('I attempt to access the DSN application form')`**
   - Store form access attempt in context
   - Check eligibility based on `context.course_completions`

4. **`@then('I should see "not available" message')`**
   - Assert `context.form_messages[form]['message'] == 'not available'`

5. **`@then('the message should explain the prerequisite: "{string}"')`**
   - Assert explanation matches expected text

6. **`@then('the DSN form shows as "not available"')`**
   - Assert DSN is not in `context.available_forms`

7. **`@when('I refresh the eligibility dashboard')`**
   - Re-calculate eligibility based on current `context.course_completions`
   - Update `context.eligibility_dashboard`

8. **`@then('the DSN form should show as "available"')`**
   - Assert DSN is in `context.available_forms`

#### Reusable Functions
```python
def get_eligibility_courses(context):
    """Return list of courses with eligibility status."""
    completions = getattr(context, 'course_completions', {
        'happiness_program': False,
        'part_1': False,
        'part_2': False
    })

    courses = [
        {
            'name': 'TTC Application',
            'prerequisite': 'None',
            'status': 'Eligible'
        },
        {
            'name': 'TTC Evaluation',
            'prerequisite': 'TTC Application submitted',
            'status': 'Eligible' if completions.get('ttc_submitted') else 'Not Eligible'
        },
        {
            'name': 'DSN Application',
            'prerequisite': 'Happiness Program completed',
            'status': 'Eligible' if completions.get('happiness_program') else 'Not Eligible'
        },
        {
            'name': 'Part 1',
            'prerequisite': 'Happiness Program completed',
            'status': 'Eligible' if completions.get('happiness_program') else 'Not Eligible'
        },
        {
            'name': 'Part 2',
            'prerequisite': 'Part 1 completed',
            'status': 'Eligible' if completions.get('part_1') else 'Not Eligible'
        }
    ]

    return courses
```

---

## TypeScript Step Definition Plan

### File: `test/typescript/steps/eligibility_dashboard_steps.ts` (NEW)

#### Context Structure
```typescript
interface EligibilityDashboard {
  courses: Array<{
    name: string;
    prerequisite: string;
    status: string;
  }>;
  formMessages: Record<string, {
    available: boolean;
    message: string;
    explanation: string;
  }>;
}

const eligibilityDashboardContext: EligibilityDashboard = {
  courses: [],
  formMessages: {},
};
```

#### Step Functions to Implement

1. **`When('I view my course eligibility dashboard', function ()`**
   - Initialize dashboard with course list
   - Calculate eligibility based on course completions

2. **`Then('I should see a list of available courses with prerequisites:', function (dataTable)`**
   - Parse data table from Cucumber
   - Compare against dashboard courses
   - Assert all expected courses present

3. **`When('I attempt to access the DSN application form', function ()`**
   - Store form access attempt
   - Check eligibility

4. **`Then('I should see "not available" message', function ()`**
   - Assert message is 'not available'

5. **`Then('the message should explain the prerequisite: "{string}"', function (explanation: string)`**
   - Assert explanation matches

6. **`Then('the DSN form shows as "not available"', function ()`**
   - Assert DSN not available

7. **`When('I refresh the eligibility dashboard', function ()`**
   - Re-calculate eligibility

8. **`Then('the DSN form should show as "available"', function ()`**
   - Assert DSN available

#### Reusable Functions
```typescript
function getEligibilityCourses(): Array<{
  name: string;
  prerequisite: string;
  status: string;
}> {
  const completions = prerequisitesContext.course_completions;

  return [
    {
      name: 'TTC Application',
      prerequisite: 'None',
      status: 'Eligible'
    },
    {
      name: 'TTC Evaluation',
      prerequisite: 'TTC Application submitted',
      status: completions.ttc_submitted ? 'Eligible' : 'Not Eligible'
    },
    {
      name: 'DSN Application',
      prerequisite: 'Happiness Program completed',
      status: completions.happiness_program ? 'Eligible' : 'Not Eligible'
    },
    {
      name: 'Part 1',
      prerequisite: 'Happiness Program completed',
      status: completions.happiness_program ? 'Eligible' : 'Not Eligible'
    },
    {
      name: 'Part 2',
      prerequisite: 'Part 1 completed',
      status: completions.part_1 ? 'Eligible' : 'Not Eligible'
    }
  ];
}
```

---

## Step Registry Updates

Add to `test/bdd/step-registry.ts`:

```typescript
'I view my course eligibility dashboard': {
  pattern: /^I\ view\ my\ course\ eligibility\ dashboard$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:8'],
},
'I should see a list of available courses with prerequisites:': {
  pattern: /^I\ should\ see\ a\ list\ of\ available\ courses\ with\ prerequisites:$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:9'],
},
'I attempt to access the DSN application form': {
  pattern: /^I\ attempt\ to\ access\ the\ DSN\ application\ form$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:20'],
},
'I should see "not available" message': {
  pattern: /^I\ should\ see\ "not\ available"\ message$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:21'],
},
'the message should explain the prerequisite: {string}': {
  pattern: /^the\ message\ should\ explain\ the\ prerequisite:\ "([^"]*)"$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:22'],
},
'the DSN form shows as "not available"': {
  pattern: /^the\ DSN\ form\ shows\ as\ "not\ available"$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:26'],
},
'I refresh the eligibility dashboard': {
  pattern: /^I\ refresh\ the\ eligibility\ dashboard$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:28'],
},
'the DSN form should show as "available"': {
  pattern: /^the\ DSN\ form\ should\ show\ as\ "available"$/,
  python: 'test/python/steps/eligibility_dashboard_steps.py:XX',
  typescript: 'test/typescript/steps/eligibility_dashboard_steps.ts:XX',
  features: ['specs/features/e2e/course_eligibility_by_profile.feature:29'],
},
```

---

## Implementation Order

### Step 1: Update Step Registry (FIRST)
1. Add 8 new step entries to `test/bdd/step-registry.ts`
2. Leave paths as placeholders (will update after implementation)

### Step 2: Python Implementation
1. Create `test/python/steps/eligibility_dashboard_steps.py`
2. Implement all 8 step definitions
3. Import helper from `form_prerequisites_steps.py` for course completion tracking
4. Run tests: `bun scripts/bdd/run-python.ts specs/features/e2e/course_eligibility_by_profile.feature`

### Step 3: TypeScript Implementation
1. Create `test/typescript/steps/eligibility_dashboard_steps.ts`
2. Implement all 8 step definitions
3. Use existing `prerequisitesContext` from `form_prerequisites_steps.ts`
4. Run tests: `bun scripts/bdd/run-typescript.ts specs/features/e2e/course_eligibility_by_profile.feature`

### Step 4: Verification
1. Run alignment check: `bun scripts/bdd/verify-alignment.ts`
2. Update step registry with actual line numbers
3. Ensure 0 orphan steps, 0 dead steps

---

## Test Verification Commands

```bash
# Run specific feature in Python
bun scripts/bdd/run-python.ts specs/features/e2e/course_eligibility_by_profile.feature

# Run specific feature in TypeScript
bun scripts/bdd/run-typescript.ts specs/features/e2e/course_eligibility_by_profile.feature

# Alignment check (must pass before commit)
bun scripts/bdd/verify-alignment.ts
```

---

## Dependencies

- **Existing**: `test/python/steps/form_prerequisites_steps.py` - Course completion tracking
- **Existing**: `test/typescript/steps/form_prerequisites_steps.ts` - Prerequisite context
- **Existing**: `test/bdd/step-registry.ts` - Step registry

---

## New Files to Create

1. `test/python/steps/eligibility_dashboard_steps.py` (~150 lines)
2. `test/typescript/steps/eligibility_dashboard_steps.ts` (~150 lines)

---

## Files to Modify

1. `test/bdd/step-registry.ts` - Add 8 new step entries

---

## Success Criteria

- [ ] All 3 scenarios pass in Python BDD tests
- [ ] All 3 scenarios pass in TypeScript BDD tests
- [ ] Step registry updated with all 8 new steps
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] No modification to legacy code (read-only)

---

## Notes

- This is NEW functionality - no legacy code to reference
- Leverage existing `course_completions` context from TASK-E2E-012
- Mock implementation is acceptable for test purposes
- Dashboard visualization is out of scope (this is API/backend logic only)
