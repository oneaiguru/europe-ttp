# TASK-E2E-012: Research Findings

## Task: Form Prerequisites and Conditional Availability

### Feature File
`specs/features/e2e/form_prerequisites_conditional.feature`

### Research Date
2025-01-04

---

## Summary

This task implements **NEW functionality** not present in the legacy Python codebase. The legacy system does NOT track course completions (Happiness Program, Part 1, Part 2) or enforce form prerequisites. The BDD scenarios are defining NEW business requirements that must be implemented from scratch.

---

## Legacy Code Analysis

### Files Reviewed
- `ttc_portal_user.py` - User data model and storage
- `form.py` - Form rendering and configuration
- `api.py` - API endpoints
- `test/python/steps/e2e_api_steps.py` - Existing step definitions
- `test/bdd/step-registry.ts` - Step registry

### Key Findings

#### 1. No Course Completion Tracking
- **Location**: `ttc_portal_user.py:356-371`
- User data structure includes: `email`, `name`, `form_data`, `home_country`, `is_profile_complete`
- **NO fields for**: course completions, prerequisites, or form eligibility

#### 2. Home Country Filtering (RELEVANT)
- **Location**: `form.py:223-225`
```python
if user_home_country and 'display_countries' in option:
    if user_home_country not in option['display_countries']:
        _display_option_flg = False
```
- This pattern exists for filtering TTC options by country
- Can be leveraged for Scenario 5 (home country-based eligibility)

#### 3. Form Data Structure
- **Location**: `ttc_portal_user.py:36-89`
- Forms stored in `self.form_data` dict: `{form_type: {instance: {data}}}`
- Form submission tracked via `is_form_submitted` flag
- No prerequisite checking logic

---

## Existing Step Implementations

### Already Exists (Can Reuse)

| Step | File | Line | Notes |
|------|------|------|-------|
| `I am authenticated as applicant with email "{email}"` | e2e_api_steps.py | 17 | Sets current_user, current_email, current_role |
| `I update my home country to "{country}"` | e2e_api_steps.py | ~269 | From home_country_changes feature |

### New Steps Needed

| Step | Scenario | Status |
|------|----------|--------|
| `When I have NOT completed the Happiness Program` | 1, 3 | NEW |
| `Then the DSN application form should NOT be available` | 1 | NEW |
| `When I complete the Happiness Program` | 1, 3 | NEW |
| `Then the DSN application form should become available` | 1 | NEW |
| `When I have completed Part 1 but NOT Part 2` | 2 | NEW |
| `Then the YES+ application form should NOT be available` | 2 | NEW |
| `When I complete Part 2` | 2 | NEW |
| `Then the YES+ application form should become available` | 2 | NEW |
| `Then the Part 1 course application should NOT be available` | 3 | NEW |
| `Then the Part 1 course application should become available` | 3 | NEW |
| `When I have NOT completed Part 1` | 4 | NEW |
| `Then the Part 2 course application should NOT be available` | 4 | NEW |
| `When I complete Part 1` | 4 | NEW |
| `Then the Part 2 course application should become available` | 4 | NEW |
| `When my home country is "{country}"` | 5 | May exist in home_country_changes |
| `Then US-specific TTC options should be available` | 5 | NEW |
| `And India-specific TTC options should NOT be available` | 5 | NEW |
| `When I update my home country to "{country}"` | 5 | EXISTS |
| `Then India-specific TTC options should become available` | 5 | NEW |

---

## Business Logic to Implement

### Course Completion Chain
```
Happiness Program → Part 1 → Part 2 → YES++ (DSN)
```

### Form Eligibility Rules
1. **DSN Application**: Requires Happiness Program completion
2. **Part 1 Application**: Requires Happiness Program completion
3. **Part 2 Application**: Requires Part 1 completion
4. **YES++ Application**: Requires Part 1 AND Part 2 completion

### Country-Specific Rules
1. **US users**: See US-specific TTC options
2. **India users**: See India-specific TTC options
3. Options should update when home country changes

---

## Implementation Approach

### Python (Test/Mock Implementation)
Since legacy code doesn't have this feature:

1. **Create new step file**: `test/python/steps/form_prerequisites_steps.py`
2. **Track completions in context**:
   ```python
   context.course_completions = {
       'happiness_program': False,
       'part_1': False,
       'part_2': False
   }
   ```
3. **Mock form availability checks**:
   - Store available forms in context
   - Check prerequisites when steps query availability
   - Return appropriate responses

### TypeScript (New Implementation)
1. **Create domain models**:
   - `CourseCompletion` enum/type
   - `FormEligibility` service
2. **Implement business logic**:
   - Prerequisite checker service
   - Country-based form filter
3. **Integrate with existing user profile system**

---

## Test Data Strategy

### Mock User Data
```python
{
    'email': 'test.applicant@example.com',
    'course_completions': [],
    'home_country': 'US',
    'available_forms': ['ttc_application_us']  # Initially
}
```

### TTC Options by Country
```python
US_TTC_OPTIONS = ['TTC-US-2025', 'TTC-US-West-2025']
INDIA_TTC_OPTIONS = ['TTC-IN-2025', 'TTC-IN-North-2025']
```

---

## Step Registry Updates

Add entries for all new steps with:
- Pattern regex matching step text
- Python path: `test/python/steps/form_prerequisites_steps.py`
- TypeScript path: `test/typescript/steps/form_prerequisites_steps.ts`
- Feature file: `specs/features/e2e/form_prerequisites_conditional.feature`

---

## Open Questions

1. **Data Persistence**: Should course completions be persisted in the new system?
   - Recommendation: Yes, add to user profile in TypeScript

2. **Form List Source**: Where do available forms come from?
   - Recommendation: Create a configuration object defining form prerequisites

3. **Admin Override**: Should admins be able to bypass prerequisites?
   - Recommendation: Out of scope for this task, future enhancement

---

## Dependencies

- **TASK-E2E-005**: Home country changes (for Scenario 5)
- Existing user profile infrastructure
- Existing form configuration system

---

## Next Steps (Planning Phase)

1. Design Python step structure with context-based state management
2. Design TypeScript service layer for form eligibility
3. Define data models for course completions and form prerequisites
4. Plan step registry updates
5. Plan test verification commands
