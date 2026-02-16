#!/usr/bin/env node
/**
 * Infra Verification Script
 *
 * Runs all verification gates in order for Node.js 20.20.0 + Next.js 16 infrastructure.
 *
 * Gates (run in order, fail-fast):
 * 1. Node version check (via check-node-version.mjs)
 * 2. TypeScript typecheck
 * 3. ESLint lint
 * 4. BDD alignment verification
 * 5. Next.js production build
 *
 * Usage:
 *   node scripts/verify-infra.mjs
 *   npm run verify:infra
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

/**
 * Run a command and return its exit code
 * Uses stdio: 'inherit' for proper output forwarding
 */
function run(name, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${name}] Running...`);

    const proc = spawn(command, args, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        console.log(`[${name}] OK`);
        resolve(0);
      } else {
        console.error(`[${name}] FAILED with exit code ${code}`);
        reject(new Error(`${name} failed`));
      }
    });

    proc.on('error', (err) => {
      console.error(`[${name}] ERROR: ${err.message}`);
      reject(err);
    });
  });
}

/**
 * Main verification flow
 */
async function main() {
  console.log('[verify-infra] Starting infrastructure verification...');

  const gates = [
    ['Node Version Check', 'node', ['scripts/check-node-version.mjs']],
    ['TypeScript Typecheck', 'npm', ['run', 'typecheck']],
    ['ESLint Lint', 'npm', ['run', 'lint']],
    ['BDD Alignment', 'npm', ['run', 'bdd:verify']],
    ['Next.js Build', 'npm', ['run', 'build']],
  ];

  for (const [name, cmd, args] of gates) {
    try {
      await run(name, cmd, args);
    } catch {
      console.error(`\n[verify-infra] FAILED at: ${name}`);
      console.error('[verify-infra] Fix errors above and retry');
      process.exit(1);
    }
  }

  console.log('\n[verify-infra] All verification gates PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error('[verify-infra] Unexpected error:', err);
  process.exit(1);
});
