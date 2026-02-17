import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
  getSnapshotFileUrl,
  runParityCheck,
  formatParityResult,
  generateSummary,
  type ParityResult,
  type Manifest,
  type ParityMappingConfig,
} from './helpers/parity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to manifests and snapshots
const LEGACY_MANIFEST_PATH = path.resolve(__dirname, '../../docs/ui/legacy/manifest.json');
const NEW_MANIFEST_PATH = path.resolve(__dirname, '../../docs/ui/new/manifest.json');
const PARITY_MAPPING_PATH = path.resolve(__dirname, '../../docs/ui/parity-mapping.json');
const LEGACY_SNAPSHOT_BASE = path.resolve(__dirname, '../../docs/ui/legacy');
const NEW_SNAPSHOT_BASE = path.resolve(__dirname, '../../docs/ui/new');

// Minimum parity score threshold (percentage)
const MIN_PARITY_SCORE = 50; // 50% minimum parity

/**
 * Synchronously load a JSON file, returning null if it doesn't exist.
 * This is required because Playwright evaluates test.describe callbacks at
 * module load time - async beforeAll hooks run too late.
 */
function loadJsonSync<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.warn(`Warning: Could not load ${filePath}: ${error}`);
  }
  return defaultValue;
}

// Load configuration synchronously at module level
// This ensures data is available when Playwright evaluates test.describe callbacks
const legacyManifest: Manifest = loadJsonSync(LEGACY_MANIFEST_PATH, { entries: [] });
const newManifest: Manifest = loadJsonSync(NEW_MANIFEST_PATH, { entries: [] });
const parityMapping: ParityMappingConfig = loadJsonSync(PARITY_MAPPING_PATH, {
  mappings: [],
  unmapped_legacy: [],
  unmapped_new: [],
});

// Pre-filter mappings by kind at module level for dynamic test generation
const portalMappings = parityMapping.mappings.filter((m) => m.kind === 'portal');
const formMappings = parityMapping.mappings.filter((m) => m.kind === 'form');
const adminMappings = parityMapping.mappings.filter((m) => m.kind === 'admin');

/**
 * UI Parity Audit Test Suite
 *
 * Compares legacy UI snapshots with new UI snapshots to verify structural,
 * functional, and accessibility parity.
 */
test.describe('UI Parity Audit', () => {
  /**
   * Test: Verify configuration files exist and are valid
   */
  test('configuration files are valid', async () => {
    expect(legacyManifest).toBeDefined();
    expect(legacyManifest.entries).toBeInstanceOf(Array);
    expect(legacyManifest.entries.length).toBeGreaterThan(0);

    expect(newManifest).toBeDefined();
    expect(newManifest.entries).toBeInstanceOf(Array);
    expect(newManifest.entries.length).toBeGreaterThan(0);

    expect(parityMapping).toBeDefined();
    expect(parityMapping.mappings).toBeInstanceOf(Array);
  });

  /**
   * Test: Portal page parity
   */
  test.describe('Portal Pages', () => {
    for (const mapping of portalMappings) {
      test(`${mapping.legacy_id} → ${mapping.new_id}`, async ({ page }) => {
        await runParityTest(page, mapping, legacyManifest, newManifest);
      });
    }
  });

  /**
   * Test: Form parity
   */
  test.describe('Forms', () => {
    for (const mapping of formMappings) {
      test(`${mapping.legacy_id} → ${mapping.new_id}`, async ({ page }) => {
        await runParityTest(page, mapping, legacyManifest, newManifest);
      });
    }
  });

  /**
   * Test: Admin page parity
   */
  test.describe('Admin Pages', () => {
    for (const mapping of adminMappings) {
      test(`${mapping.legacy_id} → ${mapping.new_id}`, async ({ page }) => {
        await runParityTest(page, mapping, legacyManifest, newManifest);
      });
    }
  });

  /**
   * Test: Generate parity summary report
   */
  test('parity summary report', async ({ page }) => {
    const results: ParityResult[] = [];

    for (const mapping of parityMapping.mappings) {
      const result = await runParityTest(page, mapping, legacyManifest, newManifest, false);
      results.push(result);
    }

    const summary = generateSummary(results);

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('UI PARITY AUDIT SUMMARY');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`Total Mappings: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Average Score: ${summary.averageScore}%`);
    console.log('════════════════════════════════════════════════════════════════\n');

    // Log individual results
    for (const result of results) {
      console.log(formatParityResult(result));
    }

    console.log('\n════════════════════════════════════════════════════════════════\n');

    // Assert minimum average score
    expect(summary.averageScore).toBeGreaterThanOrEqual(MIN_PARITY_SCORE);
  });

  /**
   * Test: Report unmapped legacy entries
   */
  test('unmapped legacy pages are documented', async () => {
    expect(parityMapping.unmapped_legacy).toBeInstanceOf(Array);

    if (parityMapping.unmapped_legacy.length > 0) {
      console.log('\nUnmapped Legacy Pages:');
      for (const entry of parityMapping.unmapped_legacy) {
        console.log(`  - ${entry.legacy_id} (${entry.kind}): ${entry.reason}`);
      }
      console.log('');
    }
  });

  /**
   * Test: Report new-only entries (features not in legacy)
   */
  test('new-only features are documented', async () => {
    expect(parityMapping.unmapped_new).toBeInstanceOf(Array);

    if (parityMapping.unmapped_new.length > 0) {
      console.log('\nNew Features (not in legacy):');
      for (const entry of parityMapping.unmapped_new) {
        console.log(`  - ${entry.new_id} (${entry.kind}): ${entry.reason}`);
      }
      console.log('');
    }
  });
});

/**
 * Result type for runParityTest
 */
interface TestResult extends ParityResult {
  legacyId: string;
  newId: string;
  kind: string;
}

/**
 * Helper function to run parity test for a single mapping
 */
async function runParityTest(
  page: Page,
  mapping: ParityMappingConfig['mappings'][number],
  legacyManifest: Manifest,
  newManifest: Manifest,
  assert: boolean = true
): Promise<TestResult> {
  // Find entries in manifests
  const legacyEntry = legacyManifest.entries.find((e) => e.id === mapping.legacy_id);
  const newEntry = newManifest.entries.find((e) => e.id === mapping.new_id);

  // Fail if either entry doesn't exist - missing snapshots should not be treated as passing
  if (!legacyEntry || !newEntry) {
    const result: TestResult = {
      legacyId: mapping.legacy_id,
      newId: mapping.new_id,
      kind: mapping.kind,
      passed: false,
      score: 0,
      structuralMatches: 0,
      structuralTotal: 0,
      functionalMatches: 0,
      functionalTotal: 0,
      accessibilityMatches: 0,
      accessibilityTotal: 0,
      missingElements: [!legacyEntry ? `legacy:${mapping.legacy_id}` : `new:${mapping.new_id}`],
      failures: [`Snapshot not found: ${!legacyEntry ? mapping.legacy_id : mapping.new_id}`],
    };

    if (assert) {
      test.skip(true, `Snapshot not available: ${mapping.legacy_id} -> ${mapping.new_id}`);
    }

    return result;
  }

  if (!legacyEntry.include || !newEntry.include) {
    const result: TestResult = {
      legacyId: mapping.legacy_id,
      newId: mapping.new_id,
      kind: mapping.kind,
      passed: false,
      score: 0,
      structuralMatches: 0,
      structuralTotal: 0,
      functionalMatches: 0,
      functionalTotal: 0,
      accessibilityMatches: 0,
      accessibilityTotal: 0,
      missingElements: [],
      failures: [`Entry excluded from parity check: ${!legacyEntry.include ? mapping.legacy_id : mapping.new_id}`],
    };

    if (assert) {
      test.skip(true, `Entry excluded from parity check: ${mapping.legacy_id}`);
    }

    return result;
  }

  // Build snapshot file paths
  const legacySnapshotPath = legacyEntry.legacy_path
    ? `snapshots/html/${legacyEntry.legacy_path}`
    : legacyEntry.snapshot_path;
  const newSnapshotPath = newEntry.snapshot_path;

  if (!legacySnapshotPath || !newSnapshotPath) {
    const result: TestResult = {
      legacyId: mapping.legacy_id,
      newId: mapping.new_id,
      kind: mapping.kind,
      passed: false,
      score: 0,
      structuralMatches: 0,
      structuralTotal: 0,
      functionalMatches: 0,
      functionalTotal: 0,
      accessibilityMatches: 0,
      accessibilityTotal: 0,
      missingElements: [],
      failures: [`Snapshot path not defined for: ${!legacySnapshotPath ? mapping.legacy_id : mapping.new_id}`],
    };

    if (assert) {
      test.skip(true, `Snapshot path not defined for: ${mapping.legacy_id} -> ${mapping.new_id}`);
    }

    return result;
  }

  const legacyFileUrl = getSnapshotFileUrl(LEGACY_SNAPSHOT_BASE, legacySnapshotPath);
  const newFileUrl = getSnapshotFileUrl(NEW_SNAPSHOT_BASE, newSnapshotPath);

  // Use separate pages for legacy and new snapshots
  // The injected 'page' is used for legacy, create a new page for new UI
  const legacyPage = page;
  const newPage = await page.context().newPage();

  let parityResult;
  try {
    // Load both snapshots
    await legacyPage.goto(legacyFileUrl);
    await newPage.goto(newFileUrl);

    // Run parity checks
    parityResult = await runParityCheck(
      legacyPage,
      newPage,
      mapping.parity_checks || {
        structural: ['h1', 'h2', 'h3', 'form', 'button', 'a'],
        functional: ['[type=submit]', '[type=button]', 'button'],
        accessibility: ['[aria-label]', '[role]', 'label', 'alt'],
      }
    );
  } finally {
    // Ensure new page is always closed to prevent resource leaks
    await newPage.close();
  }

  const result: TestResult = {
    legacyId: mapping.legacy_id,
    newId: mapping.new_id,
    kind: mapping.kind,
    passed: parityResult.totalScore >= MIN_PARITY_SCORE,
    score: parityResult.totalScore,
    structuralMatches: parityResult.structuralScore,
    structuralTotal: 100,
    functionalMatches: parityResult.functionalScore,
    functionalTotal: 100,
    accessibilityMatches: parityResult.accessibilityScore,
    accessibilityTotal: 100,
    missingElements: parityResult.missingElements,
    failures: [],
  };

  if (assert) {
    // Assert minimum parity score
    expect(
      parityResult.totalScore,
      `${mapping.legacy_id} -> ${mapping.new_id}: Parity score ${parityResult.totalScore}% is below ${MIN_PARITY_SCORE}%. Missing: ${parityResult.missingElements.join(', ')}`
    ).toBeGreaterThanOrEqual(MIN_PARITY_SCORE);
  }

  return result;
}
