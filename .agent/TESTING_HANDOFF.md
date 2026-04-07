# Testing Handoff — Europe TTP Runtime Verification

## Execution Commands (copy-paste into terminals)

### Step 0: Start infrastructure (if not running)
```bash
# Terminal 0 — keep open
docker run -d --name fake-gcs -p 4443:4443 fsouza/fake-gcs-server -scheme http -port 4443 2>/dev/null || true
sleep 2 && curl -s -X POST "http://localhost:4443/storage/v1/b" \
  -H "Content-Type: application/json" -d '{"name":"artofliving-ttcdesk.appspot.com"}' 2>/dev/null || true
PORT=8009 npm run dev
```

### Step 1: Run E2E smoke test (GLM, ~10 min)
```bash
# Terminal 1
echo "Read and follow /Users/m/ttp-split-experiment/.agent/tasks/test-e2e-smoke.md exactly. Do all tasks in order. Write results to .agent/test-e2e-results.md. Save screenshots to .agent/screenshots/." | claude -p --dangerously-skip-permissions --no-session-persistence --settings ~/.claude/settings.glm.json --effort high
```

### Step 2: Review results
After GLM finishes, check:
```bash
cat .agent/test-e2e-results.md
ls .agent/screenshots/
```

If all PASS → code is working end-to-end with GCS emulator. Ready for Alexei or deeper testing.
If any FAIL → read the error, fix, rerun.

### Step 3 (optional): Deep parity scenarios
Decompose `.agent/parity-e2e-plan.md` bundles B00-B08 into task files and run through `dev-loop-commits.sh`.

---

## What's Done

### Code (Phases 1-5 complete, 20+ commits on `main`)
- GCS utility, login, auth middleware, TTCPortalUser, admin config
- Reporting status machine, Levenshtein matching, user summary, user integrity
- All route wiring, admin page auth, parity alias routes
- Phase 2 Opus audit: all actionable findings fixed (admin auth, whitelist merge, bucket env var, mock-data cleanup)

### Infrastructure (committed, ready to use)
- **GCS emulator**: `docker-compose.yml` with `fake-gcs-server` + auto bucket creation
- **Playwright MCP**: `.claude/settings.json` enables it for any `claude -p` launched from repo
- **Dev env**: `.env.local` has all needed env vars (HMAC secret, emulator host, bucket name)
- **Dev-loop script**: `scripts/dev/dev-loop-commits.sh` — tree-based convergence, tested

### Testing (Level 1 partial)
- Landing page renders: PASS
- Admin auth blocks unauthorized: PASS
- Dev-mode login: PASS (requires `SESSION_HMAC_SECRET` env var — set in `.env.local`)
- Form persistence, admin config, reporting job: NOT YET TESTED (first GLM hit the missing env var; server was restarted with the fix but results not collected yet)

## How to Start Testing

### Start infrastructure:
```bash
# Option 1: Docker (all-in-one)
docker-compose up

# Option 2: Manual (for development)
docker run -d --name fake-gcs -p 4443:4443 fsouza/fake-gcs-server -scheme http -port 4443
sleep 2 && curl -s -X POST "http://localhost:4443/storage/v1/b" \
  -H "Content-Type: application/json" -d '{"name":"artofliving-ttcdesk.appspot.com"}'
PORT=8009 npm run dev
# (env vars loaded from .env.local automatically by Next.js)
```

### Verify infrastructure:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8009        # expect 200
curl -s http://localhost:4443/storage/v1/b | grep -c artofliving    # expect 1
```

## Testing Levels

### Level 1 — API Smoke Tests (30 min, GLM)
Run the existing task file:
```bash
echo "Read and follow .agent/tasks/browser-smoke-test.md exactly. Write results to .agent/browser-smoke-results.md." | claude -p --dangerously-skip-permissions --no-session-persistence --settings ~/.claude/settings.glm.json --effort high
```
Expected: all 6 tests PASS. If any fail, read the results file for root cause.

### Level 2 — Playwright Visual Verification (2-3 hours, GLM)
After Level 1 passes, seed data and verify admin pages show real content:

1. **Seed test data** — login as test user, submit forms for 3+ personas
2. **Run jobs** — POST to `/jobs/reporting/user-summary/load` and `/jobs/integrity/user-integrity/load`
3. **Visual check** — navigate each admin page with Playwright, verify tables have rows (not empty), take screenshots

Task file needed: create `.agent/tasks/playwright-visual-check.md` with specific pages + expected content.

### Level 3 — Deep Parity Scenarios (1 day, GLM)
The GPT Pro orchestration plan at `/Users/m/Downloads/parity_e2e_orchestration_plan (1).md` defines 10 bundles (B00-B09) with 70+ scenarios. Key bundles:

- **B00**: Seed 16 personas, 5 TTC sessions
- **B01**: Auth flows
- **B02**: Form lifecycle (save/load/submit/edit)
- **B04**: Evaluation matching edge cases
- **B05**: Reporting status machine
- **B07**: Integrity cross-matching

Each bundle can be a separate GLM task file. Decompose the plan into task reference files following dev-loop format, then run through `dev-loop-commits.sh`.

**B09 (email + PDF) is deferred** — Phase 6, not in scope.

### Level 4 — Python Side-by-Side (NOT RECOMMENDED)
The Opus code audit already compared Python vs TS line-by-line. Running both apps adds setup complexity (Python 2.7 + App Engine SDK) with marginal value. Skip unless client specifically requests it.

## Seed Data (from GPT Pro plan)

The parity plan specifies 16 personas. The seed manifest template was referenced but may not be on this machine. Key personas:
- `superadmin@ttc.test` — full admin access
- `applicant.alpha@ttc.test` — has prior TTC, overlap with beta on enrolled persons
- `evaluator.1@ttc.test` through `evaluator.4@ttc.test`
- `graduate.post@ttc.test`, `teacher.post@ttc.test` — post-TTC feedback
- `upload.attacker@ttc.test` — security testing persona

Seed data creation: POST to `/api/auth/login` (dev mode, email-only), then POST form data to `/users/upload-form-data` for each persona.

## Production Transition

To move from emulator to real GCS:
1. Remove `STORAGE_EMULATOR_HOST` from environment
2. Set `GCS_BUCKET_NAME` to the real bucket
3. Set `GOOGLE_APPLICATION_CREDENTIALS` to the service account key path (or deploy to a GCP environment with ADC)
4. Set `SESSION_HMAC_SECRET` to a real secret (not the dev placeholder)

## Files Reference

| File | Purpose |
|------|---------|
| `.env.local` | Dev env vars (gitignored) |
| `docker-compose.yml` | Full stack: emulator + bucket init + app |
| `.claude/settings.json` | Playwright MCP for GLM agents |
| `scripts/dev/dev-loop-commits.sh` | Implement → review → converge loop |
| `.agent/tasks/browser-smoke-test.md` | Level 1 API smoke test |
| `.agent/phase2-parity-results.md` | Opus parity audit findings |
| `.agent/browser-smoke-results.md` | Level 1 results (partial — rerun needed) |
| `/Users/m/Downloads/parity_e2e_orchestration_plan (1).md` | GPT Pro deep parity plan (Levels 2-3) |
