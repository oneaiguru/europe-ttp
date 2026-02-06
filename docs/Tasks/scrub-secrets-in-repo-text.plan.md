# scrub-secrets-in-repo-text: Implementation Plan

## Task Summary
Remove committed secret values from comments and documentation so secret scans and external publication are safe.

## Type
Fix/Hardening - No BDD scenarios required

---

## Implementation Strategy

### Step 1: Create Secrets Scan Script (FIRST)
Create a bash script at `scripts/security/scan-secrets.sh` that checks for:
- SendGrid API keys (`SG.` prefix)
- Google API keys (`AIza` prefix)
- Harmony search keys
- Service account filenames with embedded key IDs

**Purpose**: This script will be used to verify secrets have been removed and can be run before commits/publication.

### Step 2: Redact Priority 1 (Active Secrets)

#### 2a. YAML Configuration Files
- **`app-dev.yaml`** (lines 86-88)
  - Replace `GOOGLE_MAPS_API_KEY` value with `AIza.REDACTED.GOOGLE_MAPS`
  - Replace `GOOGLE_PUBLIC_API_KEY` value with `AIza.REDACTED.GOOGLE_PUBLIC`
  - Replace `SERVICE_JSON_FILE` value with `artofliving-ttcdesk-dev-REDACTED.json`

- **`app-20190828.yaml`** (lines 114-115)
  - Replace `GOOGLE_MAPS_API_KEY` value with `AIza.REDACTED.GOOGLE_MAPS`
  - Replace `GOOGLE_PUBLIC_API_KEY` value with `AIza.REDACTED.GOOGLE_PUBLIC`

#### 2b. HTML Files with Inline Script Tags
- **`form/ttc_application.html:804`**
- **`tabs/settings.html:322`**
- **`tabs/form_page.html:804`**
- **`tabs/ttc_application_manual.html:831`**
- **`tabs/ttc_application_manual-20180126.html:804`** (archive)

Replace all Google Maps API key values in script src attributes with `AIza.REDACTED.GOOGLE_MAPS`

### Step 3: Redact Priority 2 (Historical Comments)

#### 3a. `constants.py` (lines 14-16, 20)
Replace historical secret values in comments:
- SendGrid keys → `SG.REDACTED`
- Harmony key → `HARMONY.REDACTED`

### Step 4: Redact Priority 3 (Documentation)

#### 4a. `docs/Tasks/TASK-FIX-002.md` (lines 22, 25)
Replace real secret values with placeholders

#### 4b. `docs/Tasks/TASK-FIX-002.research.md` (lines 17-18, 28, 50-51)
Replace real secret values with placeholders

#### 4c. `docs/Tasks/TASK-FIX-002.plan.md` (lines 15-16)
Replace real secret values with placeholders

### Step 5: Verification

1. Run the secrets scan script to confirm no secrets remain
2. Verify no unintended functional changes (only value replacements)
3. Update ACTIVE_TASK.md status to "PLAN COMPLETE"

---

## Placeholder Values Reference

| Secret Type | Placeholder Format |
|-------------|-------------------|
| SendGrid API Key | `SG.REDACTED` |
| Harmony API Key | `HARMONY.REDACTED` |
| Google Maps API Key | `AIza.REDACTED.GOOGLE_MAPS` |
| Google Public API Key | `AIza.REDACTED.GOOGLE_PUBLIC` |
| Service Account File | `artofliving-ttcdesk-dev-REDACTED.json` |

---

## Files to Modify

1. `scripts/security/scan-secrets.sh` - CREATE
2. `app-dev.yaml` - redact lines 86-88
3. `app-20190828.yaml` - redact lines 114-115
4. `form/ttc_application.html` - redact line 804
5. `tabs/settings.html` - redact line 322
6. `tabs/form_page.html` - redact line 804
7. `tabs/ttc_application_manual.html` - redact line 831
8. `tabs/ttc_application_manual-20180126.html` - redact line 804
9. `constants.py` - redact lines 14-16, 20
10. `docs/Tasks/TASK-FIX-002.md` - redact lines 22, 25
11. `docs/Tasks/TASK-FIX-002.research.md` - redact lines 17-18, 28, 50-51
12. `docs/Tasks/TASK-FIX-002.plan.md` - redact lines 15-16

---

## Acceptance Criteria (from task)

1. [x] No SendGrid (`SG.`), Harmony, or Google API keys are present anywhere in tracked text files (including docs and comments)
2. [x] Replace any historical values with placeholders (e.g., `SG.REDACTED`, `AIza...REDACTED`)
3. [x] Add a simple secrets-scan check (script or documented grep) that can be run before publishing

---

## Status

✅ **COMPLETE** - All secrets have been redacted. Verified via `scripts/security/scan-secrets.sh`.

### Verification Results (2026-02-06)

```
=== Secrets Scan ===
1. SendGrid API keys: ✓ CLEAN
2. Google API keys: ✓ CLEAN
3. Harmony keys: ✓ CLEAN
4. Service account filenames: ✓ CLEAN
```

### Files Verified Redacted

| File | Lines | Status |
|------|-------|--------|
| `app-dev.yaml` | 86-88 | ✅ Redacted |
| `app-20190828.yaml` | 114-115 | ✅ Redacted |
| `form/ttc_application.html` | 804 | ✅ Redacted |
| `tabs/settings.html` | 322 | ✅ Redacted |
| `tabs/form_page.html` | 804 | ✅ Redacted |
| `tabs/ttc_application_manual.html` | 831 | ✅ Redacted |
| `tabs/ttc_application_manual-20180126.html` | 804 | ✅ Redacted |
| `constants.py` | 14-16, 20 | ✅ Redacted |
| `docs/Tasks/TASK-FIX-002.md` | 22, 25 | ✅ Redacted |
| `docs/Tasks/TASK-FIX-002.research.md` | 17-18, 28, 50-51 | ✅ Redacted |
| `docs/Tasks/TASK-FIX-002.plan.md` | 15-16 | ✅ Redacted |

---

## Notes

- This is a security hardening task with no BDD scenarios
- All changes are value replacements only (no functional changes)
- Legacy code is read-only in general, but minimal edits for security redaction are permitted
- The scan script serves as both verification and ongoing check-in guard
