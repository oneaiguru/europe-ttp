Required reading for every phase:
- `AGENTS.md` (server config, stack, constraints)
- `IMPLEMENTATION_PLAN.md` (task list)

Role selection (file-based). Determine role first, then follow only that section.

Determine `<slug>`:
- Read the task table in `IMPLEMENTATION_PLAN.md`.
- If exactly one row is `IN_PROGRESS`, use that row.
- Else choose the first task whose status is `TODO` and where `docs/Tasks/<slug>.done.md` does not exist.
- `<slug>` is the task table `name` field.

Determine role (by docs/Tasks files):
- If `docs/Tasks/<slug>.task.md` is missing, role = `T` (Task intake).
- Else if `docs/Tasks/<slug>.research.md` is missing, role = `R`.
- Else if `docs/Tasks/<slug>.plan.md` is missing, role = `P`.
- Else if `docs/Tasks/<slug>.done.md` is missing, role = `I`.
- Else (done exists): pick the next task (repeat selection).

Run exactly one role per loop, then stop.

## CRITICAL CONTEXT
This is NOT a prototype build. The pages already work and render content. You are RESTYLING them — adding Tailwind utility classes for modern layout, spacing, typography, and visual structure. Do NOT break existing functionality. Do NOT remove jQuery DataTables, Select2, or CDN scripts. The page must still render the same content after your changes.

Tailwind CSS is loaded via CDN in `app/admin/shared/admin-shell.ts`. All admin pages use `wrapAdminShell()` which includes the Tailwind CDN script tag.

The goal is to make each page look modern and professional:
- Add proper page header with title and description
- Wrap content sections in card-like containers (rounded borders, shadows, padding)
- Use Tailwind typography classes (text-sm, font-medium, text-muted-foreground etc.)
- Add proper spacing between sections (space-y-*, gap-*, p-*, m-*)
- Style buttons, dropdowns, and form controls with Tailwind classes
- Keep DataTables/Select2 functional — they have their own CSS, just improve the surrounding layout

1. T (Task intake):
- Read `AGENTS.md`, `IMPLEMENTATION_PLAN.md`.
- Read the legacy HTML file from the task's refs (this is the visual spec).
- Read the current render.ts file (this is what you're restyling).
- Create `docs/Tasks/<slug>.task.md` using `docs/Tasks/templates/TASK.md`.
- Goal section must say: "Replace all inline style attributes with Tailwind utility classes. Keep all existing functionality."
- Required Reading must list: the legacy HTML file, the current render.ts, admin-shell.ts, and any shadcn component files relevant.
- Stop after T.

2. R (Research):
- Read `docs/Tasks/<slug>.task.md` (Required Reading list).
- Read every file in the Required Reading list IN FULL.
- For each inline `style` attribute in the render.ts, document: file:line, current style value, equivalent Tailwind class.
- Check if the page currently renders by verifying the route.ts imports render correctly.
- Produce `docs/Tasks/<slug>.research.md` with file:line ranges.
- No edits, no tests. Stop after R.

3. P (Plan):
- Read `docs/Tasks/<slug>.task.md` and `docs/Tasks/<slug>.research.md`.
- For each inline style found in research, write the exact replacement: `style="X"` → `class="Y"`.
- Handle dynamic styles (e.g., `style="color:' + getStatusColor(x) + '"`) — keep these as inline style since Tailwind can't handle runtime values.
- Write the complete list of changes with before/after for each line.
- Produce `docs/Tasks/<slug>.plan.md`.
- No edits, no tests. Stop after P.

4. I (Implement):
- Read `docs/Tasks/<slug>.plan.md`.
- Apply each change from the plan.
- After all changes: verify the dev server still serves the page (check `lsof -ti:8009`).
- Run `npx tsc --noEmit` if available.
- Open the page URL in the browser and verify it renders content (not blank).
- If tests pass and page renders: create `docs/Tasks/<slug>.done.md` with content exactly `done`. Stop.
- If page is blank or broken: fix the issue before creating done file.
