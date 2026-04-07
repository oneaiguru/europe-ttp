# Documentation Gap Analysis — Source Materials vs Output Files

Generated: 2026-04-07

## Methodology

Compared 9 source material groups against 14 output files (10 agent-ideas, 1 dev-loop skill, 3 dev-loop references).

---

## Source 1: Voice Notes — en.md + ru.md

### Well-covered in outputs
- Agent architecture (architect → orchestrator → workers) → covered in `moltwork-platform-context.md`, `agent-career-ladder.md`
- Living Sessions handoff protocol → partially in `context-checkpoint-rewind.md`
- CodeGenDocs improvement track → mentioned in `session-learnings-consolidated.md`

### Partially covered
- **Session economics** (Opus 1M = $5/read, median 500K = $2.50): the cost constraints that drive short sessions. Output files mention context budget but not the DOLLAR amounts that determine session length strategy.
- **Git-as-memory replacing handoffs**: en.md describes using git commit messages instead of handoff documents, with git history as the canonical memory. Output files mention git but don't capture this as a DESIGN DECISION replacing handoffs.
- **5-minute handoff windows**: specific protocol where previous agent stays available for 5 minutes, then transitions to Haiku live memory. Not in any output file.

### NOT covered at all
- **Personal brand decision**: "first and most important decision — from which name/brand all communications should be sent." Zero coverage.
- **Dialog forking at any step**: ability to rollback 1, 2, 3... messages and fork conversation. Not captured anywhere.
- **Container hydration / pre-warming**: Docker container SSD economics, persistent containers vs fresh creation. Not in outputs.
- **Worker isolation from Documents repo**: workers should NOT have Documents access by default; explicit protocols for what context reaches them. Not captured.
- **JSON data lifecycle**: reviews/bugs as JSON in worktree → merge to main → transfer to Documents database → clean from git. Not in outputs.
- **Cache preservation on session close**: risk of losing JSONL trajectory on exit, file copy backup before closing. Not documented.

---

## Source 2: HumanLayer/Dex Talk (humanlayer2026mar.md)

### Well-covered in outputs
- RPI → CRISPY evolution → `humanlayer-rpi-reference.md` captures this well
- Instruction budget (150-200 max) → captured
- "Don't outsource the thinking" → captured
- Horizontal vs vertical plans → captured
- Design discussion as leverage → captured

### Partially covered
- **Dex's Design Concept** (Matt PCO's idea): the locked-in shared understanding between human and agent in a 200-line markdown artifact. Referenced but not extracted as a reusable pattern.
- **Team review of design docs**: Dex sends design discussions to co-founder for early review, preventing rework. The output notes this exists but doesn't propose adopting it for Moltwork team flow.

### NOT covered at all
- **The "dumb zone" concept**: context window at ~40% = degrading results. Dex's specific thresholds (keep under 40% for beginners, can push to 60% with experience). Not captured as a principle.
- **MCP tool overload**: Databricks insight that too many MCPs fill context with unused tool descriptions. Not documented as a risk.
- **Formal verification tangent**: TLA+/TLA++ for verifying code without reading it. Brief but forward-looking. Not captured.
- **Sandbox hackathon** and provider comparison: practical info about testing sandbox environments. Not relevant to capture.

---

## Source 3: GPT Parity Chat (gptparitychat.md)

### Well-covered in outputs
- `composable-migration-service.md` covers the migration stages concept
- `session-learnings-consolidated.md` covers the 6 runtime bugs
- dev-loop SKILL.md covers the implementation methodology

### Partially covered
- **14 must-have parity checkpoints** (first-login bootstrap, country-based forms, multi-instance, copy/edit/readonly, deadlines, uploads, emails, materialized reports, matching, lifetime evaluation, post-course feedback, integrity detection, combined printable report, permission enforcement): These are enumerated in the GPT chat but NOT extracted into a reusable checklist in any output file.
- **AI tester capabilities needed** (browser control, identity switching, network inspection, job triggering, mail sink, storage evidence, DB verification, screenshot export): Listed in source but not formalized as a skill or reference.

### NOT covered at all
- **Whole-user JSON blob concurrency risk**: legacy Python stores user data as single blob; photo upload and form save can overwrite each other. Not in outputs as a pattern to avoid.
- **Form completeness derived from blank/non-blank values**: legacy quirk where "improving" completeness logic in TS would change reporting. Not documented as a parity trap.
- **Timezone inconsistency** (some code Eastern, some default differently): not in outputs.
- **Side-by-side testing methodology**: running ChatGPT Agent Mode against both Python and TS deployments with identical data. The PROCESS is not captured as a reusable skill.
- **Seeded persona pack design**: the specific 13-persona seed design (superadmin, applicant_alpha/beta, late_applicant_whitelisted, evaluator_1-4, post_ttc_self/teacher, post_sahaj_self/teacher, outsider_non_admin) with data-collision seeds for integrity tests. This E2E persona architecture is not generalized in outputs.

---

## Source 4: Things Bridge Vision (THINGSBRIDGE_VISION.md)

### Well-covered in outputs
- Bidirectional daemon, not just monitoring → covered in DEEP_READ_FINDINGS.md corrections
- Auto-progression mechanism → described
- Decision cost framework → described

### Partially covered
- **Lock screen as dashboard** (6 phone widgets): mentioned but not extracted into a "design pattern for ambient agent monitoring" that could apply beyond Things.
- **Safety rails** (PR submission never auto, 48h compute cap, >50% failure pause, daily summary): listed in source but not extracted into a reusable "agent autonomy guardrails" reference.

### NOT covered at all
- **The 208 unused hotkey slots** (31 of 208 used = 15%): specific expansion capacity for client tags, skill tags, quality gates. Not in outputs.
- **Breaking point analysis**: when Things hits its limits (100+ repos) and what replaces it (custom app). Not captured as a scaling plan.
- **Telegram as interrupt channel vs Things as ambient dashboard**: the dual-channel architecture principle. Not extracted.

---

## Source 5: System Map (SYSTEM_MAP.md)

### Well-covered in outputs
- Circular economy (freelance → skills → agents → more freelance) → `moltwork-platform-context.md`
- 3-layer pattern (Mind/Memory/Intellect) → round files
- Economic model (GLM free, Claude Max, GPT Pro shared) → `agent-career-ladder.md` partially
- Monetization stack → `moltwork-platform-context.md` partially

### NOT covered at all
- **Plugin Bridge transformation** (SKILL.md → PLUGIN discovery node → ACTION CARD): the exact 3-step transformation. Round 6 documents it but no output file formalizes it as a process.
- **L0-L3 token budgets** (L0=4K, L1=8K, L2=12K, L3=16K): specific token allocations per agent level. Not in any output file.
- **Claude Code Proxy as MITM router**: Go shim routing Haiku/Sonnet calls to GLM. Described in source but not captured in outputs as operational infrastructure.
- **The stealth strategy milestones** (manual cards → auto cards → 10+ projects → local model at 80% of frontier): not formalized in outputs.
- **Production model branches** (staging/production/main with specific rules): not captured.

---

## Source 6: Vision Gap Analysis (VISION_GAP_ANALYSIS.md)

### Well-covered in outputs
- The feedback loop being broken at readMessages → mentioned in `moltwork-platform-context.md` NOT YET BUILT section

### NOT covered at all
- **First client delivery end-to-end workflow**: "Who gets notified? What agent starts? Where is work done? How is payment collected?" — the GAP itself is not captured as a to-do or design task in outputs.
- **Skill rollback protocol**: what happens when a skill makes things WORSE. Dolt supports versioning but no rollback process exists. Not in outputs.
- **Skill sync delay problem**: Agent A discovers gap, human writes skill, Agent B on another machine doesn't get it until next daily sync. Acceptable? Not discussed in outputs.
- **GLM rate limit is unmeasured**: "the foundation of the economic model and it's unmeasured." Not captured.
- **Architect session continuity fragility**: what happens when the architect session resets. Not in outputs.
- **Competitive landscape**: who else builds agent skill marketplaces. Not captured.

---

## Source 7: Operator Handbook (01-start-here.md, Russian)

### Well-covered in outputs
- Moderator role (approve/reject/escalate) → `moltwork-platform-context.md` captures this accurately

### NOT covered at all
- **Red flags checklist** (off-topic, ignored client details, fabricated facts, harmful text, unconfirmed promises, missing next step, unaddressed conflicts): this operational checklist is production-ready content that should be a reference file, not just in Russian handbook.
- **The golden rule**: "If unsure whether draft is safe to send, DON'T send it. Escalate." Not captured as a principle in English outputs.

---

## Source 8: System Workflow Handbook (02-how-the-system-works.md, Russian)

### Well-covered in outputs
- Round-robin assignment, SLA (30 min), auto-reassignment → `moltwork-platform-context.md`

### NOT covered at all
- **3-reject auto-escalation rule**: after 3 reject→retry cycles on one draft, system auto-escalates to Expert queue. Not captured as a design pattern.
- **Max 5 concurrent reviews per moderator**: capacity constraint. Not in outputs.
- **Automatic tracking** ("no manual reports, spreadsheets, or handoff notes required"): the principle of zero-overhead tracking. Not extracted.
- **Bot commands** (/start, /help, /mystats, /queue, /pause, /resume): operational interface. Not in outputs as a reference.

---

## Sources 9-20: Round Files (1-12, A-H) + bigidea.md

### Well-covered in outputs
- Rounds 1-4 (vision, skill factory, OpenClaw, connection matrix) → well-synthesized into `moltwork-platform-context.md`, `agent-career-ladder.md`, `dark-factory-roadmap.md`
- Rounds 5-6 (Things Bridge, plugin bridge) → partially in `humanlayer-rpi-reference.md` context
- Round 7 (freelance as SaaS discovery) → mentioned in `moltwork-platform-context.md`
- Round 8 (architect role) → captured in principles across files

### Partially covered
- **39 pre-validated SaaS candidates** from freelance: mentioned but not extracted as actionable. No output file lists them or explains how to access them.
- **The rewind pattern** (backup → read candidates → select → discard selection → restore → inject): described in Round 6 and Round 12 but only partially captured in `context-checkpoint-rewind.md` (which covers the simpler model-switch version, not the full KV cache preservation technique).

### NOT covered at all
- **Bigidea.md** (Russian): architect-as-computer-user concept — periodic screenshots of orchestrator terminal → OCR → feed to architect. Three implementation levels (screenshot+OCR, tmux sharing, JSONL trajectory parsing). The JSONL parsing approach connects to ARCHITECT_AS_OBSERVER.md but bigidea.md's specific framing of "replicating the human" watching a screen is unique and not captured.
- **Round 12 hotkey system**: 100 hotkeys × skills = billion tokens accessible in <1 second. The MNEMONIC concept (brain holds pointer, not knowledge). Russian+English alphabet addressing (118 single-keystroke addresses). Not in any output file.
- **Round A git-as-source-of-truth pattern**: Desktop → Documents → git commit → next session reads from Documents. The specific workflow for session persistence. Not captured.
- **Round B dual-track planning**: summarization agent (autonomous batch) vs revenue orchestrator (stateful, time-sensitive) running in parallel on different compute. The PATTERN of two agent types with different properties working simultaneously. Not captured.
- **Rounds C-H summarization pipeline**: GLM batch dispatch, sizing specs (2-level hierarchy, 30% compression, 100-token 0/ tier, 89.9% savings), validated prompt, validation-before-autonomy principle. None of this is in output files.
- **Round D decision**: build for both us AND the product (option C) — the principle that our own fleet needs drive generalizable product design. Not captured.
- **Using Tags and shortcuts.md**: Things app keyboard shortcuts (Ctrl+key for tags, Ctrl+Opt+key for filters). Raw reference material for implementing the Things Bridge tag system. Not integrated.

---

## Architect-47 Drafts — Additional Gaps from Deep Reads

### NOT covered in outputs
- **TRAJECTORY_FORMAT.md**: exact JSONL schema for Claude Code sessions (4 record types, token economy fields, session file location pattern). Operational infrastructure not in any output.
- **SYSTEM_MAP_REVIEW.md**: 12 gap fixes including Learnability Contract (run_id + trajectory_id + context_snapshot_id), Delegation Trust Decay formula (1/time²), Anti-fragile Design principle. None in outputs.
- **LARGE_ARTIFACTS_FINDINGS.md**: specific revenue targets ($5-10k/mo freelance, $2-5k/mo SaaS, $3-8k/mo education, $50-200/client platform). Operating mode targets (80/15/5 → 20/30/50). Three blocking unimplemented skills (client-communication, project-scoping, proposal-generation). Convergence = 2 consecutive clean rounds. None in outputs.
- **CAPABILITY_REGISTRY.md**: complete inventory of what's built, what's running, what's down. Sprint 2 PR status. Not in outputs (and would be stale, but the REGISTRY PATTERN is worth capturing).

---

## Top 10 Actionable Gaps (Priority Order)

1. **Revenue targets and blocking skills** — CLOSED. Written to `revenue-targets-and-blocking-skills.md`.

2. **Summarization pipeline specs** — CLOSED. Written to `summarization-pipeline-specs.md`.

3. **Plugin bridge transformation** — CLOSED. Written to `plugin-bridge-transformation.md` (incl. L0-L3 token budgets).

4. **Parity testing as a reusable skill** — CLOSED. Written to `parity-testing-skill-draft.md`.

5. **Session economics and git-as-memory** — CLOSED. Written to `session-economics.md`.

6. **Agent autonomy guardrails** — CLOSED. Written to `agent-autonomy-guardrails.md` (incl. worker isolation, daily summary, hold override).

7. **Moderator red flags checklist** — CLOSED. Written to `moderator-red-flags-checklist.md`.

8. **L0-L3 token budgets** — CLOSED. Included in `plugin-bridge-transformation.md`.

9. **Hotkey mnemonic system** — DEFERRED. Part of things-interaction-design.md, needs dedicated session.

10. **First client delivery workflow** — CLOSED. Written to `first-client-delivery-workflow.md`.

### Additional gaps closed via opus-channel extraction (2026-04-07)

- **TZ interview full skill** — CLOSED. `tz-interview-skill.md` rewritten with offline prep, focus agent, team mode, convergence, two improvement loops.
- **Context collection pattern** — CLOSED. New `context-collection-pattern.md`.
- **Subscription optimization** — CLOSED. New `subscription-optimization.md`.
- **Moderator mechanics** — CLOSED. Added to `moltwork-platform-context.md` (cascade, opt-out, quiet hours, origin story).
- **Context checkpoint exact procedure** — CLOSED. `context-checkpoint-rewind.md` updated.
- **UAT two-dimensional convergence** — CLOSED. Added to `dark-factory-roadmap.md`.
- **Things interaction design** — DEFERRED. Needs dedicated session for filesystem mirror, proposal mode, human-as-router.
