# Plan: fix-api-py-or-disable-handler

## Task ID
fix-api-py-or-disable-handler

## Summary
Disable the broken `/api/.*` handler in all app.yaml files. The `api.py` module is incomplete dead code with syntax errors and is not used by any BDD tests or frontend code.

---

## Decision: Option A (Disable Handler)

Based on research findings:
- `api.py` has a syntax error (line 17)
- Contains incomplete stub code with PHP comments and `??????` placeholders
- Missing `pyutils` module
- Methods missing `self` parameters
- Not used by BDD tests (tests use `/users/upload-form-data` instead)
- No frontend references to `/api/upload-form`

**Recommended Action:** Remove the handler references from app.yaml files.

---

## Implementation Steps

### Step 1: Verify Current State
Run alignment check to ensure BDD tests still pass:
```bash
bun scripts/bdd/verify-alignment.ts
```

### Step 2: Remove `/api/.*` Handler from app.yaml

**File:** `app.yaml`
**Lines:** 76-79

Remove this block:
```yaml
- url: /api/.*
  script: api.app
  login: required
  secure: always
```

### Step 3: Remove `/api/.*` Handler from app-dev.yaml

**File:** `app-dev.yaml`
**Lines:** Around 60

Remove the equivalent block.

### Step 4: Remove `/api/.*` Handler from app-20190828.yaml

**File:** `app-20190828.yaml`
**Lines:** Around 76

Remove the equivalent block.

### Step 5: Run Quality Checks
```bash
# Alignment (should pass - no BDD scenarios for this task)
bun scripts/bdd/verify-alignment.ts

# Type check
bun run typecheck

# Lint
bun run lint
```

### Step 6: Update Tracking

Update `docs/Tasks/fix-api-py-or-disable-handler.task.md`:
- Set status to ✅ COMPLETE
- Document the changes made

Update `IMPLEMENTATION_PLAN.md`:
- Mark task `fix-api-py-or-disable-handler` as ✅ DONE

### Step 7: Clean Up
Remove `docs/Tasks/ACTIVE_TASK.md`

---

## Acceptance Criteria Verification

1. ✅ `app.yaml` does not reference broken handlers - Handler will be removed
2. ✅ `app-dev.yaml` does not reference broken handlers - Handler will be removed
3. ✅ `app-20190828.yaml` does not reference broken handlers - Handler will be removed

---

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `app.yaml` | Remove handler block | 76-79 |
| `app-dev.yaml` | Remove handler block | ~60 |
| `app-20190828.yaml` | Remove handler block | ~76 |
| `docs/Tasks/fix-api-py-or-disable-handler.task.md` | Update status | N/A |
| `docs/Tasks/ACTIVE_TASK.md` | Delete | N/A |

---

## No Step Registry Changes Needed

This is a fix/hardening task with no BDD scenarios. The step registry is not affected.
