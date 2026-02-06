# TASK-055: Fix db/user.py Common Import

## Goal
Remove missing `common` import in db/user.py model and use correct utility module.

## Legacy Reference
- File: `db/user.py`
- Lines: 2 (`from common import Utils`)

## Problem
The `db/user.py` file imports `Utils` from a non-existent `common` module. The actual `Utils` class is in `pyutils/utils.py`. This causes an import error when the module is loaded.

## Acceptance Criteria
- [ ] `db/user.py` imports `Utils` from a valid module (`pyutils.utils`) or removes unused dependency
- [ ] Legacy code still works (no new import errors)
- [ ] Verify the import fix with a test import

## Files to Modify
- [ ] `db/user.py` - Update line 2 to import from correct location

## Test Commands
```bash
# Test that the import works
python -c "from db.user import Lead; print('Import successful')"
```
