# PROMPT_review_plan

You are converting review drafts into the Implementation Plan. Do not implement code.

Inputs:
- docs/review/REVIEW_DRAFTS.md (Pending section)
- IMPLEMENTATION_PLAN.md
- AGENTS.md

Process:
1. Read REVIEW_DRAFTS Pending entries.
2. If no pending entries exist, report that no updates are needed and stop.
3. Update IMPLEMENTATION_PLAN.md:
   - If Missing Work is "None.", replace it with the new items.
   - Otherwise, append the new items to the Missing Work list.
   - Each item should include the slug, goal, and acceptance in one bullet. Add refs when provided.
4. Move processed entries from Pending to Processed with today’s date (YYYY-MM-DD).

Constraints:
- Do not create docs/Tasks files.
- Do not edit specs/* or HANDOFF_CODEX.md unless explicitly asked.
- Keep changes limited to IMPLEMENTATION_PLAN.md and docs/review/REVIEW_DRAFTS.md.
