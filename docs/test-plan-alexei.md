# Europe TTP — Test Plan

## Setup

1. Open terminal, get the code and start:

```
cd C:\work\europe-ttp
git fetch origin
git checkout main
git pull origin main
docker compose up --build
```

2. Wait until you see **"Ready"** in the terminal.

---

## Test 1. Login

1. Open http://localhost:8009/login
2. Email: `akshay.ponda@artofliving.org`
3. Password: `DevPass123`
4. Click **Login**
5. You should be redirected to the Reports List page

- [ ] Login works, Reports List page is shown

---

## Test 2. Admin Pages

After logging in, open each link and check that the page loads without errors:

- [ ] http://localhost:8009/api/admin/reports_list — list of report links
- [ ] http://localhost:8009/api/admin/ttc_applicants_summary — table with applicant data
- [ ] http://localhost:8009/api/admin/ttc_applicants_reports — reports table
- [ ] http://localhost:8009/api/admin/ttc_applicants_integrity — integrity report
- [ ] http://localhost:8009/api/admin/settings — settings page with "Whitelisted Users"
- [ ] http://localhost:8009/api/admin/post_ttc_course_feedback — post-TTC feedback report
- [ ] http://localhost:8009/api/admin/post_sahaj_ttc_course_feedback — post-Sahaj feedback report

---

## Test 3. Forms

Open each form and check that it loads with input fields and a Submit button:

- [ ] http://localhost:8009/api/forms/ttc_application_us — US application form
- [ ] http://localhost:8009/api/forms/ttc_application_non_us — Non-US application form
- [ ] http://localhost:8009/api/forms/ttc_evaluation — evaluation form

---

## Test 4. Data Flow (the key test)

This verifies that submitted data actually reaches the admin reports.

**Step A — Submit a form:**

1. Open http://localhost:8009/api/forms/ttc_application_us
2. Fill in First Name: `Test`, Last Name: `User`
3. Fill the remaining required fields with any values
4. Click **Submit**
5. You should see a green success message

- [ ] Form submitted successfully

**Step B — Check the admin summary:**

1. Open http://localhost:8009/api/admin/ttc_applicants_summary
2. Look for the entry with name **Test User**

- [ ] Submitted data appears in the admin summary table

---

## Test 5. Settings

1. Open http://localhost:8009/api/admin/settings
2. Click **New** to add a whitelisted user
3. Enter any name and email
4. Click **Save**
5. Refresh the page

- [ ] Saved user is still there after refresh
