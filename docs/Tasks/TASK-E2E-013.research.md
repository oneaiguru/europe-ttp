# TASK-E2E-013: Research Findings

## Task: Course Eligibility by User Profile

### Feature File
`specs/features/e2e/course_eligibility_by_profile.feature`

### Research Date
2026-02-04

---

## Summary

This task implements **NEW functionality** for an eligibility dashboard that shows users which courses/forms they are eligible for based on their completed prerequisites. The legacy Python codebase does NOT have this feature - it is a user-facing dashboard concept that must be implemented from scratch.

This task builds on TASK-E2E-012 (Form Prerequisites) by adding a **dashboard view** that displays eligibility information to the user.

---

## Legacy Code Analysis

### Files Reviewed
- `ttc_portal_user.py` - User data model and storage
- `form.py` - Form rendering and configuration
- `api.py` - API endpoints
- `test/python/steps/form_prerequisites_steps.py` - Related prerequisite steps (TASK-E2E-012)
- `test/bdd/step-registry.ts` - Step registry
- `app/portal/home/render.ts` - Existing portal home page

### Key Findings

#### 1. No Eligibility Dashboard in Legacy
- **Result**: No eligibility dashboard exists in legacy Python
- The legacy system has form rendering but NO user-facing eligibility view
- This is **NEW functionality** to be implemented

#### 2. Existing Prerequisite Tracking (from TASK-E2E-012)
- **Location**: `test/python/steps/form_prerequisites_steps.py:16-49`
- `init_prerequisites_context()` - Initialize course completions
- `update_available_forms()` - Determine form availability
- Context tracks: `course_completions` (happiness_program, part_1, part_2)
- This logic can be leveraged/referenced for the dashboard

#### 3. Existing Portal Infrastructure
- **Location**: `app/portal/home/render.ts`
- Portal home page exists and shows user profile details
- Can add eligibility dashboard as a new tab or section

#### 4. Form Data Structure
- **Location**: `ttc_portal_user.py:36-89`
- Forms stored in `self.form_data` dict
- User has: `email`, `name`, `home_country`, `is_profile_complete`
- **NO fields for**: course completions, eligibility status

---

## Feature File Analysis

### Scenario 1: Eligibility shows required prerequisites
```
Given I am authenticated as a TTC applicant
When I view my course eligibility dashboard
Then I should see a list of available courses with prerequisites:
  | course | prerequisite | status |
  | TTC Application | None | Eligible |
  | TTC Evaluation | TTC Application submitted | Not Eligible |
  | DSN Application | Happiness Program completed | Not Eligible |
  | Part 1 | Happiness Program completed | Not Eligible |
  | Part 2 | Part 1 completed | Not Eligible |
```

**Key Requirements:**
- New step: `When I view my course eligibility dashboard`
- New step: `Then I should see a list of available courses with prerequisites:`
- Data table with: course name, prerequisite, eligibility status
- "I am authenticated as a TTC applicant" already exists (forms_steps.py:29)

### Scenario 2: Ineligible user gets "not available" message
```
Given I am authenticated as applicant with email "test.applicant@example.com"
And I have NOT completed the Happiness Program
When I attempt to access the DSN application form
Then I should see "not available" message
And the message should explain the prerequisite: "Complete Happiness Program first"
```

**Key Requirements:**
- `I have NOT completed the Happiness Program` - EXISTS (form_prerequisites_steps.py:53)
- New step: `When I attempt to access the DSN application form`
- New step: `Then I should see "not available" message`
- New step: `And the message should explain the prerequisite: "Complete Happiness Program first"`

### Scenario 3: Eligibility updates after completing prerequisite
```
Given I have NOT completed the Happiness Program
And the DSN form shows as "not available"
When I complete the Happiness Program
And I refresh the eligibility dashboard
Then the DSN form should show as "available"
```

**Key Requirements:**
- `I have NOT completed the Happiness Program` - EXISTS (form_prerequisites_steps.py:53)
- New step: `And the DSN form shows as "not available"`
- `I complete the Happiness Program` - EXISTS (form_prerequisites_steps.py:70)
- New step: `And I refresh the eligibility dashboard`
- New step: `Then the DSN form should show as "available"`

---

## Step Inventory

| Step Text | Status | Notes |
|-----------|--------|-------|
| `I am authenticated as a TTC applicant` | EXISTS | forms_steps.py:29, forms_steps.ts:17 |
| `I view my course eligibility dashboard` | NEW | Dashboard view action |
| `I should see a list of available courses with prerequisites:` | NEW | Data table assertion |
| `I am authenticated as applicant with email {string}` | EXISTS | e2e_api_steps.py:17, e2e_api_steps.ts:145 |
| `I have NOT completed the Happiness Program` | EXISTS | form_prerequisites_steps.py:23, form_prerequisites_steps.ts:29 |
| `I attempt to access the DSN application form` | NEW | Attempt to access form |
| `I should see "not available" message` | NEW | Verify unavailable message |
| `the message should explain the prerequisite: {string}` | NEW | Verify prerequisite explanation |
| `the DSN form shows as "not available"` | NEW | Verify form status |
| `I complete the Happiness Program` | EXISTS | form_prerequisites_steps.py:43, form_prerequisites_steps.ts:53 |
| `I refresh the eligibility dashboard` | NEW | Refresh dashboard action |
| `the DSN form should show as "available"` | NEW | Verify form available |

---

## Implementation Context

### What TASK-E2E-012 Already Provides
- Course completion tracking in test context
- Form availability logic based on prerequisites
- Steps for: `I have NOT completed the Happiness Program`, `I complete the Happiness Program`

### What This Task Adds
- **Dashboard view** showing eligibility to users
- Prerequisite explanations when forms are unavailable
- Refresh mechanism to update eligibility display
- Display of course list with prerequisites and status

---

## Business Logic to Implement

### Eligibility Display Rules
1. **Show all courses** in the system
2. **Show prerequisite** for each course (or "None" for base courses)
3. **Show status**: "Eligible" or "Not Eligible"
4. **Explanation** when accessing ineligible forms

### Course Prerequisite Chain
```
TTC Application → None (always eligible)
TTC Evaluation → TTC Application submitted
DSN Application → Happiness Program completed
Part 1 → Happiness Program completed
Part 2 → Part 1 completed
```

### Data Model (Test Context)
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

---

## Implementation Approach

### Python (Test/Mock Implementation)
Since legacy code doesn't have this feature:

1. **Create new step file**: `test/python/steps/eligibility_dashboard_steps.py`
2. **Track eligibility in context**:
   ```python
   context.eligibility_dashboard = {
       'courses': [...],  # List of course eligibility info
       'form_messages': {...}  # Form-specific messages
   }
   ```
3. **Mock dashboard view**:
   - Store course list when viewing dashboard
   - Return eligibility based on course_completions context
   - Show messages when attempting to access forms

### TypeScript (New Implementation)
1. **Create eligibility dashboard component**:
   - New route or page: `/eligibility` or tab in portal
   - Display course list with prerequisites
   - Show eligibility status
2. **Form access with prerequisite checks**:
   - When accessing form, check prerequisites
   - Show "not available" message if not eligible
   - Include prerequisite explanation
3. **Refresh mechanism**:
   - Re-evaluate eligibility on refresh
   - Update display

---

## Test Data Strategy

### Mock Course List
```python
COURSE_ELIGIBILITY_DATA = [
    {
        'course': 'TTC Application',
        'prerequisite': 'None',
        'status': 'Eligible'  # Always eligible
    },
    {
        'course': 'TTC Evaluation',
        'prerequisite': 'TTC Application submitted',
        'status': 'Not Eligible'  # Depends on submission
    },
    {
        'course': 'DSN Application',
        'prerequisite': 'Happiness Program completed',
        'status': 'Not Eligible'  # From context
    },
    {
        'course': 'Part 1',
        'prerequisite': 'Happiness Program completed',
        'status': 'Not Eligible'  # From context
    },
    {
        'course': 'Part 2',
        'prerequisite': 'Part 1 completed',
        'status': 'Not Eligible'  # From context
    },
]
```

---

## Step Registry Updates

Add entries for all new steps:

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
// ... and 7 more new steps
```

---

## Dependencies

- **TASK-E2E-012**: Form Prerequisites (already implemented)
  - Provides: course completion tracking, prerequisite logic
  - Reuses: steps for Happiness Program completion
- **Existing portal infrastructure**: `/portal/home` for adding dashboard

---

## Open Questions

1. **Dashboard Location**: Should eligibility be:
   - A separate page at `/eligibility`?
   - A tab on the portal home?
   - A modal/overlay?

2. **Data Persistence**: Should course completions be stored in user profile?
   - For tests: No, use context
   - For real system: Yes, in user profile

3. **Form Access Flow**: When user clicks an ineligible form:
   - Block access and show message on the same page?
   - Redirect to a "not available" page?
   - Show modal with explanation?

---

## Next Steps (Planning Phase)

1. Design Python step structure with eligibility dashboard context
2. Design TypeScript component for eligibility display
3. Plan step registry updates for 10 new steps
4. Plan test verification commands

---

## Related Files

### Existing (Reference)
- `test/python/steps/form_prerequisites_steps.py` - Prerequisite logic
- `test/typescript/steps/form_prerequisites_steps.ts` - Prerequisite logic
- `app/portal/home/render.ts` - Portal infrastructure

### New Files to Create
- `test/python/steps/eligibility_dashboard_steps.py` - Python steps
- `test/typescript/steps/eligibility_dashboard_steps.ts` - TypeScript steps
- `app/eligibility/render.tsx` - Eligibility dashboard (or similar)
