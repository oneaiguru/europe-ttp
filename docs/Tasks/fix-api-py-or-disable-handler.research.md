# Research: fix-api-py-or-disable-handler

## Task ID
fix-api-py-or-disable-handler

## Summary
`api.py` contains a syntax error on line 17 and appears to be incomplete/inactive code. The module is referenced in `app.yaml` but the implementation is fundamentally broken.

---

## 1. Syntax Error Location

**File:** `api.py:17`

```python
from pyutils as utils
```

**Issue:** Invalid Python syntax - should be `from pyutils import something` or `import pyutils as utils`

**Error when importing:**
```
SyntaxError: invalid syntax
```

---

## 2. app.yaml Handler Reference

**File:** `app.yaml:76-79`

```yaml
- url: /api/.*
  script: api.app
  login: required
  secure: always
```

The `/api/.*` route is configured to use `api.app`, which will fail to import.

**Also referenced in:**
- `app-dev.yaml:60`
- `app-20190828.yaml:76`

---

## 3. State of api.py Implementation

The `api.py` file appears to be **incomplete stub code** that was never fully implemented:

1. **Missing `pyutils` module:** The import on line 17 references a non-existent `pyutils` module (no `pyutils.py` or `pyutils/` directory exists at repo root)

2. **Incomplete UploadForm class (lines 43-217):**
   - Contains commented PHP code mixed with incomplete Python
   - Has placeholder comments like `??????` for unimplemented code (lines 60, 85, 89, 98, 115)
   - Mixed Python/PHP syntax indicating this was an incomplete translation

3. **TTCPortalUser class issues (lines 219-316):**
   - Methods like `set_email()`, `set_last_update_timestamp()`, `set_is_profile_complete()` are missing `self` parameter
   - `__init__` also missing `self` parameter (line 295)
   - These would fail at runtime if called

4. **Only one route registered (line 330):**
   ```python
   ('/api/upload-form', UploadForm),
   ```

---

## 4. Active Usage Analysis

**BDD tests:** `test/python/steps/api_steps.py` exists but does NOT actually import `api.py`
- Tests target `/users/upload-form-data` endpoint (line 136) via `ttc_portal_user` module
- The `api.py` file is not imported or used by BDD tests

**Frontend references:** None found
- No references to `/api/upload-form` in JavaScript, forms, or tabs
- The actual upload functionality uses `/users/upload-form-data` endpoint handled by `ttc_portal_user.py`

---

## 5. Conclusion

**`api.py` is dead code** that:
1. Cannot be imported due to syntax error
2. Was never fully implemented (contains PHP comments and `????` placeholders)
3. Is not used by any BDD tests
4. Is not referenced by frontend code
5. The `/api/upload-form` route is superseded by `/users/upload-form-data` in `ttc_portal_user.py`

---

## 6. Recommended Fix

**Option A: Disable the handler (Simpler, Safer)**
1. Remove `/api/.*` handler from `app.yaml`, `app-dev.yaml`, `app-20190828.yaml`
2. Leave `api.py` in place for historical reference
3. No functional impact - the endpoint is not used

**Option B: Fix api.py (Not Recommended)**
1. Fix syntax error on line 17
2. Add missing `self` parameters to all class methods
3. Complete the incomplete `UploadForm` implementation
4. Create the missing `pyutils` module
5. This would be implementing new functionality, not fixing existing code

---

## 7. Acceptance Criteria Status

1. `api.py` imports without syntax errors - **FAIL** (SyntaxError on line 17)
2. `app.yaml` does not reference broken handlers - **FAIL** (references `api.app`)

---

## Evidence Locations

| Evidence | Location |
|----------|----------|
| Syntax error | `api.py:17` |
| Handler reference | `app.yaml:76-79` |
| Handler reference (dev) | `app-dev.yaml:60` |
| Handler reference (old) | `app-20190828.yaml:76` |
| Missing pyutils module | No file exists in repo |
| Incomplete code markers | `api.py:60,85,89,98,115` |
| Missing self in methods | `api.py:240-269,295` |
| BDD doesn't use api.py | `test/python/steps/api_steps.py:136` |
