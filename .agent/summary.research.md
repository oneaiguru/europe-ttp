# Task 2 Research Report

## Role
R (Research) for Task 2: TTC Applicants Summary Page (`slug=summary`).

## Files read (full)
- `/Users/m/ttp-split-experiment/app/admin/ttc_applicants_summary/render.ts`
- `/Users/m/ttp-split-experiment/admin/ttc_applicants_summary.html`
- `/Users/m/ttp-split-experiment/app/api/admin/ttc_applicants_summary/route.ts`
- `/Users/m/ttp-split-experiment/app/admin/shared/admin-shell.ts`
- `/Users/m/ttp-split-experiment/components/ui/table.tsx`
- `/Users/m/ttp-split-experiment/components/ui/badge.tsx`

## What exists now

### Page is already wrapped via `wrapAdminShell()` in route
- The route imports `wrapAdminShell` and passes route output to it, setting `title` + `bodyHtml`. `renderAdminDashboard` output is inserted as body content. 
  - `app/api/admin/ttc_applicants_summary/route.ts:1-2,14-21`

### `renderAdminDashboard` currently builds page styles, script, then inline-style-heavy HTML
- `render.ts` defines `pageStyles` with helper CSS and returns a template containing inline style attributes inside both the body markup and string-built detail rows.
  - `app/admin/ttc_applicants_summary/render.ts:29-34,275-324`

### Rendering still relies on script-driven inline style behavior outside attribute styles
- DataTables styling helpers are inserted via constants; row statuses are still set by JS `.css('color', ...)` calls.
  - `app/admin/ttc_applicants_summary/render.ts:31-34,158-160`

### Legacy HTML shows previous wrapper structure and class conventions
- Legacy file retains old `site-container` wrappers, header/radio/table layout, and inline style fallbacks; route still uses a simplified injected TTC select stub.
  - `admin/ttc_applicants_summary.html:412-486`
  - `app/api/admin/ttc_applicants_summary/route.ts:6-12`

### Shared shell / style baseline
- Shell provides CDN scripts/CSS for DataTables + Select2 and base admin CSS (`body`, `.site-container`, `.smallertext`, `.form-header-block`).
  - `app/admin/shared/admin-shell.ts:4-23`

### UI pattern references
- `table.tsx` provides shadcn-like table utility class conventions (`border-b`, `text-muted-foreground`, `bg-muted/50`, `text-sm`, etc.).
  - `components/ui/table.tsx:11,24,36,49,79,93`
- `badge.tsx` provides shared badge utility pattern and class foundations (`inline-flex`, `rounded-full`, border/background variants).
  - `components/ui/badge.tsx:5-7,10-16`

## What needs to change (Task objective mapping)

### Scope likely required by this task
- Replace inline style attributes in the 325-line render function (the Task statement explicitly calls this out).
  - `app/admin/ttc_applicants_summary/render.ts:1-325`
- Keep DataTables/Select2/jQuery CDN usage unchanged (shell already supplies CDN assets; helper CSS remains in page style).
  - `app/admin/shared/admin-shell.ts:6-13`, `app/admin/ttc_applicants_summary/render.ts:29-34`

### Inline style inventory in `render.ts` (must convert)
- Form header alignment
  - `app/admin/ttc_applicants_summary/render.ts:277`
- Subheader margin-top
  - `app/admin/ttc_applicants_summary/render.ts:279`
- Lifetime radio section spacing
  - `app/admin/ttc_applicants_summary/render.ts:286,289`
- Main table `style="width:100%"`
  - `app/admin/ttc_applicants_summary/render.ts:297`
- Header font declaration and uppercase styles
  - `app/admin/ttc_applicants_summary/render.ts:298`
- Footer text alignment + font-weight styling on status summary
  - `app/admin/ttc_applicants_summary/render.ts:317`
- Detail row cells background/border/color in unmapped section
  - `app/admin/ttc_applicants_summary/render.ts:208-221`
- Separator spacer row line-height/background
  - `app/admin/ttc_applicants_summary/render.ts:224`
- Lifetime TTC/date cell background/border in mapped section
  - `app/admin/ttc_applicants_summary/render.ts:237-238`
- Detail row mapped-cell background/border/color for evaluator/email/status and View button wrapper
  - `app/admin/ttc_applicants_summary/render.ts:241-249`
- Detail wrapper table styles (`cellpadding`, `cellspacing`, `border`, `background-color`) and nested margins in action container
  - `app/admin/ttc_applicants_summary/render.ts:256-263`

### Additional candidate style cleanup outside render function (not in requested render-only scope)
- `DEFAULT_TTC_LIST_HTML` uses inline styles for label/select container and select width/margins.
  - `app/api/admin/ttc_applicants_summary/route.ts:7-10`
- If interpreted as part of full page styling parity, this inline styling would need migration too; currently not in `render.ts`.

### Parity notes with legacy reference
- Legacy page has additional wrapper structure (`site-inner-container`, `form-tab-content`) and label classes (`label_input`) that can be used as migration references if needed.
  - `admin/ttc_applicants_summary.html:429-447,440-446`
- Legacy `View` action links include `javascript:` prefix in onclick; modernized `render.ts` already avoids that prefix and uses plain calls, so no additional `View` migration needed at action-level behavior.
  - `admin/ttc_applicants_summary.html:336-337,385-386` vs `app/admin/ttc_applicants_summary/render.ts:214,248,259-263`

### Risk/reality checks before implementation
- `render.ts` includes behavior-critical inline status color logic via `getStatusColor` in JS callbacks and detail rows; this should be preserved even if styles become Tailwind classes.
  - `app/admin/ttc_applicants_summary/render.ts:42-43,158-160,247`
- Existing table/row behavior is still DataTables-driven (export buttons, row details handler helper, scroll/colReorder/footer callbacks) and should remain unchanged unless CSS class changes are needed for equivalent layout.
  - `app/admin/ttc_applicants_summary/render.ts:148-149,175,142-173`
