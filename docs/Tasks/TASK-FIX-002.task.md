# TASK-FIX-002: Remove Committed Secrets

## Task ID
TASK-FIX-002

## Task Name
remove-committed-secrets

## Priority
p1 (Critical - security)

## Goal
Remove committed API keys and service account keys, and rotate any affected credentials.

## Files to Modify
- `constants.py` (lines 12-16)
- `ttc_portal_sendgrid_key.txt` (entire file)
- `artofliving-ttcdesk-dev-b3dbc09298ee.json` (entire file)

## Acceptance Criteria
1. `constants.py` uses environment-based configuration with no real API keys
2. `ttc_portal_sendgrid_key.txt` is removed and secrets are provisioned outside git
3. `artofliving-ttcdesk-dev-b3dbc09298ee.json` is removed and replaced with secure secret provisioning
4. All existing tests still pass after the changes

## Notes
- This is a security fix to remove credentials that were accidentally committed to the repository
- Need to ensure that any rotation of credentials is documented for the operations team
- Consider adding `.env.example` file as template for required environment variables
