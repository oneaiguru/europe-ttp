You are doing a visual UAT check on the TTC Applicants Summary page.

The dev server is running at http://localhost:8009

STEPS:
1. Navigate to http://localhost:8009/api/admin/ttc_applicants_summary
2. Take a screenshot and save to /Users/m/ttp-split-experiment/.agent/screenshots/summary-after.png
3. Check that:
   - The page loads without errors
   - A table structure is visible
   - Tailwind classes are being applied (look for rounded corners, proper spacing, card-like layout)
   - DataTables/Select2 CDN scripts are loading (check for DataTable initialization)
4. Navigate to http://localhost:8009 (landing page)
5. Take a screenshot and save to /Users/m/ttp-split-experiment/.agent/screenshots/landing.png
6. Report: what you see, any visual issues, whether Tailwind is working

Create the screenshots directory if it doesn't exist.
