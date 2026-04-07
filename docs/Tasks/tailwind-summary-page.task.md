# Task: tailwind-summary-page

## Goal
Add Tailwind layout structure to the TTC Applicants Summary admin page. Wrap content in a card container with proper header, spacing, and typography. Style the filter controls (Select2 dropdown, radio buttons, view mode toggle) with Tailwind classes. Keep all DataTables/Select2/jQuery functionality working.

## Required Reading
- `admin/ttc_applicants_summary.html` — legacy visual spec (486 lines)
- `app/admin/ttc_applicants_summary/render.ts` — current implementation (325 lines)
- `app/admin/shared/admin-shell.ts` — HTML shell with Tailwind CDN
- `app/portal/home/render.ts` — example of Tailwind-styled render function

## Acceptance
- Page at http://localhost:8009/api/admin/ttc_applicants_summary renders with visible Tailwind styling (cards, spacing, typography)
- DataTables table initializes and shows column headers
- Select2 TTC dropdown works
- Radio buttons for lifetime evaluations and view mode work
- No JavaScript errors in console

## Constraints
- Keep render.ts as HTML string builder
- Keep all jQuery/DataTables/Select2 CDN scripts
- Keep all existing JavaScript functions (format, view_form, etc.)
- Dynamic colors via getStatusColor() stay as inline style (runtime values)
