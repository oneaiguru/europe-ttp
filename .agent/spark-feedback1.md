Add Tailwind layout to the Post-TTC Course Feedback Summary admin page.

READ THESE FILES IN FULL:
1. app/admin/post_ttc_course_feedback/render.ts — current implementation
2. admin/post_ttc_course_feedback_summary.html — legacy reference (451 lines)
3. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

DO:
- Replace all inline style="..." attributes with Tailwind utility classes
- Add page wrapper: class="max-w-7xl mx-auto p-6"
- Wrap content in card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6"
- Style title with: class="text-2xl font-light mb-2"
- Keep ALL jQuery/DataTables functionality working
- Keep dynamic colors as inline style

Commit: feat: add Tailwind layout to post-ttc feedback page
