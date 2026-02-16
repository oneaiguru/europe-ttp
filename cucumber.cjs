// Cucumber configuration for TypeScript BDD tests.
//
// TypeScript Loading: This config uses ES module imports (`import:` option).
// TypeScript files are transpiled on-the-fly by `tsx`, which is registered
// at the Node process level via `--import tsx` in the runner script.
// See: scripts/bdd/run-typescript.ts
//
// Note: Direct `cucumber-js` CLI invocation is NOT supported in this repo.
// Use `npm run bdd:typescript` instead. The runner uses `tsx` via `--import tsx`
// because TypeScript steps use ESM constructs (e.g., import.meta.url) that
// are incompatible with ts-node/register.
module.exports = {
  spec: [
    'specs/features/**/*.feature',
  ],
  import: [
    'test/typescript/steps/**/*.ts',
  ],
  format: [
    'json:test/reports/typescript_bdd.json',
    'summary',
  ],
  formatOptions: {
    snippetInterface: 'async-await',
  },
};
