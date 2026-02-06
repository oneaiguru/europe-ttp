# TASK-048: restrict-docs-serving - Implementation Plan

## Goal
Prevent serving internal docs to general authenticated users by removing unused `/docs` static handlers.

## Summary
Remove the `/docs` static handlers from all three `app.yaml` files. The handler is not referenced by any application code and serves internal project documentation that should not be publicly accessible.

## Implementation Steps

### Step 1: Remove `/docs` handler from `app.yaml`
**File: `app.yaml`**
**Lines: 63-66**

Remove the following handler block:
```yaml
- url: /docs
  static_dir: docs
  login: required
  secure: always
```

### Step 2: Remove `/docs` handler from `app-dev.yaml`
**File: `app-dev.yaml`**
**Lines: 51-54**

Remove the following handler block:
```yaml
- url: /docs
  static_dir: docs
  login: required
  secure: always
```

### Step 3: Remove `/docs` handler from `app-20190828.yaml`
**File: `app-20190828.yaml`**
**Lines: 62-65**

Remove the following handler block:
```yaml
- url: /docs
  static_dir: docs
  login: required
  secure: always
```

### Step 4: Verify removal
Run verification to confirm handlers are removed:
```bash
# Verify no /docs handlers remain
grep -n "url: /docs" app*.yaml
# Should return no results
```

## Files to Change
1. `app.yaml:63-66` - Remove `/docs` handler
2. `app-dev.yaml:51-54` - Remove `/docs` handler
3. `app-20190828.yaml:62-65` - Remove `/docs` handler

## Tests to Run
```bash
# Verify no /docs handlers remain in any app.yaml
grep -n "url: /docs" app*.yaml

# Verify app.yaml files are still valid YAML
python -c "import yaml; yaml.safe_load(open('app.yaml'))"
python -c "import yaml; yaml.safe_load(open('app-dev.yaml'))"
python -c "import yaml; yaml.safe_load(open('app-20190828.yaml'))"

# Run BDD alignment verification
bun run bdd:verify
```

## Risks / Rollback
- **Risk**: Very low - the `/docs` handler is not referenced by any application code
- **Impact**: None - no functional change to the application
- **Rollback**: If needed, restore the removed handler blocks from git history

## Notes
- The research confirmed that `/docs` is only used for GCS bucket references in `ttc_portal.html`, not the static handler
- Internal docs will remain in the repository but not served via the web application
- No secrets or PII were found in the `docs/` directory (already redacted in previous tasks)
