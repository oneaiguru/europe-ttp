# TASK-053: reduce-test-fallbacks-typescript - Research

## Task Summary
Stop TypeScript BDD steps from passing when implementation is missing/broken, and fix state leakage between scenarios.

---

## Evidence Locations

### 1. Fallback Response Logic in `admin_steps.ts`

**File**: `test/typescript/steps/admin_steps.ts:64-98`

Three fallback HTML constants and silent try/catch blocks:

```typescript
const ADMIN_DASHBOARD_FALLBACK_HTML =
  '<h1>Admin</h1><table id="ttc_applicants_summary"></table>';
const ADMIN_REPORTS_LIST_FALLBACK_HTML = `<h1>Admin</h1><ul>...</ul>`;
const ADMIN_SETTINGS_FALLBACK_HTML =
  '<h1>Admin Settings</h1><p>Please enter settings for TTC portal</p><div id="settings_page"></div>';

async function renderAdminDashboardHtml(): Promise<string> {
  try {
    const module = await import('../../../app/admin/ttc_applicants_summary/render');
    if (typeof module.renderAdminDashboard === 'function') {
      return module.renderAdminDashboard();
    }
  } catch {
    // Ignore missing module, fallback below.
  }
  return ADMIN_DASHBOARD_FALLBACK_HTML;
}
```

**Lines**: 64-74 (dashboard), 76-86 (reports list), 88-98 (settings)

**Issue**: When the render module is missing or the function doesn't exist, tests pass using fake HTML. This masks:
- Import errors (module path wrong, file missing)
- Export errors (function not exported)
- Runtime errors in the render function

---

### 2. State Leakage - Module-Level Contexts Not Reset

**Problem**: Multiple step files define module-level state objects that are never reset between scenarios. Only `e2e_api_steps.ts` has a `Before()` hook.

#### Files with Unreset State:

| File | Context Object | Lines | Properties |
|------|----------------|-------|------------|
| `test/typescript/steps/api_steps.ts` | `apiContext` | 27-30 | `responseStatus`, `lastPayload` |
| `test/typescript/steps/draft_steps.ts` | `draftContext` | 35-43 | `drafts`, `currentForm`, `partialFormData` |
| `test/typescript/steps/user_steps.ts` | `userFormContext` | 150 | `lastResponseStatus`, `lastResponseBody` |
| `test/typescript/steps/user_steps.ts` | `configContext` | 263 | `lastConfig`, `lastResponseStatus` |
| `test/typescript/steps/user_steps.ts` | `getFormDataContext` | 341 | `lastFormData`, `lastResponseStatus` |
| `test/typescript/steps/user_steps.ts` | `reportingContext` | 473 | `lastReport`, `lastResponseStatus` |
| `test/typescript/steps/eligibility_dashboard_steps.ts` | `eligibilityDashboardContext` | 53-57 | `userEmail`, `availableCourses`, `eligibilityMap` |
| `test/typescript/steps/form_prerequisites_steps.ts` | `prerequisitesContext` | 28-33 | `userEmail`, `completedForms`, `availableForms` |
| `test/typescript/steps/integrity_steps.ts` | `integrityContext` (globalThis) | 67-77 | `integrityData`, `evaluations`, `csvData`, etc. |

#### Example from `api_steps.ts:27-30`:
```typescript
const apiContext: {
  responseStatus?: number;
  lastPayload?: Record<string, unknown>;
} = {};
```

This object is never reset, so `apiContext.responseStatus` from a failed scenario can persist into the next scenario.

#### Example from `draft_steps.ts:35-43`:
```typescript
const draftContext: {
  drafts: Record<string, DraftData>;
  currentForm?: string;
  partialFormData?: Record<string, string>;
} = {
  drafts: {},
  currentForm: undefined,
  partialFormData: undefined,
};
```

The `drafts` object accumulates entries across scenarios unless explicitly cleared.

---

### 3. State Reset - Correct Implementation in `e2e_api_steps.ts`

**File**: `test/typescript/steps/e2e_api_steps.ts:106-132`

This file demonstrates the correct pattern:

```typescript
Before(() => {
  // Reset the test context properties without replacing the object
  testContext.whitelist = [];
  testContext.evaluations = [];
  // ... resets all properties
  delete testContext.currentEmail;
  delete testContext.currentRole;
  // ... deletes optional properties
});
```

**Issue**: Other step files don't have similar `Before()` hooks.

---

### 4. Other Step Files (No Fallback Issues Found)

The review cited these locations, but upon inspection they do NOT have fallback logic:

- `test/typescript/steps/api_steps.ts:83` - Direct import, no fallback
- `test/typescript/steps/forms_steps.ts:23` - Direct import, no fallback
- `test/typescript/steps/portal_steps.ts:81` - Direct import, no fallback

These files correctly fail on import errors. The evidence locations in the review draft may be outdated or referencing compiled `.js` files.

---

## Problem Analysis

### Current Behavior

1. **Fallback Pattern**: `admin_steps.ts` catches all import/runtime errors and returns fake HTML that tests can assert against
2. **State Leakage**: Module-level contexts persist across scenarios, potentially causing false positives or false negatives

### Why This Is Problematic

1. **False Greens**: Admin tests pass even when render modules are completely broken
2. **Silent Failures**: Import errors, missing exports, and runtime failures are never reported
3. **Cross-Scenario Contamination**: State from one scenario affects the next, making tests non-deterministic

---

## Root Causes

### 1. Legacy of Fixture-First Design

The fallback pattern was likely intentional during early development to allow tests to run before all render modules were implemented. Now that implementation is complete, the fallback masks real issues.

### 2. Cucumber v11 World Object Underutilization

Cucumber v11 provides per-scenario `World` objects that automatically reset. Some steps use them (`forms_steps.ts`, `portal_steps.ts`, `admin_steps.ts`), but others use module-level state.

---

## Proposed Solution

### Option A: Remove Fallback + Centralize State Reset (Recommended)

1. **Remove try/catch fallback** in `admin_steps.ts`:
   - Delete `ADMIN_DASHBOARD_FALLBACK_HTML`, `ADMIN_REPORTS_LIST_FALLBACK_HTML`, `ADMIN_SETTINGS_FALLBACK_HTML`
   - Let import errors propagate and fail scenarios

2. **Create shared Before hook** in a new `test/typescript/steps/common.ts`:
   ```typescript
   import { Before } from '@cucumber/cucumber';

   Before(function () {
     // Reset apiContext
     apiContext.responseStatus = undefined;
     apiContext.lastPayload = undefined;

     // Reset draftContext
     draftContext.drafts = {};
     draftContext.currentForm = undefined;
     draftContext.partialFormData = undefined;

     // Reset other contexts...
   });
   ```

**Pros**:
- All scenarios fail fast on real errors
- Single source of truth for state reset
- Explicit about what state exists

**Cons**:
- Need to export contexts from their files
- Changes existing test behavior (tests using stale state may now fail)

### Option B: Move State to World Objects

Migrate all module-level contexts to Cucumber World objects:

```typescript
// In a common setup file
setWorldConstructor(function () {
  this.apiContext = { responseStatus: undefined, lastPayload: undefined };
  this.draftContext = { drafts: {}, currentForm: undefined };
  // ...
});
```

**Pros**:
- Cucumber automatically resets World per scenario
- No manual Before hook needed
- Follows Cucumber best practices

**Cons**:
- Requires changes to all step files to use `this.context` instead of module-level
- Larger refactor than Option A

### Option C: Explicit Mock Mode (Weaker)

Add environment variable check before allowing fallback:

```typescript
const MOCK_MODE = process.env.BDD_MOCK_MODE === 'true';

async function renderAdminDashboardHtml(): Promise<string> {
  try {
    const module = await import('../../../app/admin/ttc_applicants_summary/render');
    if (typeof module.renderAdminDashboard === 'function') {
      return module.renderAdminDashboard();
    }
  } catch (e) {
    if (!MOCK_MODE) {
      throw new Error(
        `Admin dashboard render failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
  return ADMIN_DASHBOARD_FALLBACK_HTML;
}
```

**Cons**: Still allows fallback when misconfigured; doesn't solve state leakage

---

## Files to Change

### Primary Changes
1. `test/typescript/steps/admin_steps.ts` - Remove fallback try/catch blocks (lines 64-98)
2. `test/typescript/steps/common.ts` - New file for shared Before hook and state reset

### Context Reset Changes
3. `test/typescript/steps/api_steps.ts` - Export `apiContext`, add to reset
4. `test/typescript/steps/draft_steps.ts` - Export `draftContext`, add to reset
5. `test/typescript/steps/user_steps.ts` - Export 4 contexts, add to reset
6. `test/typescript/steps/eligibility_dashboard_steps.ts` - Export context, add to reset
7. `test/typescript/steps/form_prerequisites_steps.ts` - Export context, add to reset
8. `test/typescript/steps/integrity_steps.ts` - Export `getIntegrityContext`, add to reset

---

## Related Work

- **TASK-052 (reduce-test-fallbacks-python)**: Similar issue in Python steps; used explicit `MOCK_MODE` flag
- **TASK-064 (ts-step-state-leakage)**: Fixed state leakage in `e2e_api_steps.ts`, but other files weren't addressed

---

## References

- `docs/review/REVIEW_DRAFTS.md` - Lines 113-119: Original review finding
- `test/typescript/steps/e2e_api_steps.ts:106-132` - Example of correct Before hook
- `pyutils/test_mode.py` - Python test mode infrastructure (could inspire TS equivalent)
