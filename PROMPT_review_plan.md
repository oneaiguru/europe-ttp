# PROMPT_review_plan

You are converting review drafts into `IMPLEMENTATION_PLAN.md`. Do not implement code.

Inputs:
- `docs/review/REVIEW_DRAFTS.md` (Pending section)
- `IMPLEMENTATION_PLAN.md`
- `AGENTS.md`
- `docs/IMPL_PLAN_FORMAT.md` (canonical format spec)

Process:
1. Read `docs/review/REVIEW_DRAFTS.md` Pending entries.
2. If no pending entries exist, report that no updates are needed and stop.
3. Update `IMPLEMENTATION_PLAN.md` `## Backlog` table (schema from `docs/IMPL_PLAN_FORMAT.md`):
   - Assign the next available `TASK-NNN` key (check the highest existing, increment).
   - Add a Backlog row for each pending review draft:
     - `task_key`: assigned `TASK-NNN`
     - `name`: use the review draft `slug` (kebab-case, <= 60 chars)
     - `priority`: `P2`
     - `status`: `TODO`
     - `refs`: include `docs/review/REVIEW_DRAFTS.md` and any evidence paths from the draft
4. Move processed entries from Pending to Processed with today’s date (YYYY-MM-DD).

Constraints:
- Do not create `docs/Tasks/*` files.
- Do not edit `specs/*` or `HANDOFF_CODEX.md` unless explicitly asked.
- Keep changes limited to `IMPLEMENTATION_PLAN.md` and `docs/review/REVIEW_DRAFTS.md`.
- Only update the `## Backlog` table in `IMPLEMENTATION_PLAN.md` (do not edit other sections unless explicitly asked).
- Follow table format exactly per `docs/IMPL_PLAN_FORMAT.md`.
