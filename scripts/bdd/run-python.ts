#!/usr/bin/env bun
/**
 * Run Python BDD tests against legacy code
 *
 * Usage: bun scripts/bdd/run-python.ts [feature-path]
 *   If feature-path omitted, runs all features in test/python/features/
 */

import { spawn } from 'child_process';
import path from 'path';

const PROJECT_ROOT = path.resolve();
const PYTHON_FEATURES = path.join(PROJECT_ROOT, 'test/python/features');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test/reports');

// Get feature path from args or use default
const featurePath = process.argv[2] || PYTHON_FEATURES;

console.log(`[run-python] Running Behave on: ${featurePath}`);

// Run behave command
const proc = spawn('behave', [
  featurePath,
  '-f', 'json',
  '-o', path.join(OUTPUT_DIR, 'python_bdd.json'),
  '--no-capture', // Don't capture stdout/stderr
], {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: PROJECT_ROOT },
});

proc.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[run-python] Behave exited with code ${code}`);
    process.exit(code || 1);
  }
  console.log('[run-python] Behave completed successfully');
  process.exit(0);
});

proc.on('error', (err) => {
  console.error('[run-python] Failed to start behave:', err);
  process.exit(1);
});
