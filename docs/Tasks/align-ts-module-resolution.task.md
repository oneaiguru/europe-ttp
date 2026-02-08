# TASK-085: align-ts-module-resolution

## Goal
Ensure TypeScript module resolution configuration is aligned with the project's runtime (Bun) and build tools, avoiding misconfigurations that cause type errors or false-green checks.

## Context
The project is a **Bun-based migration** from Python 2.7 App Engine, NOT a Next.js project. The `app/` directory follows Bun's file routing convention.

Related tasks:
- TASK-070: Fixed type errors by replacing Next.js types with Web API types
- TASK-068: Added `baseUrl` to tsconfig.json and removed `app/api` from exclude

## Legacy Reference
None - this is an infrastructure/task configuration task.

## Refs
- `tsconfig.json` (lines 1-25)
- `package.json` (lines 1-32)

## Current State Analysis

### tsconfig.json
- `target`: "ES2022" ✓
- `module`: "ESNext" ✓
- `moduleResolution`: "bundler" - **may need review**
- `strict`: true ✓
- `skipLibCheck`: true ✓
- `esModuleInterop`: true ✓
- `resolveJsonModule`: true ✓
- `types`: ["node"] ✓
- `jsx`: "react" ✓
- `baseUrl`: "." ✓ (added in TASK-068)
- `include`: Mixed test, script, app sources
- `exclude`: node_modules only

### package.json
- `"type": "module"` - Uses ESM
- Uses `bun` as engine
- No `next` dependency
- DevDependencies: testing tools, ESLint, TypeScript

## Acceptance Criteria
- [ ] `moduleResolution` setting is appropriate for Bun runtime
- [ ] `tsconfig.json` aligns with package.json `"type": "module"`
- [ ] No path alias misconfigurations (`@/` or others)
- [ ] `bun run typecheck` passes
- [ ] `bun run bdd:verify` passes

## Files to Create/Modify
- [ ] `tsconfig.json` - Review and adjust `moduleResolution` if needed

## Test Commands
```bash
bun run typecheck
bun run bdd:verify
```

## Research Questions
1. Is `moduleResolution: "bundler"` correct for Bun runtime, or should it be `"node16"` / `"nodenext"`?
2. Are there any path alias configurations (`paths`) that need to be added or removed?
3. Does the current configuration cause any false-green typecheck scenarios?

## Notes
- TASK-068 already added `baseUrl: "."`
- TASK-070 fixed the immediate `next/server` type errors by using Web API types
- This task is about ensuring the *module resolution strategy* is correct for the long term
