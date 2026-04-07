# B03: Form Lifecycle Tests

**Date:** 2026-04-07 (re-run)
**Target:** http://localhost:8009
**Scope:** Form lifecycle — draft save/read, multi-instance, submission flag, validation

---

## Test 1: Draft Round-Trip (applicant.alpha) — PASS

| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 1.1 | Login `applicant.alpha@ttc.test` | 200 + token | 200 + token | PASS |
| 1.2 | POST upload-form-data with partial fields (no i_form_submitted) | 200 ok:true | 200 ok:true | PASS |
| 1.3 | GET get-form-data?form_type=ttc_application&form_instance=default | 200 + all saved fields | 200 + all fields match | PASS |

**Data saved:** `{i_fname:"Alpha", i_lname:"Applicant", i_email:"applicant.alpha@ttc.test", i_country:"United States", i_ttc_country_and_dates:"test_us_future"}`
**Read back:** All fields match exactly.

---

## Test 2: Multi-Form Instances (applicant.multi) — PASS

| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 2.1 | Login `applicant.multi@ttc.test` | 200 + token | 200 + token | PASS |
| 2.2 | Submit `test_us_future` instance | 200 ok:true | 200 ok:true | PASS |
| 2.3 | Submit `test_ca_future` instance | 200 ok:true | 200 ok:true | PASS |
| 2.4 | GET get-form-instances?form_type=ttc_application | Both instances in response | Both present | PASS |

**Instances returned:** `TTC_OPEN_US_2026`, `TTC_EXPIRED_CA_2026`, `TTC_OPEN_UK_2026`, `test_us_future`, `test_ca_future`. Both submitted instances confirmed.

---

## Test 3: Submission Flag Persistence (applicant.alpha) — PASS

| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 3.1 | Upload form_data with `i_form_submitted: "true"` + `i_agreement_accepted: "true"` | 200 ok:true | 200 ok:true | PASS |
| 3.2 | GET get-form-data — check read-back | `i_form_submitted: "true"` | `i_form_submitted: "true"` | PASS |

**form_type:** ttc_application. Field stored/returned as string `"true"`. Read-back confirms truthy value persisted.

---

## Test 4: Missing form_type Validation — FAIL

| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 4.1 | POST upload-form-data with `{form_data:{i_fname:"Test"}}` (no form_type) | 400 | **500** (empty body) | **FAIL** |

**Bug:** `validatePayload()` only checks for unknown fields (whitelist enforcement) but does NOT validate that `form_type` is present. When `form_type` is undefined, `setFormData(undefined, ...)` crashes with an unhandled exception, returning an empty 500 response.

**Root cause:** `app/users/upload-form-data/route.ts` — `validatePayload` accepts `form_type` as optional, and the handler uses `validation.data!.form_type!` without checking for undefined.

**Fix:** Add required-field validation in `validatePayload()` to return 400 with descriptive error.

---

## Summary

| Test | Result |
|------|--------|
| T1: Draft round-trip | PASS |
| T2: Multi-form instances | PASS |
| T3: Submission flag | PASS |
| T4: Missing form_type → 400 | **FAIL (returns 500)** |

**3/4 PASS, 1 FAIL (validation gap — missing required-field check for form_type)**
