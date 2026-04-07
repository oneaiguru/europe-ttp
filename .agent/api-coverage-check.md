# Task: API Coverage Check — Python vs Next.js

## Goal
Compare ALL routes/endpoints in the old Python app against ALL routes in the new Next.js app. Produce a coverage report showing which Python endpoints have a Next.js equivalent and which are missing.

## Read These Files First
1. `/Users/m/ttp-split-experiment/admin.py` — Python admin routes (Flask/webapp2 handlers)
2. `/Users/m/ttp-split-experiment/reporting/user_summary.py` — Python reporting routes
3. `/Users/m/ttp-split-experiment/reporting/user_report.py` — Python report routes
4. `/Users/m/ttp-split-experiment/reporting/user_integrity.py` — Python integrity routes
5. `/Users/m/ttp-split-experiment/reporting/print_form.py` — Python print routes

Also scan for any other Python files with route definitions:
- Look for `webapp2.Route`, `app.route`, `@app.route`, `class.*Handler`, `WSGIApplication` patterns

## Then Check Next.js Routes
List all files matching: `app/**/route.ts`

## Output
Write a coverage report to `/Users/m/ttp-split-experiment/.agent/api-coverage-report.md` with this format:

```
# API Coverage Report — Python → Next.js

## Summary
- Total Python endpoints: N
- Covered in Next.js: N
- Missing from Next.js: N

## Covered Endpoints
| Python Route | Python Handler | Next.js Route File |
|---|---|---|

## Missing Endpoints  
| Python Route | Python Handler | Purpose |
|---|---|---|

## Next.js Only (no Python equivalent)
| Next.js Route | Purpose |
|---|---|
```

Also scan the HTML templates in `/Users/m/ttp-split-experiment/admin/` and `/Users/m/ttp-split-experiment/javascript/` for any pages that might have routes not in the Python files.

## Constraints
- Only report actual route handlers, not utility functions
- Include both page-serving routes (GET that returns HTML) and API routes (GET/POST that returns JSON)
- Do NOT modify any files — this is a read-only audit
