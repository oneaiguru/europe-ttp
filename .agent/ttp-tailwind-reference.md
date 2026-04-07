# TTP Tailwind Migration — Orchestration Reference

## Global Rules
- Keep render.ts files as HTML string builders — do NOT convert to React/JSX components.
- Replace all inline `style` attributes with Tailwind utility classes.
- Use `wrapAdminShell()` from `app/admin/shared/admin-shell.ts` for all admin pages.
- Keep jQuery DataTables, Select2, and all CDN script tags — this is a styling migration, not a jQuery rewrite.
- Use shadcn-style Tailwind class patterns from `components/ui/*.tsx` as reference for class naming (e.g., `bg-card`, `text-muted-foreground`, `rounded-xl`, `border-border`).
- Preserve all existing function signatures, exports, and route.ts contracts.
- Do not modify files outside the active task's scope.
- The worktree may have unrelated changes. Do not revert or touch them.

## TRPI Loop (per task)
Each task runs four sequential passes. One role per pass, then stop.

### R (Research)
- Read all files listed in the task's "Files to read" section IN FULL.
- Produce a research report with file:line evidence for every claim.
- Map: what exists now, what needs to change, what patterns to follow.
- No edits, no tests. Stop after R.
- Write output to `.agent/<slug>.research.md`.

### P (Plan)
- Read `.agent/<slug>.research.md` and the task definition.
- Produce an exact implementation plan: which files, which lines, what changes.
- Every change must include exact code (not pseudocode, not "update accordingly").
- Reference research evidence for every change.
- No edits, no tests. Stop after P.
- Write output to `.agent/<slug>.plan.md`.

### I (Implement)
- Read `.agent/<slug>.plan.md`.
- Apply the plan step by step.
- Run verification command from the task definition after changes.
- Commit with the message specified in the task.
- Report: files changed, verification result.

## Review Loop
- After I completes, dispatch a fresh agent with:
  "Read `/Users/m/ttp-split-experiment/AGENTS.md` first.
  Read `/Users/m/ttp-split-experiment/.agent/ttp-tailwind-reference.md` in full. Focus on Task N.
  The task was just implemented. Read all files listed in the task.
  Verify the dev server is running on port 8009 (check with lsof -ti:8009).
  Use Playwright to navigate to the task's page URL and verify it renders content (not blank).
  If the page is blank or broken: that is a P0 bug, fix it before anything else.
  Check if the task is fully implemented and bug-free.
  If bugs or gaps: fix them, run verification, report what you fixed.
  If everything correct and page renders: reply exactly `all clean`."
- If reviewer fixed things: dispatch another review pass.
- If reviewer says "all clean": task is done, move to next task.
- Max 3 review rounds per task. If not converged: escalate.

## Task 1: Permissions Page
- Slug: `permissions`
- Goal: Convert the unauthorized page from inline styles to Tailwind card layout, wrap in admin shell.
- Files to read:
  - `app/admin/permissions/render.ts`
  - `app/api/admin/permissions/route.ts`
  - `app/admin/shared/admin-shell.ts`
  - `components/ui/card.tsx` (for Tailwind class patterns)
  - `lib/utils.ts`
- Verification: `npx tsc --noEmit` (or verify type correctness manually if tsc unavailable)
- Commit message: `feat: convert permissions page to Tailwind card styling`

## Task 2: TTC Applicants Summary Page
- Slug: `summary`
- Goal: Replace all inline `style` attributes in the 325-line render function with Tailwind utility classes. Keep DataTables/Select2/jQuery CDN scripts unchanged. Wrap in admin shell if not already.
- Files to read:
  - `app/admin/ttc_applicants_summary/render.ts` (325 lines — the main target)
  - `admin/ttc_applicants_summary.html` (486 lines — legacy reference)
  - `app/api/admin/ttc_applicants_summary/route.ts`
  - `app/admin/shared/admin-shell.ts`
  - `components/ui/table.tsx` (for table class patterns)
  - `components/ui/badge.tsx` (for status badge patterns)
- Verification: `npx tsc --noEmit`
- Commit message: `feat: convert ttc_applicants_summary to Tailwind styling`

## Task 3: TTC Applicants Integrity Page
- Slug: `integrity`
- Goal: Same as Task 2 — replace inline styles with Tailwind in the integrity page render function. If render.ts is a stub, enrich it from the legacy HTML using the same patterns established in Task 2.
- Files to read:
  - `app/admin/ttc_applicants_integrity/render.ts`
  - `admin/ttc_applicants_integrity.html` (382 lines — legacy reference)
  - `app/api/admin/ttc_applicants_integrity/route.ts` (if exists)
  - `app/admin/shared/admin-shell.ts`
  - `app/admin/ttc_applicants_summary/render.ts` (Task 2 result — the pattern to follow)
- Verification: `npx tsc --noEmit`
- Commit message: `feat: convert ttc_applicants_integrity to Tailwind styling`
