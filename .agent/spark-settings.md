Add Tailwind layout to the Admin Settings page.

READ THESE FILES IN FULL:
1. app/admin/settings/render.ts — current implementation
2. admin/admin_settings.html — legacy reference (560 lines)
3. app/admin/shared/admin-shell.ts — shell with Tailwind CDN

DO:
- Replace all inline style="..." attributes with Tailwind utility classes
- Add page wrapper: class="max-w-7xl mx-auto p-6"
- Wrap form sections in: class="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6"
- Style title with: class="text-2xl font-light mb-2"
- Style form inputs with Tailwind classes
- Keep ALL jQuery/typeahead/AJAX functionality working

Commit: feat: add Tailwind layout to settings page
