You are reviewing the Tailwind migration of ALL admin pages.

The dev server runs at http://localhost:8009. Read AGENTS.md first.

For EACH of these pages, use Playwright to navigate and verify it renders content (not blank):
1. http://localhost:8009/api/admin/ttc_applicants_summary
2. http://localhost:8009/api/admin/ttc_applicants_integrity
3. http://localhost:8009/api/admin/permissions
4. http://localhost:8009/api/admin/reports_list
5. http://localhost:8009/api/admin/settings
6. http://localhost:8009/api/admin/ttc_applicants_reports

For each page report:
- Does it load? (not blank, not error)
- Are Tailwind classes visible in the HTML? (cards, rounded borders, spacing)
- Does the DataTable/Select2 initialize? (column headers visible)
- Any JavaScript console errors?

If a page is blank or broken: read the render.ts and route.ts, find the bug, fix it.
If all pages render: reply exactly "all clean"

After any fixes: git add and commit with "fix: review corrections for admin pages"
