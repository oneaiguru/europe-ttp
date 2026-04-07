Add Tailwind layout to the TTC Applicants Integrity admin page.

READ THESE FILES IN FULL:
1. app/admin/ttc_applicants_integrity/render.ts — current implementation
2. admin/ttc_applicants_integrity.html — legacy reference
3. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

DO:
- Replace all inline style="..." attributes with Tailwind utility classes
- Add page wrapper: class="max-w-7xl mx-auto p-6"
- Wrap filter controls in: class="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6"
- Wrap table area in: class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto"
- Style title with: class="text-2xl font-light mb-2"
- Keep ALL jQuery/DataTables/Select2 functionality working
- Keep dynamic JS colors as inline style

Commit: feat: add Tailwind layout to integrity page
