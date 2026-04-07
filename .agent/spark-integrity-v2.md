Add modern Tailwind layout to the TTC Applicants Integrity admin page.

READ THESE FILES IN FULL:
1. app/admin/ttc_applicants_integrity/render.ts — current implementation (258 lines)
2. admin/ttc_applicants_integrity.html — legacy reference
3. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

THE PAGE CURRENTLY WORKS but looks raw/unstyled. Add Tailwind classes to the HTML strings for modern appearance:

1. Add a page wrapper div with class="max-w-7xl mx-auto p-6 space-y-6"
2. Style the page title with class="text-2xl font-light text-gray-800"
3. Style the subtitle/description with class="text-sm text-gray-500"
4. Wrap the filter controls (Select TTC dropdown, radio buttons) in a card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
5. Wrap the DataTable container in a card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto"
6. Replace any remaining inline style="..." with Tailwind classes (bg-white, border-r, etc.)
7. Style buttons with class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"

KEEP all jQuery/DataTables/Select2 CDN scripts and JS functions working.
KEEP dynamic colors as inline style where values come from JS.

After changes: git add the modified files and commit with message "feat: add Tailwind layout to integrity page"
