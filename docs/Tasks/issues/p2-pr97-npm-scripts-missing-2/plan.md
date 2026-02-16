# P2-PR97-NPM-SCRIPTS-MISSING-2

## Issue
Bot claims these files referenced in package.json scripts don't exist:
- `scripts/verify-infra.mjs`
- `scripts/ui/capture-new-ui-snapshots.ts`
- `test/playwright/ui_parity.spec.ts`
- `test/playwright/redirect-sanitization.spec.ts`

## Analysis

### Files That EXIST (False Positive)
| File | Status | Notes |
|------|--------|-------|
| `scripts/ui/capture-new-ui-snapshots.ts` | EXISTS | Part of untracked files, not in PR diff |
| `test/playwright/ui_parity.spec.ts` | EXISTS | Part of untracked files, not in PR diff |

### Files That DON'T EXIST (Legitimate Issue)
| File | Status | Notes |
|------|--------|-------|
| `scripts/verify-infra.mjs` | MISSING | May be planned future script |
| `test/playwright/redirect-sanitization.spec.ts` | MISSING | May be planned future script |

## Verdict

**PARTIAL FALSE POSITIVE**

The bot is flagging files that exist in the working directory but aren't part of the PR changeset. This is expected behavior for files created during development that haven't been committed yet.

However, 2 files are genuinely missing and would need to be either:
1. Created if the npm scripts are needed
2. Removed from package.json if no longer planned

## Relationship to P2-PR97-NPM-SCRIPTS-MISSING

This is a duplicate/continuation of the same issue. The bot re-reported because:
1. The PR context changed
2. Files exist in working tree but not in the PR diff

## Action Required

None for the existing files - they work fine locally. For the missing files:
- If `npm run verify-infra` or `npm run test:redirect-sanitization` are needed, create them
- Otherwise, remove dead script references from package.json
