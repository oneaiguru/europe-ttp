Add Tailwind layout to portal pages.

READ FIRST:
1. app/portal/home/render.ts — home page
2. app/portal/tabs/render.ts — tabs page
3. app/portal/disabled/render.ts — disabled page
4. app/admin/shared/admin-shell.ts — for Tailwind CDN pattern

For each portal page:
1. Add wrapper: class="max-w-4xl mx-auto p-6"
2. Style headings with Tailwind typography classes
3. Add card wrappers where appropriate
4. Replace any inline style="..." with Tailwind classes

KEEP all existing functionality.

After changes: git add and commit with "feat: add Tailwind layout to portal pages"
