import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const browserBddTestDir = defineBddConfig({
  featuresRoot: projectRoot,
  features: path.join(projectRoot, 'specs/features/browser/**/*.feature'),
  steps: path.join(__dirname, 'steps/**/*.ts'),
  outputDir: path.join(__dirname, '.features-gen'),
});

/**
 * Playwright configuration for browser BDD, UI parity, and security tests.
 *
 * IMPORTANT: baseURL is scoped to the browser-bdd project only.
 * The parity and security projects use file:// URLs and must NOT inherit baseURL.
 *
 * All paths are absolute (resolved from project root) because this config
 * lives in test/playwright/ -- relative paths would double up.
 */
export default defineConfig({
  testDir: __dirname,
  testMatch: '**/*.spec.ts',

  outputDir: path.join(projectRoot, 'test-results'),

  use: {
    headless: true,
    screenshot: 'only-on-failure',
    // NO baseURL here -- file:// tests would break
  },

  fullyParallel: true,

  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(projectRoot, 'test/playwright/html-report') }],
  ],

  workers: process.env.CI ? 2 : 4,
  timeout: 30 * 1000,
  retries: process.env.CI ? 2 : 0,

  webServer: {
    command: 'npx next dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: projectRoot,
  },

  projects: [
    {
      name: 'browser-bdd',
      testDir: browserBddTestDir,
      testMatch: '**/*.spec.js',
      use: { baseURL: 'http://localhost:3000' },
    },
    {
      name: 'parity',
      testDir: __dirname,
      testMatch: 'ui_parity.spec.ts',
      // no baseURL -- uses file:// URLs
    },
    {
      name: 'security',
      testDir: __dirname,
      testMatch: 'redirect-sanitization.spec.ts',
      // no baseURL -- uses file:// URLs
    },
  ],
});
