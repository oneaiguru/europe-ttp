# Implementation: P2-PR97-SNAPSHOT-DIRS

## Summary
Fixed scripts/ui/capture-new-ui-snapshots.ts to create output directories before writing files.

## Changes Made

### File: `/Users/m/git/clients/aol/europe-ttp/scripts/ui/capture-new-ui-snapshots.ts`

1. **Added mkdirSync to import** (line 12)
   - Changed: `import { readdirSync, readFileSync, writeFileSync } from 'node:fs';`
   - To: `import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';`

2. **Added directory creation in writeSnapshot function** (line 224)
   - Added `mkdirSync(kindDir, { recursive: true });` before the `writeFileSync` call
   - Ensures the kind-specific snapshot directory exists before writing the HTML file

3. **Added OUTPUT_DIR creation before manifest write** (line 303)
   - Added `mkdirSync(OUTPUT_DIR, { recursive: true });` before creating the manifest
   - Ensures the base output directory exists before writing manifest.json

## Verification

### Typecheck
```
> npm run typecheck
✓ Passed with no errors
```

### BDD Verify
```
> npm run bdd:verify
✓ 375 steps defined, 0 orphan, 0 dead, 0 ambiguous, 0 overlapping
```

## Root Cause
The script assumed output directories already existed when writing snapshot files and the manifest. Running the script on a fresh clone or after cleaning output directories would fail with ENOENT errors because `writeFileSync` does not create parent directories.

## Solution
Used `mkdirSync` with `{ recursive: true }` option to ensure parent directories are created as needed before any write operations.
