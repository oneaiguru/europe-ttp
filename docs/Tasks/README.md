# Europe TTP Migration - Tasks

## Task File State Machine

```
ACTIVE_TASK.md exists → Worker picks task
├── <slug>.research.md missing → Run R (Research)
├── <slug>.plan.md missing → Run P (Plan)
└── <slug>.plan.md exists → Run I (Implement)

After I complete → Remove ACTIVE_TASK.md
```

---

## Task Template

Create new tasks using `docs/Tasks/templates/task.md`:

```markdown
# TASK-XXX: [Feature Name]

## Goal
One-sentence description of what this task achieves.

## Feature File
Path to the .feature file that defines acceptance criteria.

## Legacy Reference
- File: legacy/path/to/file.py
- Lines: XX-YY

## Acceptance Criteria
- [ ] Scenario 1 from feature file passes
- [ ] Scenario 2 from feature file passes
- [ ] `bun run bdd:verify` passes
- [ ] `bun run typecheck` passes
```

---

## Active Task

Check `ACTIVE_TASK.md` to see what's currently being worked on.
