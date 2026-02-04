import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { STEPS } from '../../test/bdd/step-registry.js';

const stepLineRe = /^(Given|When|Then|And|But)\s+(.+)$/;

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile() && entry.endsWith('.feature')) {
      files.push(full);
    }
  }
  return files;
}

function extractFeatureSteps(filePath) {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const steps = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const match = stepLineRe.exec(trimmed);
    if (match) {
      steps.push(match[2]);
    }
  }
  return steps;
}

function stepMatchesPattern(featureStep, registryKey, stepEntry) {
  if (featureStep === registryKey) {
    return true;
  }

  if (stepEntry.pattern) {
    return stepEntry.pattern.test(featureStep);
  }

  return false;
}

function findRegistryEntry(featureStep) {
  for (const [key, entry] of Object.entries(STEPS)) {
    if (stepMatchesPattern(featureStep, key, entry)) {
      return { key, entry };
    }
  }
  return null;
}

const specsDir = 'specs/features';
const featureFiles = walk(specsDir);

const orphanSteps = [];
const deadSteps = [];
const missingPython = [];
const missingTypeScript = [];

for (const [key, entry] of Object.entries(STEPS)) {
  const hasPythonImpl = !!entry.python && entry.python !== 'test/python/steps/file.py:1';
  const hasTsImpl = !!entry.typescript && entry.typescript !== 'test/typescript/steps/file.ts:1';

  if (!hasPythonImpl) {
    missingPython.push(key);
  }
  if (!hasTsImpl) {
    missingTypeScript.push(key);
  }
}

for (const file of featureFiles) {
  const featureSteps = extractFeatureSteps(file);
  for (const step of featureSteps) {
    const registryEntry = findRegistryEntry(step);
    if (!registryEntry) {
      deadSteps.push({ step, file });
    }
  }
}

for (const [key, entry] of Object.entries(STEPS)) {
  if (!entry.features || entry.features.length === 0) {
    orphanSteps.push(key);
  }
}

let hasErrors = false;

if (deadSteps.length > 0) {
  console.error('\n❌ DEAD STEPS (in features but not in registry):');
  for (const { step, file } of deadSteps) {
    console.error(`  - "${step}" in ${file}`);
  }
  hasErrors = true;
}

if (orphanSteps.length > 0) {
  console.error('\n⚠️  ORPHAN STEPS (in registry but not used in any features):');
  for (const step of orphanSteps) {
    console.error(`  - "${step}"`);
  }
  hasErrors = true;
}

if (missingPython.length > 0) {
  console.error('\n⚠️  STEPS MISSING PYTHON IMPLEMENTATION:');
  for (const step of missingPython) {
    console.error(`  - "${step}"`);
  }
  hasErrors = true;
}

if (missingTypeScript.length > 0) {
  console.error('\n⚠️  STEPS MISSING TYPESCRIPT IMPLEMENTATION:');
  for (const step of missingTypeScript) {
    console.error(`  - "${step}"`);
  }
  hasErrors = true;
}

if (!hasErrors) {
  console.log('\n✅ All checks passed!');
  console.log(`   - ${featureFiles.length} feature files`);
  console.log(`   - ${Object.keys(STEPS).length} registered steps`);
  console.log(`   - 0 orphan steps`);
  console.log(`   - 0 dead steps`);
  console.log(`   - All steps have both Python and TypeScript implementations`);
}

process.exit(hasErrors ? 1 : 0);
