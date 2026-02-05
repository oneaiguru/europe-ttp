# REVIEW_DRAFTS

## Pending

Task: remove-committed-secrets
Slug: remove-committed-secrets
Goal: Remove committed API keys and service account keys, and rotate any affected credentials.
Acceptance Criteria:
1. `constants.py` no longer contains real API keys and uses environment-based configuration instead.
2. `ttc_portal_sendgrid_key.txt` is removed from the repo and secrets are provisioned outside git.
3. `artofliving-ttcdesk-dev-b3dbc09298ee.json` is removed from the repo and replaced with secure secret provisioning.
Evidence: constants.py:12-16; ttc_portal_sendgrid_key.txt:1; artofliving-ttcdesk-dev-b3dbc09298ee.json:2-6

Task: fix-verify-alignment-placeholder-matching
Slug: fix-verify-alignment-placeholder-matching
Goal: Ensure `verify-alignment.ts` correctly matches registry placeholders when patterns are absent.
Acceptance Criteria:
1. Placeholder handling converts `{string}`/`{int}`/`{float}` into regex without re-escaping inserted regex tokens.
2. Add a minimal test (or fixture) that fails under the current implementation and passes after the fix.
Evidence: scripts/bdd/verify-alignment.ts:52-69

## Evidence Map
- remove-committed-secrets -> constants.py:12-16; ttc_portal_sendgrid_key.txt:1; artofliving-ttcdesk-dev-b3dbc09298ee.json:2-6
- fix-verify-alignment-placeholder-matching -> scripts/bdd/verify-alignment.ts:52-69
