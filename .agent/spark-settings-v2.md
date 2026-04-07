Add modern Tailwind layout to the Admin Settings page.

READ THESE FILES IN FULL:
1. app/admin/settings/render.ts — current implementation (312 lines)
2. admin/admin_settings.html — legacy reference (560 lines)
3. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

THE PAGE CURRENTLY WORKS but looks raw/unstyled. Add Tailwind classes to the HTML strings for modern appearance:

1. Add a page wrapper div with class="max-w-7xl mx-auto p-6 space-y-6"
2. Style the page title with class="text-2xl font-light text-gray-800"
3. Wrap each form section in a card: class="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
4. Style form labels with class="text-sm font-medium text-gray-700"
5. Style text inputs with class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
6. Style buttons with class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
7. Replace any inline style="..." with Tailwind classes
8. Add proper spacing between form groups: class="space-y-4"

KEEP all jQuery/typeahead/AJAX functionality working.

After changes: git add the modified files and commit with message "feat: add Tailwind layout to settings page"
