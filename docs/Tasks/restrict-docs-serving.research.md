# TASK-048: restrict-docs-serving - Research

## Goal
Prevent serving internal docs to general authenticated users.

## Evidence

### 1. Current `/docs` Handler Configuration
**File: `app.yaml:63-66`**
```yaml
- url: /docs
  static_dir: docs
  login: required
  secure: always
```

**Also in: `app-dev.yaml:51-54`**
```yaml
- url: /docs
  static_dir: docs
  login: required
  secure: always
```

**Also in: `app-20190828.yaml:62-65`**
```yaml
- url: /docs
  static_dir: docs
  login: required
  secure: always
```

### 2. Security Analysis
- **Current state**: `login: required` means any authenticated user can access `/docs/*`
- **Risk**: Internal project documentation (plans, tasks, review notes) could be exposed to all authenticated users
- **Admin-only pattern exists**: The same files use `login: admin` for sensitive endpoints (e.g., `app.yaml:93`, `app.yaml:103`)

### 3. Contents of `docs/` Directory
The `docs/` directory contains:
- `BUILD_LOOP_STATUS.md` - Internal process documentation
- `COMPLETION_LOG.md` - Task completion history
- `IMPL_PLAN_FORMAT.md` - Implementation plan format spec
- `SESSION_HANDOFF.md` - Session handoff notes
- `Tasks/` - 208 task files (`.task.md`, `.research.md`, `.plan.md`)
- `archive/` - Archived implementation plans
- `decisions/` - Migration decisions
- `ops/` - Operations documentation (including `SECRET_REMEDIATION_PLAN.md`)
- `review/` - `REVIEW_DRAFTS.md` with security review items

### 4. No Secrets in `docs/` Directory
A grep search for secrets (`SG.`, `AIza`, `SENDGRID`) shows:
- References are to redacted values (`SG.REDACTED`)
- Historical keys are already commented out with `# Historical keys (removed):`
- No active secrets are present in the `docs/` directory

### 5. Application Usage
A search for `/docs` references in the codebase shows:
- `ttc_portal.html:147-148` references GCS bucket docs: `{{ default_bucket_name }}/docs/` - this is cloud storage, not the static handler
- No application code links to the `/docs` static handler
- The `/docs` handler appears to be legacy, not actively used by the application

## Constraint Analysis
1. **Legacy is read-only**: Can only modify `app.yaml` files (not legacy Python code)
2. **No breaking changes**: Removing `/docs` should not affect application functionality
3. **Admin-only pattern**: Use `login: admin` following existing patterns in `app.yaml`

## Options
1. **Remove `/docs` handler entirely** - Cleanest, since it's not used by the application
2. **Change to `login: admin`** - Restricts to admin users only (following pattern of `/jobs/*` endpoints)

## Recommendation
**Remove the `/docs` handlers** from all three `app.yaml` files:
- `app.yaml:63-66`
- `app-dev.yaml:51-54`
- `app-20190828.yaml:62-65`

Justification:
- The handler is not referenced by any application code
- The `docs/` directory contains internal project documentation, not user-facing content
- Removing is cleaner than adding admin-only restriction
