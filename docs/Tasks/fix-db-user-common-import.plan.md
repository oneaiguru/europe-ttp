# TASK-055: Fix db/user.py Common Import - Implementation Plan

## Overview
Fix the broken import in `db/user.py` that references a non-existent `common` module. The `mask` function is actually located at `pyutils/utils.py:205` as a module-level function.

## Implementation Steps

### Step 1: Update the import statement
**File:** `db/user.py:2`
- Change: `from common import Utils`
- To: `from pyutils.utils import mask`

### Step 2: Update the usage
**File:** `db/user.py:26`
- Change: `d[p] = Utils.mask(d[p])`
- To: `d[p] = mask(d[p])`

### Step 3: Verify the fix
Run test import to confirm no errors:
```bash
python -c "from db.user import Lead; print('Import successful')"
```

## Files to Change
1. `db/user.py` - Lines 2 and 26

## Tests to Run
```bash
# Test import
python -c "from db.user import Lead; print('Import successful')"
```

## Risks / Rollback
- **Risk:** Low - this is fixing a clearly broken import
- **Rollback:** Revert `db/user.py` to original state if needed
- **Impact:** Only affects `db/user.py` which is legacy read-only code (reference only)

## Notes
- The `mask` function at `pyutils/utils.py:205` is a module-level function, not a method of `Utils` class
- This follows the pattern used in other files like `ttc_portal.py:17` which imports `from pyutils import utils`
