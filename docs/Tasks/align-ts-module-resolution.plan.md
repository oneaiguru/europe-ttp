# TASK-085: align-ts-module-resolution - Implementation Plan

## Summary
Fix import style inconsistency by removing `.js` extension from one import. The TypeScript module resolution configuration (`moduleResolution: "bundler"`) is already correct for the Bun runtime and requires no changes.

## Research Findings
- `moduleResolution: "bundler"` is the correct setting for Bun projects (per TypeScript docs)
- `package.json` uses `"type": "module"` - aligned with `tsconfig.json`
- No path aliases (`@/`) are used in the codebase
- `bun run typecheck` and `bun run bdd:verify` both pass
- One inconsistency found: `test/typescript/steps/api_steps.ts:6` uses `.js` extension in import

## Implementation Steps

### Step 1: Remove `.js` extension from import
**File:** `test/typescript/steps/api_steps.ts:6`

**Change:**
```diff
- import { authContext } from './auth_steps.js';
+ import { authContext } from './auth_steps';
```

**Rationale:** The rest of the codebase uses extensionless imports (e.g., `app/api/upload/verify/route.ts`, `scripts/bdd/verify-alignment.ts`). With `moduleResolution: "bundler"`, TypeScript and Bun handle extension resolution automatically.

### Step 2: Verify no other `.js` extension imports exist
Run a quick grep to ensure no other files have this inconsistency:

```bash
rg "from .*\.js['\"]" --type ts test/
```

### Step 3: Run verification gates
```bash
bun run typecheck
bun run bdd:verify
```

Both should pass (they already pass; this step confirms the change doesn't break anything).

## Files to Change
| File | Change |
|------|--------|
| `test/typescript/steps/api_steps.ts` | Remove `.js` extension from line 6 |

## Files to NOT Change
| File | Reason |
|------|--------|
| `tsconfig.json` | `moduleResolution: "bundler"` is correct for Bun |
| `package.json` | Already uses `"type": "module"` |

## Acceptance Criteria Verification
| Criterion | How to Verify |
|-----------|---------------|
| `moduleResolution` appropriate for Bun | Already correct (`"bundler"`) |
| `tsconfig.json` aligns with `package.json` | Already aligned (`ESNext` + `"type": "module"`) |
| No path alias misconfigurations | No aliases used; `baseUrl: "."` is sufficient |
| `bun run typecheck` passes | Run after change |
| `bun run bdd:verify` passes | Run after change |

## Risks
| Risk | Mitigation |
|------|------------|
| None - This is a trivial import style fix | Change is isolated to one line; verification gates will catch any issues |

## Rollback
If issues arise, restore the `.js` extension:
```diff
- import { authContext } from './auth_steps';
+ import { authContext } from './auth_steps.js';
```
