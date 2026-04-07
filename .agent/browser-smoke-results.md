# Browser Smoke Test Results

**Date:** 2026-04-07
**Target:** http://localhost:8009 (dev server, Next.js v16.1.6)
**GCS Emulator:** http://localhost:4443 (fake-gcs-server, Docker)
**Bucket:** `artofliving-ttcdesk.appspot.com`

---

## Summary

| # | Test | Result |
|---|------|--------|
| 1 | Landing page renders | PASS |
| 2 | Admin pages require auth | PASS |
| 3 | Dev-mode login works | FAIL |
| 4 | Form data persists through GCS | BLOCKED |
| 5 | Admin config persists through GCS | BLOCKED |
| 6 | Reporting job runs without error | BLOCKED |

**3 PASS, 1 FAIL, 3 BLOCKED**

---

## Detailed Results

### 1. Landing page renders — PASS

- Navigated to `http://localhost:8009`
- Page title: "Europe TTP"
- Content renders correctly: heading, admin page links (7), form page links (11)
- No blank page, no error page
- 1 console error (non-blocking)
- Screenshot: `.agent/screenshots/test1-landing-page.png`

### 2. Admin pages require auth — PASS

- `GET /api/admin/ttc_applicants_summary` (no auth)
- Response: `{"error":"Authentication required"}`
- Status: **401**
- Auth middleware correctly blocks unauthenticated access

### 3. Dev-mode login works — FAIL

- `POST /api/auth/login` with `{"email":"test@example.com"}`
- Response: empty body
- Status: **500 Internal Server Error**
- **Root cause:** `getSessionHmacSecret()` throws because neither `SESSION_HMAC_SECRET` nor `UPLOAD_HMAC_SECRET` environment variables are set. No `.env` / `.env.local` file exists in the project — only `.env.example`.

### 4. Form data persists through GCS — BLOCKED

- Depends on session token from Test 3.
- Without auth: `POST /users/upload-form-data` returns **401** `{"error":"Authentication required"}` — auth middleware works correctly.
- Cannot complete data round-trip test without login token.

### 5. Admin config persists through GCS — BLOCKED

- Depends on session token from Test 3.
- Without auth: `POST /api/admin/admin/set-config` returns **401** — auth middleware works correctly.
- Cannot complete config round-trip test without login token.

### 6. Reporting job runs without error — BLOCKED

- Depends on session token from Test 3.
- Without auth: `POST /jobs/reporting/user-summary/load` returns **401** — auth middleware works correctly.
- Cannot run job without login token.

---

## Fix Required

To unblock Tests 3-6, create a `.env.local` with HMAC secrets:

```
UPLOAD_HMAC_SECRET=dev-upload-secret-change-me
SESSION_HMAC_SECRET=dev-session-secret-change-me
```

Then restart the dev server. In Docker, add these to `docker-compose.yml` under `ttp-nextjs.environment`.
