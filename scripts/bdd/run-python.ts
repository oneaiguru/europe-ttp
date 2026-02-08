#!/usr/bin/env bun
/**
 * Run Python BDD tests against legacy code
 *
 * Fix 0I-1A: Uses symlink test/python/features -> ../../specs/features
 * Behave runs from test/python directory (standard layout)
 *
 * Usage: bun scripts/bdd/run-python.ts [feature-subpath]
 *   If feature-subpath omitted, runs all features
 *   Example: bun scripts/bdd/run-python.ts features/auth/login.feature
 */

import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = path.resolve();
const PYTHON_DIR = path.join(PROJECT_ROOT, 'test/python');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test/reports');

// Feature path is relative to test/python/features (which symlinks to specs/features)
function normalizeFeatureSubpath(input?: string): string {
  if (!input) {
    return 'features';
  }

  let subpath = input;
  if (path.isAbsolute(subpath)) {
    subpath = path.relative(PROJECT_ROOT, subpath);
  }

  subpath = subpath.replace(/\\/g, '/');
  if (subpath.startsWith('./')) {
    subpath = subpath.slice(2);
  }

  if (subpath === 'specs/features' || subpath === 'specs/features/') {
    return 'features';
  }
  if (subpath.startsWith('specs/features/')) {
    return `features/${subpath.slice('specs/features/'.length)}`;
  }

  return subpath;
}

const featureSubpath = normalizeFeatureSubpath(process.argv[2]);

await mkdir(OUTPUT_DIR, { recursive: true }).catch(() => {});

console.log(`[run-python] Running Behave from: ${PYTHON_DIR}`);
console.log(`[run-python] Features: ${featureSubpath}`);
console.log(`[run-python] Output: ${path.join(OUTPUT_DIR, 'python_bdd.json')}`);

// Run behave from test/python directory
// It will find:
// - test/python/features (symlink to specs/features)
// - test/python/steps (step definitions)
// - test/python/features/environment.py (hooks)
const proc = spawn(
  'behave',
  [
    featureSubpath,
    '-f',
    'json',
    '-o',
    path.join(OUTPUT_DIR, 'python_bdd.json'),
    '--no-capture',
  ],
  {
    cwd: PYTHON_DIR,
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: PYTHON_DIR },
  },
);

// Track forced kill timeout for cleanup
let forcedKillTimeout: ReturnType<typeof setTimeout> | null = null;

// Forward termination signals to child process
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`[run-python] Received ${signal}, forwarding to child...`);
    proc.kill(signal as NodeJS.Signals);

    // Force kill if child doesn't exit gracefully within 5 seconds
    forcedKillTimeout = setTimeout(() => {
      console.error(`[run-python] Child did not exit gracefully, force killing...`);
      proc.kill('SIGKILL' as NodeJS.Signals);
    }, 5000);
  });
});

proc.on('exit', (code, signal) => {
  // Clear any pending forced kill timeout
  if (forcedKillTimeout) {
    clearTimeout(forcedKillTimeout);
    forcedKillTimeout = null;
  }

  if (signal) {
    console.error(`[run-python] Behave terminated by signal: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`[run-python] Behave exited with code ${code}`);
    process.exit(code);
  }
  console.log('[run-python] Behave completed successfully');
  process.exit(0);
});

proc.on('error', (err) => {
  console.error('[run-python] Failed to start behave:', err);
  process.exit(1);
});
