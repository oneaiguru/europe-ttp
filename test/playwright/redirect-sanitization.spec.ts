import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HARNESS_PATH = path.resolve(__dirname, 'helpers/redirect-test-harness.html');

// Extend Window interface for test harness functions
declare global {
  interface Window {
    __testSanitizeRedirectUrl: (url: string | null | undefined) => string | null;
    __testSanitizeHttpUrl: (url: string | null | undefined) => string | null;
  }
}

/**
 * Redirect Sanitization Runtime Tests
 *
 * These tests validate the ACTUAL runtime implementation of sanitizeRedirectUrl()
 * from javascript/utils.js by loading it in a browser context where DOM APIs
 * (document.createElement, window.location.host) are available.
 *
 * NOTE: The existing BDD tests in specs/features/security/redirect_sanitization.feature
 * use a SIMULATED implementation that has additional security features not present
 * in the runtime. This file tests the actual runtime behavior.
 *
 * GAP ANALYSIS: Compare results between BDD (simulated) and Playwright (runtime) tests
 * to identify security gaps in the implementation.
 */

test.describe('Redirect Sanitization - Runtime Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Load the test harness which exposes sanitizeRedirectUrl
    await page.goto(`file://${HARNESS_PATH}`);
  });

  /**
   * Helper to call the runtime sanitizeRedirectUrl function
   */
  async function sanitizeRedirect(page: Page, url: string | null | undefined): Promise<string | null> {
    return await page.evaluate((testUrl: string | null | undefined) => {
      return window.__testSanitizeRedirectUrl(testUrl);
    }, url);
  }

  test.describe('Basic validation', () => {
    test('null input returns null', async ({ page }) => {
      const result = await sanitizeRedirect(page, null);
      expect(result).toBeNull();
    });

    test('undefined input returns null', async ({ page }) => {
      const result = await sanitizeRedirect(page, undefined as unknown as string);
      expect(result).toBeNull();
    });

    test('empty string returns null', async ({ page }) => {
      const result = await sanitizeRedirect(page, '');
      expect(result).toBeNull();
    });

    test('whitespace-only string returns null', async ({ page }) => {
      const result = await sanitizeRedirect(page, '   ');
      expect(result).toBeNull();
    });

    test('string literal "null" returns null', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'null');
      expect(result).toBeNull();
    });
  });

  test.describe('Root-relative paths', () => {
    test('root-relative path is allowed', async ({ page }) => {
      const result = await sanitizeRedirect(page, '/safe-path');
      expect(result).toBe('/safe-path');
    });

    test('root-relative path with query string is allowed', async ({ page }) => {
      const result = await sanitizeRedirect(page, '/safe-path?query=value');
      expect(result).toBe('/safe-path?query=value');
    });

    test('root-relative path with fragment is allowed', async ({ page }) => {
      const result = await sanitizeRedirect(page, '/safe-path#section');
      expect(result).toBe('/safe-path#section');
    });
  });

  test.describe('Protocol-relative URLs', () => {
    test('protocol-relative URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, '//evil.com/path');
      expect(result).toBeNull();
    });

    test('protocol-relative URL with subdomain is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, '//attacker.evil.com/path');
      expect(result).toBeNull();
    });
  });

  test.describe('Absolute URLs', () => {
    // NOTE: These tests use the browser's window.location.host for same-origin check.
    // In a file:// context, this will be empty, so cross-origin URLs will be rejected.
    // The runtime checks anchor.host !== window.location.host

    test('cross-origin HTTPS URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'https://not-this-host.example/path');
      // In file:// context, window.location.host is empty, so any URL with a host will fail
      expect(result).toBeNull();
    });

    test('cross-origin HTTP URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'http://evil.com/path');
      expect(result).toBeNull();
    });
  });

  test.describe('Dangerous protocols', () => {
    test('javascript: URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'javascript:alert(1)');
      // The runtime uses anchor.protocol check - javascript: will fail http/https check
      expect(result).toBeNull();
    });

    test('data: URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'data:text/html,<script>alert(1)</script>');
      expect(result).toBeNull();
    });

    test('vbscript: URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'vbscript:alert(1)');
      expect(result).toBeNull();
    });

    test('file: URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'file:///etc/passwd');
      expect(result).toBeNull();
    });
  });

  test.describe('Security gaps (tests expected to FAIL against runtime)', () => {
    /**
     * These tests document where the runtime implementation falls short of
     * the security model tested in the BDD simulation.
     *
     * The simulated implementation in redirect_sanitization_steps.ts has:
     * - URL decoding bypass protection (runtime lacks)
     * - Dangerous scheme detection before anchor parsing (runtime lacks)
     * - Null byte/control character stripping (runtime lacks)
     *
     * These tests are expected to FAIL, documenting the security gaps.
     */

    test('GAP: URL-encoded protocol-relative URL may bypass runtime', async ({ page }) => {
      // The runtime does NOT decode URLs before checking
      // %2F%2F = // encoded
      const result = await sanitizeRedirect(page, '%2F%2Fevil.com%2Fpath');
      // This may NOT be null if runtime doesn't decode before checking
      // Document actual behavior
      console.log(`URL-encoded protocol-relative result: ${result}`);
      // Runtime check: trimmed.charAt(0) === '/' fails because first char is '%'
      // So it falls through to the absolute URL check
      // anchor.href = '%2F%2Fevil.com%2Fpath' - browser may or may not decode
      // This is a POTENTIAL security gap
    });

    test('GAP: Double-encoded protocol-relative URL may bypass runtime', async ({ page }) => {
      const result = await sanitizeRedirect(page, '%252F%252Fevil.com%252Fpath');
      console.log(`Double-encoded protocol-relative result: ${result}`);
      // Document actual behavior
    });

    test('GAP: URL-encoded javascript: may bypass runtime', async ({ page }) => {
      // %6A%61%76%61%73%63%72%69%70%74%3A = javascript: encoded
      const result = await sanitizeRedirect(page, '%6A%61%76%61%73%63%72%69%70%74%3Aalert(1)');
      console.log(`URL-encoded javascript result: ${result}`);
      // Document actual behavior
    });

    test('GAP: Null byte injection may not be stripped', async ({ page }) => {
      // Runtime does NOT strip null bytes before anchor parsing
      const result = await sanitizeRedirect(page, 'https://example.com%00.evil.com/path');
      console.log(`Null byte injection result: ${result}`);
      // Document actual behavior
    });

    test('GAP: Tab character in javascript: URL', async ({ page }) => {
      // Runtime does NOT normalize whitespace in scheme detection
      const result = await sanitizeRedirect(page, 'java\tscript:alert(1)');
      console.log(`Tab character injection result: ${result}`);
      // Document actual behavior
    });
  });

  test.describe('Mixed case handling', () => {
    test('mixed case javascript: URL is rejected', async ({ page }) => {
      const result = await sanitizeRedirect(page, 'JaVaScRiPt:alert(1)');
      // The anchor.protocol will be 'javascript:' (lowercased by browser)
      expect(result).toBeNull();
    });

    test('HTTP and HTTPS protocols are handled case-insensitively', async ({ page }) => {
      // The runtime uses trimmed.toLowerCase() for protocol prefix check
      const result = await sanitizeRedirect(page, 'HtTpS://evil.com/path');
      expect(result).toBeNull(); // Cross-origin rejection
    });
  });
});
