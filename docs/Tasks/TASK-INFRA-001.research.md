# TASK-INFRA-001: Research Findings

## Problem Statement
The build prompt's dependency bootstrap snippet should be lockfile-aware to support `pnpm-lock.yaml`.

## Current State Analysis

### Lockfile Inventory
Located in `/workspace`:
- `bun.lock` - EXISTS (62,701 bytes, Feb 4 23:41)
- `package-lock.json` - EXISTS (135,283 bytes, Feb 5 20:00)
- `yarn.lock` - EXISTS (71,571 bytes, Feb 5 23:29)
- `pnpm-lock.yaml` - **DOES NOT EXIST**

### Current Bootstrap Snippet
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
    # bun is present but no bun lockfile; fall back to bun anyway (still deterministic-ish vs npm install).
    bun install
  else
    npm install
  fi
fi
```

## Key Findings

### 1. Bootstrap is Already Lockfile-Aware
The current snippet ALREADY handles `pnpm-lock.yaml` correctly:
- Line 27: `elif [ -f pnpm-lock.yaml ]`
- Lines 28-29: Enables corepack and runs `pnpm install --frozen-lockfile`

### 2. Priority Order is Correct
The current priority chain is:
1. `bun.lock*` + bun command → `bun install`
2. `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`
3. `package-lock.json` → `npm ci`
4. `yarn.lock` → `yarn install --frozen-lockfile`
5. bun command (no lockfile) → `bun install`
6. fallback → `npm install`

This matches the task's requirements.

### 3. The Assumption Mismatch
**Task assumption**: "This repo uses `pnpm-lock.yaml` and does not ship `package-lock.json`"
**Actual state**: `pnpm-lock.yaml` does not exist; `package-lock.json` does exist

### 4. package.json Context
The `package.json` shows:
- `"type": "module"` - ESM module
- Scripts use `bun` commands (e.g., `bun scripts/bdd/verify-alignment.ts`)
- `"engines"` includes both `"node": ">=20.0.0 <21.0.0"` and `"bun": ">=1.1.0"`

## Conclusion

**The bootstrap snippet is already correct** for the task's stated requirements. It already:
- Checks for `pnpm-lock.yaml` before falling back to `npm ci`
- Enables corepack for pnpm support
- Uses `--frozen-lockfile` for pnpm

The task description appears to be based on outdated information or an assumption that doesn't match the current repository state (where `pnpm-lock.yaml` doesn't exist).

**No code changes are needed** - the current implementation satisfies the stated acceptance criteria.
