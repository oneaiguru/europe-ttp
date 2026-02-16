#!/usr/bin/env node
/**
 * Run TypeScript BDD tests
 *
 * Usage: node --import tsx scripts/bdd/run-typescript.ts [feature-path]
 *   If feature-path omitted, runs all features in specs/features/
 */

// Check Node version before proceeding
import { checkNodeVersion } from '../check-node-version.mjs';
checkNodeVersion();

import { spawn } from 'child_process';
import { mkdir, readdir } from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = path.resolve();
const SPEC_FEATURES = path.join(PROJECT_ROOT, 'specs/features');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test/reports');
const STEPS_ROOT = path.join(PROJECT_ROOT, 'test/typescript/steps');

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
      `[run-typescript] Invalid BDD_FORCE_KILL_TIMEOUT_MS="${env}", using default ${DEFAULT_TIMEOUT_MS}ms`
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

const featurePath = process.argv[2] || SPEC_FEATURES;

async function findCompiledStepArtifacts(root: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs'))) {
        results.push(fullPath);
      }
    }
  }

  try {
    await walk(root);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return results;
    }
    throw err;
  }

  return results;
}

const compiledArtifacts = await findCompiledStepArtifacts(STEPS_ROOT);
if (compiledArtifacts.length > 0) {
  const relativeArtifacts = compiledArtifacts
    .map((artifact) => path.relative(PROJECT_ROOT, artifact))
    .sort();

  console.error(
    `[run-typescript] Found ${relativeArtifacts.length} compiled step artifacts under ${path.relative(
      PROJECT_ROOT,
      STEPS_ROOT,
    )}.`,
  );
  relativeArtifacts.forEach((artifact) => {
    console.error(`[run-typescript] - ${artifact}`);
  });
  console.error(
    '[run-typescript] Remove these files so missing TypeScript code fails loudly instead of falling back.',
  );
  process.exit(1);
}

await mkdir(OUTPUT_DIR, { recursive: true }).catch(() => {});

console.log(`[run-typescript] Running Cucumber on: ${featurePath}`);

const NODE_BIN = process.execPath;
const CUCUMBER_BIN = path.join(PROJECT_ROOT, 'node_modules/@cucumber/cucumber/bin/cucumber.js');

// Register tsx as the Node.js TypeScript loader. This enables Cucumber to
// import TypeScript step definition files directly. The loader must be
// registered before Cucumber starts since it processes .ts files at runtime.
const proc = spawn(
  NODE_BIN,
  [
    '--preserve-symlinks',
    '--preserve-symlinks-main',
    '--import',
    'tsx',
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

    console.log(`[run-typescript] Received ${signal}, forwarding to child...`);

    // Clear any existing timeout before creating new one (prevents orphaned timeouts)
    if (forcedKillTimeout) {
      clearTimeout(forcedKillTimeout);
      forcedKillTimeout = null;
    }

    proc.kill(signal as NodeJS.Signals);

    // Force kill if child doesn't exit gracefully within 5 seconds
    forcedKillTimeout = setTimeout(() => {
      console.error(`[run-typescript] Child did not exit gracefully, force killing...`);
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
    console.error(`[run-typescript] Cucumber terminated by signal: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`[run-typescript] Cucumber exited with code ${code}`);
    console.error('[run-typescript] Hint: Run "npm install" at repo root');
    process.exit(code);
  }
  console.log('[run-typescript] Cucumber completed successfully');
  process.exit(0);
});

proc.on('error', (err) => {
  console.error('[run-typescript] Failed to start cucumber:', err);
  console.error('[run-typescript] Hint: Run "npm install" at repo root');
  process.exit(1);
});
