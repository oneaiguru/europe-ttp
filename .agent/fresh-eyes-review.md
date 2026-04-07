You are doing a fresh-eyes code review. You have NO context about what was planned. Just read the code and find bugs.

READ EVERY FILE BELOW IN FULL:
1. app/admin/ttc_applicants_summary/render.ts
2. app/admin/ttc_applicants_integrity/render.ts
3. app/admin/ttc_applicants_reports/render.ts
4. app/admin/post_ttc_course_feedback/render.ts
5. app/admin/post_sahaj_ttc_course_feedback/render.ts
6. app/admin/settings/render.ts
7. app/admin/permissions/render.ts
8. app/admin/reports_list/render.ts
9. app/admin/shared/admin-shell.ts

Focus on:
- Runtime errors (undefined variables, wrong imports, broken template literals)
- Broken HTML (unclosed tags, mismatched quotes in class strings)
- Broken JS (template literal escaping issues in onclick handlers)
- TypeScript errors (wrong types, missing exports)

If no issues: reply exactly "no issues found"
If issues found: list each with file:line and severity (P0=crash, P1=wrong behavior, P2=quality)
Fix any P0/P1 issues directly, commit with "fix: fresh-eyes corrections"
