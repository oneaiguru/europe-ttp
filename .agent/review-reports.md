Review the reports admin page Tailwind migration.

READ IN FULL:
- app/admin/reports/render.ts (or app/admin/ttc_applicants_reports/render.ts if that exists)
- The route.ts that serves this page

CHECK:
1. Has Tailwind wrapper classes (max-w-*, p-*, space-y-*)?
2. Has card containers (rounded-xl, border, shadow-sm)?
3. Any remaining inline style="..." that should be Tailwind?
4. Any broken template literals or unclosed tags?
5. TypeScript compiles?

If bugs found: fix them and commit with "fix: review correction for reports"
If all correct: reply exactly "all clean"
