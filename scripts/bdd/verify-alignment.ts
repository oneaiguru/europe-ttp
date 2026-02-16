import { lstatSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { STEPS } from '../../test/bdd/step-registry';

type StepMap = Record<string, { python?: string; typescript: string; pattern?: RegExp }>;

// Check for ambiguous step patterns (multiple registry entries could match the same feature step)
// These represent duplicate registrations that will cause runtime errors in Cucumber/behave
type Ambiguity = {
  key1: string;
  key2: string;
  pattern1: string;
  pattern2: string;
  file1: string;
  file2: string;
};

// Overlapping step patterns (one pattern could match a subset of another pattern's matches)
// These represent ambiguous registrations that can cause non-deterministic step matching at runtime
type Overlap = {
  key1: string;
  key2: string;
  reason: string;  // "prefix", "suffix", or "subset"
  example: string; // Example step text that would match both
  file1: string;
  file2: string;
};

const stepLineRe = /^(?:Given|When|Then|And|But|\*)\s+(.+)$/;

/**
 * Parse a pipe-delimited Gherkin table row, preserving empty cells.
 *
 * Gherkin table rows like `| a | | c |` have:
 * - Leading and trailing pipe characters
 * - Cells separated by pipes
 * - Empty cells represented as empty strings (not dropped)
 *
 * @param line - Raw table row line (e.g., "  | a | | c |  ")
 * @returns Array of cell values with whitespace trimmed (e.g., ["a", "", "c"])
 */
function parseGherkinRow(line: string): string[] {
  const trimmed = line.trim();
  // Remove leading and trailing pipes, then split by pipe
  // A valid Gherkin table row must start and end with |
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return [];
  }
  // Slice off the first and last | characters, then split
  const content = trimmed.slice(1, -1);
  return content.split('|').map(s => s.trim());
}

/**
 * Walk a directory tree and return all .feature files.
 * Uses lstatSync() to avoid following symlinks, preventing:
 * - Infinite loops from symlink cycles
 * - Escaping the repo via parent directory symlinks
 * - Crashes from broken symlinks
 */
function walk(dir: string): string[] {
  const entries = readdirSync(dir).sort();
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = lstatSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile() && entry.endsWith('.feature')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Expand Scenario Outline template steps with Examples table values.
 *
 * For each row in the Examples table, replaces <placeholder> tokens in the
 * template steps with the corresponding values from that row.
 *
 * @param templateSteps - Step templates with <placeholder> syntax
 * @param header - Examples table column names (e.g., ['size'])
 * @param rows - Examples table data rows (e.g., [['162'], ['163']])
 * @param output - Array to append expanded steps to
 */
function expandAndAddOutlineSteps(
  templateSteps: string[],
  header: string[],
  rows: string[][],
  output: string[]
): void {
  for (const row of rows) {
    for (const template of templateSteps) {
      let expanded = template;
      for (let i = 0; i < header.length; i++) {
        const placeholder = `<${header[i]}>`;
        expanded = expanded.replaceAll(placeholder, row[i]);
      }
      output.push(expanded);
    }
  }
}

/**
 * Extract Gherkin step definitions from a .feature file.
 *
 * Parses the file line-by-line and extracts the text of all steps
 * (Given/When/Then/And/But/*) for later matching against the step registry.
 *
 * For regular scenarios, extracts step text directly.
 * For Scenario Outlines, expands template steps with values from Examples tables.
 *
 * @param filePath - Absolute path to the .feature file to parse
 * @returns Array of step text strings (expanded for Scenario Outlines)
 */
export function extractFeatureSteps(filePath: string): string[] {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read feature file: ${filePath}\n  Reason: ${message}`);
  }
  const lines = content.split(/\r?\n/);
  const steps: string[] = [];

  let inOutline = false;
  let inExamples = false;
  let currentOutlineSteps: string[] = [];
  let examplesHeader: string[] = [];
  let examplesRows: string[][] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNumber = lineIndex + 1; // 1-indexed for error messages
    const trimmed = line.trim();

    // Detect Scenario Outline start
    if (/^Scenario Outline:/.test(trimmed)) {
      // Expand any pending outline with Examples before starting a new one
      if (inOutline && currentOutlineSteps.length > 0 && examplesRows.length > 0) {
        expandAndAddOutlineSteps(currentOutlineSteps, examplesHeader, examplesRows, steps);
      }
      inOutline = true;
      inExamples = false;
      currentOutlineSteps = [];
      examplesHeader = [];
      examplesRows = [];
      continue;
    }

    // Detect regular Scenario or Feature start (ends outline)
    if (/^(Scenario|Feature|Rule):/.test(trimmed)) {
      // Expand and add any pending outline steps
      if (inOutline && currentOutlineSteps.length > 0 && examplesRows.length > 0) {
        expandAndAddOutlineSteps(currentOutlineSteps, examplesHeader, examplesRows, steps);
      }
      inOutline = false;
      inExamples = false;
    }

    // Detect Examples table (handles both "Examples:" and "Example:" variations)
    // When we encounter an Examples section, check if we already have a pending
    // Examples section to expand first (for multi-Examples outlines)
    if (/^Examples?:/.test(trimmed)) {
      // If we already have parsed examples, expand them first
      if (examplesHeader.length > 0 && examplesRows.length > 0) {
        expandAndAddOutlineSteps(currentOutlineSteps, examplesHeader, examplesRows, steps);
      }
      // Reset for new Examples section
      examplesHeader = [];
      examplesRows = [];
      inExamples = true;
      continue;
    }

    // Skip blank and comment lines within Examples section
    if (inExamples) {
      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }
    }

    // Parse Examples table header
    if (inExamples && examplesHeader.length === 0 && trimmed.startsWith('|')) {
      examplesHeader = parseGherkinRow(trimmed);
      if (examplesHeader.length === 0) {
        throw new Error(`Empty Examples header in ${filePath}:${lineNumber}`);
      }
      continue;
    }

    // Parse Examples table data rows
    if (inExamples && examplesHeader.length > 0 && trimmed.startsWith('|')) {
      const values = parseGherkinRow(trimmed);
      if (values.length !== examplesHeader.length) {
        throw new Error(
          `Malformed Examples row in ${filePath}:${lineNumber}\n` +
          `  Expected ${examplesHeader.length} columns, got ${values.length}\n` +
          `  Row: ${trimmed}`
        );
      }
      examplesRows.push(values);
      continue;
    }

    // End of Examples table (next step line or blank line before steps)
    // Only end Examples if we've parsed at least the header
    // Don't end on blank lines before the header appears
    if (inExamples && !trimmed.startsWith('|') && trimmed !== '' && !trimmed.startsWith('#')) {
      // We've hit a non-pipe, non-blank, non-comment line - Examples section is over
      if (examplesHeader.length === 0) {
        throw new Error(`Examples block in ${filePath}:${lineNumber} has no header row`);
      }
      // Check for empty Examples block (header but no rows)
      if (examplesRows.length === 0) {
        throw new Error(`Empty Examples block in ${filePath}:${lineNumber - 1} (header found but no data rows)`);
      }
      inExamples = false;
    }

    // Extract step lines
    const match = stepLineRe.exec(trimmed);
    if (match) {
      if (inOutline) {
        currentOutlineSteps.push(match[1]);
      } else {
        steps.push(match[1]);
      }
    }
  }

  // Handle file ending while in outline
  if (inOutline && currentOutlineSteps.length > 0) {
    // Check for Examples section with no header at end of file
    if (inExamples && examplesHeader.length === 0) {
      throw new Error(`Examples block at end of ${filePath} has no header row`);
    }
    // Check for empty Examples block at end of file
    if (examplesHeader.length > 0 && examplesRows.length === 0) {
      throw new Error(`Empty Examples block at end of ${filePath} (header found but no data rows)`);
    }
    if (examplesRows.length > 0) {
      expandAndAddOutlineSteps(currentOutlineSteps, examplesHeader, examplesRows, steps);
    }
  }

  return steps;
}

/**
 * Check if a feature step matches a registry pattern.
 *
 * Performs three types of matching:
 * 1. Exact string match
 * 2. Pre-compiled regex pattern (if `stepEntry.pattern` exists)
 * 3. Fallback placeholder matching for {string}, {int}, {float} (Cucumber semantics)
 *
 * Placeholder matching follows Cucumber expression semantics:
 * - {string} matches both single-quoted and double-quoted strings
 * - {int} matches optional minus sign followed by digits (e.g., -42, 7)
 * - {float} matches optional minus, digits, optional decimal, more digits (e.g., -3.14, 2.0, 5)
 *
 * @param featureStep - The step text from the .feature file (without Gherkin keyword)
 * @param registryKey - The step pattern key from the step registry (may contain placeholders)
 * @param stepEntry - The registry entry containing optional pre-compiled pattern
 * @returns true if the feature step matches the registry pattern
 */
function stepMatchesPattern(featureStep: string, registryKey: string, stepEntry: StepMap[string]): boolean {
  // Exact match
  if (featureStep === registryKey) {
    return true;
  }

  // If the step entry has a pre-compiled pattern, use it
  if (stepEntry.pattern) {
    return stepEntry.pattern.test(featureStep);
  }

  // Fallback: check for Cucumber placeholders and build regex dynamically
  // This handles cases where the registry entry has placeholders but no pre-compiled pattern
  //
  // REDoS SAFETY: The {string} pattern below has nested quantifiers, but is safe because:
  // - Input sources are trusted (codebase files only, no user-controlled input)
  // - Pattern is anchored with ^...$
  // - No HTTP request processing
  const hasPlaceholders = registryKey.includes('{string}') || registryKey.includes('{int}') || registryKey.includes('{float}');
  if (hasPlaceholders) {
    // Escape regex special characters first (except escaped placeholders)
    const escaped = registryKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patternStr = escaped
      // {string} matches both single-quoted and double-quoted strings per Cucumber spec
      // Note: Nested quantifiers present but safe (trusted inputs only)
      .replace(/\\\{string\\\}/g, '("([^"]*)"|\'([^\']*)\')')
      // {int} matches optional minus sign followed by digits per Cucumber spec
      .replace(/\\\{int\\\}/g, '-?\\d+')
      // {float} matches optional minus sign, digits, optional decimal point and more digits per Cucumber spec
      .replace(/\\\{float\\\}/g, '-?\\d+\\.?\\d*');
    const pattern = new RegExp(`^${patternStr}$`);
    return pattern.test(featureStep);
  }

  return false;
}

/**
 * Get the compiled regex pattern for a step registry entry.
 * Uses pre-compiled pattern if available, otherwise builds from registry key.
 *
 * ## State Safety
 * - Each call returns a FRESH RegExp object (no state sharing between calls)
 * - No 'global' flag is used (no lastIndex mutation risks)
 * - Input sources are trusted (codebase files only, no user-controlled input)
 *
 * ## ReDoS Safety
 * The {string} placeholder pattern `("([^"]*)"|'([^']*)')` has nested quantifiers,
 * but is safe because:
 * - Input sources are internal to the codebase (registry keys + feature files)
 * - No HTTP request processing or user input
 * - Pattern is anchored with ^...$
 *
 * @param registryKey - The step pattern key from the step registry (may contain placeholders)
 * @param stepEntry - The registry entry containing optional pre-compiled pattern
 * @returns Compiled RegExp for the step pattern
 */
function getCompiledPattern(registryKey: string, stepEntry: StepMap[string]): RegExp {
  // If pre-compiled pattern exists, use it
  if (stepEntry.pattern) {
    return stepEntry.pattern;
  }

  // Otherwise, build from registry key (same logic as stepMatchesPattern fallback)
  const hasPlaceholders = registryKey.includes('{string}') || registryKey.includes('{int}') || registryKey.includes('{float}');
  if (hasPlaceholders) {
    const escaped = registryKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patternStr = escaped
      .replace(/\\\{string\\\}/g, '("([^"]*)"|\'([^\']*)\')')
      .replace(/\\\{int\\\}/g, '-?\\d+')
      .replace(/\\\{float\\\}/g, '-?\\d+\\.?\\d*');
    return new RegExp(`^${patternStr}$`);
  }

  // Exact match pattern (no placeholders)
  return new RegExp(`^${registryKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/**
 * Generate representative test strings from a step pattern key.
 * Used for overlap detection by testing if both patterns match the same input.
 *
 * The function generates test strings that cover common placeholder values:
 * - Empty strings
 * - Single character
 * - Multi-word strings
 * - Special characters (e.g., email addresses)
 *
 * @param key - Step registry key (may contain {string}, {int}, {float} placeholders)
 * @returns Array of test strings that could match the pattern
 */
function generateTestStrings(key: string): string[] {
  const testValues: Record<string, string[]> = {
    '{string}': ['"test"', '""', '"x"', '"multi word test"', '"test@example.com"'],
    '{int}': ['0', '1', '-1', '42', '999'],
    '{float}': ['0.0', '1.5', '-3.14', '0.001'],
  };

  // Find all placeholders in the key
  const placeholderPattern = /\{(?:string|int|float|word)\}/g;
  const placeholders = Array.from(key.matchAll(placeholderPattern));

  if (placeholders.length === 0) {
    return [key];
  }

  // For simple case with one placeholder, return multiple variants
  if (placeholders.length === 1) {
    const placeholder = placeholders[0][0];
    const values = testValues[placeholder as keyof typeof testValues] || ['"test"'];
    return values.map(v => key.replace(placeholder, v));
  }

  // For multiple placeholders, generate a small subset of combinations
  // (full Cartesian product would be too large)
  const results: string[] = [];

  // Generate combinations using placeholder-type-aware values.
  // This catches overlaps that differ only by numeric vs string placeholder semantics.
  //
  // Strategy: For each placeholder type, pick a representative value.
  // Then generate combinations where:
  // 1. All placeholders use their type-specific representative
  // 2. Mixed cases: string + numeric combinations to catch cross-type overlaps
  //
  // Examples of overlaps this catches:
  // - "I have {int} items" vs "I have {float} items" (both match "I have 1 items")
  // - "I have {string} and {int}" vs "I have {string} and {float}" (both match 'I have "x" and 1')
  const uniquePlaceholderTypes = Array.from(new Set(placeholders.map(p => p[0])));

  // Case 1: All placeholders get their type-specific representative value
  for (const placeholder of uniquePlaceholderTypes) {
    const values = testValues[placeholder as keyof typeof testValues] || ['"test"'];
    // Use first value as representative
    const representative = values[0];
    let result = key;
    for (const match of placeholders) {
      if (match[0] === placeholder) {
        result = result.replace(match[0], representative);
      }
    }
    results.push(result);
  }

  // Case 2: Mixed type combinations to catch overlaps where one pattern uses
  // {int} and another uses {float} for the same logical position
  if (uniquePlaceholderTypes.length > 1) {
    // Generate a cross-product sample using first value of each type
    const crossProduct: string[][] = [[]];
    for (const placeholder of uniquePlaceholderTypes) {
      const values = testValues[placeholder as keyof typeof testValues] || ['"test"'];
      const newCrossProduct: string[][] = [];
      for (const tuple of crossProduct) {
        // Take only first two values per type to keep it bounded
        for (const val of values.slice(0, 2)) {
          newCrossProduct.push([...tuple, val]);
        }
      }
      crossProduct.length = 0;
      crossProduct.push(...newCrossProduct);
    }

    // Map placeholder types to their position in the tuple
    for (const tuple of crossProduct) {
      let result = key;
      for (const match of placeholders) {
        const placeholder = match[0];
        const typePos = uniquePlaceholderTypes.indexOf(placeholder);
        if (typePos !== -1 && tuple[typePos]) {
          result = result.replace(placeholder, tuple[typePos]);
        }
      }
      results.push(result);
    }
  } else {
    // Single placeholder type: add a few more variants for better coverage
    const placeholder = uniquePlaceholderTypes[0];
    const values = testValues[placeholder as keyof typeof testValues] || ['"test"'];
    // Already used first value above, use the rest
    for (const val of values.slice(1)) {
      let result = key;
      for (const match of placeholders) {
        result = result.replace(match[0], val);
      }
      results.push(result);
    }
  }

  return results;
}

/**
 * Detect if two step patterns overlap (would match the same input).
 * Uses actual regex testing instead of string parsing.
 *
 * This catches ambiguous registrations where patterns overlap but are not identical,
 * which can cause non-deterministic step matching at runtime.
 *
 * The implementation generates test strings from each pattern and tests them against
 * both patterns. If any test string matches both patterns, there is a real overlap.
 *
 * This approach correctly handles regex anchors (like `$`) and other regex semantics
 * that string-based parsing cannot detect.
 *
 * @param key1 - First step registry key
 * @param pattern1 - Compiled regex for first pattern
 * @param key2 - Second step registry key
 * @param pattern2 - Compiled regex for second pattern
 * @returns Overlap info if patterns overlap, null otherwise
 */
function detectOverlap(
  key1: string,
  pattern1: RegExp,
  key2: string,
  pattern2: RegExp
): Overlap | null {
  // Skip exact duplicates (already handled by ambiguity check)
  if (pattern1.source === pattern2.source) {
    return null;
  }

  // Generate test strings from pattern1 and test against pattern2
  const testStrings1 = generateTestStrings(key1);
  for (const test of testStrings1) {
    if (pattern1.test(test) && pattern2.test(test)) {
      return {
        key1,
        key2,
        reason: 'overlap',
        example: test,
        file1: '',
        file2: '',
      };
    }
  }

  // Also test strings from pattern2
  const testStrings2 = generateTestStrings(key2);
  for (const test of testStrings2) {
    if (pattern1.test(test) && pattern2.test(test)) {
      return {
        key1,
        key2,
        reason: 'overlap',
        example: test,
        file1: '',
        file2: '',
      };
    }
  }

  return null;
}

/**
 * Main CLI entry point for BDD alignment verification.
 * Returns exit code (0 for success, 1 for failure) to allow use as a library.
 *
 * When used as a library, callers can check the return value instead of
 * having the process exit. When run directly via CLI, the return value
 * is passed to process.exit().
 */
function main(): number {
  const featureFiles = walk('specs/features');
  const featureSteps = new Set<string>();

  for (const file of featureFiles) {
    try {
      for (const step of extractFeatureSteps(file)) {
        featureSteps.add(step);
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }

  // Check for dead steps (used in .feature files but not defined in step registry)
  // These represent test scenarios that will fail at runtime due to missing implementations
  const deadSteps: string[] = [];
  const matchedSteps = new Set<string>();

  for (const featureStep of featureSteps) {
    let matched = false;
    for (const [registryKey, stepEntry] of Object.entries(STEPS)) {
      if (stepMatchesPattern(featureStep, registryKey, stepEntry)) {
        matched = true;
        matchedSteps.add(registryKey);
        break;
      }
    }
    if (!matched) {
      deadSteps.push(featureStep);
    }
  }

  // Check for orphan steps (defined in step registry but never used in any .feature file)
  // These represent dead code that should be removed or are pending test coverage
  const orphanSteps = Object.keys(STEPS).filter((key) => !matchedSteps.has(key));

  const missingPython = Object.entries(STEPS as StepMap)
    .filter(([, v]) => {
      // :NONE suffix means TypeScript-only step (platform-specific)
      // Don't count these as "missing Python"
      if (v.python?.endsWith(':NONE')) {
        return false;
      }
      return !v.python || !v.python.trim();
    })
    .map(([k]) => k);

  const missingTypescript = Object.entries(STEPS as StepMap)
    .filter(([, v]) => !v.typescript || !v.typescript.trim())
    .map(([k]) => k);

  // Detect TypeScript-only steps (marked with :NONE in python field)
  // These are intentional platform-specific tests that don't need Python implementations
  const typescriptOnlySteps = Object.entries(STEPS as StepMap)
    .filter(([, v]) => v.python?.endsWith(':NONE'))
    .map(([k, v]) => ({ key: k, typescript: v.typescript }));

  const ambiguities: Ambiguity[] = [];
  const stepKeys = Object.keys(STEPS);

  // Pre-compile all patterns for ambiguity detection.
  // RATIONALE: Each pattern is used exactly once in the pairwise comparison loop below.
  // This is a micro-optimization for readability (avoids inlining getCompiledPattern() calls)
  // rather than a performance optimization (270 tiny regexes have negligible compile cost).
  const compiledPatterns = new Map<string, RegExp>();

  for (const key of stepKeys) {
    compiledPatterns.set(key, getCompiledPattern(key, STEPS[key as keyof typeof STEPS] as StepMap[string]));
  }

  // Pairwise comparison to detect duplicate patterns
  for (let i = 0; i < stepKeys.length; i++) {
    for (let j = i + 1; j < stepKeys.length; j++) {
      const key1 = stepKeys[i];
      const key2 = stepKeys[j];
      const pattern1 = compiledPatterns.get(key1)!;
      const pattern2 = compiledPatterns.get(key2)!;

      if (pattern1.source === pattern2.source) {
        // Exact duplicate - definitely ambiguous
        ambiguities.push({
          key1,
          key2,
          pattern1: pattern1.source,
          pattern2: pattern2.source,
          file1: (STEPS[key1 as keyof typeof STEPS] as { typescript?: string }).typescript || 'unknown',
          file2: (STEPS[key2 as keyof typeof STEPS] as { typescript?: string }).typescript || 'unknown',
        });
      }
    }
  }

  // Check for overlapping step patterns (one pattern matches subset of another)
  const overlaps: Overlap[] = [];

  for (let i = 0; i < stepKeys.length; i++) {
    for (let j = i + 1; j < stepKeys.length; j++) {
      const key1 = stepKeys[i];
      const key2 = stepKeys[j];
      const pattern1 = compiledPatterns.get(key1)!;
      const pattern2 = compiledPatterns.get(key2)!;

      const overlap = detectOverlap(key1, pattern1, key2, pattern2);
      if (overlap) {
        // Populate file paths
        overlap.file1 = (STEPS[key1 as keyof typeof STEPS] as { typescript?: string }).typescript || 'unknown';
        overlap.file2 = (STEPS[key2 as keyof typeof STEPS] as { typescript?: string }).typescript || 'unknown';
        overlaps.push(overlap);
      }
    }
  }

  if (orphanSteps.length || deadSteps.length || missingPython.length || missingTypescript.length || ambiguities.length || overlaps.length) {
    console.error('BDD alignment failed');
    if (orphanSteps.length) {
      console.error(`Orphan steps (in registry, not matched in features): ${orphanSteps.length}`);
      orphanSteps.forEach((s) => console.error(`  - ${s}`));
    }
    if (deadSteps.length) {
      console.error(`Dead steps (in features, not matched in registry): ${deadSteps.length}`);
      deadSteps.forEach((s) => console.error(`  - ${s}`));
    }
    if (missingPython.length) {
      console.error(`Missing python step paths: ${missingPython.length}`);
      missingPython.forEach((s) => console.error(`  - ${s}`));
    }
    if (missingTypescript.length) {
      console.error(`Missing typescript step paths: ${missingTypescript.length}`);
      missingTypescript.forEach((s) => console.error(`  - ${s}`));
    }
    if (ambiguities.length) {
      console.error(`Ambiguous step patterns: ${ambiguities.length}`);
      ambiguities.forEach((a) => {
        console.error(`  - Duplicate pattern detected:`);
        console.error(`      Pattern: ${a.pattern1}`);
        console.error(`      Entry 1: "${a.key1}" -> ${a.file1}`);
        console.error(`      Entry 2: "${a.key2}" -> ${a.file2}`);
      });
    }
    if (overlaps.length) {
      console.error(`Overlapping step patterns: ${overlaps.length}`);
      overlaps.forEach((o) => {
        console.error(`  - Overlap detected (${o.reason}):`);
        console.error(`      Pattern 1: "${o.key1}" -> ${o.file1}`);
        console.error(`      Pattern 2: "${o.key2}" -> ${o.file2}`);
        console.error(`      Example that could match both: "${o.example}"`);
      });
    }
    return 1;
  }

  console.log(
    `✓ ${Object.keys(STEPS).length} steps defined, ${orphanSteps.length} orphan, ${deadSteps.length} dead, ` +
    `${ambiguities.length} ambiguous, ${overlaps.length} overlapping`
  );

  // Report TypeScript-only steps (platform-specific, intentionally no Python impl)
  if (typescriptOnlySteps.length > 0) {
    console.log(`TypeScript-only steps (platform-specific): ${typescriptOnlySteps.length}`);
    typescriptOnlySteps.forEach((s) => console.log(`  - ${s.key}`));
  }

  return 0;
}

// Direct-exec guard: only run main() when this file is the entry point
// This allows the module to be imported as a library without side effects
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const exitCode = main();
  process.exit(exitCode);
}
