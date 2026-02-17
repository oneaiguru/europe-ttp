# P2-PR97-NPM-SCRIPTS-MISSING: Investigation and Plan

## Issue Description

The PR comment claimed these npm script entries reference files that are not present in the repository:
- `"verify:infra": "node scripts/verify-infra.mjs"`
- `"ui:snapshot:new": "node --import tsx scripts/ui/capture-new-ui-snapshots.ts"`
- `"ui:parity": "playwright test test/playwright/ui_parity.spec.ts"`
- `"test:redirect": "playwright test test/playwright/redirect-sanitization.spec.ts"`

## Investigation Results

### File Existence Check

| Script | Referenced File | Exists? |
|--------|-----------------|---------|
| `verify:infra` | `scripts/verify-infra.mjs` | YES |
| `ui:snapshot:new` | `scripts/ui/capture-new-ui-snapshots.ts` | YES |
| `ui:parity` | `test/playwright/ui_parity.spec.ts` | YES |
| `test:redirect` | `test/playwright/redirect-sanitization.spec.ts` | YES |

### Functional Verification

**verify:infra script** - Successfully executed:
```
[verify-infra] Starting infrastructure verification...
[Node Version Check] Running...
[check-node-version] OK: Node.js v20.20.0
[Node Version Check] OK
[TypeScript Typecheck] Running...
[TypeScript Typecheck] OK
[ESLint Lint] Running...
[ESLint Lint] OK
```

**ui:snapshot:new** - File is a valid TypeScript module with proper imports from `node:fs`, `node:path`, and `node:url`.

**ui:parity** - File is a valid Playwright test spec with proper imports from `@playwright/test` and local helper module.

**test:redirect** - File is a valid Playwright test spec with proper imports from `@playwright/test` and test harness.

### package.json Verification

All four scripts are defined in `package.json` (lines 25-28):
```json
"verify:infra": "node scripts/verify-infra.mjs",
"ui:snapshot:new": "node --import tsx scripts/ui/capture-new-ui-snapshots.ts",
"ui:parity": "playwright test test/playwright/ui_parity.spec.ts",
"test:redirect": "playwright test test/playwright/redirect-sanitization.spec.ts",
```

## Conclusion

**STATUS: INVALID / FALSE_POSITIVE**

The PR comment claiming these npm scripts reference missing files is incorrect. All four files exist in the repository at their specified paths, and at least one (`verify:infra`) was verified to execute successfully.

## Recommendation

**NO ACTION REQUIRED**

This issue should be closed as invalid. The npm scripts are correctly configured and their referenced files are present in the repository.

## Evidence

- File paths verified via `Glob` tool: All 4 files found
- `verify:infra` executed and passed all checks
- File contents inspected and confirmed to be valid TypeScript/JavaScript modules
- package.json scripts section verified to contain all referenced entries

---

*Investigation completed: 2026-02-16*
