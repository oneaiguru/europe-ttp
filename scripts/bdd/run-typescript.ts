#!/usr/bin/env bun
/**
 * Run TypeScript BDD tests
 *
 * Usage: bun scripts/bdd/run-typescript.ts [feature-path]
 *   If feature-path omitted, runs all features in specs/features/
 */

import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = path.resolve();
const SPEC_FEATURES = path.join(PROJECT_ROOT, 'specs/features');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test/reports');

const featurePath = process.argv[2] || SPEC_FEATURES;

await mkdir(OUTPUT_DIR, { recursive: true }).catch(() => {});

console.log(`[run-typescript] Running Cucumber on: ${featurePath}`);

const proc = spawn(
  'bun',
  [
    'node_modules/.bin/cucumber-js',
    featurePath,
    '-f',
    `json:${path.join(OUTPUT_DIR, 'typescript_bdd.json')}`,
    '--require',
    'test/typescript/steps',
    '--require-module',
    'ts-node/register',
  ],
  {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: { ...process.env, TS_NODE_PROJECT: 'tsconfig.json' },
  },
);

proc.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[run-typescript] Cucumber exited with code ${code}`);
    console.error('[run-typescript] Hint: Run "bun install" at repo root');
  } else {
    console.log('[run-typescript] Cucumber completed successfully');
  }
  process.exit(code || 0);
});

proc.on('error', (err) => {
  console.error('[run-typescript] Failed to start cucumber:', err);
  console.error('[run-typescript] Hint: Run "bun install" at repo root');
  process.exit(1);
});
