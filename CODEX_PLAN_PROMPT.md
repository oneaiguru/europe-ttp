# CODEX PLAN PROMPT - Europe TTP Migration

## Context

**Project Location:** `/Users/m/git/clients/aol/europe-ttp`

**Your Mission:** Execute the PREP phase (Phase 0) to prepare for autonomous build loops.

## Planning Mode - Code Changes PROHIBITED

In planning mode, you ONLY:
- Read and analyze legacy code
- Write .feature files (Gherkin)
- Update step registry
- Generate task graphs and coverage matrices
- Document implementation plans

**DO NOT write any implementation code in plan mode.**

---

## Phase 0A: Extract from Legacy Python

Read ALL `.py` files in the project root and subdirectories. Extract structured data.

### Output: `specs/extracted/routes.json`
Find all webapp2.Route definitions and webapp2.WSGIApplication routes.
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "routes": [
    {
      "path": "/path",
      "handler": "HandlerClass",
      "methods": ["GET"],
      "file": "path/to/file.py",
      "line": 123
    }
  ]
}
```

### Output: `specs/extracted/models.json`
Find all NDB model definitions (ndb.Model, ndb.Expando).
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "models": [
    {
      "name": "ModelName",
      "kind": "ndb.Model|ndb.Expando",
      "properties": [
        {"name": "prop_name", "type": "StringProperty", "required": true}
      ],
      "file": "db/file.py",
      "line": 10
    }
  ]
}
```

### Output: `specs/extracted/forms.json`
Find all form definitions (webapp2.RequestHandler, form fields).
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "forms": [
    {
      "name": "FormName",
      "handler": "FormHandler",
      "fields": [
        {"name": "field_name", "type": "text", "required": true, "validation": "..."}
      ],
      "file": "form.py",
      "line": 100
    }
  ]
}
```

### Output: `specs/extracted/emails.json`
Find all SendGrid email triggers.
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "emails": [
    {
      "name": "EmailTemplateName",
      "trigger": "event_description",
      "template_id": "sendgrid-template-id",
      "file": "path/to/file.py",
      "line": 50
    }
  ]
}
```

### Output: `specs/extracted/reports.json`
Find all report generation logic in `reporting/` directory.
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "reports": [
    {
      "name": "ReportName",
      "description": "What report does",
      "endpoint": "/report/path",
      "file": "reporting/file.py",
      "line": 20
    }
  ]
}
```

---

## Phase 0B: Generate Feature Files

From the extracted JSON files, generate Gherkin `.feature` files.

### Structure
```
specs/features/
├── auth/
│   ├── login.feature
│   ├── logout.feature
│   └── password_reset.feature
├── forms/
│   ├── ttc_application_us.feature
│   ├── ttc_application_non_us.feature
│   └── dsn_application.feature
├── reports/
│   ├── participant_list.feature
│   └── certificate.feature
└── uploads/
    ├── photo_upload.feature
    └── document_upload.feature
```

### Feature Template
```gherkin
Feature: [Feature Name]
  As a [user role]
  I want to [action]
  So that [benefit]

  @p1 @python-verified
  Scenario: [Scenario description]
    Given [precondition]
    When [action]
    Then [expected outcome]
```

### Tags
- `@p1` - Critical path (must have)
- `@p2` - Important (should have)
- `@p3` - Nice to have
- `@python-verified` - Verified against Python impl
- `@needs-verification` - Needs manual verification

---

## Phase 0C: Step Registry

Create `test/bdd/step-registry.ts` with ALL unique steps from feature files.

```typescript
export const STEPS = {
  'I am on the TTC application page': {
    pattern: /^I am on the TTC application page$/,
    python: 'test/python/steps/forms_steps.py:15',
    typescript: 'test/typescript/steps/forms_steps.ts:23',
    features: ['specs/features/forms/ttc_application_us.feature:12'],
  },
  // ... all steps from all feature files
} as const;
```

Also create skeleton step definition files:
- `test/python/steps/*.py` - Empty step defs with TODO comments
- `test/typescript/steps/*.ts` - Empty step defs with TODO comments

### Alignment Verification Script

Create `scripts/bdd/verify-alignment.ts` that checks:
1. All feature steps have registry entries
2. All registry entries have Python impl path
3. All registry entries have TypeScript impl path (can be "TODO")
4. No orphan steps (in registry but not in features)
5. No dead steps (in features but not in registry)

```bash
# Run verification
bun scripts/bdd/verify-alignment.ts
# Expected output: ✓ 47 steps defined, 0 orphan, 0 dead
```

---

## Phase 0D: Task Graph & Implementation Plan

### Output: `tasks/task_graph.json`
```json
{
  "generated_at": "ISO-8601-timestamp",
  "tasks": [
    {
      "id": "TASK-001",
      "name": "Authentication: Login",
      "feature_file": "specs/features/auth/login.feature",
      "priority": "p1",
      "estimated_hours": 4,
      "depends_on": []
    }
  ]
}
```

### Update: `IMPLEMENTATION_PLAN.md`
Replace placeholder with actual task list derived from task_graph.json.

### Update: `docs/coverage_matrix.md`
Fill in ALL features from the .feature files:
- Python column: ✓ after Python steps verified
- TypeScript column: ❌ initially (updates during build)

---

## Verification Commands

After each phase, run verification:

```bash
# After 0A: Check JSON files exist and are valid
ls -la specs/extracted/*.json
cat specs/extracted/routes.json | jq .

# After 0B: Count feature files
find specs/features -name "*.feature" | wc -l

# After 0C: Check step registry
cat test/bdd/step-registry.ts | grep "pattern:" | wc -l

# After 0D: Check task graph
cat tasks/task_graph.json | jq ".tasks | length"
```

---

## Required Reading (Before Starting)

1. `/Users/m/git/clients/aol/europe-ttp/HANDOFF.md`
2. `/Users/m/git/clients/aol/europe-ttp/PROMPT_plan.md`
3. `/Users/m/git/clients/aol/europe-ttp/AGENTS.md`

---

## Success Criteria

Phase 0 is complete when:
- [ ] `specs/extracted/` has 5 JSON files (routes, models, forms, emails, reports)
- [ ] `specs/features/` has 20+ .feature files
- [ ] `test/bdd/step-registry.ts` has 50+ step patterns
- [ ] `bun scripts/bdd/verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `tasks/task_graph.json` has 30-60 tasks
- [ ] `docs/coverage_matrix.md` lists all features with Python=✓, TypeScript=❌
- [ ] `git status` shows new files (ready to commit)

---

## Output Format

After completing each phase, output:

```
[PHASE 0A COMPLETE]
Created: specs/extracted/routes.json (X routes)
Created: specs/extracted/models.json (X models)
Created: specs/extracted/forms.json (X forms)
Created: specs/extracted/emails.json (X emails)
Created: specs/extracted/reports.json (X reports)

[PHASE 0B COMPLETE]
Created: X feature files in specs/features/auth/
Created: X feature files in specs/features/forms/
Created: X feature files in specs/features/reports/
Created: X feature files in specs/features/uploads/

[PHASE 0C COMPLETE]
Created: test/bdd/step-registry.ts (X unique steps)
Created: X Python step definition files
Created: X TypeScript step definition files

[PHASE 0D COMPLETE]
Created: tasks/task_graph.json (X tasks)
Updated: IMPLEMENTATION_PLAN.md
Updated: docs/coverage_matrix.md

[PREP PHASE COMPLETE]
Ready to hand off to Weaver for build loop.
```

---

## BDD Migration Invariants (Non-Negotiable)

1. **One Source of Truth**: `test/bdd/step-registry.ts` is the ONLY place step definitions are mapped
2. **Dual Implementation**: Every step MUST have Python + TypeScript paths
3. **No Orphan Steps**: Run `verify-alignment.ts` before any commit
4. **Python First**: TypeScript impl only AFTER Python step passes
5. **Feature Files Drive Implementation**: No code without a scenario
6. **Legacy Behavior Preserved**: All scenarios must pass against Python first

---

## Important Notes

1. **Legacy is Read-Only**: Never modify Python files
2. **BDD Alignment is Sacred**: Every step must have Python + TypeScript paths
3. **Commit Each Phase**: Git commit after each phase completes
4. **Update progress.md**: Log what was done in each session

---

## Start Now

Begin with Phase 0A. Read `app.yaml`, `*.py` files, extract all routes.
Output to `specs/extracted/routes.json`.
