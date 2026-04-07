Task 1 Research — Permissions Page

Scope
- Files reviewed (full):
  - app/admin/permissions/render.ts
  - app/api/admin/permissions/route.ts
  - app/admin/shared/admin-shell.ts
  - components/ui/card.tsx
  - lib/utils.ts

What exists now
- Unauthorized renderer is a string builder with inline styles.
  - app/admin/permissions/render.ts:1 exports ADMIN_UNAUTHORIZED_HTML = UN-AUTHORIZED.
  - app/admin/permissions/render.ts:3 exports renderAdminUnauthorized().
  - app/admin/permissions/render.ts:4-7 returns a div and p wrapper using style attributes for typography and spacing.

- Permissions route currently wraps output in a local page string, not shell.
  - app/api/admin/permissions/route.ts:1 imports renderAdminUnauthorized.
  - app/api/admin/permissions/route.ts:3-9 sets html = renderAdminUnauthorized() and wraps in a local document template with only charset/title/body.
  - app/api/admin/permissions/route.ts:10-12 returns Response(page, { headers: { content-type: text/html } }).
  - No use of wrapAdminShell in this file.

- Shared admin shell exists and should be used for admin pages.
  - app/admin/shared/admin-shell.ts:25-30 defines AdminShellOptions.
  - app/admin/shared/admin-shell.ts:36-51 defines wrapAdminShell(options) to build full HTML.
  - app/admin/shared/admin-shell.ts:42 injects ADMIN_CDN_CSS in head.
  - app/admin/shared/admin-shell.ts:43 injects ADMIN_BASE_CSS in head.
  - app/admin/shared/admin-shell.ts:47 injects ADMIN_CDN_JS before body content.
  - app/admin/shared/admin-shell.ts:49 injects options.bodyHtml in body.

- Card style conventions available for migration target.
  - components/ui/card.tsx:11 sets root classes: rounded-xl border border-border bg-card text-card-foreground shadow.
  - components/ui/card.tsx:25 sets header layout classes.
  - components/ui/card.tsx:37 sets title text classes.
  - components/ui/card.tsx:49 sets description text classes.
  - components/ui/card.tsx:59 sets content classes.
  - components/ui/card.tsx:69 sets footer classes.

- Utility for class merging exists.
  - lib/utils.ts:4-5 exports cn(...) using clsx and twMerge.

What needs to change
1) Replace inline style usage in renderAdminUnauthorized() with Tailwind class-based markup.
   - Current styling evidence is only in app/admin/permissions/render.ts:4-6.
2) Wrap the route output with wrapAdminShell rather than the local page template.
   - Current template usage is app/api/admin/permissions/route.ts:5-9.
3) Keep function signatures and route response contracts unchanged.
   - renderAdminUnauthorized signature at app/admin/permissions/render.ts:3.
   - GET signature and Response contract at app/api/admin/permissions/route.ts:3-12.
