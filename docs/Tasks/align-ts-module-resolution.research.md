# TASK-085: align-ts-module-resolution - Research

## Executive Summary
The current TypeScript module resolution configuration is **mostly correct** for the Bun runtime. The `moduleResolution: "bundler"` setting is the appropriate choice for Bun projects. However, there is one `.js` extension usage in imports that should be reviewed for consistency.

---

## Evidence gathered

### 1. Runtime configuration analysis

**File:** `tsconfig.json:1-25`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    ...
    "baseUrl": "."
  },
  ...
}
```

**File:** `package.json:4`

```json
"type": "module"
```

**Finding:** The `moduleResolution: "bundler"` setting is **correct** for Bun. According to [TypeScript documentation](https://www.typescriptlang.org/tsconfig/moduleResolution.html), `bundler` mode is explicitly recommended for **Bun** projects:

> *"Use esnext with --moduleResolution bundler for bundlers, Bun, and tsx. Do not use for Node.js."*

### 2. Import pattern analysis

**Relative imports with `.js` extensions:**

- `test/typescript/steps/api_steps.ts:6` uses `from './auth_steps.js'`

This is inconsistent with the rest of the codebase. Most imports use TypeScript's extensionless imports:

- `app/api/upload/verify/route.ts:13` - `from '../../../utils/crypto'` (no extension)
- `scripts/bdd/verify-alignment.ts:3` - `from '../../test/bdd/step-registry'` (no extension)

**Finding:** The `.js` extension in `test/typescript/steps/api_steps.ts:6` is an inconsistency that should be removed for consistency with the `bundler` mode, which doesn't require file extensions.

### 3. Path alias analysis

**No path aliases (`@/`) are used in the codebase.**

Searched for patterns `from "@/` and `import "@/` - found only references in documentation files, not in actual source code.

**Finding:** No `paths` configuration needed in `tsconfig.json`. The `baseUrl: "."` is sufficient for the current import structure.

### 4. Type check and BDD verification status

Both verification gates pass:

```bash
$ bun run typecheck
# (passes with no output)

$ bun run bdd:verify
✓ 270 steps defined, 0 orphan, 0 dead, 0 ambiguous
```

**Finding:** The current configuration does not cause false-green typecheck scenarios.

---

## Research question answers

### Q1: Is `moduleResolution: "bundler"` correct for Bun runtime?

**Answer:** Yes. According to [TypeScript module resolution reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html), `moduleResolution: "bundler"` with `module: "esnext"` is the recommended configuration for Bun projects. The alternative `nodenext` is only for pure Node.js projects.

### Q2: Are there any path alias configurations (`paths`) that need to be added or removed?

**Answer:** No. The codebase uses relative imports exclusively (e.g., `from '../../../utils/crypto'`). No `@/` or other path aliases are used. The `baseUrl: "."` setting (from TASK-068) is sufficient.

### Q3: Does the current configuration cause any false-green typecheck scenarios?

**Answer:** No. The typecheck passes cleanly with no errors, and the BDD verification script confirms all steps are properly aligned.

---

## Recommendations

1. **Keep** `moduleResolution: "bundler"` - correct for Bun runtime
2. **Remove** the `.js` extension from `test/typescript/steps/api_steps.ts:6` for consistency
3. **Keep** `baseUrl: "."` - enables relative imports from project root
4. **No changes** needed to `paths` configuration (none used)
