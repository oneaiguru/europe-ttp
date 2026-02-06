# TASK-055: Fix db/user.py Common Import - Research

## Summary

The `db/user.py` file imports `Utils` from a non-existent `common` module. The actual utility functions are in `pyutils/utils.py`. This is legacy code that was added with a broken import.

## Evidence

### Current State (Broken)
- File: `db/user.py:2`
- Import: `from common import Utils`
- Usage: `Utils.mask(d[p])` on line 26

### Actual Location of Utilities
- File: `pyutils/utils.py`
- The `mask` function exists at `pyutils/utils.py:205` as a **module-level function**, not as a method of `Utils` class
- The `Utils` class exists at `pyutils/utils.py:223` but does NOT have a `mask` method

### Import Pattern Used Elsewhere
From `reporting/participant_list.py:18`:
```python
from pyutils import utils, Utils
```

From `reporting/user_summary.py:28`:
```python
from pyutils import utils, Utils
```

From `ttc_portal.py:17`:
```python
from pyutils import utils
```

### History
- `db/user.py` was added in commit `5f9a716` (feat(legacy-api-db): add legacy-api-db legacy code)
- The broken import was present from the initial commit
- No `common.py` file has ever existed at the repo root containing a `Utils` class with `mask` method

## Solution Options

### Option 1: Import `mask` directly from `pyutils.utils`
```python
from pyutils.utils import mask
# Change line 26: d[p] = mask(d[p])
```

### Option 2: Import `utils` module and reference the function
```python
from pyutils import utils
# Change line 26: d[p] = utils.mask(d[p])
```

### Option 3: Add a `mask` static method to `Utils` class
This would require modifying `pyutils/utils.py` to add:
```python
class Utils:
    @staticmethod
    def mask(str, n=4, filer="*", filer_cnt=6):
        # ... implementation
```

## Recommendation

**Option 1** is simplest and follows the pattern of importing what's needed directly. Change:
- Line 2: `from common import Utils` → `from pyutils.utils import mask`
- Line 26: `Utils.mask(d[p])` → `mask(d[p])`

Alternatively, **Option 2** is consistent with other files that import `utils` from `pyutils`.

## Files to Modify

1. `db/user.py` - Lines 2 and 26
