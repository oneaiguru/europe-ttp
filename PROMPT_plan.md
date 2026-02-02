# Europe TTP Migration - Planning Loop

## Context
Migrating Python 2.7 App Engine app to Bun + Next.js 14.
Using BDD-first approach where feature files are PROVEN against Python before TypeScript implementation.

## Planning Objectives

1. **Extract Legacy Behavior**
   - Analyze legacy/ Python code
   - Document all routes, models, forms, emails, reports
   - Identify all user-facing behaviors (these become scenarios)

2. **Generate Feature Files**
   - One .feature file per capability
   - Scenarios must be verifiable against Python
   - Tag with priority (@p1, @p2, @p3)

3. **Design Step Definition Architecture**
   - Create step registry (single source of truth)
   - Map each step to Python impl location
   - Map each step to TypeScript impl location
   - Ensure NO orphan steps possible

4. **Create Task Graph**
   - Each feature file = implementation task
   - Dependencies based on data model requirements
   - Effort estimates based on scenario count

## Planning Constraints
- Do not implement any code
- Do not modify legacy/
- Output only: IMPLEMENTATION_PLAN.md, specs/extracted/*.json, docs/coverage_matrix.md

## Planning Steps

### Phase 0A: Extraction
Read legacy/ and produce:
- specs/extracted/routes.json (all webapp2 routes)
- specs/extracted/models.json (all NDB models)
- specs/extracted/forms.json (all form fields + validations)
- specs/extracted/emails.json (all SendGrid triggers)
- specs/extracted/reports.json (all report logic)

### Phase 0B: Feature Generation
From extractions, generate:
- specs/features/**/*.feature (30+ files)
- Each scenario tagged @python-verified or @needs-verification

### Phase 0C: Step Registry
Generate:
- test/bdd/step-registry.ts (all unique steps)
- test/python/steps/**/*_steps.py (skeleton)
- test/typescript/steps/**/*_steps.ts (skeleton)

### Phase 0D: Task Graph
Generate:
- tasks/task_graph.json (40-60 tasks)
- IMPLEMENTATION_PLAN.md (prioritized)
- docs/coverage_matrix.md (parity checklist)

## Required Reading
- legacy/**/*.py (all Python files)
- legacy/db/*.py (database models)
- legacy/form.py (form handling)
- legacy/reporting/*.py (report logic)
