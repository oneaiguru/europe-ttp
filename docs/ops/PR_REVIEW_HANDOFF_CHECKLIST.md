# PR Review Handoff Checklist (Stacked PRs)

## 0) Ground Truth
- **Source branch (full work):** `session/8b7771dc-1f9e-480a-8645-dc2a724578dd`
- **GitHub remote:** `github` (base: `github/main`)
- **Do NOT push to:** `origin` (local weaver bare remote)

## 1) Pre‑Flight
- Confirm `.claude-trace/` is ignored (already in `.gitignore`)
- Read `docs/ops/PR_REVIEW_PLAN.md`
- Use stacked PRs (PR‑00 → PR‑01 → PR‑02 …)

## 2) PR‑00 (Plan + Guardrails)
- Scope: `AGENTS.md`, `CLAUDE.md`, `docs/ops/PR_REVIEW_PLAN.md`
- Base: `github/main`
- Target: `main`
- Open PR + request Codex review

## 3) PR‑01+ (Stacked)
- Each PR bases on the prior PR branch
- Use path‑based checkout from the session branch
- Run only the tests specified for that PR slice
- Push to `github` remote, open PR targeting previous PR branch

## 4) After Reviews
- Merge in order
- Compare Python/legacy review feedback to TS parity
- Open fix PRs if any TS behavior diverges
