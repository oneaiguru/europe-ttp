Add modern Tailwind layout to the Admin Reports List page.

READ THESE FILES IN FULL:
1. app/admin/reports_list/render.ts — current implementation
2. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

This is a navigation page with links to different reports. Style it:
1. Page wrapper: class="max-w-4xl mx-auto p-6 space-y-6"
2. Title: class="text-2xl font-light text-gray-800 mb-6"
3. Each link in a card-like row: class="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
4. Link text: class="text-blue-600 hover:text-blue-800 font-medium"

After changes: git add and commit with "feat: add Tailwind layout to reports list page"
