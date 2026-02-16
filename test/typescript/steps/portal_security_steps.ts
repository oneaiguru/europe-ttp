/* BDD step definitions for portal link scheme validation tests */
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { renderPortalHome, type PortalHomeReportLink } from '../../../app/portal/home/render';
import { sanitizeHref } from '../../../app/utils/html';

// Track current portal state
let portalHtml: string;
let reportLinks: PortalHomeReportLink[] = [];

Given('I am viewing the portal home page', function () {
  // Reset state for each scenario
  portalHtml = '';
  reportLinks = [];
});

When('a report link contains {string}', function (url: string) {
  // Create a portal home with test URL
  reportLinks = [
    {
      href: url,
      label: 'Test Report',
    },
  ];
  portalHtml = renderPortalHome({
    userEmail: 'test@example.com',
    homeCountryIso: 'US',
    homeCountryName: 'United States',
    reportLinks,
  });
});

Then('the link should be rejected or sanitized', function () {
  // Verify sanitizeHref rejects the dangerous URL
  for (const link of reportLinks) {
    const sanitized = sanitizeHref(link.href);
    expect(sanitized).toBe('');
  }

  // Verify the dangerous URL is NOT present in the rendered output
  // This is the actual security requirement - XSS payload must not appear in HTML
  for (const link of reportLinks) {
    expect(portalHtml).not.toContain(link.href);
  }

  // Verify the link label is not rendered (link was filtered out)
  for (const link of reportLinks) {
    expect(portalHtml).not.toContain(link.label);
  }
});

Then('the link should be rendered correctly', function () {
  // Verify sanitizeHref allows the safe URL
  for (const link of reportLinks) {
    const sanitized = sanitizeHref(link.href);
    expect(sanitized).not.toBe('');
    expect(sanitized).toBeTruthy();
    // Verify the safe URL IS present in the rendered output
    expect(portalHtml).toContain(sanitized);
  }

  // Verify link structure is present
  expect(portalHtml).toContain('<a');
  expect(portalHtml).toContain('rel="admin"');
  expect(portalHtml).toContain('href=');

  // Verify label is present
  expect(portalHtml).toContain('Test Report');
});
