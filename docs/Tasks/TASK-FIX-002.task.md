# TASK-FIX-002: Remove Committed Secrets

## Task Definition

**ID**: TASK-FIX-002
**Name**: Remove Committed Secrets
**Priority**: p1 (Security)
**Type**: Security Fix
**Status**: TODO

## Feature File
N/A (security remediation task from IMPLEMENTATION_PLAN.md)

## Scenario
N/A

## Steps Needing Implementation
- Remove committed secrets from the repo and replace with environment-based configuration.
- Update `constants.py` to use environment-based configuration with no real API keys.
- Remove `ttc_portal_sendgrid_key.txt` and ensure secrets are provisioned outside git.
- Remove `artofliving-ttcdesk-dev-b3dbc09298ee.json` and replace with secure secret provisioning.

## Acceptance Criteria
- [ ] `constants.py` uses environment-based configuration with no real API keys.
- [ ] `ttc_portal_sendgrid_key.txt` is removed and secrets are provisioned outside git.
- [ ] `artofliving-ttcdesk-dev-b3dbc09298ee.json` is removed and replaced with secure secret provisioning.
- [ ] No new secrets are committed.

## References
- `IMPLEMENTATION_PLAN.md` missing work item `remove-committed-secrets`
- `constants.py:12-16`
- `ttc_portal_sendgrid_key.txt:1`
- `artofliving-ttcdesk-dev-b3dbc09298ee.json:2-6`
