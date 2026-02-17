/* BDD step definitions for legacy JavaScript XSS regression tests */
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { escapeHtmlAttr } from '../../../app/utils/html';

// Track current content and rendered output
let renderedOutput: string;
let showCharCount: number;

/**
 * Simulates getShowHideHTML function from javascript/utils.js:1581-1595.
 *
 * The function takes content and renders it with show/hide toggle if it exceeds
 * a character count threshold. Short content path (under threshold with no toggle)
 * must escape HTML to prevent XSS.
 *
 * This simulates the SHORT CONTENT PATH specifically, which is XSS regression target.
 *
 * @param content - The raw user content to render
 * @param _show_char_count - Character threshold for show/hide (default 100, unused in short-path simulation)
 * @returns Escaped HTML string
 */
function simulateGetShowHideHTML(
  content: string,
  show_char_count: number = 100,
  show_button_text: string = '(show more)',
  hide_button_text: string = '(hide)'
): string {
  // This implements the non-single-line branch from javascript/utils.js.
  // It covers both:
  // - short content path (escape only)
  // - long content path (show/hide toggle markup + escaped content)

  let btn_sep = '<br>';
  const hide_controls_length = show_button_text.length + 4;
  let hide_buf = hide_controls_length + 3;
  if (show_char_count <= 23) {
    btn_sep = '&nbsp;';
    hide_buf = 0;
  }

  if (content.length > show_char_count + hide_buf) {
    const visible_text = content.substring(0, show_char_count - hide_controls_length);
    const hidden_text = content.substring(show_char_count - hide_controls_length);
    const escapedShowButtonText = escapeHtmlAttr(show_button_text);
    const escapedHideButtonText = escapeHtmlAttr(hide_button_text);

    return (
      escapeHtmlAttr(visible_text) +
      '<span id="shDots">...</span>' +
      '<span id="shMore" style="display:none;">' +
      escapeHtmlAttr(hidden_text) +
      '</span>' +
      btn_sep +
      `<span id="shButton" onclick="showHide('', '${escapedShowButtonText}', '${escapedHideButtonText}', false)" style="color:blue;cursor:pointer;display:inline-block; font-family:'Ubuntu Mono',monospace;">` +
      show_button_text +
      '</span>'
    );
  }

  // Short content path: escape to prevent XSS (javascript/utils.js:1595).
  return escapeHtmlAttr(content);
}

Given('I am using the legacy utils.js getShowHideHTML function', function () {
  // Reset state for each scenario
  renderedOutput = '';
  showCharCount = 100; // Default threshold from legacy code
});

When('I render content {string}', function (content: string) {
  renderedOutput = simulateGetShowHideHTML(content, showCharCount);
});

Then('the output should be escaped as {string}', function (expected: string) {
  // Verify exact escape output
  expect(renderedOutput).toBe(expected);
});

Then('the output should escape the script tag', function () {
  // Script tags should be fully escaped
  expect(renderedOutput).toContain('&lt;script&gt;');
  expect(renderedOutput).toContain('&lt;/script&gt;');
  // Should NOT contain raw script tags
  expect(renderedOutput).not.toContain('<script>');
  expect(renderedOutput).not.toContain('</script>');
});

Then('the output should escape HTML attributes', function () {
  // This regression asserts the entire tag is escaped so no attributes can execute.
  expect(renderedOutput).toContain('&lt;div');
  expect(renderedOutput).toContain('&gt;');
  expect(renderedOutput).toContain('&lt;/div&gt;');
  expect(renderedOutput).not.toContain('<div');
  expect(renderedOutput).not.toContain('</div>');
});

Then(/^the output should contain the show\/hide toggle$/, function () {
  // Long content includes show/hide button
  expect(renderedOutput).toContain('showHide(');
  expect(renderedOutput).toContain('onclick=');
  expect(renderedOutput).toContain('shButton');
});

Then('the content should be displayed', function () {
  // Content should be present (escaped) in output
  expect(renderedOutput.length).toBeGreaterThan(0);
});

When('I render long content over {int} characters', function (threshold: number) {
  // Create content that exceeds threshold
  // Must exceed the legacy buffer/controls threshold to take the toggle branch.
  const longContent = 'a'.repeat(threshold + 50);
  renderedOutput = simulateGetShowHideHTML(longContent, threshold);
});
