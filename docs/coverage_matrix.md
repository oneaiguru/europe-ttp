# Europe TTP Migration - Feature Coverage Matrix

## Legend
- ✓ = Complete (Python verified + TypeScript implemented)
- ⏳ = In Progress
- ❌ = Not Started
- 🟡 = Python verified, TypeScript pending

---

## Authentication

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Login | specs/features/auth/login.feature | ✓ | ✓ |
| Logout | specs/features/auth/logout.feature | ✓ | ✓ |
| Password Reset | specs/features/auth/password_reset.feature | ✓ | ✓ |

## Portal

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Disabled Page | specs/features/portal/disabled.feature | ✓ | ✓ |
| Portal Home | specs/features/portal/home.feature | ✓ | ✓ |
| Tabs Rendering | specs/features/portal/tabs.feature | ✓ | ✓ |

## Admin

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Admin Access | specs/features/admin/access.feature | ✓ | ✓ |
| Admin Permissions | specs/features/admin/permissions.feature | ✓ | ✓ |
| Admin Reports Pages | specs/features/admin/reports_pages.feature | ✓ | ✓ |
| Admin Settings | specs/features/admin/settings.feature | ✓ | ✓ |

## Forms

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| DSN Application | specs/features/forms/dsn_application.feature | ✓ | ✓ |
| Post-Sahaj TTC Feedback | specs/features/forms/post_sahaj_ttc_feedback.feature | ✓ | ✓ |
| Post-Sahaj TTC Self Evaluation | specs/features/forms/post_sahaj_ttc_self_eval.feature | ✓ | ✓ |
| Post-TTC Feedback | specs/features/forms/post_ttc_feedback.feature | ✓ | ✓ |
| Post-TTC Self Evaluation | specs/features/forms/post_ttc_self_eval.feature | ❌ | ❌ |
| TTC Applicant Profile | specs/features/forms/ttc_applicant_profile.feature | ✓ | ✓ |
| TTC Application (Non-US) | specs/features/forms/ttc_application_non_us.feature | ✓ | ✓ |
| TTC Application (US) | specs/features/forms/ttc_application_us.feature | ✓ | ✓ |
| TTC Evaluation | specs/features/forms/ttc_evaluation.feature | ❌ | ❌ |
| TTC Evaluator Profile | specs/features/forms/ttc_evaluator_profile.feature | ✓ | ✓ |
| TTC Portal Settings | specs/features/forms/ttc_portal_settings.feature | ❌ | ❌ |

## File Uploads

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Document Upload | specs/features/uploads/document_upload.feature | ❌ | ❌ |
| Photo Upload | specs/features/uploads/photo_upload.feature | ❌ | ❌ |

## API

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Upload Form API | specs/features/api/upload_form.feature | ✅ | ✅ |

## User Services

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Reporting Get Form Data | specs/features/user/reporting_get_form_data.feature | ✅ | ✅ |
| User Config Management | specs/features/user/config_management.feature | ❌ | ❌ |
| User Form Data Upload | specs/features/user/form_data_upload.feature | ❌ | ❌ |
| User Get Form Data | specs/features/user/get_form_data.feature | ❌ | ❌ |
| User Get Form Instances | specs/features/user/get_form_instances.feature | ❌ | ❌ |

## Reports

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Certificate Generation | specs/features/reports/certificate.feature | ❌ | ❌ |
| Participant List | specs/features/reports/participant_list.feature | ❌ | ❌ |
| Print Form | specs/features/reports/print_form.feature | ❌ | ❌ |
| User Application Report | specs/features/reports/user_report.feature | ❌ | ❌ |
| User Integrity Report | specs/features/reports/user_integrity.feature | ⚠️ | ✓ |
| User Summary Report | specs/features/reports/user_summary.feature | ⚠️ | ⚠️ |

---

## E2E

| Feature | .feature File | Python | TypeScript |
|---------|--------------|--------|------------|
| Deadline and Whitelist Override | specs/features/e2e/deadline_and_whitelist_override.feature | ✅ | ✅ |

---

## Summary
- **Total Features:** 36
- **Python Verified:** 17/36
- **TypeScript Complete:** 17/36
- **Parity:** 47%
