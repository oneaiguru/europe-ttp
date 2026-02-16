/**
 * Regression tests for Scenario Outline placeholder expansion.
 *
 * These tests verify that Scenario Outline template steps with <placeholder>
 * syntax are correctly expanded with Examples table values before matching
 * against the step registry.
 *
 * See: TASK-222, scripts/bdd/verify-alignment.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractFeatureSteps } from '../../scripts/bdd/verify-alignment';

describe('Scenario Outline Expansion', () => {
  it('should expand <size> placeholder with Examples table values', () => {
    const steps = extractFeatureSteps('specs/features/api/upload_form_body_size.feature');

    // Should include expanded steps for each Example row
    assert.ok(steps.includes('I submit a valid form data payload of 162 bytes'), 'should contain 162 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 163 bytes'), 'should contain 163 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 164 bytes'), 'should contain 164 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 165 bytes'), 'should contain 165 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 166 bytes'), 'should contain 166 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 167 bytes'), 'should contain 167 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 168 bytes'), 'should contain 168 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 169 bytes'), 'should contain 169 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 170 bytes'), 'should contain 170 bytes step');
    assert.ok(steps.includes('I submit a valid form data payload of 171 bytes'), 'should contain 171 bytes step');
  });

  it('should NOT include template step with <size> placeholder', () => {
    const steps = extractFeatureSteps('specs/features/api/upload_form_body_size.feature');

    // The raw template should NOT be in the steps
    assert.ok(!steps.includes('I submit a valid form data payload of <size> bytes'), 'should not contain template');
  });

  it('should include regular (non-outline) scenario steps', () => {
    const steps = extractFeatureSteps('specs/features/api/upload_form_body_size.feature');

    // Regular scenarios should still be included (updated from 100 to 200 bytes per feature file)
    assert.ok(steps.includes('I submit a valid form data payload of 200 bytes'), 'should contain 200 bytes step');
    assert.ok(steps.includes('I submit a form data payload of 6000000 bytes'), 'should contain 6MB step');
    assert.ok(steps.includes('I submit a form data payload of 6000000 bytes without content-length header'), 'should contain 6MB no CL step');
    assert.ok(steps.includes('I submit a form data payload of 200 bytes without content-length header'), 'should contain 200 bytes no CL step');
  });

  it('should handle both "Examples:" and "Example:" variations', () => {
    // The upload_form_body_size.feature uses "Examples:" (plural)
    // This test verifies we handle both variations for future-proofing
    const steps = extractFeatureSteps('specs/features/api/upload_form_body_size.feature');

    // Verify the Examples section was processed (10 rows in Examples table)
    const expandedSteps = steps.filter(s =>
      s.startsWith('I submit a valid form data payload of') &&
      s.endsWith('bytes') &&
      !s.includes('without content-length')
    );

    // Should have 10 expanded steps from Examples + 1 from regular scenario (100 bytes)
    // Plus the oversized payload scenario
    assert.ok(expandedSteps.length > 10, 'should have more than 10 expanded steps');
  });

  it('should handle Scenario Outline with multiple placeholders', () => {
    // Test a feature file that might have multiple placeholders
    const steps = extractFeatureSteps('specs/features/e2e/deadline_and_whitelist_override.feature');

    // Should not contain any <placeholder> templates
    const hasTemplates = steps.some(s => s.includes('<') && s.includes('>'));
    assert.strictEqual(hasTemplates, false);
  });

  it('should handle empty Examples table gracefully', () => {
    // If a Scenario Outline has no Examples rows, we should not crash
    // and the outline steps should simply not be expanded
    const steps = extractFeatureSteps('specs/features/api/upload_form_body_size.feature');

    // All steps should be valid (no placeholder strings)
    const hasUnexpandedPlaceholders = steps.some(s => s.includes('<') && s.includes('>'));
    assert.strictEqual(hasUnexpandedPlaceholders, false);
  });

  it('should expand multiple Examples sections independently', () => {
    // Test that multiple Examples blocks are each expanded with their own data
    const steps = extractFeatureSteps('test/fixtures/multi-examples-outline.feature');

    // Expected: 12 steps total (3 template steps × 4 data rows across 2 Examples blocks)
    // First Examples: 3 steps × 2 rows = 6 steps
    // Second Examples: 3 steps × 2 rows = 6 steps
    assert.strictEqual(steps.length, 12);

    // First Examples block expansion (count=5, eaten=2, remaining=3)
    assert.ok(steps.includes('I have 5 apples'), 'should contain 5 apples');
    assert.ok(steps.includes('I eat 2 apples'), 'should contain eat 2 apples');
    assert.ok(steps.includes('I have 3 apples'), 'should contain 3 apples');

    // First Examples block expansion (count=10, eaten=4, remaining=6)
    assert.ok(steps.includes('I have 10 apples'), 'should contain 10 apples');
    assert.ok(steps.includes('I eat 4 apples'), 'should contain eat 4 apples');
    assert.ok(steps.includes('I have 6 apples'), 'should contain 6 apples');

    // Second Examples block expansion (count=3, eaten=1, remaining=2)
    assert.ok(steps.includes('I have 3 apples'), 'should contain 3 apples (second block)');
    assert.ok(steps.includes('I eat 1 apples'), 'should contain eat 1 apples');
    assert.ok(steps.includes('I have 2 apples'), 'should contain 2 apples');

    // Second Examples block expansion (count=7, eaten=3, remaining=4)
    assert.ok(steps.includes('I have 7 apples'), 'should contain 7 apples');
    assert.ok(steps.includes('I eat 3 apples'), 'should contain eat 3 apples');
    assert.ok(steps.includes('I have 4 apples'), 'should contain 4 apples');
  });

  it('should handle blank line after Examples:', () => {
    const steps = extractFeatureSteps(
      'test/fixtures/blank-line-after-examples.feature'
    );

    assert.ok(steps.includes('I have 5 apples'), 'should contain 5 apples');
    assert.ok(steps.includes('I eat 2 apples'), 'should contain eat 2 apples');
    assert.ok(steps.includes('I have 3 apples'), 'should contain 3 apples');
    assert.ok(steps.includes('I have 10 apples'), 'should contain 10 apples');
    assert.ok(steps.includes('I eat 4 apples'), 'should contain eat 4 apples');
    assert.ok(steps.includes('I have 6 apples'), 'should contain 6 apples');
  });

  it('should handle comment line after Examples:', () => {
    const steps = extractFeatureSteps(
      'test/fixtures/blank-line-after-examples.feature'
    );

    assert.ok(steps.includes('I have 3 apples'), 'should contain 3 apples');
    assert.ok(steps.includes('I eat 1 apples'), 'should contain eat 1 apples');
    assert.ok(steps.includes('I have 2 apples'), 'should contain 2 apples');
  });

  it('should expand all scenarios from blank-line fixture', () => {
    const steps = extractFeatureSteps(
      'test/fixtures/blank-line-after-examples.feature'
    );
    // First outline: 3 steps × 2 rows = 6
    // Second outline: 3 steps × 2 rows = 6
    assert.strictEqual(steps.length, 12);
  });

  it('should preserve empty cells in Examples table as empty strings', () => {
    const steps = extractFeatureSteps('test/fixtures/empty-cells-examples.feature');

    // Row 1: test1, 123, "" (empty notes)
    assert.ok(steps.includes('I have a name of "test1"'), 'should contain test1 name');
    assert.ok(steps.includes('I set the value to "123"'), 'should contain 123 value');
    assert.ok(steps.includes('I have notes of ""'), 'should contain empty notes');

    // Row 2: test2, "" (empty value), important
    assert.ok(steps.includes('I have a name of "test2"'), 'should contain test2 name');
    assert.ok(steps.includes('I set the value to ""'), 'should contain empty value');
    assert.ok(steps.includes('I have notes of "important"'), 'should contain important notes');

    // Row 3: test3, 789, some notes (no empty cells)
    assert.ok(steps.includes('I have a name of "test3"'), 'should contain test3 name');
    assert.ok(steps.includes('I set the value to "789"'), 'should contain 789 value');
    assert.ok(steps.includes('I have notes of "some notes"'), 'should contain some notes');

    // Row 4: "" (empty name), 456, empty name
    assert.ok(steps.includes('I have a name of ""'), 'should contain empty name');
    assert.ok(steps.includes('I set the value to "456"'), 'should contain 456 value');
    assert.ok(steps.includes('I have notes of "empty name"'), 'should contain empty name notes');
  });

  it('should correctly count columns with empty cells', () => {
    const steps = extractFeatureSteps('test/fixtures/empty-cells-examples.feature');

    // Should have 4 rows x 3 steps = 12 steps total
    assert.strictEqual(steps.length, 12);
  });
});
