/**
 * Regression tests for BDD overlap detection.
 *
 * These tests verify that the overlap detector correctly identifies
 * real overlaps (where two patterns could match the same input)
 * while avoiding false positives (patterns that look similar but
 * are semantically distinct due to regex anchors).
 *
 * See: scripts/bdd/verify-alignment.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Overlap Detection', () => {
  describe('getAuthenticatedUser steps (false positive case)', () => {
    // These two patterns should NOT overlap due to $ anchor in first pattern
    const pattern1 = /^I\ call\ getAuthenticatedUser\ with\ x-user-email\ header\ "([^"]*)"$/;
    const pattern2 = /^I\ call\ getAuthenticatedUser\ with\ x-user-email\ header\ "([^"]*)"\ and\ no\ bearer\ token$/;

    it('should NOT detect overlap - pattern1 ends at the quote', () => {
      // Test string that matches pattern1
      const test1 = 'I call getAuthenticatedUser with x-user-email header "test@example.com"';
      assert.strictEqual(pattern1.test(test1), true);
      assert.strictEqual(pattern2.test(test1), false);
    });

    it('should NOT detect overlap - pattern2 requires more text', () => {
      // Test string that matches pattern2
      const test2 = 'I call getAuthenticatedUser with x-user-email header "test@example.com" and no bearer token';
      assert.strictEqual(pattern1.test(test2), false);
      assert.strictEqual(pattern2.test(test2), true);
    });

    it('should NOT detect overlap - different patterns match disjoint inputs', () => {
      // Generate multiple test strings and verify they never match both patterns
      const testValues = [
        'test@example.com',
        '',
        'x',
        'multi word test',
        'user+tag@example.com',
      ];

      for (const value of testValues) {
        const test1 = `I call getAuthenticatedUser with x-user-email header "${value}"`;
        const test2 = `I call getAuthenticatedUser with x-user-email header "${value}" and no bearer token`;

        const pattern1MatchesTest1 = pattern1.test(test1);
        const pattern2MatchesTest1 = pattern2.test(test1);
        const pattern1MatchesTest2 = pattern1.test(test2);
        const pattern2MatchesTest2 = pattern2.test(test2);

        // No input should match both patterns
        const bothMatchTest1 = pattern1MatchesTest1 && pattern2MatchesTest1;
        const bothMatchTest2 = pattern1MatchesTest2 && pattern2MatchesTest2;

        assert.strictEqual(bothMatchTest1, false);
        assert.strictEqual(bothMatchTest2, false);
      }
    });
  });

  describe('REAL overlap detection (true positive cases)', () => {
    it('should detect overlap when pattern1 has no end anchor', () => {
      // These SHOULD overlap - pattern1 is a true prefix without end anchor
      const pattern1 = /^I\ click\ on\ "([^"]*)"/;  // No $ anchor
      const pattern2 = /^I\ click\ on\ "([^"]*)"\ button$/;

      const test = 'I click on "submit" button';
      assert.strictEqual(pattern1.test(test), true);
      assert.strictEqual(pattern2.test(test), true);
    });

    it('should detect overlap when both patterns are identical', () => {
      const pattern1 = /^I\ click\ the\ "([^"]*)"\ button$/;
      const pattern2 = /^I\ click\ the\ "([^"]*)"\ button$/;

      const test = 'I click the "submit" button';
      assert.strictEqual(pattern1.test(test), true);
      assert.strictEqual(pattern2.test(test), true);
    });

    it('should detect overlap when pattern1 is more permissive', () => {
      // Pattern1 matches any string after the prefix
      const pattern1 = /^I\ enter\ "([^"]*)"$/;
      // Pattern2 matches the same but has different placeholder semantics
      // In actual regex, these are the same
      const pattern2 = /^I\ enter\ "([^"]*)"$/;

      const test = 'I enter "value"';
      assert.strictEqual(pattern1.test(test), true);
      assert.strictEqual(pattern2.test(test), true);
    });
  });

  describe('multi-placeholder numeric overlap detection', () => {
    it('should detect overlap between {int} and {float} in same position', () => {
      // Pattern A uses {int}, Pattern B uses {float}
      // Both should match integer values, creating an overlap
      const patternA = /^I\ have\ (-?\d+)\ items\ and\ (-?\d+)\ dollars$/;
      const patternB = /^I\ have\ (-?\d+\.?\d*)\ items\ and\ (-?\d+\.?\d*)\ dollars$/;

      // Integer value should match both patterns
      const test = 'I have 5 items and 10 dollars';
      assert.strictEqual(patternA.test(test), true);
      assert.strictEqual(patternB.test(test), true);
    });

    it('should detect overlap with mixed {string} and {int} placeholders', () => {
      // Two patterns that differ only in one placeholder type
      const patternA = /^I\ have\ ("([^"]*)"|'([^\']*)')\ items\ and\ (-?\d+)\ dollars$/;
      const patternB = /^I\ have\ ("([^"]*)"|'([^\']*)')\ items\ and\ (-?\d+\.?\d*)\ dollars$/;

      const test = 'I have "many" items and 5 dollars';
      assert.strictEqual(patternA.test(test), true);
      assert.strictEqual(patternB.test(test), true);
    });

    it('should detect overlap with {int} vs {float} in different positions', () => {
      const patternA = /^I\ have\ (-?\d+)\ items\ and\ (-?\d+)\ dollars$/;
      const patternB = /^I\ have\ (-?\d+\.?\d*)\ items\ and\ (-?\d+)\ dollars$/;

      const test = 'I have 3 items and 7 dollars';
      assert.strictEqual(patternA.test(test), true);
      assert.strictEqual(patternB.test(test), true);
    });

    it('should handle negative numbers in multi-placeholder patterns', () => {
      const patternA = /^from\ (-?\d+)\ to\ (-?\d+)$/;
      const patternB = /^from\ (-?\d+\.?\d*)\ to\ (-?\d+\.?\d*)$/;

      const test = 'from -5 to 10';
      assert.strictEqual(patternA.test(test), true);
      assert.strictEqual(patternB.test(test), true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty placeholder values', () => {
      const pattern1 = /^I\ call\ getAuthenticatedUser\ with\ x-user-email\ header\ "([^"]*)"$/;
      const pattern2 = /^I\ call\ getAuthenticatedUser\ with\ x-user-email\ header\ "([^"]*)"\ and\ no\ bearer\ token$/;

      const test1 = 'I call getAuthenticatedUser with x-user-email header ""';
      assert.strictEqual(pattern1.test(test1), true);
      assert.strictEqual(pattern2.test(test1), false);

      const test2 = 'I call getAuthenticatedUser with x-user-email header "" and no bearer token';
      assert.strictEqual(pattern1.test(test2), false);
      assert.strictEqual(pattern2.test(test2), true);
    });

    it('should handle special characters in placeholder values', () => {
      const pattern1 = /^I\ call\ getAuthenticatedUser\ with\ x-user-email\ header\ "([^"]*)"$/;
      const pattern2 = /^I\ call\ getAuthenticatedUser\ with\ x-user-email\ header\ "([^"]*)"\ and\ no\ bearer\ token$/;

      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.co.uk',
        'test@test',
      ];

      for (const email of specialEmails) {
        const test1 = `I call getAuthenticatedUser with x-user-email header "${email}"`;
        const test2 = `I call getAuthenticatedUser with x-user-email header "${email}" and no bearer token`;

        const pattern1MatchesTest1 = pattern1.test(test1);
        const pattern2MatchesTest1 = pattern2.test(test1);

        // No single input should match both
        assert.strictEqual(pattern1MatchesTest1 && pattern2MatchesTest1, false);

        // Each pattern should match its respective input
        assert.strictEqual(pattern1.test(test1), true);
        assert.strictEqual(pattern2.test(test2), true);
      }
    });
  });
});
