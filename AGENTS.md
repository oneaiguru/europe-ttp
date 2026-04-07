# AGENTS.md — Europe TTP

## Dev Server
- Port: 8009 (fixed — do NOT use 3000/3001/3002, those are pipeline services)
- Start: `PORT=8009 npm run dev`
- Check if running: `lsof -ti:8009`
- Do NOT start a new server if one is already running
- Base URL: http://localhost:8009

## Key Pages (for visual verification)
- Landing: http://localhost:8009
- Summary: http://localhost:8009/api/admin/ttc_applicants_summary
- Permissions: http://localhost:8009/api/admin/permissions
- Reports list: http://localhost:8009/api/admin/reports_list

## Verification Commands
- Typecheck: `npx tsc --noEmit`
- Visual: Open the page in Playwright and verify it renders content (not blank)

## Stack
- Next.js 16, React 19, Node 20.20.0
- Tailwind CSS + shadcn/ui components in components/ui/
- render.ts files return HTML strings served via `new Response(html)`
- jQuery DataTables + Select2 via CDN (keep these, do not replace)

## Do NOT
- Start additional dev servers
- Modify files outside your task scope
- Remove jQuery/DataTables/Select2 CDN scripts
- Convert render.ts to React/JSX components (keep HTML string pattern)
