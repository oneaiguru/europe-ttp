#!/usr/bin/env node
/**
 * Run Python BDD tests against legacy code
 *
 * Fix 0I-1A: Uses symlink test/python/features -> ../../specs/features
 * Behave runs from test/python directory (standard layout)
 *
 * Usage: node scripts/bdd/run-python.ts [feature-subpath]
 *   If feature-subpath omitted, runs all features
 *   Example: node scripts/bdd/run-python.ts features/auth/login.feature
 */

// Check Node version before proceeding
import { checkNodeVersion } from '../check-node-version.mjs';
checkNodeVersion();

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve PROJECT_ROOT from script location, not caller's CWD
// Fixes P2-PR97: path.resolve() uses CWD which fails when run from CI with absolute path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PYTHON_DIR = path.join(PROJECT_ROOT, 'test/python');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test/reports');

/**
 * Get graceful shutdown timeout from environment or use default.
 * Allows CI/slow environments to configure longer grace periods.
 */
function getGracefulShutdownTimeoutMs(): number {
  const DEFAULT_TIMEOUT_MS = 5000;
  const env = process.env.BDD_FORCE_KILL_TIMEOUT_MS;
  if (env === undefined || env === '') {
    return DEFAULT_TIMEOUT_MS;
  }
  const trimmed = env.trim();
  if (trimmed === '' || !/^[1-9]\d*$/.test(trimmed)) {
    console.warn(
      `[run-python] Invalid BDD_FORCE_KILL_TIMEOUT_MS="${env}", using default ${DEFAULT_TIMEOUT_MS}ms`
    );
    return DEFAULT_TIMEOUT_MS;
  }
  return parseInt(trimmed, 10);
}

/**
 * Graceful shutdown timeout in milliseconds.
 * After receiving SIGTERM/SIGINT, wait this long before force-killing child process.
 */
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = getGracefulShutdownTimeoutMs();

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

// Check if Python test directory exists (may not be included in TypeScript-only PRs)
if (!existsSync(PYTHON_DIR)) {
  console.log('[run-python] Python tests not available (test/python directory not found)');
  console.log('[run-python] This is expected in TypeScript-only deployments');
  console.log('[run-python] Skipping Python BDD tests...');
  process.exit(0);
}

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

// Track shutdown state to prevent duplicate signal handling
let isShuttingDown = false;
let forcedKillTimeout: ReturnType<typeof setTimeout> | null = null;

// Forward termination signals to child process
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    // Prevent duplicate signal handling
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    console.log(`[run-python] Received ${signal}, forwarding to child...`);

    // Clear any existing timeout before creating new one (prevents orphaned timeouts)
    if (forcedKillTimeout) {
      clearTimeout(forcedKillTimeout);
      forcedKillTimeout = null;
    }

    proc.kill(signal as NodeJS.Signals);

    // Force kill if child doesn't exit gracefully within 5 seconds
    forcedKillTimeout = setTimeout(() => {
      console.error(`[run-python] Child did not exit gracefully, force killing...`);
      proc.kill('SIGKILL' as NodeJS.Signals);
      forcedKillTimeout = null;
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
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
