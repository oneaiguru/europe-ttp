# Research: tailwind-summary-page

## Findings (file:line ranges or doc:section references)
- app/admin/ttc_applicants_summary/render.ts:46-334 — No `style="..."` attributes remain in the embedded HTML template or script output.
- app/admin/ttc_applicants_summary/render.ts:39-44 — Shared CSS for details control/table/button behavior is still injected through `DETAILS_CONTROL_CSS`, `DATATABLE_CSS`, and `BUTTON_CSS`.
- app/admin/ttc_applicants_summary/render.ts:266-273 — Detail-row table markup already uses utility classes such as `bg-white`, `leading-[5px]`, and `mt-[13px] mb-[7px]` (including no inline styles).
- app/admin/ttc_applicants_summary/render.ts:285-333 — Page section layout uses utility classes (e.g., `site-container`, `smallertext`, `mt-[35px]`, `w-full`) rather than inline style.
- app/api/admin/ttc_applicants_summary/route.ts:2 — route imports `renderAdminDashboard` from `../../../admin/ttc_applicants_summary/render`.
- app/api/admin/ttc_applicants_summary/route.ts:18-21 — route wraps `bodyHtml` in `wrapAdminShell(...)` and returns `new Response(page, { content-type: 'text/html' })`.
- admin/ttc_applicants_summary.html (legacy spec): numerous inline `style` attributes in the original implementation, e.g. cell/details spacing and footer alignment, now handled via classes in render implementation.

## Evidence Map

Every claim in this research must cite a source.

| claim | source | verified |
|-------|--------|----------|
| Current `render.ts` has no inline `style` attributes | app/admin/ttc_applicants_summary/render.ts:46-334 | yes |
| Shared CSS helpers are used in `render.ts` instead of inlined table/controls styles | app/admin/ttc_applicants_summary/render.ts:39-44 | yes |
| Route imports `renderAdminDashboard` correctly | app/api/admin/ttc_applicants_summary/route.ts:2 | yes |
| Route returns HTML response wrapped by shell | app/api/admin/ttc_applicants_summary/route.ts:18-24 | yes |
| Legacy spec contains inline style values that were previously used for layout | admin/ttc_applicants_summary.html:1-330 | yes |

## Constraint Inventory

- **AGENTS.md:Stack**: admin pages remain `render.ts` -> HTML-string flow with Tailwind CDN and shared shell. Keep CDN scripts intact; do not convert to JSX components.
- **AGENTS.md:Do NOT**: do not remove DataTables/Select2 CDN scripts.
- **Task**: Required Reading includes legacy HTML, current render, shell, and portal example (`docs/Tasks/tailwind-summary-page.task.md:5-9`).
- **Task Goal**: replace inline styles and modernize while preserving functionality (`docs/Tasks/tailwind-summary-page.task.md:3-4`).

## Inline Style Conversion Inventory

- No inline `style="..."` attributes were found in `app/admin/ttc_applicants_summary/render.ts`; therefore no direct `style -> class` replacement rows are available for this task at present.
- Dynamic color formatting remains in JS via classes/functions (`getStatusClass`) and is already Tailwind-compatible without inline runtime styles.

## Drift Guards

- [x] `app/admin/ttc_applicants_summary/render.ts` exists and exposes `renderAdminDashboard`.
- [x] `app/api/admin/ttc_applicants_summary/route.ts` imports and executes `renderAdminDashboard` and returns an HTML response.
- [x] No inline `style` attribute exists in `app/admin/ttc_applicants_summary/render.ts` (static scan).
- [ ] Context pack path `docs/context-packs/packs/core.md` is not present in this repository; task did not provide alternative context content.

## Context Pack

Pack(s) loaded: core (requested path `docs/context-packs/packs/core.md` was not found in workspace)
Token estimate for this research artifact: ~300 tokens
