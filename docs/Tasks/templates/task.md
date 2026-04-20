# TASK-XXX: [Feature Name]

## Goal
One-sentence description of what this task achieves.

## Feature File
`specs/features/[category]/[feature].feature`

## Legacy Reference
- File: `legacy/path/to/file.py`
- Lines: XX-YY

## Step Definitions Required
- Step pattern 1 → `test/python/steps/[category]_steps.py`
- Step pattern 2 → `test/typescript/steps/[category]_steps.ts`

## Acceptance Criteria
- [ ] All scenarios in feature file pass (Python)
- [ ] All scenarios in feature file pass (TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] List files here

## Test Commands
```bash
bun run bdd:python specs/features/[category]/[feature].feature
bun run bdd:typescript specs/features/[category]/[feature].feature
bun run bdd:verify
```
