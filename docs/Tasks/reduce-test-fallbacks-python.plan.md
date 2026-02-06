# TASK-052: reduce-test-fallbacks-python - Implementation Plan

## Task Summary
Stop Python BDD steps from masking real failures with fake 200/HTML responses by implementing an explicit mock mode.

---

## Approach: Option A - Explicit Mock Mode

We will implement **Option A** from the research because it:
- Fails fast by default (catches real errors)
- Provides explicit opt-in for fixture-only mode
- Aligns with the TypeScript test behavior (no silent fallbacks)
- Maintains backward compatibility via environment variable

---

## Implementation Steps

### Step 1: Create Shared Test Utilities

**File**: `test/python/steps/common.py` (new)

Create a new module for shared test utilities:
- Define `MOCK_MODE` flag (reads from `BDD_MOCK_MODE` env var)
- Define `_fake_response()` that raises AssertionError when not in mock mode
- Re-export for use by other step modules

```python
import os

MOCK_MODE = os.environ.get('BDD_MOCK_MODE', 'false').lower() == 'true'

def _fake_response(body_text=''):
    """Return a fake response object for testing.

    Only works when BDD_MOCK_MODE=true. Otherwise raises AssertionError
    to prevent masking real application failures.
    """
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

### Step 2: Update `api_steps.py`

**File**: `test/python/steps/api_steps.py`

1. Import `_fake_response` from `common` module (line ~73)
2. Remove local `_fake_response()` definition (lines 73-78)
3. Update the exception fallback at lines 155-163 to import and use the shared version

### Step 3: Update `portal_steps.py`

**File**: `test/python/steps/portal_steps.py`

1. Import `_fake_response` from `common` module (line ~41)
2. Remove local `_fake_response(body_text)` definition (lines 41-46)
3. Update all usage sites (lines 134, 219, 286) to use the shared version
4. Update any calls that pass `body_text` argument to match new signature

### Step 4: Update `auth_steps.py`

**File**: `test/python/steps/auth_steps.py`

1. Import `_fake_response` from `common` module (line ~47)
2. Remove local `_fake_response()` definition (lines 47-52)
3. Update all usage sites (lines 64, 83, 102, 115, 127) to use the shared version

### Step 5: Update CI Configuration

**Files**: `.github/workflows/*.yml` or relevant CI config

Add `BDD_MOCK_MODE=true` to any jobs that intentionally run fixture-only tests.

---

## Files to Change

| File | Type | Change |
|------|------|--------|
| `test/python/steps/common.py` | NEW | Create shared test utilities module |
| `test/python/steps/api_steps.py` | EDIT | Import shared `_fake_response`, remove local definition |
| `test/python/steps/portal_steps.py` | EDIT | Import shared `_fake_response`, remove local definition |
| `test/python/steps/auth_steps.py` | EDIT | Import shared `_fake_response`, remove local definition |
| CI config files | EDIT | Add `BDD_MOCK_MODE=true` where needed |

---

## Testing Strategy

### Verification Commands

```bash
# 1. Verify alignment (placeholder checks pass)
bun run bdd:verify

# 2. Python BDD tests should now fail when legacy app is unavailable
#    (unless BDD_MOCK_MODE=true is set)
bun run bdd:python test/python/steps/api_steps.py
bun run bdd:python test/python/steps/portal_steps.py
bun run bdd:python test/python/steps/auth_steps.py
```

### Expected Behavior Changes

1. **Without `BDD_MOCK_MODE=true`**:
   - Tests will raise `AssertionError` if legacy app is unavailable
   - Real application errors (import errors, runtime errors) will be visible
   - This is the desired default behavior

2. **With `BDD_MOCK_MODE=true`**:
   - Tests will use fake responses as before
   - Fixture-only mode works as designed
   - Suitable for CI jobs that don't have legacy app dependencies

---

## Risks and Rollback

### Risks

1. **Breaking Change**: Existing CI jobs may fail if they rely on silent fallback
   - **Mitigation**: Add `BDD_MOCK_MODE=true` to affected CI jobs

2. **Local Development**: Developers may see new failures
   - **Mitigation**: Document in commit message and add comment in `common.py`

3. **Python 2.7 Compatibility**: New module must use Python 2.7 compatible syntax
   - **Mitigation**: Avoid f-strings, type hints, and other Python 3+ features

### Rollback Plan

If issues arise:
1. Delete `test/python/steps/api_steps.py`
2. Restore local `_fake_response()` definitions in each step file
3. Revert CI configuration changes

---

## Completion Criteria

1. ✅ `test/python/steps/common.py` created with `MOCK_MODE` and `_fake_response()`
2. ✅ All three step files import from `common` instead of defining locally
3. ✅ `bun run bdd:verify` passes
4. ✅ Tests fail with clear message when legacy app unavailable (without `BDD_MOCK_MODE=true`)
5. ✅ Tests pass with `BDD_MOCK_MODE=true` (fixture-only mode works)
6. ✅ CI configuration updated where needed

---

## References

- Research: `docs/Tasks/reduce-test-fallbacks-python.research.md`
- Task: `docs/Tasks/reduce-test-fallbacks-python.task.md`
- Source: `docs/review/REVIEW_DRAFTS.md` lines 105-111
