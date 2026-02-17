#!/usr/bin/env node
/**
 * Fast-fail Node version check
 * Exits with error if Node version is not exactly 20.20.0
 */

import { fileURLToPath, pathToFileURL } from 'url';
import { realpathSync } from 'fs';

const REQUIRED_VERSION = '20.20.0';
const REQUIRED_MAJOR = 20;
const REQUIRED_MINOR = 20;
const REQUIRED_PATCH = 0;

/**
 * Check Node version and exit if mismatch
 * Can be called directly or imported as a function
 */
export function checkNodeVersion() {
  const current = process.version;
  const match = current.match(/^v(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    console.error(`[check-node-version] ERROR: Cannot parse Node version: ${current}`);
    process.exit(1);
  }

  const [, major, minor, patch] = match.map(Number);

  if (major !== REQUIRED_MAJOR || minor !== REQUIRED_MINOR || patch !== REQUIRED_PATCH) {
    console.error(`[check-node-version] ERROR: Node.js ${REQUIRED_VERSION} is required.`);
    console.error(`[check-node-version] Current version: ${current}`);
    console.error(`[check-node-version] Install using nvm:`);
    console.error(`[check-node-version]   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash`);
    console.error(`[check-node-version]   nvm install ${REQUIRED_VERSION} && nvm use ${REQUIRED_VERSION}`);
    console.error(`[check-node-version] (Alternative: fnm, nodenv - see SETUP.md)`);
    process.exit(1);
  }

  console.log(`[check-node-version] OK: Node.js ${current}`);
}

// Run check only when executed directly (not when imported as a module)
// Uses realpathSync to resolve symlinks for accurate comparison
if (process.argv[1]) {
  try {
    const scriptRealPath = realpathSync(fileURLToPath(import.meta.url));
    const entryRealPath = realpathSync(process.argv[1]);
    if (scriptRealPath === entryRealPath) {
      checkNodeVersion();
    }
  } catch {
    // Fallback for edge cases (e.g., path doesn't exist)
    // Use URL comparison as secondary check
    try {
      const entryUrl = pathToFileURL(process.argv[1]).href;
      if (import.meta.url === entryUrl) {
        checkNodeVersion();
      }
    } catch {
      // Last resort: simple string comparison
      if (import.meta.url === `file://${process.argv[1]}`) {
        checkNodeVersion();
      }
    }
  }
}
