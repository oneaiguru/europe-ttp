Add modern Tailwind layout to the TTC Applicants Summary admin page.

READ THESE FILES IN FULL:
1. app/admin/ttc_applicants_summary/render.ts — current implementation (325 lines)
2. admin/ttc_applicants_summary.html — legacy reference
3. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

THE PAGE CURRENTLY WORKS but looks raw/unstyled. Inline styles were already replaced with Tailwind classes. Now add layout structure:

1. Add a page wrapper div with class="max-w-7xl mx-auto p-6 space-y-6"
2. Style the page title (Admin/h1) with class="text-2xl font-light text-gray-800"
3. Style the subtitle with class="text-sm text-gray-500 mb-4"
4. Wrap the filter controls section (Select TTC, lifetime evals toggle, report dropdown, view mode) in a card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
5. Wrap the DataTable in a card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto"
6. Style the footer summary area with class="text-sm text-gray-600 mt-4"

KEEP all jQuery/DataTables/Select2 CDN scripts and JS functions working.

After changes: git add the modified files and commit with message "feat: add Tailwind layout to summary page"
