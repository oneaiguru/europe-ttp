// eslint.config.js - ESLint v9 flat config for TypeScript
import tsParser from "@typescript-eslint/parser";
import tsEslint from "@typescript-eslint/eslint-plugin";

export default [
  {
    // Base ignores - legacy code, build outputs, and compiled artifacts only
    ignores: [
      "node_modules/",
      "test/typescript/node_modules/",
      "javascript/**",
      "dist/**",
      "test/typescript/steps/forms_steps.cjs",  // compiled output
      "experimental/**",  // third-party jsPDF
    ],
  },
  {
    // TypeScript source: scripts, test, app .ts, and app .tsx files
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
    files: ["cucumber.cjs", ".cucumberrc.cjs"],
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
