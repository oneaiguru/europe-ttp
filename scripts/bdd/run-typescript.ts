#!/usr/bin/env bun
/**
 * Run TypeScript BDD tests
 *
 * Usage: bun scripts/bdd/run-typescript.ts [feature-path]
 *   If feature-path omitted, runs all features in specs/features/
 */

import { spawn } from 'child_process';
import path from 'path';

const PROJECT_ROOT = path.resolve();
const SPEC_FEATURES = path.join(PROJECT_ROOT, 'specs/features');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test/reports');

// Get feature path from args or use default
const featurePath = process.argv[2] || SPEC_FEATURES;

console.log(`[run-typescript] Running Cucumber on: ${featurePath}`);

// Run cucumber-js command
const proc = spawn('bun', [
  'test/typescript/node_modules/.bin/cucumber-js',
  featurePath,
  '-f', 'json:tests/reports/typescript_bdd.json',
  '--require', 'test/typescript/steps',
], {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
});

proc.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[run-typescript] Cucumber exited with code ${code}`);
    process.exit(code || 1);
  }
  console.log('[run-typescript] Cucumber completed successfully');
  process.exit(0);
});

proc.on('error', (err) => {
  console.error('[run-typescript] Failed to start cucumber:', err);
  console.error('[run-typescript] Hint: Run "bun install" in test/typescript/');
  process.exit(1);
});
