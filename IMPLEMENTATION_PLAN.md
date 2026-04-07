# TTP Tailwind Migration — Implementation Plan

## Context
Migrate admin pages from raw inline-styled HTML to Tailwind-styled HTML. Each render.ts returns an HTML string served via API routes. Tailwind CDN is loaded via wrapAdminShell.

Legacy HTML files in `admin/` are the spec. Working examples: `app/portal/home/render.ts`, `app/portal/tabs/render.ts`.

## Execution Order
Process tasks in priority order. Each page is independent after Task 1.

## Tasks

| task_key | name | priority | status | refs |
|----------|------|----------|--------|------|
| TASK-001 | tailwind-summary-page | P0 | TODO | admin/ttc_applicants_summary.html, app/admin/ttc_applicants_summary/render.ts, app/admin/shared/admin-shell.ts |
