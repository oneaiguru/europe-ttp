# TASK-048: restrict-docs-serving

## Goal
Prevent serving internal docs to general authenticated users.

## Feature File
None - this is a security/hardening task.

## Legacy Reference
- File: `app.yaml`
- Lines: 63-66

## Acceptance Criteria
1. `/docs` is removed from deployment or restricted to admins only.
2. Ensure no secrets/PII can be reached via static handlers.

## Files to Create/Modify
- [ ] `app.yaml` - remove or restrict `/docs` handler

## Test Commands
```bash
# Verify docs directory is not served publicly
grep -A 5 "handler:" app.yaml | grep -v "admin"
# Verify docs/ directory exists and check contents
ls -la docs/
```

## Notes
From `docs/review/REVIEW_DRAFTS.md`:
> Goal: Prevent serving internal docs to general authenticated users.
> Evidence: `app.yaml:63-66`
