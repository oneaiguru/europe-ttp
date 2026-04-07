Findings:
1) app/admin/ttc_applicants_reports/render.ts
- Line 464: Inline style attribute is still used for status color (`style="background-color:white;color:..."`) instead of Tailwind classes.
- Line 498: Inline style attribute is still used for status color (`style="background-color:white;color:..."`) instead of Tailwind classes.

2) app/admin/post_ttc_course_feedback/render.ts
- Line 229: Inline style attribute is used for status color (`style="color:..."`).
- Line 265: Inline style attribute is used for status color (`style="color:..."`).
- Line 275: Inline style attribute is used for status color (`style="color:..."`).
- Line 293: Top-level page wrapper is missing an explicit `space-y-*` utility for vertical spacing.

3) app/admin/post_sahaj_ttc_course_feedback/render.ts
- Line 222: Inline style attribute is used for status color (`style="color:..."`).
- Line 245: Inline style attribute is used for status color (`style="color:..."`).
- Line 266: Inline style attribute is used for status color (`style="color:..."`).

4) app/admin/reports_list/render.ts
- Line 18: Card links have only `hover:shadow-sm`; requirement asks for card containers with shadows.
- Line 23: Page container lacks a card-style wrapper (`rounded-xl border ... shadow-sm`) around the page content.
