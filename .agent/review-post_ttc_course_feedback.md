Review the post_ttc_course_feedback admin page Tailwind migration.

READ IN FULL:
- app/admin/post_ttc_course_feedback/render.ts (or app/admin/ttc_applicants_post_ttc_course_feedback/render.ts if that exists)
- The route.ts that serves this page

CHECK:
1. Has Tailwind wrapper classes (max-w-*, p-*, space-y-*)?
2. Has card containers (rounded-xl, border, shadow-sm)?
3. Any remaining inline style="..." that should be Tailwind?
4. Any broken template literals or unclosed tags?
5. TypeScript compiles?

If bugs found: fix them and commit with "fix: review correction for post_ttc_course_feedback"
If all correct: reply exactly "all clean"
