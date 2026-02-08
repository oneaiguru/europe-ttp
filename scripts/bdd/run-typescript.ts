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

const NODE_BIN = 'node';
const TSX_BIN = path.join(PROJECT_ROOT, 'node_modules/tsx/dist/cli.mjs');
const CUCUMBER_BIN = path.join(PROJECT_ROOT, 'node_modules/.bin/cucumber-js');

const proc = spawn(
  NODE_BIN,
  [
    '--preserve-symlinks',
    '--preserve-symlinks-main',
    TSX_BIN,
    CUCUMBER_BIN,
    featurePath,
    '-f',
    `json:${path.join(OUTPUT_DIR, 'typescript_bdd.json')}`,
    '--import',
    'test/typescript/steps/**/*.ts',
  ],
  {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PATH: [
        path.join(PROJECT_ROOT, 'node_modules'),
        process.env.NODE_PATH,
      ]
        .filter(Boolean)
        .join(path.delimiter),
    },
  },
);

// Track forced kill timeout for cleanup
let forcedKillTimeout: ReturnType<typeof setTimeout> | null = null;

// Forward termination signals to child process
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`[run-typescript] Received ${signal}, forwarding to child...`);
    proc.kill(signal as NodeJS.Signals);

    // Force kill if child doesn't exit gracefully within 5 seconds
    forcedKillTimeout = setTimeout(() => {
      console.error(`[run-typescript] Child did not exit gracefully, force killing...`);
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
    console.error(`[run-typescript] Cucumber terminated by signal: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`[run-typescript] Cucumber exited with code ${code}`);
    console.error('[run-typescript] Hint: Run "bun install" at repo root');
    process.exit(code);
  }
  console.log('[run-typescript] Cucumber completed successfully');
  process.exit(0);
});

proc.on('error', (err) => {
  console.error('[run-typescript] Failed to start cucumber:', err);
  console.error('[run-typescript] Hint: Run "bun install" at repo root');
  process.exit(1);
});
