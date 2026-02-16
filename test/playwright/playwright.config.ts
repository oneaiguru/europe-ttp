import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for UI parity audit tests.
 *
 * These tests compare legacy UI snapshots with new UI snapshots by loading
 * static HTML files and verifying structural/functional parity.
 */
export default defineConfig({
  testDir: './test/playwright',
  testMatch: '**/*.spec.ts',

  // Output directory for test results
  outputDir: './test/playwright/results',

  // Run tests in headless mode (CI-friendly)
  use: {
    headless: true,
    // Capture screenshot on failure for debugging
    screenshot: 'only-on-failure',
  },

  // Run tests in parallel for faster feedback
  fullyParallel: true,

  // Report configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: './test/playwright/results/html-report' }],
  ],

  // Worker configuration
  workers: process.env.CI ? 2 : 4,

  // Timeout for each test (30 seconds default)
  timeout: 30 * 1000,

  // Retry on CI only (flaky network/filesystem)
  retries: process.env.CI ? 2 : 0,
});
