# TASK-INFRA-001: Implementation Plan

## Task Summary
Fix dependency bootstrap for pnpm-lock.yaml lockfile awareness.

## Research Conclusion
**NO CODE CHANGES NEEDED**

The research findings confirm that:
1. The bootstrap snippet in `PROMPT_build.md` is **already lockfile-aware**
2. It already checks for `pnpm-lock.yaml` before falling back to `npm ci`
3. It already enables corepack and runs `pnpm install --frozen-lockfile` when needed

## Root Cause
The task was created based on an **incorrect assumption**:
- **Assumption**: "This repo uses `pnpm-lock.yaml` and does not ship `package-lock.json`"
- **Actual state**: `pnpm-lock.yaml` does NOT exist; `package-lock.json` DOES exist

The repository currently has:
- `bun.lock` - EXISTS
- `package-lock.json` - EXISTS
- `yarn.lock` - EXISTS
- `pnpm-lock.yaml` - DOES NOT EXIST

## Current Bootstrap Snippet (Already Correct)
Location: `/workspace/PROMPT_build.md` lines 21-41

```bash
if [ ! -d node_modules ]; then
  if command -v bun >/dev/null 2>&1 && ( [ -f bun.lockb ] || [ -f bun.lock ] ); then
    bun install
  elif [ -f pnpm-lock.yaml ]; then
    corepack enable >/dev/null 2>&1 || true
    pnpm install --frozen-lockfile
  elif [ -f package-lock.json ]; then
    npm ci
  elif [ -f yarn.lock ]; then
    yarn install --frozen-lockfile
  elif command -v bun >/dev/null 2>&1; then
    bun install
  else
    npm install
  fi
fi
```

## Implementation Steps

### Step 1: Verify Acceptance Criteria (Skipped - No Changes)
**Status**: ✅ ALREADY SATISFIED

The existing code already meets all acceptance criteria:
- ✅ The snippet prefers `pnpm install --frozen-lockfile` when `pnpm-lock.yaml` exists
- ✅ The snippet uses `npm ci` only when `package-lock.json` exists
- ✅ A Weaver container without `bun` can bootstrap dependencies using existing lockfiles

### Step 2: No BDD Tests Required
This is an infrastructure/orchestration task with `feature_file: N/A`.
No step definitions or BDD scenarios are applicable.

### Step 3: Mark Task Complete
Since the bootstrap is already correct, this task can be marked as DONE.

## Verification Commands
```bash
# Verify lockfile state
ls -la *.lock *lock* 2>/dev/null

# Verify bootstrap snippet (should show pnpm check before npm ci)
grep -A 15 "if \[ ! -d node_modules \]" /workspace/PROMPT_build.md
```

## Completion Criteria
- [x] Bootstrap snippet verified as lockfile-aware
- [x] Acceptance criteria already satisfied
- [x] No code changes required
- [ ] Update task status in IMPLEMENTATION_PLAN.md
- [ ] Remove ACTIVE_TASK.md
