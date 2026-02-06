# TASK-052: reduce-test-fallbacks-python - Research

## Task Summary
Stop Python BDD steps from masking real failures with fake 200/HTML responses.

---

## Evidence Locations

### Primary Files with `_fake_response()` Usage

1. **`test/python/steps/api_steps.py:73-78`** - `_fake_response()` definition
   ```python
   def _fake_response():
       return type('obj', (object,), {
           'body': '',
           'status': '200 OK',
           'status_int': 200
       })()
   ```

2. **`test/python/steps/api_steps.py:155-163`** - Silent exception fallback
   ```python
   try:
       app = TestApp(ttc_portal_user_module.app)
       context.response = app.post(endpoint, params=payload)
       return
   except Exception:
       context.response = _fake_response()
       return
   ```
   - **Issue**: All exceptions (import errors, runtime errors, etc.) are silently swallowed and replaced with a fake 200 response.

3. **`test/python/steps/portal_steps.py:41-46`** - `_fake_response(body_text)` definition
   ```python
   def _fake_response(body_text):
       return type('obj', (object,), {
           'body': body_text,
           'status': '200 OK',
           'status_int': 200
       })()
   ```

4. **`test/python/steps/portal_steps.py:93-134`** - Portal home step with fallback
   - Lines 211-220: Try/except around disabled page request

5. **`test/python/steps/auth_steps.py:47-52`** - Auth step `_fake_response()`
   - Lines 64, 83, 102, 115, 127: All auth steps use fake responses as fallback

### Full Inventory of `_fake_response()` Usage

| File | Lines | Context |
|------|-------|---------|
| `test/python/steps/api_steps.py` | 73, 160, 163 | API POST request fallback on any exception |
| `test/python/steps/portal_steps.py` | 41, 134, 219, 286 | Portal home, disabled, tabs pages |
| `test/python/steps/auth_steps.py` | 47, 64, 83, 102, 115, 127 | Login/logout/password reset steps |

---

## Problem Analysis

### Current Behavior

The Python BDD steps use a defensive fallback pattern:
1. Try to use `TestApp` to make real requests to the legacy Python application
2. If any exception occurs (import error, runtime error, etc.), silently return a fake 200 response with mock HTML
3. Subsequent assertions pass because they check for expected strings in the fake response body

### Why This Is Problematic

1. **False Greens**: Tests pass even when the application code is completely broken or missing
2. **Silent Failures**: Import errors, syntax errors, and runtime failures are never reported
3. **No Detection**: When code is refactored or deleted, tests continue to pass
4. **Contrast with TypeScript**: The TypeScript implementation (`test/typescript/steps/api_steps.ts`) directly imports and calls route handlers, which will fail immediately on import/runtime errors

### TypeScript Comparison

In `test/typescript/steps/api_steps.ts:74-94`:
```typescript
When('I submit form data to the upload form API', async () => {
  // ...
  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(/* ... */);
  apiContext.responseStatus = response.status;
});
```

If the import or POST call fails, Cucumber will report the error immediately. No fake response is used.

---

## Root Causes

### Why the Fallback Pattern Exists

1. **Hybrid Test Environment**: The Python tests were designed to work in two modes:
   - **Integration mode**: Use `TestApp` to make real requests to the legacy `ttc_portal_user` app
   - **Fixture-only mode**: When the legacy app isn't available, use fixture data and fake responses

2. **Legacy Code Read-Only**: Per project rules, the legacy Python 2.7 App Engine code is read-only. The tests were designed to not fail when legacy components are missing.

3. **Test Mode Flag**: There's already a `pyutils/test_mode.py` module for test mode detection, but it's not used to control the fallback behavior.

---

## Constraints

1. **Legacy is read-only**: Cannot modify `ttc_portal.py`, `ttc_portal_user.py`, `form.py`, `admin.py`, etc.

2. **No BDD scenarios required**: This is a fix/hardening task without new feature files

3. **Python 2.7 compatibility**: Tests must run in the legacy Python environment

---

## Proposed Solution

### Option A: Explicit Mock Mode (Recommended)

Add an environment variable or fixture flag to explicitly enable mock mode:

```python
# In test/python/steps/common.py or similar
MOCK_MODE = os.environ.get('BDD_MOCK_MODE', 'false').lower() == 'true'

def _fake_response(body_text=''):
    if not MOCK_MODE:
        raise AssertionError(
            'Real handler not available and mock mode not enabled. '
            'Set BDD_MOCK_MODE=true to use fixture-only mode.'
        )
    return type('obj', (object,), {
        'body': body_text,
        'status': '200 OK',
        'status_int': 200
    })()
```

**Pros**:
- Failures are visible by default (fail fast)
- Explicit opt-in for fixture-only mode
- Clear intent when using mock mode

**Cons**:
- Requires CI configuration to set `BDD_MOCK_MODE=true`
- Changes existing test behavior

### Option B: Conditional Import with Warning

Check if the legacy app is importable before trying to use it:

```python
def _can_use_real_app():
    try:
        import ttc_portal_user
        return hasattr(ttc_portal_user, 'app')
    except Exception:
        return False

@when('I submit form data to the upload form API')
def step_submit_form_data(context):
    if _can_use_real_app():
        # Use real TestApp
        # ...
    else:
        # Explicitly skip or fail
        raise NotImplementedError(
            'Legacy app not available. This step requires real integration or mock mode.'
        )
```

### Option C: Logging and Fallback (Weaker)

Keep the fallback but add visible logging:

```python
import logging
logger = logging.getLogger(__name__)

# In except block:
logger.warning('Using fake response fallback for %s (exception: %s)', endpoint, e)
context.response = _fake_response()
```

**Cons**: Still produces false greens, just with warnings in logs.

---

## Files to Change

1. `test/python/steps/api_steps.py` - Lines 73-78 (definition), 155-163 (usage)
2. `test/python/steps/portal_steps.py` - Lines 41-46 (definition), multiple usage sites
3. `test/python/steps/auth_steps.py` - Lines 47-52 (definition), multiple usage sites

Potential new file:
- `test/python/steps/common.py` - Shared test utilities including mock mode flag

---

## Related Work

- **TASK-FIX-010 (remove-node_modules-cycle)**: Fixed a similar cycle issue in TypeScript runner
- **reduce-test-fallbacks-typescript**: Parallel task for TypeScript steps (though TS doesn't use this pattern)

---

## References

- `docs/review/REVIEW_DRAFTS.md` - Lines 105-111: Original review finding
- `pyutils/test_mode.py` - Existing test mode infrastructure (could be leveraged)
