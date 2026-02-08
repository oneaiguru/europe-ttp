# PROMPT_multi_subagent_ts_only_reveiw

You are reviewing this repo. Do not implement code; review only.

This prompt defines a **repeatable, TS/JS-only, multi-subagent** review process. The **final output format must match the standard Stage 0 review report format** (P0→P3 findings with file:line evidence), while the **process** uses fixed subagent scopes and produces **review drafts** for the build loop.

## Review Mode

baseline: full scan of assigned scope.  
pr: review the current branch against its base (default branch) and focus on changed files plus impacted dependencies. Use diff only for scoping and still read current code.

Mode selection (local git only; deterministic):
1. If `REVIEW_MODE` is explicitly provided (env or prompt), obey it.
2. Determine default branch:
   - Prefer `git symbolic-ref refs/remotes/origin/HEAD` (strip `refs/remotes/origin/`).
   - Fallback: `main`.
3. If current branch != default branch, select `pr` mode with base = default branch.
4. Else select `baseline` mode.
5. If git metadata is unavailable, default to `baseline` and state the limitation.

## Scope (TS/JS-Only)

Include:
- `app/**` (TypeScript and any `.js` artifacts under `app/**`)
- `test/typescript/**`
- `test/bdd/**`
- `scripts/bdd/**`
- `experimental/**`
- `javascript/**`
- `specs/features/**` (`.feature` files only)
- Tooling/config: `package.json`, `bun.lock`, `tsconfig.json`, `eslint.config.js`, `.cucumberrc.cjs`, `cucumber.cjs`

Exclude:
- Python/legacy runtime sources (do not review): `**/*.py`, `test/python/**`, `pyutils/**`, `db/**`, `reporting/**`, etc.
- Secret hunting: do not do repo-wide credential scanning. Only call out **runtime-affecting** defaults/unsafe fallbacks (e.g., known default secrets used by code paths).

## Required Local Checks

Run and record results in `docs/review/TEST_RUN_LOG.md` (append a dated entry with commit hash):
- `bun run bdd:verify`
- `bun run bdd:typescript`
- `bun run typecheck`
- `bun run lint`

Optional (if you want full `AGENTS.md` test coverage): run `bun run bdd:python` too, but do not review Python code in this TS-only pass.

If you cannot run tests, say so and rely on the existing log. If the log is missing, call that out.

## Multi-Subagent Setup (Fixed Scopes)

Use **exactly these** five subagent scopes (do not auto-resplit):
1. **TS-A (Steps Core):** `test/typescript/**`
2. **TS-B (Experimental):** `experimental/**`
3. **TS-C (BDD Tooling/Registry):** `test/bdd/**`, `scripts/bdd/**`, `.cucumberrc.cjs`, `cucumber.cjs`
4. **TS-D (App Runtime + JS):** `app/**`, `javascript/**`
5. **TS-E (Features + Tooling):** `specs/features/**`, `package.json`, `bun.lock`, `tsconfig.json`, `eslint.config.js`

If your platform supports subagents, run them in parallel. If not, run them sequentially but keep the same boundaries and report each scope separately.

### Subagent Prompt Template (Copy/Paste)

Give each subagent the following prompt (fill in `MODE` and `SCOPE`):

```
You are a code reviewer.

Mode: <baseline|pr>. Do not change code.

Scope:
<INSERT YOUR ASSIGNED PATHS HERE>

Goal:
Deep dive for P0–P3 issues (P0 critical, P1 high, P2 medium, P3 low).
Focus on TS/JS correctness, determinism, security boundaries (authn/authz assumptions), race conditions, and missing tests.
Ignore Python and do not do secret/key hunting; only flag runtime-affecting unsafe defaults.

Output format (required):
- Findings ordered by severity (P0 → P3).
- Each finding must include file path + line reference.
- Be explicit about risk/impact and why it matters.
- Assumptions / open questions.
- Test gaps (what to add or re-run).
- Review mode + scope (state mode and list reviewed paths; call out exclusions).
- If no findings, say “No issues found” and mention residual risks.
- If you did not run tests, say so.

Notes:
- Read current code, not just diffs.
- If your scope is incomplete or missing files, call it out.
```

## Consolidation (Coordinator Responsibilities)

After subagents finish:
1. Merge and deduplicate findings across subagents.
2. Re-check severities (P0/P1/P2/P3) for consistency.
3. Produce the final review report using the required output format below.
4. Update `docs/review/REVIEW_DRAFTS.md`:
   - Add a new “Run Metadata (YYYY-MM-DD)” section (or update the existing top section) with:
     - repo path
     - `git rev-parse HEAD`
     - review mode + base branch if in `pr` mode
     - method: “5 parallel subagent scans with fixed scopes”
     - the five scopes listed above
     - local checks run + pass/fail summary
   - Add each actionable item as a **new entry under `## Pending`** using this format:
     - `Task: <slug>`
     - `Slug: <slug>`
     - `Goal: <one sentence>`
     - `Acceptance Criteria:` as a numbered list
     - `Evidence:` as `path:line` or `path:line-line` references
   - Do not move anything to `## Processed` in this prompt (that is handled by `PROMPT_review_plan.md` later).
   - Update/append the `## Evidence Map` section so every pending slug has an evidence list.

## Output Format (Final Response Required)

1. **Findings ordered by severity** (P0 → P3).
2. Each finding includes **absolute file path + line reference**.
3. **Assumptions / open questions**.
4. **Test gaps** (what to add or re-run).
5. **Review mode + scope**:
   - mode (`baseline` or `pr`)
   - branch/base (in `pr` mode)
   - list reviewed scopes (the five scopes)
   - explicit exclusions (Python/legacy)
6. **Review draft count**: `N` new Pending entries added.
7. **Total loop iterations**: recommend `N * 4` iterations for a T→R→P→I loop.
8. **Artifacts updated**: list changes made to `docs/review/REVIEW_DRAFTS.md` and `docs/review/TEST_RUN_LOG.md`.
