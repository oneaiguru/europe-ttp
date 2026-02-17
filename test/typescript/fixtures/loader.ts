/**
 * Fixture loader utility for BDD tests.
 *
 * This module provides utilities for loading JSON fixture files used in tests.
 * Fixtures are test-only data structures that simulate API responses.
 *
 * IMPORTANT: These fixtures do NOT represent actual API implementations.
 * They are test doubles that will be replaced by real API calls when
 * Next.js routes are implemented for these reports.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// ES module compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = resolve(__dirname, 'reports');

/**
 * Load a JSON fixture file.
 *
 * @param name - The name of the fixture file (without .json extension)
 * @returns The parsed JSON fixture data
 * @throws Error if the fixture file is missing or contains invalid JSON
 */
export function loadFixture<T = unknown>(name: string): T {
  const fixturePath = resolve(FIXTURES_DIR, `${name}.json`);

  try {
    const content = readFileSync(fixturePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `Fixture file not found: ${name}.json (looked in ${FIXTURES_DIR})`
        );
      }
      if (error instanceof SyntaxError) {
        throw new Error(
          `Invalid JSON in fixture file: ${name}.json - ${error.message}`
        );
      }
    }
    throw error;
  }
}

/**
 * Validate that an object has all required properties.
 *
 * @param data - The object to validate
 * @param requiredProps - Array of required property names
 * @param context - Description of what is being validated (for error messages)
 */
export function validateFixtureStructure(
  data: unknown,
  requiredProps: string[],
  context: string
): void {
  assert.ok(data, `${context}: data is null or undefined`);
  assert.strictEqual(
    typeof data,
    'object',
    `${context}: data must be an object`
  );
  assert.ok(
    !Array.isArray(data),
    `${context}: data must be an object, not an array`
  );

  const obj = data as Record<string, unknown>;
  for (const prop of requiredProps) {
    assert.ok(prop in obj, `${context}: missing required property '${prop}'`);
  }
}

/**
 * Validate that an array contains objects with required properties.
 *
 * @param data - The array to validate
 * @param requiredProps - Array of required property names for each item
 * @param context - Description of what is being validated (for error messages)
 */
export function validateArrayStructure(
  data: unknown,
  requiredProps: string[],
  context: string
): void {
  assert.ok(data, `${context}: data is null or undefined`);
  assert.ok(Array.isArray(data), `${context}: data must be an array`);

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    assert.ok(
      item && typeof item === 'object',
      `${context}: item at index ${i} must be an object`
    );
    assert.ok(
      !Array.isArray(item),
      `${context}: item at index ${i} must be an object, not an array`
    );

    const obj = item as Record<string, unknown>;
    for (const prop of requiredProps) {
      assert.ok(
        prop in obj,
        `${context}: item at index ${i} missing required property '${prop}'`
      );
    }
  }
}
