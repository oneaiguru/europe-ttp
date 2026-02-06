# TEST_RUN_LOG

## 2026-02-06 (commit aa2db64784b7353cc040efe9c4be60cc1569ae9b)

Commands:
- `bun run bdd:verify` -> PASS (`✓ 243 steps defined, 0 orphan, 0 dead`)
- `bun run bdd:python` -> PASS (`99 scenarios`, `441 steps`) with warnings:
  - Could not import admin app
  - Could not import api app
  - Could not import ttc_portal app
  - Could not import reporting app: No module named 'google.appengine'
  - Could not import fixture loader
  - Could not enable test mode
- `bun run bdd:typescript` -> PASS (`99 scenarios`, `441 steps`)
- `bun run typecheck` -> PASS
- `bun run lint` -> PASS
