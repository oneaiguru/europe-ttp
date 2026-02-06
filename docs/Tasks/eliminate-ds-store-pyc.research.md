# Research: eliminate-ds-store-pyc

## Legacy Behavior Summary
This is a repository hygiene task, not a feature migration. The repo has tracked Python bytecode files (`.pyc`) that should not be in version control.

## Code Locations

### `.gitignore`
- **File:** `/Users/m/git/clients/aol/europe-ttp/.gitignore`
- **Line 24:** Contains `.DS_Store` (already present)
- **Missing:** No Python cache patterns (`*.pyc`, `__pycache__/`, `*.pyo`)

### Tracked `.pyc` Files (to be removed)
All tracked in git, need `git rm --cached`:
```
admin.pyc
constants.pyc
disabled.pyc
pyutils/__init__.pyc
pyutils/utils.pyc
reporting/__init__.pyc
reporting/user_summary.pyc
tabs.pyc
test/python/steps/__pycache__/reports_steps.cpython-39.pyc
ttc_portal.pyc
ttc_portal_user.pyc
```

### `.DS_Store` Status
- Already in `.gitignore` (line 24)
- Already removed from git tracking (none found in `git ls-files`)
- **No action needed for `.DS_Store`**

## Implementation Notes

1. **Add to `.gitignore`:** After line 24 (`.DS_Store`), add Python cache patterns:
   ```
   *.pyc
   __pycache__/
   *.pyo
   ```

2. **Remove tracked `.pyc` files:** Use `git rm --cached` to remove from git index without deleting working copies:
   ```bash
   git rm --cached *.pyc
   git rm --cached pyutils/*.pyc
   git rm --cached reporting/*.pyc
   git rm --cached test/python/steps/__pycache__/*.pyc
   ```

3. **These are legacy Python 2.7 bytecode files** - safe to remove as they are automatically regenerated when Python imports the modules.

## Step Registry Status
N/A - This is a fix/hardening task with no feature file, so no step registry entries are needed.
