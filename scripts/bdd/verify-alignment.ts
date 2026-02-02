import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { STEPS } from '../../test/bdd/step-registry';

type StepMap = Record<string, { python: string; typescript: string }>;

const stepLineRe = /^(Given|When|Then|And|But)\s+(.+)$/;

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
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

function extractFeatureSteps(filePath: string): string[] {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const steps: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const match = stepLineRe.exec(trimmed);
    if (match) {
      steps.push(match[2]);
    }
  }
  return steps;
}

const featureFiles = walk('specs/features');
const featureSteps = new Set<string>();

for (const file of featureFiles) {
  for (const step of extractFeatureSteps(file)) {
    featureSteps.add(step);
  }
}

const registrySteps = new Set(Object.keys(STEPS));
const orphan = [...registrySteps].filter((s) => !featureSteps.has(s));
const dead = [...featureSteps].filter((s) => !registrySteps.has(s));

const missingPython = Object.entries(STEPS as StepMap)
  .filter(([, v]) => !v.python || !v.python.trim())
  .map(([k]) => k);

const missingTypescript = Object.entries(STEPS as StepMap)
  .filter(([, v]) => !v.typescript || !v.typescript.trim())
  .map(([k]) => k);

if (orphan.length || dead.length || missingPython.length || missingTypescript.length) {
  console.error('BDD alignment failed');
  if (orphan.length) {
    console.error(`Orphan steps (in registry, not in features): ${orphan.length}`);
    orphan.forEach((s) => console.error(`  - ${s}`));
  }
  if (dead.length) {
    console.error(`Dead steps (in features, not in registry): ${dead.length}`);
    dead.forEach((s) => console.error(`  - ${s}`));
  }
  if (missingPython.length) {
    console.error(`Missing python step paths: ${missingPython.length}`);
    missingPython.forEach((s) => console.error(`  - ${s}`));
  }
  if (missingTypescript.length) {
    console.error(`Missing typescript step paths: ${missingTypescript.length}`);
    missingTypescript.forEach((s) => console.error(`  - ${s}`));
  }
  process.exit(1);
}

console.log(`✓ ${registrySteps.size} steps defined, ${orphan.length} orphan, ${dead.length} dead`);
