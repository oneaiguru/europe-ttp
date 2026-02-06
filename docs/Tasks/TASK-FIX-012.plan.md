# TASK-FIX-012: Implementation Plan

## Goal
Remove PII from experimental fixtures and prune unsafe binary artifacts.

## Decision: Delete experimental/ Directory

After research, the recommended approach is to **delete the entire experimental/ directory** because:
1. Contains real PII (cannot be safely anonymized retrospectively)
2. Not part of the active BDD test suite
3. jsPDF is available via npm
4. No production code references this directory

## Implementation

### Step 1: Verify No Dependencies
```bash
# Check if any code imports from experimental/
grep -r "experimental/" --include="*.py" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v ".git"
```

### Step 2: Delete experimental/ Directory
```bash
git rm -r experimental/
```

### Step 3: Update .gitignore (if not already present)
Add patterns to prevent re-adding:
```
.DS_Store
*.zip
experimental/
```

### Step 4: Verify Tests Still Pass
```bash
bun run bdd:typescript
bun run bdd:python
bun run typecheck
bun run lint
```

## Rollback
If issues occur, restore with:
```bash
git checkout HEAD~1 -- experimental/
```

## Acceptance Criteria
1. ✅ No PII in tracked files (experimental/ removed)
2. ✅ No .DS_Store or .zip artifacts
3. ✅ Tests still pass (no dependencies on experimental/)
