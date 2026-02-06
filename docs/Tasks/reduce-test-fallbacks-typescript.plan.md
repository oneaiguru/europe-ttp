# TASK-053: reduce-test-fallbacks-typescript - Implementation Plan

## Summary
Remove fallback HTML patterns that mask import/runtime failures in `admin_steps.ts`, and add `Before` hooks to reset module-level state in 8 step files.

---

## Problem Statement

### Issue 1: Fallback Responses Mask Real Failures
**File**: `test/typescript/steps/admin_steps.ts:64-98`

Three `render*` functions catch all errors and return fake HTML:
- `renderAdminDashboardHtml()` → Returns `ADMIN_DASHBOARD_FALLBACK_HTML`
- `renderAdminReportsListHtml()` → Returns `ADMIN_REPORTS_LIST_FALLBACK_HTML`
- `renderAdminSettingsHtml()` → Returns `ADMIN_SETTINGS_FALLBACK_HTML`

This masks:
- Import errors (module path wrong, file missing)
- Export errors (function not exported)
- Runtime errors in the render function

### Issue 2: State Leakage Between Scenarios
Eight step files have module-level contexts that are never reset:

| File | Context Object | Lines |
|------|----------------|-------|
| `api_steps.ts` | `apiContext` | 27-30 |
| `draft_steps.ts` | `draftContext` | 35-43 |
| `user_steps.ts` | `userFormContext` | 150 |
| `user_steps.ts` | `configContext` | 263 |
| `user_steps.ts` | `getFormDataContext` | 341 |
| `user_steps.ts` | `reportingContext` | 473 |
| `eligibility_dashboard_steps.ts` | `eligibilityDashboardContext` | 53-57 |
| `form_prerequisites_steps.ts` | `prerequisitesContext` | 28-33 |
| `integrity_steps.ts` | `globalThis.integrityContext` | 67-77 |

Reference: `e2e_api_steps.ts:106-132` shows the correct pattern with a `Before()` hook.

---

## Implementation Steps

### Step 1: Create Common State Reset Module
**File**: `test/typescript/steps/common.ts` (new)

1. Import `Before` from `@cucumber/cucumber`
2. Import all context objects from their respective files (after exporting them)
3. Create a `Before()` hook that resets each context:
   - Reset objects to initial state
   - `delete` optional properties
   - Clear arrays and objects

### Step 2: Export Contexts from Each Step File
Export the context objects so `common.ts` can import them:

1. **api_steps.ts** (line 27): Add `export const apiContext = ...`
2. **draft_steps.ts** (line 35): Already exported - no change needed
3. **user_steps.ts**: Export 4 contexts (lines 150, 263, 341, 473)
4. **eligibility_dashboard_steps.ts** (line 53): Export `eligibilityDashboardContext`
5. **form_prerequisites_steps.ts** (line 28): Export `prerequisitesContext`
6. **integrity_steps.ts**: Export `getIntegrityContext()` function or the context object

### Step 3: Remove Fallback Logic from admin_steps.ts
**File**: `test/typescript/steps/admin_steps.ts`

1. Delete lines 49-62 (fallback HTML constants):
   - `ADMIN_DASHBOARD_FALLBACK_HTML`
   - `ADMIN_REPORTS_LIST_FALLBACK_HTML`
   - `ADMIN_SETTINGS_FALLBACK_HTML`

2. Simplify render functions (lines 64-98) to direct imports:
   ```typescript
   async function renderAdminDashboardHtml(): Promise<string> {
     const module = await import('../../../app/admin/ttc_applicants_summary/render');
     return module.renderAdminDashboard();
   }
   ```
   (Repeat for `renderAdminReportsListHtml` and `renderAdminSettingsHtml`)

3. Keep `ADMIN_REPORTS_LIST_LINKS` array (lines 51-57) - used for assertions

### Step 4: Verify Admin Render Functions Are Exported
**Before removing fallbacks, confirm:**

1. `app/admin/ttc_applicants_summary/render.ts` exports `renderAdminDashboard`
2. `app/admin/reports_list/render.ts` exports `renderAdminReportsList`
3. `app/admin/settings/render.ts` exports `renderAdminSettings`

Run `bun run typecheck` to verify imports will resolve.

---

## Files to Change

| File | Change Type | Lines |
|------|-------------|-------|
| `test/typescript/steps/common.ts` | Create | New file |
| `test/typescript/steps/admin_steps.ts` | Edit | 49-98 |
| `test/typescript/steps/api_steps.ts` | Edit | 27-30 |
| `test/typescript/steps/user_steps.ts` | Edit | 150, 263, 341, 473 |
| `test/typescript/steps/eligibility_dashboard_steps.ts` | Edit | 53-57 |
| `test/typescript/steps/form_prerequisites_steps.ts` | Edit | 28-33 |
| `test/typescript/steps/integrity_steps.ts` | Edit | 67-77 |

---

## Verification Commands

```bash
# Run TypeScript BDD tests
bun run bdd:typescript

# Type checking (should pass with direct imports)
bun run typecheck

# Linting
bun run lint

# Verify alignment between step registry and implementations
bun run bdd:verify
```

---

## Expected Test Impact

### Will Fail (Intentionally):
- Admin scenarios if render modules are missing/broken (currently pass falsely)
- Any scenarios relying on leaked state from previous scenarios

### Will Pass:
- Admin scenarios when render functions are correctly implemented
- All scenarios with proper state isolation

---

## Risks and Rollback

### Risk 1: Admin Tests May Fail After Change
**Cause**: If any admin render module is missing or has export errors

**Mitigation**:
1. Before starting, run `grep -r "export.*renderAdmin" app/admin/` to verify exports exist
2. If tests fail, check error message for missing module/function
3. Re-export or create missing render function

**Rollback**: Restore fallback logic with `git checkout test/typescript/steps/admin_steps.ts`

### Risk 2: State Reset May Break Tests That Rely on Leakage
**Cause**: Some tests may accidentally pass due to leaked state

**Mitigation**:
1. Run `bun run bdd:typescript` before changes to establish baseline
2. After changes, any new failures indicate tests that were relying on leaked state
3. Fix tests to properly set up their own state

**Rollback**: Remove `Before` hook from `common.ts`

### Risk 3: Circular Import Issues
**Cause**: `common.ts` imports from step files that might import from `common.ts`

**Mitigation**: Keep `common.ts` as a one-way dependency - it only imports contexts, step files don't import from `common.ts`

**Rollback**: N/A (design consideration)

---

## Order of Operations

1. **Verify exports exist** in `app/admin/*/render.ts` files
2. **Create `common.ts`** with empty `Before()` hook
3. **Export contexts** from each step file
4. **Populate `Before()` hook** in `common.ts` with reset logic
5. **Remove fallbacks** from `admin_steps.ts`
6. **Run tests** and fix any failures
7. **Commit** if all tests pass

---

## Related Work

- **TASK-052 (reduce-test-fallbacks-python)**: Similar fix for Python steps using explicit `MOCK_MODE` flag
- **TASK-064 (ts-step-state-leakage)**: Fixed `e2e_api_steps.ts` state reset (reference implementation)

---

## Success Criteria

1. `bun run bdd:typescript` passes with all scenarios
2. Import errors in admin render modules cause test failures (not silent fallbacks)
3. No state leaks between scenarios (verified by running scenarios in different orders)
4. `bun run bdd:verify` passes (step registry alignment)
