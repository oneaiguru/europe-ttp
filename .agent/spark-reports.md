Add modern Tailwind layout to the TTC Applicants Reports admin page (the largest page).

READ THESE FILES IN FULL:
1. app/admin/ttc_applicants_reports/render.ts — current implementation (640 lines)
2. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

Add Tailwind classes to HTML strings:
1. Page wrapper: class="max-w-7xl mx-auto p-6 space-y-6"
2. Title: class="text-2xl font-light text-gray-800"
3. Filter controls in card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
4. DataTable in card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto"
5. Replace inline style="..." with Tailwind classes
6. Keep dynamic JS colors as inline style

KEEP all jQuery/DataTables/Select2/slider functionality working.
After changes: git add and commit with "feat: add Tailwind layout to reports page"
