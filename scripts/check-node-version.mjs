#!/usr/bin/env node
/**
 * Fast-fail Node version check
 * Exits with error if Node version is not exactly 20.20.0
 */

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

// Run check when executed directly
checkNodeVersion();
