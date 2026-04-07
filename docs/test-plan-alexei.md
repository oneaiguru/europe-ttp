# Europe TTP — Test Plan v2 (Backend + Frontend)

## What Is This?

The TypeScript/Next.js version of the Europe TTP admin portal. This version has a **real working backend** — form data persists, reporting jobs generate real summaries, admin pages show actual data (not mock).

## Your Goal

Verify the full data flow works:
1. Pages load without errors
2. You can log in and submit form data
3. Admin pages show real data after running reporting jobs
4. Data persists between page reloads

## Setup

**On Windows (C:\work):**

### 1. Get the code

```bash
cd C:\work
git clone https://github.com/oneaiguru/europe-ttp.git
cd europe-ttp
git checkout main
```

### 2. Start with Docker (recommended — everything included)

```bash
docker compose up --build
```

Dev default for local Docker:
- password auth is enabled by default via compose: `DEV_LOGIN_PASSWORD=DevPass123`
- you can still override with `DEV_LOGIN_PASSWORD=your-password docker compose up --build`
- or set `DEV_LOGIN_CREDENTIALS` for per-email passwords.

This starts:
- **GCS emulator** (fake storage backend — no Google credentials needed)
- **Bucket initialization** (creates the storage bucket automatically)
- **Next.js app** on http://localhost:8009

Wait until you see "Ready" in the terminal.

### 3. Verify it works

Open http://localhost:8009 in your browser. You should see the landing page with links to admin and form pages.

## Test Checklist

### A. Landing Page
- [ ] http://localhost:8009 loads with admin and form page links
- [ ] All links are clickable

### B. Login (Dev Mode)
Dev mode now accepts email + optional password.
When `DEV_LOGIN_PASSWORD` or `DEV_LOGIN_CREDENTIALS` is configured, password is validated.
You can now use a web form: `http://localhost:8009/login`
- [ ] Open `http://localhost:8009/login` and sign in with:
  - Email: `akshay.ponda@artofliving.org`
  - Password: `DevPass123` (or your override)
- [ ] Verify redirect to `/api/admin/reports_list`
- [ ] Open a terminal and run: `curl -X POST http://localhost:8009/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"akshay.ponda@artofliving.org\"}"`
- [ ] If `DEV_LOGIN_PASSWORD` is configured, run: `curl -X POST http://localhost:8009/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"akshay.ponda@artofliving.org\",\"password\":\"REPLACE_WITH_PASSWORD\"}"`
- [ ] If `DEV_LOGIN_CREDENTIALS` is configured, run: `curl -X POST http://localhost:8009/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"akshay.ponda@artofliving.org\",\"password\":\"REPLACE_WITH_PASSWORD\"}"`
- [ ] Response contains a token
- [ ] Save this token — you'll need it for admin pages

### C. Admin Pages (need auth)
For each admin page, add the session cookie to your browser (or use curl with `-b "session=TOKEN"`):

- [ ] http://localhost:8009/api/admin/ttc_applicants_summary — shows "Admin" heading and DataTables
- [ ] http://localhost:8009/api/admin/ttc_applicants_reports — shows reports page
- [ ] http://localhost:8009/api/admin/ttc_applicants_integrity — shows integrity report
- [ ] http://localhost:8009/api/admin/settings — shows "Admin Settings" with whitelisted users section
- [ ] http://localhost:8009/api/admin/post_ttc_course_feedback — shows post-TTC feedback page
- [ ] http://localhost:8009/api/admin/post_sahaj_ttc_course_feedback — shows post-Sahaj feedback page

### D. Form Pages
- [ ] http://localhost:8009/api/forms/ttc_application_us — US application form with fields
- [ ] http://localhost:8009/api/forms/ttc_application_non_us — Non-US application form
- [ ] http://localhost:8009/api/forms/ttc_evaluation — Evaluation form
- [ ] All form pages have Submit button

### E. Data Flow (the key test)
1. [ ] Submit form data: `curl -X POST http://localhost:8009/users/upload-form-data -b "session=TOKEN" -d "form_type=ttc_application&form_instance=default&form_data={\"i_fname\":\"Test\",\"i_lname\":\"User\"}&form_instance_page_data={}&form_instance_display=Test"`
2. [ ] Verify response: `{"ok":true}`
3. [ ] Read back: `curl http://localhost:8009/users/get-form-data?form_type=ttc_application&form_instance=default -b "session=TOKEN"`
4. [ ] Verify your data came back (i_fname=Test, i_lname=User)
5. [ ] Run reporting job: `curl http://localhost:8009/jobs/reporting/user-summary/load -H "x-appengine-cron: true"`
6. [ ] Verify 200 response (not error)
7. [ ] Check admin summary page — should show the submitted data

### F. Permissions Page (no auth needed)
- [ ] http://localhost:8009/api/admin/permissions — loads without login (this is the "unauthorized" page)

## Notes
- The GCS emulator runs inside Docker — all data is temporary (lost when you stop Docker)
- Admin emails with permissions are hardcoded (use `akshay.ponda@artofliving.org` for full access)
- In Docker dev, password auth is enabled by default (`DevPass123`) unless overridden by env
- Production session login policy: set `SESSION_LOGIN_HASH_ALGORITHM=bcrypt` and provide `SESSION_LOGIN_CREDENTIALS_BCRYPT` as JSON map of email -> bcrypt hash
