# Dark Factory Roadmap — From Manual Orchestration to Zero-Human Code Pipeline

## Levels

### Level 1 — Human-orchestrated (current state, proven April 2026)
- Human launches terminals, monitors logs, fixes runtime bugs
- Human decides when to restart, move to next phase
- Scripts automate WITHIN a phase (dev-loop-commits.sh)
- Human orchestrates BETWEEN phases

### Level 2 — Script-orchestrated (next step)
- `master-pipeline.sh` runs all phases: seed → implement → gap-close → test → report
- `test-loop.sh` extends dev-loop pattern to runtime testing:
  test → if 500, read stack trace → classify error → fix → retest → converge
- Human sees only the final report
- Escalation to human only when automated loops don't converge

### Level 3 — Self-healing runtime (medium term)
- Test agent diagnoses runtime failures from stack traces
- Fix patterns learned from registry: "undefined property → guard with if (!x) x = {}"
- Prompt improvement registry feeds back into implementation prompts
- Each project run improves the next run's prompts automatically
- Human touchpoint: only TZ interview at start + escalation review

### Level 4 — Full dark factory (end state)
- Request → TZ interview (async, chat-based) → automated pipeline → delivered repo
- Self-improving: each project improves skills for the next
- Composable stages: BDD extraction → backend port → frontend port → polishing
- Human reviews only escalations (convergence failures)

## What we proved at each level this session

### Level 1 proof points
- 18 tasks implemented via dev-loop, 5 parallel, GLM-executed
- Gap closure found and fixed all parity issues
- GCS emulator infrastructure works end-to-end
- Runtime testing caught 6 bugs invisible to code review
- Fix-while-testing cycle: ~15 min per bug, 2-5 line fixes

### Level 2 requirements (what's missing)
1. `test-loop.sh` — runtime test with auto-diagnosis and fix
2. `master-pipeline.sh` — end-to-end phase orchestration
3. Error classification: which stack traces are fixable by GLM vs need Opus
4. Server restart automation (currently manual after code fixes)

### Level 3 requirements
1. Prompt improvement registry with real data (not just draft)
2. Error pattern library: common runtime errors → fix templates
3. Self-restart capability: agent kills server, restarts, retests
4. Multi-angle review: N cheap GLM reviewers with different focus prompts

### Level 4 requirements
1. TZ interview skill fully automated
2. BDD extraction from legacy code (currently manual/pre-existing)
3. Pricing model for migration-as-a-service
4. Client-facing delivery workflow (Alexei test → client handoff)

## Role mapping (from voice notes)

| Role | Level 1 | Level 2 | Level 3 | Level 4 |
|------|---------|---------|---------|---------|
| Human | Orchestrator + fixer | Reviewer of reports | TZ + escalation only | TZ only |
| Opus | Planner + architect | Planner + escalation handler | Escalation only | Escalation only |
| GLM | Implementor + tester | Implementor + tester + fixer | Everything routine | Everything |
| Script | dev-loop per task | master-pipeline | master-pipeline + self-heal | full pipeline |

## Relationship to HumanLayer/Dex RPI evolution (March 2026 talk)

Dex's evolution: RPI → Questions/Research/Design/Structure/Plan/Work/Implement/PR
Our evolution: TZ → Research → Plan → Decompose → Implement → Gap Closure → Test → UAT

Key difference: Dex still requires human to read code and review plans.
Our approach: human only does TZ interview, everything else automated.
Dex's "instruction budget" insight (150-200 max) validates our small task files.
Dex's "don't outsource the thinking" = our TZ interview captures human decisions upfront.

## Runtime bugs as training data (this session's evidence)

These 6 bugs are the FIRST entries for the error pattern library (Level 3):

| Error class | Pattern | Auto-fix template |
|---|---|---|
| Missing env var | `getX() throws because ENVVAR not set` | Add to .env.local + docker-compose |
| SDK/emulator incompatibility | `ESM uses XML API, emulator only supports JSON` | REST API fallback when emulator active |
| Undefined property access | `Cannot set property X of undefined` | Guard: `if (!obj[key]) obj[key] = {}` |
| Non-object in iteration | `Cannot create property on string` | Skip: `if (typeof x !== 'object') continue` |
| Error message pattern mismatch | `catch` checks for SDK error format, not emulator format | Add emulator error pattern to catch |
| Stale compilation cache | `Turbopack serves old compiled code` | Clear .next, restart server |

Each of these could be a GLM-executable fix if the test agent can classify the stack trace.
