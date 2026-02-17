import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { Page } from '@playwright/test';

/**
 * Manifest entry type for legacy/new UI snapshots
 */
export interface ManifestEntry {
  id: string;
  kind: string;
  legacy_path?: string;
  snapshot_path?: string;
  include: boolean;
}

/**
 * Manifest type with entries array
 */
export interface Manifest {
  entries: ManifestEntry[];
}

/**
 * Parity mapping entry
 */
export interface ParityMapping {
  legacy_id: string;
  new_id: string;
  kind: string;
  description?: string;
  variant?: string;
  note?: string;
  parity_checks?: {
    structural: string[];
    functional: string[];
    accessibility: string[];
  };
}

/**
 * Parity mapping configuration
 */
export interface ParityMappingConfig {
  mappings: ParityMapping[];
  unmapped_legacy: Array<{ legacy_id: string; kind: string; reason: string }>;
  unmapped_new: Array<{ new_id: string; kind: string; reason: string }>;
}

/**
 * Parity check result
 */
export interface ParityResult {
  legacyId: string;
  newId: string;
  kind: string;
  passed: boolean;
  score: number;
  structuralMatches: number;
  structuralTotal: number;
  functionalMatches: number;
  functionalTotal: number;
  accessibilityMatches: number;
  accessibilityTotal: number;
  missingElements: string[];
  failures: string[];
}

/**
 * Load and parse a manifest JSON file
 */
export async function loadManifest(path: string): Promise<Manifest> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load and parse parity mapping configuration
 */
export async function loadParityMapping(path: string): Promise<ParityMappingConfig> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path, 'utf-8');
  return JSON.parse(content);
}

/**
 * Get file:// URL for a snapshot path
 *
 * Uses path.resolve() and pathToFileURL() for cross-platform correctness
 * and guards against path traversal attacks.
 *
 * @throws Error if snapshotPath resolves outside basePath
 */
export function getSnapshotFileUrl(basePath: string, snapshotPath: string): string {
  const resolved = path.resolve(basePath, snapshotPath);
  const normalizedBase = path.resolve(basePath);

  // Guard: reject paths that escape the base directory
  // Check if resolved path starts with normalizedBase + separator (or equals base exactly)
  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new Error(`Path traversal rejected: ${snapshotPath} resolves outside ${basePath}`);
  }

  return pathToFileURL(resolved).href;
}

/**
 * Extract selector matches count from a page
 */
export async function countSelectors(page: Page, selectors: string[]): Promise<number> {
  let count = 0;
  for (const selector of selectors) {
    try {
      const elements = await page.locator(selector).count();
      count += elements;
    } catch {
      // Selector not found - continue
    }
  }
  return count;
}

/**
 * Check if specific elements exist in a page
 */
export async function checkSelectorsExist(
  page: Page,
  selectors: string[]
): Promise<{ found: string[]; missing: string[] }> {
  const found: string[] = [];
  const missing: string[] = [];

  for (const selector of selectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found.push(selector);
      } else {
        missing.push(selector);
      }
    } catch {
      missing.push(selector);
    }
  }

  return { found, missing };
}

/**
 * Run parity checks between two loaded pages
 */
export async function runParityCheck(
  legacyPage: Page,
  newPage: Page,
  checks: ParityMapping['parity_checks']
): Promise<{
  structuralScore: number;
  functionalScore: number;
  accessibilityScore: number;
  totalScore: number;
  missingElements: string[];
}> {
  const structural = checks?.structural ?? [];
  const functional = checks?.functional ?? [];
  const accessibility = checks?.accessibility ?? [];

  const [legacyStructural, legacyFunctional, legacyA11y] = await Promise.all([
    countSelectors(legacyPage, structural),
    countSelectors(legacyPage, functional),
    countSelectors(legacyPage, accessibility),
  ]);

  const [newStructural, newFunctional, newA11y] = await Promise.all([
    countSelectors(newPage, structural),
    countSelectors(newPage, functional),
    countSelectors(newPage, accessibility),
  ]);

  const structuralScore = Math.min(100, legacyStructural > 0 ? (newStructural / legacyStructural) * 100 : 100);
  const functionalScore = Math.min(100, legacyFunctional > 0 ? (newFunctional / legacyFunctional) * 100 : 100);
  const accessibilityScore = Math.min(100, legacyA11y > 0 ? (newA11y / legacyA11y) * 100 : 100);

  const totalScore = (structuralScore + functionalScore + accessibilityScore) / 3;

  const missingElements: string[] = [];

  // Check for missing elements in new UI
  const allSelectors = [...structural, ...functional, ...accessibility];
  for (const selector of allSelectors) {
    const legacyCount = await legacyPage.locator(selector).count();
    const newCount = await newPage.locator(selector).count();
    if (legacyCount > 0 && newCount === 0) {
      missingElements.push(selector);
    }
  }

  return {
    structuralScore: Math.round(structuralScore),
    functionalScore: Math.round(functionalScore),
    accessibilityScore: Math.round(accessibilityScore),
    totalScore: Math.round(totalScore),
    missingElements,
  };
}

/**
 * Format parity result for reporting
 */
export function formatParityResult(result: ParityResult): string {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  const scoreBar = createScoreBar(result.score);

  return `
${status} ${result.legacyId} → ${result.newId}
  Kind: ${result.kind}
  Score: ${result.score}% ${scoreBar}
  Structural: ${result.structuralMatches}/${result.structuralTotal}
  Functional: ${result.functionalMatches}/${result.functionalTotal}
  Accessibility: ${result.accessibilityMatches}/${result.accessibilityTotal}
  ${result.missingElements.length > 0 ? `Missing: ${result.missingElements.join(', ')}` : ''}
  ${result.failures.length > 0 ? `Failures: ${result.failures.join(', ')}` : ''}
`;
}

/**
 * Create a visual score bar
 */
function createScoreBar(score: number): string {
  // Clamp score to 0-100 to prevent negative repeat counts
  const clampedScore = Math.max(0, Math.min(100, score));
  const filled = Math.round(clampedScore / 10);
  const empty = 10 - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * Generate summary report from multiple parity results
 */
export function generateSummary(results: ParityResult[]): {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  averageScore: number;
} {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

  return {
    total: results.length,
    passed,
    failed,
    skipped: 0,
    averageScore,
  };
}
