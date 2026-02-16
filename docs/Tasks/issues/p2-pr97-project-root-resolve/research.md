# P2-PR97: PROJECT_ROOT Resolve Issue - Research

## Issue Identification

**File:** `scripts/bdd/run-python.ts`
**Line:** 21 (original)
**Priority:** P2

## Problem

```typescript
const PROJECT_ROOT = path.resolve();
```

`path.resolve()` with no arguments returns the current working directory (CWD) of the calling process, not the repository root. This causes incorrect behavior when:

1. The script is run from CI with an absolute path without `cd`
2. The script is invoked from a different directory
3. The caller's CWD is not the repository root

## Impact

When `PROJECT_ROOT` is incorrectly resolved:
- `PYTHON_DIR` points to wrong location
- `OUTPUT_DIR` points to wrong location
- Python tests fail to find their files
- Test reports are written to wrong location

## Root Cause

ESM modules do not have `__dirname` and `__filename` globals like CommonJS. The pattern `path.resolve()` was used as a workaround but incorrectly resolves to CWD instead of script location.

## Solution

Use `import.meta.url` to get the script's location, then derive `__dirname` from it:

```typescript
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
```

This correctly resolves:
- `__filename` = `/path/to/repo/scripts/bdd/run-python.ts`
- `__dirname` = `/path/to/repo/scripts/bdd`
- `PROJECT_ROOT` = `/path/to/repo`

## Evidence

- Script location: `scripts/bdd/run-python.ts`
- Expected PROJECT_ROOT: Repository root (2 directories up from script)
- Original behavior: Uses `process.cwd()` which depends on where command is run from

## Classification

**Priority:** P2 (Medium)
- Not a security issue
- Not data corruption
- Causes test failures in CI environments
- Works correctly when run from repository root (common local dev pattern)

**Category:** Infrastructure/Build
**Component:** BDD Test Runner
