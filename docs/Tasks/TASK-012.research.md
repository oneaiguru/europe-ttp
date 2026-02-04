# TASK-012: TTC Application (Non-US) - Research

## Overview
Research the legacy Python implementation for TTC Application forms for non-US countries to understand how to implement the BDD step definitions.

## Legacy Python Implementation

### File Locations
- **Primary file**: `form.py` - Handles form rendering and loading
- **User model**: `ttc_portal_user.py` - Manages user data including home_country
- **Constants**: `constants.py` - Contains FORM_CONFIG_LOCATION and country mappings

### Key Implementation Details

#### 1. Country-Specific Form Loading
From `form.py:570-571`:
```python
if obj == "form/ttc_application.html":
    questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/ttc_application.json'
```

The legacy system loads TTC application forms from a path that includes the user's home country ISO code:
- US: `config/forms/US/ttc_application.json`
- Non-US: `config/forms/{country_iso}/ttc_application.json` (e.g., `IN/ttc_application.json`, `CA/ttc_application.json`)

#### 2. User Home Country Storage
From `ttc_portal_user.py:289-294`:
```python
def set_home_country(self, home_country):
    self.home_country = home_country
    self.config['i_home_country'] = home_country
```

The user's home country is stored in the TTCPortalUser model and used to determine which form variant to load.

#### 3. Country Parameter in Request
From `form.py:557-558`:
```python
user_home_country_iso = self.request.get('user_home_country_iso', user_country)
logging.info('[Form][get] user_home_country_iso = ' + user_home_country_iso)
```

The form handler accepts a `user_home_country_iso` request parameter to determine which country's form to load.

#### 4. Country Constants
From `constants.py:68`:
- `COUNTRIES` - JSON list of all countries with ISO codes
- `COUNTRIES_MAP_NAME2ISO` - Maps country names to ISO codes
- `COUNTRIES_MAP_ISO2NAME` - Maps ISO codes to country names

Examples:
- US = "United States"
- IN = "India"
- CA = "Canada"

## Comparison with TASK-011 (TTC Application US)

### TASK-011 Implementation (US-only)

**Python Step** (`test/python/steps/forms_steps.py:51-57`):
```python
@when('I open the TTC application form for the United States')
def step_open_ttc_application_form_us(context):
    body = (
        '<h1>TTC Application</h1>'
        '<div id="ttc_application_form">TTC Application Questions</div>'
    )
    context.response_body = body
```

**TypeScript Step** (`test/typescript/steps/forms_steps.ts:48-60`):
```typescript
When('I open the TTC application form for the United States', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/ttc_application_us/render');
    if (typeof module.renderTtcApplicationUsForm === 'function') {
      world.responseHtml = module.renderTtcApplicationUsForm();
    } else {
      world.responseHtml = TTC_APPLICATION_US_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = TTC_APPLICATION_US_FALLBACK_HTML;
  }
});
```

### TASK-012 Required Implementation (Non-US)

The non-US variant needs to:
1. Accept a country parameter or use the user's home country
2. Load the appropriate form based on country ISO code
3. Display country-specific TTC application questions

## Step Registry Status

Current entries in `test/bdd/step-registry.ts`:
- Line 92-97: `I open the TTC application form for a non-US country`
  - python: `test/python/steps/forms_steps.py:1` (placeholder)
  - typescript: `test/typescript/steps/forms_steps.ts:1` (placeholder)

- Line 398-403: `I should see the TTC application questions for that country`
  - python: `test/python/steps/forms_steps.py:1` (placeholder)
  - typescript: `test/typescript/steps/forms_steps.ts:1` (placeholder)

## Implementation Notes

### Key Differences from US Implementation
1. **Country parameter**: Non-US steps need to handle a country parameter (either explicitly in the step or via context)
2. **Dynamic form loading**: The form content should vary based on the country
3. **User home country**: Should respect `context.user_home_country_iso` if set

### Test Data Requirements
- Need to test with at least one non-US country (e.g., "India", "Canada")
- Step should verify that country-specific questions are present
- Could use a generic "non-US" placeholder or implement country-specific logic

### Potential Implementation Approaches

**Option 1**: Use a fixed non-US country for testing (simplest)
```python
# Always use "India" for non-US tests
context.user_home_country_iso = 'IN'
```

**Option 2**: Make the step parameterized
```gherkin
When I open the TTC application form for country {string}
```

**Option 3**: Use user's home country from context
```python
# Set in the Given step
context.user_home_country_iso = context.user_home_country_iso or 'US'
# Non-US would be set to something else
```

## Acceptance Criteria Verification

The steps must:
1. [ ] Set `context.response_body` with TTC application HTML
2. [ ] Include an element identifying the form (e.g., `ttc_application_form`)
3. [ ] Include "TTC Application" in the title/body
4. [ ] Be distinguishable from the US variant (either by content or metadata)

## Recommended Implementation Strategy

For simplicity and to match the pattern established in TASK-011:

1. **Python Step**: Set user's home country to a non-US value (e.g., 'IN' for India) and return similar HTML structure
2. **TypeScript Step**: Similar to US variant but with country parameter or non-US specific module
3. **Assertions**: Verify the form is displayed and contains TTC application content

The implementation should be minimal but functional, allowing the tests to pass while demonstrating the pattern for country-specific forms.
