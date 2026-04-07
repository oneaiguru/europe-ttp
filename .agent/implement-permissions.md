ROLE: IMPLEMENT. Apply this plan exactly.

READ FIRST:
- app/admin/permissions/render.ts (current state)
- app/api/admin/permissions/route.ts (current state)
- app/admin/shared/admin-shell.ts (shell wrapper contract)

CHANGES TO MAKE:

1. In app/admin/permissions/render.ts, replace the return string in renderAdminUnauthorized() with Tailwind-styled card markup:
   - Use classes: min-h-screen, flex, items-center, justify-center, bg-background, text-foreground, p-6
   - Inner card: w-full, max-w-md, rounded-xl, border, border-border, bg-card, text-card-foreground, shadow
   - Content area: flex, flex-col, space-y-1.5, p-6
   - Keep ADMIN_UNAUTHORIZED_HTML in the title
   - Add descriptive paragraph with text-sm text-muted-foreground

2. In app/api/admin/permissions/route.ts:
   - Add import: import { wrapAdminShell } from '../../../admin/shared/admin-shell';
   - Replace manual HTML construction with wrapAdminShell({ title: 'Admin Permissions', bodyHtml: renderAdminUnauthorized() })
   - Set content-type header to 'text/html; charset=utf-8'

AFTER CHANGES:
- Run: npx tsc --noEmit
- Report result

Commit with: feat: convert permissions page to Tailwind card styling
