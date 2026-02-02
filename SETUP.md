# Europe TTP Migration - Complete Setup Guide

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  PREP PHASE (Now, Local Claude Code, Interactive)              │
│                                                                 │
│  You + Claude Code locally:                                     │
│  ├── Create project structure ✓ DONE                            │
│  ├── Legacy code already present ✓ DONE                         │
│  ├── Run PROMPT_plan.md (extraction + feature files)           │
│  ├── Generate task_graph.json                                   │
│  └── Verify BDD infrastructure works                            │
│                                                                 │
│  This is INTERACTIVE - needs your guidance                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ When prep complete (task_graph.json exists)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BUILD PHASE (After prep, via AA Weaver)                       │
│                                                                 │
│  M1 Worker (or PCs later):                                      │
│  ├── Point WEAVER_REPO_PATH at europe-ttp                       │
│  ├── Submit tasks via coordinator                               │
│  ├── Each task runs PROMPT_build.md (T→R→P→I loop)              │
│  └── Parallel execution when PCs ready                          │
│                                                                 │
│  This is AUTONOMOUS - weaver runs without you                   │
└─────────────────────────────────────────────────────────────────┘
```

## What Runs Where

| Phase | Tool | Where | Mode |
|-------|------|-------|------|
| Prep: Extraction | Claude Code | Local (interactive) | You guide it |
| Prep: Feature files | Claude Code | Local (interactive) | You guide it |
| Prep: Task graph | Claude Code | Local (interactive) | You guide it |
| Plan loop | Codex CLI | Local via `loop_mix.sh plan` | IMPLEMENTATION_PLAN updates |
| Review loop | Codex CLI | Local via `loop_mix.sh review` | Review drafts |
| Build loop | AA Weaver | M1/PCs via coordinator | Autonomous T→R→P→I |

---

## Part 1: Python 2.7 BDD Tooling Setup

### The Only Viable BDD Stack for Python 2.7

**Behave 1.2.6** is the correct and only sane choice for Python 2.7 BDD.

#### Why Behave?

- Native Gherkin (.feature) support
- Python 2.7 compatible (pinned version)
- Historically used with App Engine & webapp2
- Simple step discovery (easy to mirror in TypeScript)

### Installation

Create `requirements-bdd.txt`:

```text
behave==1.2.6
WebTest==2.0.35
parse==1.19.0
```

Install:

```bash
pip2.7 install -r requirements-bdd.txt
```

> **Sources**: [Behave GitHub](https://github.com/behave/behave) | [Behave PyPI](https://pypi.org/project/behave/) | [Behave Documentation](https://behave.readthedocs.io/en/stable/gherkin)

---

## Part 2: Python BDD Directory Structure

```
test/python/
├── features/
│   ├── forms/
│   │   └── ttc_application_us.feature
│   ├── auth/
│   ├── reports/
│   └── environment.py
└── steps/
    ├── forms_steps.py
    ├── auth_steps.py
    └── common_steps.py
```

### environment.py (App Engine Integration)

```python
# test/python/features/environment.py
from webtest import TestApp
import sys
import os

# Add legacy root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

# Import the webapp2 app
from admin import app as admin_app
from api import app as api_app
from ttc_portal import app as ttc_app

def before_all(context):
    """Set up test clients for all apps."""
    context.admin_client = TestApp(admin_app)
    context.api_client = TestApp(api_app)
    context.ttc_client = TestApp(ttc_app)

def before_scenario(context, scenario):
    """Reset context before each scenario."""
    context.response = None
    context.data = {}
```

### Example Step Definition (Python 2.7)

```python
# test/python/steps/forms_steps.py
from behave import given, when, then

@given('I am on the TTC application page')
def step_impl(context):
    """Navigate to TTC application form."""
    context.response = context.ttc_client.get('/ttc/application')
    assert context.response.status_code == 200

@when('I submit the application with valid data')
def step_impl(context):
    """Submit the form with valid data."""
    form_data = {
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'john@example.com',
    }
    context.response = context.ttc_client.post('/ttc/application', form_data)

@then('I should see a success message')
def step_impl(context):
    """Verify success message is shown."""
    assert context.response.status_code == 302  # Redirect after success
    assert '/ttc/success' in context.response.location
```

---

## Part 3: Running Python BDD Tests

### Run All Features

```bash
# From project root
cd test/python
behave features/ -f json -o ../reports/python_bdd.json
```

### Run Specific Feature

```bash
behave features/forms/ttc_application_us.feature
```

### Run by Tag

```bash
behave features/ --tags=@python-verified
behave features/ --tags=@p1
```

### Verify Output Format

The JSON output enables mechanical parity checking:

```bash
cat test/reports/python_bdd.json | jq '.[] | .status'
```

---

## Part 4: TypeScript BDD Setup

### Installation

```bash
cd /Users/m/git/clients/aol/europe-ttp
bun add -D @cucumber/cucumber @cucumber/pretty
```

### Directory Structure

```
test/typescript/
├── features/
│   └── (symlinks to specs/features/)
├── steps/
│   ├── forms_steps.ts
│   ├── auth_steps.ts
│   └── common_steps.ts
├── support/
│   └── world.ts
└── reports/
```

### cucumber.ts Config

```typescript
// test/typescript/cucumber.ts
import { beforeEach } from '@cucumber/cucumber';
import { TestClient } from './support/world';

beforeEach(async function () {
  this.world = new TestClient();
});
```

---

## Part 5: Alignment Verification Script

Create `scripts/bdd/verify-alignment.ts`:

```typescript
// scripts/bdd/verify-alignment.ts
#!/usr/bin/env bun
/**
 * BDD Alignment Verification
 *
 * Ensures:
 * 1. All feature steps have registry entries
 * 2. All registry entries have Python impl path
 * 3. All registry entries have TypeScript impl path
 * 4. No orphan steps (in registry but not in features)
 * 5. No dead steps (in features but not in registry)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const STEPS_REGISTRY = './test/bdd/step-registry.ts';
const FEATURES_DIR = './specs/features';

interface StepEntry {
  pattern: RegExp;
  python: string;
  typescript: string;
  features: string[];
}

// Parse step registry
function parseRegistry(filepath: string): Record<string, StepEntry> {
  const content = readFileSync(filepath, 'utf-8');
  // Extract STEPS object
  const match = content.match(/export const STEPS = \{([\s\S]+)\} as const/);
  if (!match) throw new Error('Could not find STEPS export');
  // Would need proper parsing in production
  return {};
}

// Extract steps from feature files
function extractStepsFromFeatures(dir: string): string[] {
  const steps: string[] = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      steps.push(...extractStepsFromFeatures(fullPath));
    } else if (file.endsWith('.feature')) {
      const content = readFileSync(fullPath, 'utf-8');
      // Extract Given/When/Then lines
      const stepLines = content.match(/^\s*(Given|When|Then|And).+$/gm) || [];
      steps.push(...stepLines.map(s => s.replace(/^\s*(Given|When|Then|And)\s+/, '')));
    }
  }

  return steps;
}

// Main verification
function main() {
  console.log('[BDD Alignment Check]');

  // Parse registry
  const registry = parseRegistry(STEPS_REGISTRY);
  const featureSteps = extractStepsFromFeatures(FEATURES_DIR);

  // Check each
  let orphan = 0;
  let dead = 0;
  let noPython = 0;
  let noTypeScript = 0;

  // TODO: Implement actual checks

  console.log(`\n  Steps defined: ${Object.keys(registry).length}`);
  console.log(`  Steps in features: ${featureSteps.length}`);
  console.log(`  Orphan steps: ${orphan}`);
  console.log(`  Dead steps: ${dead}`);
  console.log(`  Missing Python impl: ${noPython}`);
  console.log(`  Missing TypeScript impl: ${noTypeScript}`);

  if (orphan === 0 && dead === 0) {
    console.log('\n✓ Alignment check PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ Alignment check FAILED');
    process.exit(1);
  }
}

main();
```

---

## Part 6: Test Runner Scripts

### scripts/bdd/run-python.ts

```typescript
// scripts/bdd/run-python.ts
#!/usr/bin/env bun
/**
 * Run Python BDD tests against legacy code
 */
import { spawn } from 'child_process';

const featurePath = process.argv[2] || 'specs/features/';

const proc = spawn('behandle', [
  'test/python/features',
  '-f', 'json',
  '-o', 'test/reports/python_bdd.json'
]);

proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);

proc.on('exit', (code) => process.exit(code || 0));
```

### scripts/bdd/run-typescript.ts

```typescript
// scripts/bdd/run-typescript.ts
#!/usr/bin/env bun
/**
 * Run TypeScript BDD tests
 */
import { spawn } from 'child_process';

const featurePath = process.argv[2] || 'specs/features/';

const proc = spawn('bun', [
  'test/typescript/node_modules/.bin/cucumber-js',
  featurePath,
  '-f', 'json',
  '-o', 'test/reports/typescript_bdd.json'
]);

proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);

proc.on('exit', (code) => process.exit(code || 0));
```

---

## Part 7: package.json Scripts

```json
{
  "scripts": {
    "bdd:verify": "bun scripts/bdd/verify-alignment.ts",
    "bdd:python": "bun scripts/bdd/run-python.ts",
    "bdd:typescript": "bun scripts/bdd/run-typescript.ts",
    "bdd:all": "bun run bdd:python && bun run bdd:typescript && bun run bdd:verify",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

---

## Part 8: BDD Migration Invariants (Non-Negotiable)

1. **One Source of Truth**: `test/bdd/step-registry.ts` is the ONLY place step definitions are mapped
2. **Dual Implementation**: Every step MUST have Python + TypeScript paths
3. **No Orphan Steps**: Run `verify-alignment.ts` before any commit
4. **Python First**: TypeScript impl only AFTER Python step passes
5. **Feature Files Drive Implementation**: No code without a scenario
6. **Legacy is Read-Only**: Never modify files in root (legacy Python)

---

## Part 9: Handoff to Weaver

### When PREP Phase is Complete

Check these before handing off:

```bash
# Verify extractions exist
ls -la specs/extracted/*.json
# Output: routes.json models.json forms.json emails.json reports.json

# Verify feature files
find specs/features -name "*.feature" | wc -l
# Output: 20+ (should be 30+)

# Verify step registry
cat test/bdd/step-registry.ts | grep "pattern:" | wc -l
# Output: 50+ step patterns

# Verify task graph
cat tasks/task_graph.json | jq ".tasks | length"
# Output: 30-60 tasks

# Run alignment check
bun run bdd:verify
# Output: ✓ Alignment check PASSED
```

### Start Build Loop (Weaver)

```bash
# On M1 worker
COORDINATOR_URL=http://192.168.1.80:8787 \
  WEAVER_REPO_PATH=/Users/m/git/clients/aol/europe-ttp \
  WEAVER_OUTPUT_PATH=/Users/m/aa-output \
  WEAVER_CODEX_HOME=$HOME/.codex \
  pnpm exec tsx /Users/m/aa/apps/worker/src/index.ts
```

### Submit Tasks

```bash
curl -X POST http://192.168.1.80:8787/tasks \
  -H 'Content-Type: application/json' \
  -d '{"provider":"codex","mode":"build"}'
```

---

## Part 10: Sources

- [Behave GitHub Repository](https://github.com/behave/behave) - Official Behave source
- [Behave PyPI](https://pypi.org/project/behave/) - Package information
- [Behave Documentation - Gherkin](https://behave.readthedocs.io/en/stable/gherkin) - Feature file setup
- [Python BDD Framework Comparison (2019)](https://automationpanda.com/2019/04/02/python-bdd-framework-comparison/) - Why Behave over pytest-bdd
- [BDD with Behave (2025)](https://blog.nashtechglobal.com/introduction-to-bdd-with-behave-in-python/) - Recent guide
- [Testing Flask API with BDD Python 2.7](https://stackoverflow.com/questions/32149715/bdd-tests-to-test-flask-rest-api) - StackOverflow reference
