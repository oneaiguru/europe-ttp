# TASK-069: eslint-coverage-gaps - Implementation Plan

## Summary
Update `eslint.config.js` to include application TypeScript files (`app/**/*.ts`, `app/**/*.tsx`) and runtime JS config files (`*.cjs`) in ESLint coverage. The current config only covers `scripts/**/*.ts` and `test/**/*.ts`, creating a false-green linting situation.

## Changes to Make

### 1. Modify `eslint.config.js`

**Current state (lines 7-14, 17):**
- Ignores ALL `*.js` and `*.mjs` files
- Only covers `scripts/**/*.ts` and `test/**/*.ts`

**New state:**
- Move `*.js`, `*.mjs` from top-level `ignores` to selective application
- Add `app/**/*.ts` and `app/**/*.tsx` to `files` glob
- Create separate config entry for `.cjs` config files (`cucumber.cjs`, `.cucumberrc.cjs`)
- Keep `test/typescript/steps/forms_steps.cjs` ignored (compiled output)

**Exact edits:**

```js
// eslint.config.js - ESLint v9 flat config for TypeScript
import tsParser from "@typescript-eslint/parser";
import tsEslint from "@typescript-eslint/eslint-plugin";

export default [
  {
    // Base ignores - legacy code and build outputs only
    ignores: [
      "node_modules/",
      "test/typescript/node_modules/",
      "javascript/**",
      "dist/**",
      "test/typescript/steps/forms_steps.cjs",  // compiled output
    ],
  },
  {
    // TypeScript source: scripts, test, and app
    files: [
      "scripts/**/*.ts",
      "test/**/*.ts",
      "app/**/*.ts",
      "app/**/*.tsx",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsEslint,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // JS config files (cucumber, etc)
    files: ["*.cjs", "*.js"],
    // Exclude build artifacts and test compiled output
    ignored: false,  // override top-level ignores for these specific patterns
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
    rules: {
      // Basic JS linting for config files
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
];
```

**Alternative approach (simpler, using eslint flat config ignores override):**

```js
// eslint.config.js - ESLint v9 flat config for TypeScript
import tsParser from "@typescript-eslint/parser";
import tsEslint from "@typescript-eslint/eslint-plugin";

export default [
  {
    // Base ignores
    ignores: [
      "node_modules/",
      "test/typescript/node_modules/",
      "javascript/**",
      "dist/**",
      "test/typescript/steps/forms_steps.cjs",  // compiled output
      "!cucumber.cjs",  // un-ignore specific config files
      "!.cucumberrc.cjs",
    ],
  },
  {
    // TypeScript source: scripts, test, and app
    files: [
      "scripts/**/*.ts",
      "test/**/*.ts",
      "app/**/*.ts",
      "app/**/*.tsx",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsEslint,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // JS config files
    files: ["cucumber.cjs", ".cucumberrc.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
];
```

### 2. Verification Steps

After editing `eslint.config.js`:

1. Run `bun run lint` - should now lint app/ files
2. Run `bun run lint app/api/upload/signed-url/route.ts` - should NOT show "File ignored"
3. Run `bun run lint cucumber.cjs` - should lint the config file
4. Run `bun run typecheck` - verify no regression
5. Run `bun run bdd:verify` - verify BDD alignment still passes

## Files to Change

| File | Lines | Change |
|------|-------|--------|
| `eslint.config.js` | 5-34 | Add app/ patterns to files glob, add .cjs config entry |

## Expected Lint Results

Based on research, these files may have lint issues once covered:
- `app/api/upload/signed-url/route.ts` - may have unused vars or formatting
- `app/api/upload/verify/route.ts` - may have unused vars
- `app/utils/crypto.ts` - new file, should be clean
- `app/users/upload-form-data/route.ts` - may have unused vars
- Various `app/**/*.ts` render files - mostly template strings, likely clean

## Risks / Rollback

**Risk:** Adding app/ files may expose pre-existing lint issues that need fixing.

**Mitigation:** The task acceptance criteria allows for fixing these issues. Run `bun run lint --fix` first for auto-fixable issues, then manually address remaining ones.

**Rollback:** If issues are too numerous to address in this task, revert `eslint.config.js` to previous state and create follow-up task.

## Test Commands

```bash
# Verify lint covers app/ files
bun run lint app/api/upload/signed-url/route.ts

# Verify lint covers .cjs config
bun run lint cucumber.cjs

# Full lint (should pass after fixes)
bun run lint

# Typecheck (no regression)
bun run typecheck

# BDD alignment (no regression)
bun run bdd:verify
```

## Dependencies

None - this is a standalone tooling task.
