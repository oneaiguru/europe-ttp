# Plan: eliminate-ds-store-pyc

## Summary
Remove tracked Python bytecode files from git and add Python cache patterns to `.gitignore`.

---

## Step 1: Update `.gitignore`

**File:** `/Users/m/git/clients/aol/europe-ttp/.gitignore`

**After line 24** (`.DS_Store`), add Python cache patterns:

```gitignore
# Python cache
*.pyc
__pycache__/
*.pyo
```

**Location:** Insert after line 24, before `*.pem` on line 25.

---

## Step 2: Remove Tracked `.pyc` Files from Git Index

Use `git rm --cached` to remove from git tracking while keeping working copies:

```bash
# Remove .pyc files in repo root
git rm --cached admin.pyc constants.pyc disabled.pyc tabs.pyc ttc_portal.pyc ttc_portal_user.pyc

# Remove .pyc files in pyutils/
git rm --cached pyutils/__init__.pyc pyutils/utils.pyc

# Remove .pyc files in reporting/
git rm --cached reporting/__init__.pyc reporting/user_summary.pyc

# Remove .pyc files in test/python/steps/__pycache__/
git rm --cached test/python/steps/__pycache__/reports_steps.cpython-39.pyc
```

---

## Step 3: Verification

1. **Verify `.gitignore` updated:**
   ```bash
   grep -E "(\*\.pyc|__pycache__|\.pyo)" .gitignore
   ```

2. **Verify no `.pyc` files remain tracked:**
   ```bash
   git ls-files "*.pyc" "pyutils/*.pyc" "reporting/*.pyc" "test/python/steps/__pycache__/*.pyc"
   ```
   Expected: empty output

3. **Run quality checks:**
   ```bash
   bun scripts/bdd/verify-alignment.ts
   bun run typecheck
   bun run lint
   ```

---

## Step 4: Update Tracking

1. Update `IMPLEMENTATION_PLAN.md`:
   - Add entry to Phase 3 (Fixes) table for this task
   - Mark as ✅ DONE

2. Update `docs/Tasks/eliminate-ds-store-pyc.task.md`:
   - Change status from 🟡 IN PROGRESS to ✅ DONE

3. Remove `docs/Tasks/ACTIVE_TASK.md`

---

## Notes

- **No BDD scenarios:** This is a fix/hardening task with no feature file
- **Safe operation:** Python bytecode files are automatically regenerated when modules are imported
- **`.DS_Store`:** Already in `.gitignore` and not tracked (no action needed)
