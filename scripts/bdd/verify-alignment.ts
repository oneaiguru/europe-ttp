import { lstatSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { STEPS } from '../../test/bdd/step-registry';

type StepMap = Record<string, { python: string; typescript: string; pattern?: RegExp }>;

const stepLineRe = /^(?:Given|When|Then|And|But|\*)\s+(.+)$/;

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
 * Extract Gherkin step definitions from a .feature file.
 *
 * Parses the file line-by-line and extracts the text of all steps
 * (Given/When/Then/And/But/*) for later matching against the step registry.
 *
 * @param filePath - Absolute path to the .feature file to parse
 * @returns Array of step text strings (without the Gherkin keyword prefix)
 */
function extractFeatureSteps(filePath: string): string[] {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const steps: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const match = stepLineRe.exec(trimmed);
    if (match) {
      steps.push(match[1]);
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
 * Detect if one step pattern could match a subset of another pattern's matches.
 *
 * This catches ambiguous registrations where patterns overlap but are not identical,
 * which can cause non-deterministic step matching at runtime.
 *
 * Detection is conservative: only reports definite overlaps where:
 * 1. Patterns share the same literal prefix through at least one placeholder
 * 2. One pattern has additional literal text after/before the shared placeholder
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

  // Parse placeholder positions and literal segments
  // Pattern format: "literal {placeholder} literal {placeholder} ..."
  const parts1 = parsePatternParts(key1);
  const parts2 = parsePatternParts(key2);

  // Check for trailing literal overlap: A {p} vs A {p} B
  const trailingOverlap = checkTrailingOverlap(parts1, parts2, key1, key2);
  if (trailingOverlap) return trailingOverlap;

  // Check for leading literal overlap: A {p} vs C A {p}
  const leadingOverlap = checkLeadingOverlap(parts1, parts2, key1, key2);
  if (leadingOverlap) return leadingOverlap;

  return null;
}

/**
 * Parse a step pattern into literal segments and placeholders.
 * Returns array of strings and placeholder markers.
 */
function parsePatternParts(key: string): (string | { type: 'placeholder' })[] {
  const parts: (string | { type: 'placeholder' })[] = [];
  let remaining = key;

  while (remaining.length > 0) {
    // Find next placeholder
    const placeholderMatch = remaining.match(/^\{(?:string|int|float)\}/);
    if (placeholderMatch) {
      parts.push({ type: 'placeholder' });
      remaining = remaining.slice(placeholderMatch[0].length);
    } else {
      // Extract literal text until next placeholder or end
      const nextPlaceholder = remaining.search(/\{(?:string|int|float)\}/);
      if (nextPlaceholder === -1) {
        parts.push(remaining);
        remaining = '';
      } else {
        parts.push(remaining.slice(0, nextPlaceholder));
        remaining = remaining.slice(nextPlaceholder);
      }
    }
  }

  return parts;
}

/**
 * Check if pattern2 extends pattern1 with trailing literal.
 * Example: "I click on {string}" vs "I click on {string} button"
 */
function checkTrailingOverlap(
  parts1: (string | { type: 'placeholder' })[],
  parts2: (string | { type: 'placeholder' })[],
  key1: string,
  key2: string
): Overlap | null {
  // Check if parts1 is a prefix of parts2 through at least one placeholder
  const minLen = Math.min(parts1.length, parts2.length);
  let hasSharedPlaceholder = false;

  for (let i = 0; i < minLen; i++) {
    const p1 = parts1[i];
    const p2 = parts2[i];

    // Compare parts properly (string vs string, object vs object with type check)
    const isEqual = (typeof p1 === 'string' && typeof p2 === 'string' && p1 === p2) ||
                    (typeof p1 === 'object' && typeof p2 === 'object' && p1.type === p2.type);

    if (!isEqual) {
      return null;
    }
    if (typeof p1 === 'object' && p1.type === 'placeholder') {
      hasSharedPlaceholder = true;
    }
  }

  // Must share at least one placeholder position
  if (!hasSharedPlaceholder) {
    return null;
  }

  // Check if one pattern extends the other with a literal
  if (parts1.length < parts2.length) {
    const extra = parts2.slice(parts1.length);
    // Extra part must be literal (not placeholder)
    if (extra.length === 1 && typeof extra[0] === 'string') {
      return {
        key1,
        key2,
        reason: 'suffix',
        example: generateExample(parts1),
        file1: '',
        file2: '',
      };
    }
  } else if (parts2.length < parts1.length) {
    const extra = parts1.slice(parts2.length);
    if (extra.length === 1 && typeof extra[0] === 'string') {
      return {
        key1: key2,
        key2: key1,
        reason: 'suffix',
        example: generateExample(parts2),
        file1: '',
        file2: '',
      };
    }
  }

  return null;
}

/**
 * Check if pattern2 extends pattern1 with leading literal.
 * Example: "user is {string}" vs "the user is {string}"
 */
function checkLeadingOverlap(
  parts1: (string | { type: 'placeholder' })[],
  parts2: (string | { type: 'placeholder' })[],
  key1: string,
  key2: string
): Overlap | null {
  // Leading literal overlap is harder to detect without full comparison
  // For conservative detection, skip for now
  // Can be added in future if needed
  return null;
}

/**
 * Generate an example step text that would match the given pattern parts.
 */
function generateExample(parts: (string | { type: 'placeholder' })[]): string {
  return parts
    .map((p) => {
      if (typeof p === 'string') return p;
      if (p.type === 'placeholder') return '"test"';
      return '';
    })
    .join('');
}

const featureFiles = walk('specs/features');
const featureSteps = new Set<string>();

for (const file of featureFiles) {
  for (const step of extractFeatureSteps(file)) {
    featureSteps.add(step);
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
  .filter(([, v]) => !v.python || !v.python.trim())
  .map(([k]) => k);

const missingTypescript = Object.entries(STEPS as StepMap)
  .filter(([, v]) => !v.typescript || !v.typescript.trim())
  .map(([k]) => k);

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
  process.exit(1);
}

console.log(
  `✓ ${Object.keys(STEPS).length} steps defined, ${orphanSteps.length} orphan, ${deadSteps.length} dead, ` +
  `${ambiguities.length} ambiguous, ${overlaps.length} overlapping`
);
