# TASK-027: User Get Form Instances - Research

## Task Overview
Implement BDD steps for `get_form_instances` API endpoint that returns list of form instances for a given form type.

## Legacy Python Implementation

### Location
File: `ttc_portal_user.py`
Method: `TTCPortalUser.get_form_instances(self, f_type)`
Lines: 223-232

### Code Analysis
```python
def get_form_instances(self, f_type):
    logging.info('[get_form_instances] called f_type = {f_type}'.format(**locals()))
    _form_instances = {}
    if f_type in self.form_data:
        for _i in self.form_data[f_type]:
            if _i != 'default':
                _form_instances[_i] = {}
                _form_instances[_i]['page_data'] = self.form_data[f_type][_i].get('form_instance_page_data', '{}')
                _form_instances[_i]['display'] = self.form_data[f_type][_i].get('form_instance_display', _i)
    return _form_instances
```

### API Route
File: `ttc_portal_user.py`
Route: `/users/get-form-instances`
Lines: 458-460

```python
elif self.request.path == '/users/get-form-instances':
    _form_type = self.request.get('form_type')
    self.response.write(json.dumps(_ttc_user.get_form_instances(_form_type)))
```

### Behavior Summary

1. **Input**: Form type (e.g., "ttc_application")
2. **Processing**:
   - Iterates through `self.form_data[f_type]` dictionary
   - Skips the 'default' instance (which is a duplicate of the most recent instance)
   - For each instance, extracts:
     - `page_data`: The form_instance_page_data metadata
     - `display`: The form_instance_display text (or falls back to instance ID)
3. **Output**: Dictionary keyed by instance ID, with `page_data` and `display` for each

### Data Structure

**Input** (form_data example):
```python
self.form_data = {
    'ttc_application': {
        'default': { ... },  # Skipped
        'test_us_future': {
            'form_instance_page_data': {'dates': 'Jan 2024', 'country': 'US'},
            'form_instance_display': 'US TTC - January 2024'
        },
        'test_india_future': {
            'form_instance_page_data': {'dates': 'Feb 2024', 'country': 'IN'},
            'form_instance_display': 'India TTC - February 2024'
        }
    }
}
```

**Output**:
```python
{
    'test_us_future': {
        'page_data': {'dates': 'Jan 2024', 'country': 'US'},
        'display': 'US TTC - January 2024'
    },
    'test_india_future': {
        'page_data': {'dates': 'Feb 2024', 'country': 'IN'},
        'display': 'India TTC - February 2024'
    }
}
```

### Related Code Patterns

1. **set_form_data** (lines 36-89): Stores form instances with metadata
   - Sets `form_instance_page_data`
   - Sets `form_instance_display`
   - Creates 'default' copy for easy retrieval

2. **get_form_data** (lines 212-221): Gets data for specific instance
   - Uses 'default' instance if not specified

## Existing TypeScript Implementation

### MockTTCPortalUser Class
File: `test/typescript/steps/user_steps.ts`
Lines: 28-107

**Current state**: Does NOT have `get_form_instances` method

**Existing methods**:
- `setFormData`: Stores form data in nested structure
- `getFormData`: Retrieves single form instance
- `loadUserData`: Mock initialization
- `getConfig`: Gets user config
- `setConfig`: Sets user config

### Data Structure Match
The TypeScript mock matches Python's structure:
```typescript
public formData: Record<string, Record<string, StoredFormData>> = {};
```

Where `StoredFormData` includes:
- `form_instance_page_data`
- `form_instance_display`
- (other metadata)

## Existing Python Implementation

### MockTTCPortalUser Class
File: `test/python/steps/user_steps.py`
Lines: 27-93

**Current state**: Does NOT have `get_form_instances` method

**Existing methods**:
- `set_form_data`: Stores form data
- `get_form_data`: Retrieves single form instance
- `load_user_data`: Mock initialization
- `get_config`: Gets user config
- `set_config`: Sets user config

## Step Registry Status

File: `test/bdd/step-registry.ts`
Lines: 56-64

### Steps Registered (Status: Pending Implementation)

1. **Given I have multiple form instances for a form type**
   - Pattern: `/^I\ have\ multiple\ form\ instances\ for\ a\ form\ type$/`
   - Python: `test/python/steps/user_steps.py:1` (placeholder - incorrect line number)
   - TypeScript: `test/typescript/steps/user_steps.ts:1` (placeholder - incorrect line number)
   - Features: `specs/features/user/get_form_instances.feature:8`

2. **When I request the list of form instances**
   - Pattern: `/^I\ request\ the\ list\ of\ form\ instances$/`
   - Python: `test/python/steps/user_steps.py:1` (placeholder)
   - TypeScript: `test/typescript/steps/user_steps.ts:1` (placeholder)
   - Features: `specs/features/user/get_form_instances.feature:9`

3. **Then I should receive the available form instances**
   - Pattern: `/^I\ should\ receive\ the\ available\ form\ instances$/`
   - Python: `test/python/steps/user_steps.py:1` (placeholder)
   - TypeScript: `test/typescript/steps/user_steps.ts:1` (placeholder)
   - Features: `specs/features/user/get_form_instances.feature:10`

## Implementation Notes

### Python Step Implementation Plan

1. **Add `get_form_instances` method to MockTTCPortalUser**:
   ```python
   def get_form_instances(self, f_type):
       _form_instances = {}
       if f_type in self.form_data:
           for instance_id in self.form_data[f_type]:
               if instance_id != 'default':
                   _form_instances[instance_id] = {
                       'page_data': self.form_data[f_type][instance_id].get('form_instance_page_data', {}),
                       'display': self.form_data[f_type][instance_id].get('form_instance_display', instance_id)
                   }
       return _form_instances
   ```

2. **Step: Given I have multiple form instances for a form type**
   - Create user
   - Call `set_form_data` multiple times with different instances (e.g., 'test_us_future', 'test_india_future')
   - Store in context

3. **Step: When I request the list of form instances**
   - Get user from context
   - Call `user.get_form_instances(form_type)`
   - Store result in context

4. **Step: Then I should receive the available form instances**
   - Verify result is dictionary
   - Verify 'default' instance is excluded
   - Verify each instance has `page_data` and `display` keys
   - Verify values match what was set up

### TypeScript Step Implementation Plan

Same logic as Python, using TypeScript syntax.

### Test Data Setup

Use similar patterns from existing steps:
- Form type: `ttc_application`
- Instance 1: `test_us_future` with US-specific page_data
- Instance 2: `test_india_future` with India-specific page_data

## Key Findings

1. **No existing implementation**: Both Python and TypeScript mock classes need `get_form_instances` method added
2. **Simple logic**: Just iterate and filter out 'default' key
3. **Consistent structure**: Both mocks already have the right `form_data` structure from `set_form_data`
4. **Parallel implementation**: Python and TypeScript will be nearly identical in logic
5. **Step registry**: Needs line number updates after implementation

## Next Steps

Proceed to Plan phase (P) to create detailed implementation plan.
