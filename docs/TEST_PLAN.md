# Europe TTP - Test Plan

## What Is This?

This is the **new TypeScript/Next.js version** of the Europe TTP (Teacher Training Program) admin portal and application system. It replaces the old Python 2.7 application with a modern stack while keeping the same functionality and page structure.

## Your Goal

Go through every page listed below and verify:
1. The page loads without errors
2. The layout looks clean and professional (Tailwind CSS styling)
3. Admin pages show sample data in tables (this is mock data for testing — real data comes from the backend)
4. Form pages show all fields with proper labels, inputs, and a Submit button
5. Check each box as you verify it

## Setup

**On Windows (C:\work):**

1. Get the code — choose ONE option:

   **Option A — Fresh clone:**
   ```
   cd C:\work
   git clone https://github.com/oneaiguru/europe-ttp.git
   cd europe-ttp
   git checkout experiment/trpi-split
   ```

   **Option B — If you already have the repo:**
   ```
   cd C:\work\europe-ttp
   git fetch origin
   git checkout experiment/trpi-split
   git pull origin experiment/trpi-split
   ```

2. Start the application — choose ONE option:

   **Option A — With Docker (recommended):**
   ```
   docker compose up
   ```

   **Option B — Without Docker (requires Node.js 20):**
   ```
   npm install
   set PORT=8009
   npm run dev
   ```

3. Open your browser to: **http://localhost:8009**

## Landing Page

**URL:** http://localhost:8009

- [ ] Page loads with "Europe TTP" title
- [ ] "Admin Pages" section shows 8 cards in a 3-column grid
- [ ] "Form Pages" section shows 11 cards in a 3-column grid
- [ ] Each card shows the page name and URL path
- [ ] Clicking any card navigates to the correct page

---

## Admin Pages

### 1. TTC Applicants Summary

**URL:** http://localhost:8009/api/admin/ttc_applicants_summary

- [ ] Page title shows "Admin"
- [ ] "Select TTC" dropdown shows "Default TTC" (pre-selected)
- [ ] "Show lifetime evaluations?" radio buttons appear (Yes/No)
- [ ] DataTable loads with **5 applicant rows**
- [ ] Columns visible: Name, Status, Evals Status, Evals, Evals (Lifetime), Email, Cell Phone, Home Phone, City, State, Last Updated
- [ ] Status values are color-coded (green = complete, blue = submitted, orange = pending, amber = in progress)
- [ ] Export buttons appear: Copy, Excel, Print
- [ ] Footer shows "Total Complete Applications: 2, Total Submitted Applications: 1"
- [ ] Click the arrow (v) on any row to expand evaluation details

**Mock data:** Yes (5 sample applicants)

### 2. TTC Integrity Report

**URL:** http://localhost:8009/api/admin/ttc_applicants_integrity

- [ ] Page title shows "Admin: TTC Integrity Report"
- [ ] "Select TTC" dropdown shows "Default TTC"
- [ ] DataTable loads with **2 rows** (Maria Garcia, Peter Schmidt)
- [ ] Columns: Name, Email, Last Updated (EST), Enrolled Matches, Org Courses Matches
- [ ] Match counts show as "1 / 3" format (matches / total)
- [ ] Search row appears below headers
- [ ] Export buttons: Copy, Excel, Print

**Mock data:** Yes (2 applicants with cross-matches)

### 3. TTC Report

**URL:** http://localhost:8009/api/admin/ttc_applicants_reports

- [ ] Page title shows "Admin: TTC Report"
- [ ] Controls: Select TTC, Lifetime evaluations toggle, Report dropdown, View Mode (Compact/Expanded)
- [ ] DataTable loads with **3 rows**
- [ ] Table has 31 columns - scroll horizontally to see all
- [ ] Status values are color-coded
- [ ] Compact mode: cells show [+] to expand long content
- [ ] Expanded mode: full content visible
- [ ] Footer shows "Total Submitted Applications: 2"

**Mock data:** Yes (3 applicants with reporting data)

### 4. Admin Settings

**URL:** http://localhost:8009/api/admin/settings

- [ ] Page title shows "Admin Settings"
- [ ] "Whitelisted Users (2 added)" section appears
- [ ] Dropdown shows "2 added"
- [ ] Green message: "Your settings have been retrieved"
- [ ] "+ New" button (blue) and "- Remove" button (blue) visible
- [ ] "Save" button at bottom of page
- [ ] Clicking Save shows "Your data has been saved"

**Mock data:** Yes (2 whitelisted users)

### 5. Permissions

**URL:** http://localhost:8009/api/admin/permissions

- [ ] Shows "UN-AUTHORIZED" message in red
- [ ] Message: "You do not have permission to access this page."
- [ ] This is expected behavior (no authentication system in place)

**Mock data:** N/A (intentionally shows unauthorized)

### 6. Reports List

**URL:** http://localhost:8009/api/admin/reports_list

- [ ] Page title shows "Admin"
- [ ] List of 5 links: TTC Report, TTC Integrity Report, Post TTC Report, Post Sahaj TTC Report, Admin Settings
- [ ] Each link navigates to the correct page

**Mock data:** N/A (navigation page)

### 7. Post TTC Report

**URL:** http://localhost:8009/api/admin/post_ttc_course_feedback

- [ ] DataTable loads with **2 rows** (Maria Garcia, Peter Schmidt)
- [ ] Columns: Name, Status, Evaluations, TTC Dates, TTC Location, Email, Cell Phone, Home Phone
- [ ] Status values are color-coded
- [ ] Export buttons: Copy, Excel, Print

**Mock data:** Yes (2 entries with TTC dates/locations)

### 8. Post Sahaj TTC Report

**URL:** http://localhost:8009/api/admin/post_sahaj_ttc_course_feedback

- [ ] DataTable loads with **1 row** (James Wilson)
- [ ] Columns: Name, Status, Evaluations, TTC Dates, TTC Location, Email, Cell Phone, Home Phone
- [ ] Status shows "complete" in green

**Mock data:** Yes (1 entry)

---

## Form Pages

All form pages share the same layout: centered card with rounded corners, form fields with labels, and a blue "Submit" button. Required fields are marked with a red asterisk (*).

### 9. TTC Application (US)

**URL:** http://localhost:8009/api/forms/ttc_application_us

- [ ] Title: "TTC Application"
- [ ] Fields: First Name*, Last Name*, Email*, Country, Happiness Program Completed (Yes/No), AMP Completed, VTP Completed, Part 1 Course Date, Part 2 Silence Date, DSN Completed, Number of Evaluators, Evaluator 1 Email, Evaluator 2 Email
- [ ] Date inputs show date picker
- [ ] Submit button is blue

### 10. TTC Application (Non-US)

**URL:** http://localhost:8009/api/forms/ttc_application_non_us

- [ ] Same fields and layout as US application

### 11. TTC Evaluation

**URL:** http://localhost:8009/api/forms/ttc_evaluation

- [ ] Title: "TTC Evaluation"
- [ ] Fields: Evaluator Name*, Volunteer Email*, Volunteer Name*, Evaluator Recommendation (dropdown), Readiness Level (dropdown), Teaching Experience (dropdown), Strengths (textarea), Areas for Improvement (textarea)

### 12. Applicant Profile

**URL:** http://localhost:8009/api/forms/ttc_applicant_profile

- [ ] Title: "TTC Applicant Profile"
- [ ] Fields: First Name*, Last Name*, Email*, Address, City, State, Zip, Phone, Gender (dropdown)

### 13. Evaluator Profile

**URL:** http://localhost:8009/api/forms/ttc_evaluator_profile

- [ ] Title: "TTC Evaluator Profile"
- [ ] Fields: First Name*, Last Name*, Email*, Organization

### 14. DSN Application

**URL:** http://localhost:8009/api/forms/dsn_application

- [ ] Title: "DSN Application"
- [ ] Fields: First Name*, Last Name*

### 15. Post-TTC Self Evaluation

**URL:** http://localhost:8009/api/forms/post_ttc_self_evaluation

- [ ] Title: "Post-TTC Self Evaluation"
- [ ] Fields: Course Start Date, Course Location, Co-Teacher Email, Teaching Hours, Courses Taught, Self Rating (dropdown)

### 16. Post-TTC Feedback

**URL:** http://localhost:8009/api/forms/post_ttc_feedback

- [ ] Title: "Post-TTC Feedback"
- [ ] Fields: Graduate Email*, Graduate Name*, Feedback Rating (dropdown), Recommend for Teaching (Yes/No), Comments (textarea)

### 17. Post-Sahaj Self Evaluation

**URL:** http://localhost:8009/api/forms/post_sahaj_ttc_self_evaluation

- [ ] Title: "Post-Sahaj TTC Self Evaluation"
- [ ] Same fields as Post-TTC Self Evaluation

### 18. Post-Sahaj Feedback

**URL:** http://localhost:8009/api/forms/post_sahaj_ttc_feedback

- [ ] Title: "Sahaj TTC Graduate feedback from Co-Teacher"
- [ ] Same fields as Post-TTC Feedback

### 19. Portal Settings

**URL:** http://localhost:8009/api/forms/ttc_portal_settings

- [ ] Title: "TTC Portal Settings"
- [ ] Fields: Home Country (dropdown)

---

## Notes

- **Mock data**: Admin pages 1-4, 7-8 display mock/sample data. In production, these pages fetch data from the backend API. The mock data demonstrates that the UI renders correctly with realistic data shapes.
- **Form submissions**: Form pages render correctly but Submit does not persist data (no backend). In production, forms POST to the backend API.
- **Permissions page**: Shows "UN-AUTHORIZED" by design when no authentication cookie is present.
- **Reports table**: The TTC Report page has 31 columns. Use horizontal scroll or switch to Compact mode for easier viewing.
