# Europe TTP Migration - Planning Loop (BDD-First)

## Context
Migrating Python 2.7 App Engine app to Bun + Next.js 14.
**BDD-First**: Feature files are PROVEN against Python before TypeScript implementation.

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

Read ALL `.py` files. Extract structured data to `specs/extracted/`:

### Output 1: `specs/extracted/routes.json`
Find all webapp2.Route definitions and webapp2.WSGIApplication routes.
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "routes": [
    {"path": "/path", "handler": "HandlerClass", "methods": ["GET"], "file": "path/to/file.py", "line": 123}
  ]
}
```

### Output 2: `specs/extracted/models.json`
Find all NDB model definitions (ndb.Model, ndb.Expando) in `db/` and root.
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "models": [
    {"name": "ModelName", "kind": "ndb.Model", "properties": [...], "file": "db/file.py", "line": 10}
  ]
}
```

### Output 3: `specs/extracted/forms.json`
Find all form definitions (webapp2.RequestHandler, form fields).
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "forms": [
    {"name": "FormName", "handler": "FormHandler", "fields": [...], "file": "form.py", "line": 100}
  ]
}
```

### Output 4: `specs/extracted/emails.json`
Find all SendGrid email triggers.
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "emails": [
    {"name": "EmailTemplateName", "trigger": "event", "template_id": "...", "file": "...", "line": 50}
  ]
}
```

### Output 5: `specs/extracted/reports.json`
Find all report generation logic in `reporting/` directory.
```json
{
  "extracted_at": "ISO-8601-timestamp",
  "reports": [
    {"name": "ReportName", "description": "...", "endpoint": "/report/path", "file": "reporting/file.py", "line": 20}
  ]
}
```

---

## Phase 0B: Generate Feature Files (Gherkin)

From extracted JSON, generate `.feature` files in `specs/features/`.

### Directory Structure
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

## Phase 0C: Create Step Registry (Single Source of Truth)

Create `test/bdd/step-registry.ts` with ALL unique steps from feature files.

### Registry Format
```typescript
export const STEPS = {
  'I am on the TTC application page': {
    pattern: /^I am on the TTC application page$/,
    python: 'test/python/steps/forms_steps.py:15',
    typescript: 'test/typescript/steps/forms_steps.ts:23',
    features: ['specs/features/forms/ttc_application_us.feature:12'],
  },
  // ... EVERY step from EVERY feature file
} as const;
```

### Skeleton Step Definitions
Create empty skeleton files:
- `test/python/steps/*_steps.py` - Python step defs with TODO comments
- `test/typescript/steps/*_steps.ts` - TypeScript step defs with TODO comments

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
# Output: ✓ 47 steps defined, 0 orphan, 0 dead
```

---

## Phase 0D: Generate Task Graph & Coverage Matrix

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
      "scenarios": ["Valid login", "Invalid login"],
      "depends_on": [],
      "estimated_hours": 4
    }
  ]
}
```

### Update: `IMPLEMENTATION_PLAN.md`
Replace placeholder with task list derived from task_graph.json:
```markdown
## Phase 1: Foundation
| Task | Priority | Feature File | Status |
|------|----------|--------------|--------|
| TASK-001 | p1 | specs/features/auth/login.feature | 🔴 TODO |
```

### Update: `docs/coverage_matrix.md`
Fill in ALL features with status:
```markdown
| Feature | Python | TypeScript |
|---------|--------|------------|
| Login | ✓ | ❌ |
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

## Required Reading

1. Legacy code: `*.py`, `db/*.py`, `form.py`, `reporting/*.py`
2. `HANDOFF.md` - Project scope
3. `AGENTS.md` - Agent roles (for reference)

---

## Planning Outputs (What You Produce)

| Output | Location | Format |
|--------|----------|--------|
| Routes extraction | `specs/extracted/routes.json` | JSON |
| Models extraction | `specs/extracted/models.json` | JSON |
| Forms extraction | `specs/extracted/forms.json` | JSON |
| Emails extraction | `specs/extracted/emails.json` | JSON |
| Reports extraction | `specs/extracted/reports.json` | JSON |
| Feature files | `specs/features/**/*.feature` | Gherkin |
| Step registry | `test/bdd/step-registry.ts` | TypeScript |
| Step skeletons | `test/python/steps/*.py`, `test/typescript/steps/*.ts` | Code |
| Task graph | `tasks/task_graph.json` | JSON |
| Implementation plan | `IMPLEMENTATION_PLAN.md` | Markdown |
| Coverage matrix | `docs/coverage_matrix.md` | Markdown |
| Verification script | `scripts/bdd/verify-alignment.ts` | TypeScript |

---

## Success Criteria

Phase 0 (Planning) is complete when:
- [ ] `specs/extracted/` has 5 JSON files
- [ ] `specs/features/` has 20+ .feature files
- [ ] `test/bdd/step-registry.ts` has 50+ step patterns
- [ ] `bun scripts/bdd/verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `tasks/task_graph.json` has 30-60 tasks
- [ ] `docs/coverage_matrix.md` lists all features
- [ ] Git commit ready with all planning artifacts

---

## After Planning: Handoff to Build Loop

When planning is complete, the build loop (`PROMPT_build.md`) will:
1. Pick next task from task_graph
2. Research Python implementation
3. Plan TypeScript implementation
4. Implement with BDD verification
5. Update coverage matrix

**Planning does NOT write implementation code.**
