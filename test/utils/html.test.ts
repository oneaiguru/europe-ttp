/**
 * Unit tests for HTML escape utilities.
 * Tests focus on XSS prevention via URL scheme validation.
 */

// @ts-expect-error - bun:test is a built-in Bun module
import { describe, it, expect } from 'bun:test';
import { escapeHtml, escapeHtmlAttr, sanitizeHref } from '../../app/utils/html';

describe('escapeHtml', () => {
  it('converts < to &lt;', () => {
    expect(escapeHtml('<test')).toBe('&lt;test');
  });

  it('converts > to &gt;', () => {
    expect(escapeHtml('test>')).toBe('test&gt;');
  });

  it('converts & to &amp;', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes script tags', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('handles multiple special characters', () => {
    expect(escapeHtml('<div>test & "quote"</div>'))
      .toBe('&lt;div&gt;test &amp; "quote"&lt;/div&gt;');
  });
});

describe('escapeHtmlAttr', () => {
  it('converts double quotes to &quot;', () => {
    expect(escapeHtmlAttr('test"quote')).toBe('test&quot;quote');
  });

  it('converts single quotes to &#x27;', () => {
    expect(escapeHtmlAttr("test'quote")).toBe('test&#x27;quote');
  });

  it('escapes all HTML special characters', () => {
    expect(escapeHtmlAttr('<div>test&"\'</div>'))
      .toBe('&lt;div&gt;test&amp;&quot;&#x27;&lt;/div&gt;');
  });

  it('escapes onclick handler', () => {
    // escapeHtmlAttr expects content to be inside double-quoted attribute
    // It escapes " to &quot; which prevents breaking out of the attribute
    expect(escapeHtmlAttr('" onclick="alert(1)'))
      .toBe('&quot; onclick=&quot;alert(1)');
  });
});

describe('sanitizeHref', () => {
  describe('valid URLs are allowed', () => {
    it('allows https:// URLs', () => {
      expect(sanitizeHref('https://example.com/report')).toBe('https://example.com/report');
    });

    it('allows http:// URLs', () => {
      expect(sanitizeHref('http://example.com/report')).toBe('http://example.com/report');
    });

    it('allows root-relative paths', () => {
      expect(sanitizeHref('/reports.html')).toBe('/reports.html');
    });

    it('allows root-relative paths with query string', () => {
      expect(sanitizeHref('/reports.html?id=123')).toBe('/reports.html?id=123');
    });

    it('allows root-relative paths with hash', () => {
      expect(sanitizeHref('/reports.html#section')).toBe('/reports.html#section');
    });

    it('allows plain relative paths and normalizes to root-relative', () => {
      expect(sanitizeHref('ttc_applicants_reports.html')).toBe('/ttc_applicants_reports.html');
    });

    it('allows plain relative paths with query string', () => {
      expect(sanitizeHref('report.html?id=123')).toBe('/report.html?id=123');
    });

    it('allows plain relative paths with hash', () => {
      expect(sanitizeHref('report.html#section')).toBe('/report.html#section');
    });

    it('allows plain relative paths in subdirectories', () => {
      expect(sanitizeHref('admin/reports.html')).toBe('/admin/reports.html');
    });

    it('trims whitespace from relative paths', () => {
      expect(sanitizeHref('  ttc_applicants_reports.html  ')).toBe('/ttc_applicants_reports.html');
    });

    it('trims whitespace', () => {
      expect(sanitizeHref('  https://example.com/report  ')).toBe('https://example.com/report');
    });
  });

  describe('unsafe schemes are rejected', () => {
    it('rejects javascript: scheme', () => {
      expect(sanitizeHref('javascript:alert(1)')).toBe('');
    });

    it('rejects javascript: with uppercase', () => {
      expect(sanitizeHref('JAVASCRIPT:alert(1)')).toBe('');
    });

    it('rejects javascript: with mixed case', () => {
      expect(sanitizeHref('JaVaScRiPt:alert(1)')).toBe('');
    });

    it('rejects data: scheme', () => {
      expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('rejects data: with uppercase', () => {
      expect(sanitizeHref('DATA:text/html,test')).toBe('');
    });

    it('rejects vbscript: scheme', () => {
      expect(sanitizeHref('vbscript:msgbox(1)')).toBe('');
    });

    it('rejects file: scheme', () => {
      expect(sanitizeHref('file:///etc/passwd')).toBe('');
    });

    it('rejects ftp: scheme', () => {
      expect(sanitizeHref('ftp://example.com/file')).toBe('');
    });

    it('rejects protocol-relative URLs (//evil.com)', () => {
      expect(sanitizeHref('//evil.com/phishing')).toBe('');
    });

    it('rejects protocol-relative with subdomain', () => {
      expect(sanitizeHref('//attacker.evil.com/path')).toBe('');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for null', () => {
      expect(sanitizeHref(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(sanitizeHref(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(sanitizeHref('')).toBe('');
    });

    it('returns empty string for whitespace-only', () => {
      expect(sanitizeHref('   ')).toBe('');
    });

    it('normalizes plain filenames to root-relative paths', () => {
      expect(sanitizeHref('not-a-valid-url')).toBe('/not-a-valid-url');
    });

    it('preserves https URL structure', () => {
      const url = 'https://example.com/path?query=value#hash';
      expect(sanitizeHref(url)).toBe(url);
    });
  });
});
