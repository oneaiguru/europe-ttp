# TTP Tailwind Migration — Reference File v2

## Status
- 13 commits on experiment/trpi-split — Tailwind CDN now loads on all pages
- 10 of 11 audited pages render correctly with clean layouts
- 1 page (TTC Reports) has a crowded table header layout issue
- 8 dynamic inline styles remain (getStatusColor) — these are intentional, not fixable with static Tailwind

## Global Rules
- Keep render.ts files as HTML string builders — do NOT convert to React/JSX components.
- Keep jQuery DataTables, Select2, and all CDN script tags unchanged.
- Use `wrapAdminShell()` from `app/admin/shared/admin-shell.ts` for all admin pages.
- Use `wrapFormShell()` from `app/forms/shared/form-shell.ts` for all form pages.
- Preserve all existing function signatures, exports, and route.ts contracts.
- Do not modify files outside the active task's scope.
- Dynamic `style="color:..."` from `getStatusColor()` is intentional — do NOT convert these.
- The dev server runs on port 8009. Check with `lsof -ti:8009` before starting.

## Loop (per task)
- Single-pass implement + separate review pass.
- **Implementor:** Read this file + task section. Make changes. Run `npx tsc --noEmit`. Commit.
- **Reviewer:** Read this file + task section. Open page URL in Playwright. Check visual result. Fix any issues or reply `all clean`.
- Max 3 review rounds per task. If not converged: escalate.

## Visual Verification Checklist (reviewer must check ALL)
1. Page renders content (not blank/white screen)
2. Card wrappers have visible borders and rounded corners
3. Inputs have visible borders and proper width (not zero-width)
4. Text is readable (proper font-size, proper color contrast)
5. DataTables/Select2 initialize (for admin pages with tables)
6. No overlapping or clipped content
7. Page heading and subtitle are visible

---

## Task 1: Fix TTC Reports Table Layout
- Slug: `reports-table`
- Goal: Fix the 18+ column DataTable header on TTC Reports page. Headers currently overlap and are unreadable because they're all uppercase bold text crammed into one row.
- Page URL: http://localhost:8009/api/admin/ttc_applicants_reports
- Files to read:
  - `app/admin/ttc_applicants_reports/render.ts` (644 lines — main target)
  - `admin/ttc_applicants_reports.html` (legacy reference for original table layout)
  - `app/admin/ttc_applicants_summary/render.ts` (pattern — has similar DataTable)
- What's wrong: Table headers display as "NAME EMAIL STATUS LAST UPDATED EVALS (LIFETIME) EVALUATORS TEACHING READINESS RATINGS BELOW 3 (EVALS) MENTAL FITNESS..." all in one crowded row. Text overlaps between columns.
- What to fix:
  - Add `text-xs` to thead cells (smaller header text)
  - Ensure `overflow-x-auto` wrapper is present (horizontal scroll for wide tables)
  - Consider adding `min-w-[80px]` to narrow columns so they don't collapse
  - Keep `nowrap` class on the table to prevent cell text wrapping
- Verification:
  1. `npx tsc --noEmit` must pass
  2. Playwright: open page, verify table headers are readable and not overlapping
- Commit message: `fix: improve TTC reports table header readability`

## Task 2: Convert Remaining Dynamic Inline Colors to Tailwind Classes (Optional)
- Slug: `status-colors`
- Goal: Refactor `getStatusColor()` to return Tailwind class names instead of hex colors, then use class attribute instead of style attribute.
- Page URLs: Reports, Post TTC Feedback, Post Sahaj TTC Feedback
- Files to read:
  - `app/admin/ttc_applicants_reports/render.ts` (lines 464, 498 — inline styles)
  - `app/admin/post_ttc_course_feedback/render.ts` (lines 229, 265, 275)
  - `app/admin/post_sahaj_ttc_course_feedback/render.ts` (lines 222, 245, 266)
- What's wrong: 8 table cells use `style="color:' + getStatusColor(status) + '"` instead of Tailwind classes.
- What to fix:
  - Find the `getStatusColor()` function — it maps status strings to hex colors
  - Create a `getStatusClass()` function that maps the same statuses to Tailwind text color classes (e.g., `text-green-600`, `text-red-600`, `text-amber-600`)
  - Replace `style="color:..."` with `class="' + getStatusClass(status) + '"` in all 8 locations
  - Keep `bg-white` Tailwind class that already exists on some cells
- Verification:
  1. `npx tsc --noEmit` must pass
  2. Playwright: open each page, verify status colors still display correctly
- Commit message: `refactor: convert dynamic status colors from inline styles to Tailwind classes`
- NOTE: This task is OPTIONAL. The inline styles work correctly. Only do this if specifically requested.

## Task 3: Verify All Pages Pass Visual Checklist (Final Sweep)
- Slug: `final-sweep`
- Goal: Open every page in Playwright and verify the Visual Verification Checklist passes.
- Pages to check:
  1. http://localhost:8009 (landing)
  2. http://localhost:8009/api/admin/ttc_applicants_summary
  3. http://localhost:8009/api/admin/ttc_applicants_integrity
  4. http://localhost:8009/api/admin/ttc_applicants_reports
  5. http://localhost:8009/api/admin/settings
  6. http://localhost:8009/api/admin/permissions
  7. http://localhost:8009/api/admin/reports_list
  8. http://localhost:8009/api/admin/post_ttc_course_feedback
  9. http://localhost:8009/api/admin/post_sahaj_ttc_course_feedback
  10. http://localhost:8009/api/forms/ttc_applicant_profile
  11. http://localhost:8009/api/forms/ttc_application_us
  12. http://localhost:8009/api/forms/ttc_application_non_us
  13. http://localhost:8009/api/forms/ttc_evaluation
  14. http://localhost:8009/api/forms/ttc_evaluator_profile
  15. http://localhost:8009/api/forms/dsn_application
  16. http://localhost:8009/api/forms/post_ttc_feedback
  17. http://localhost:8009/api/forms/post_ttc_self_evaluation
  18. http://localhost:8009/api/forms/post_sahaj_ttc_feedback
  19. http://localhost:8009/api/forms/post_sahaj_ttc_self_evaluation
  20. http://localhost:8009/api/forms/ttc_portal_settings
- For each page: navigate, take screenshot, check visual checklist. Report issues or `all clean`.
- Commit message: none (verification only)
