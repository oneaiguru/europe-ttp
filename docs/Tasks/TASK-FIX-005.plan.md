# TASK-FIX-005: Implementation Plan

## Goal
Ensure `step-registry.js` is kept in sync with `step-registry.ts` so that the alignment verification passes.

## Implementation Strategy

### Step 1: Compile step-registry.ts to JavaScript
Use TypeScript compiler to generate the `.js` file from `.ts`:

```bash
cd /workspace && npx tsc test/bdd/step-registry.ts --outDir test/bdd --module ESNext --target ES2022 --moduleResolution bundler --esModuleInterop --skipLibCheck --allowSyntheticDefaultImports
```

This will regenerate `test/bdd/step-registry.js` from the source `.ts` file.

### Step 2: Verify Alignment
Run the alignment check to confirm all steps are now matched:

```bash
cd /workspace && node scripts/bdd/verify-alignment.js
```

Expected output: `✓ 231 steps defined, 0 orphan, 0 dead`

### Step 3: Add Build Script to package.json
Add a build script to keep the registry in sync:

```json
"scripts": {
  "build:registry": "tsc test/bdd/step-registry.ts --outDir test/bdd --module ESNext --target ES2022 --moduleResolution bundler --esModuleInterop --skipLibCheck --allowSyntheticDefaultImports",
  "bdd:verify": "npm run build:registry && node scripts/bdd/verify-alignment.js"
}
```

This ensures the registry is always compiled before verification.

### Step 4: Run Full Verification
Run the complete BDD verification to ensure everything works:

```bash
cd /workspace && npm run bdd:verify
```

### Step 5: Update IMPLEMENTATION_PLAN.md
Mark TASK-FIX-005 as complete.

### Step 6: Clean Up
Remove `docs/Tasks/ACTIVE_TASK.md`

## Acceptance Criteria
- [ ] `step-registry.js` is regenerated from `step-registry.ts`
- [ ] `node scripts/bdd/verify-alignment.js` passes with 0 orphan, 0 dead
- [ ] Build script added to package.json
- [ ] All 231 steps are accessible to verification script

## Test Commands
```bash
# Compile the registry
npx tsc test/bdd/step-registry.ts --outDir test/bdd --module ESNext --target ES2022 --moduleResolution bundler --esModuleInterop --skipLibCheck --allowSyntheticDefaultImports

# Verify alignment
node scripts/bdd/verify-alignment.js
```

## Notes
- The `.ts` file uses ES modules with `export const STEPS`
- The compiled `.js` file will use the same format
- Both verify-alignment.js and verify-alignment.ts should work after compilation
