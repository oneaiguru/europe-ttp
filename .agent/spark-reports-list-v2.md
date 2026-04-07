Fix the Admin Reports List page — it currently shows plain unstyled links.

READ: app/admin/reports_list/render.ts

The page should look like a modern navigation menu. Rewrite the HTML output to use:
- Page wrapper: <div class="max-w-2xl mx-auto p-8">
- Title: <h1 class="text-3xl font-light text-gray-800 mb-8">Admin</h1>
- Each link as a card row: <a href="..." class="block rounded-lg border border-gray-200 bg-white p-4 mb-3 hover:shadow-md transition-shadow text-blue-600 hover:text-blue-800 font-medium text-lg">

The links should be: TTC Report, TTC Integrity Report, Post TTC Report, Post Sahaj TTC Report, Admin Settings.

Make sure each link points to the correct /api/admin/... route.
KEEP the function signature and exports unchanged.

After changes: git add and commit with "fix: restyle reports list as card navigation"
