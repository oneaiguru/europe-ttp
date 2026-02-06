# TASK-INFRA-001: Fix Dependency Bootstrap For pnpm-lock.yaml

## Problem
The build prompt's dependency bootstrap snippet falls back to `npm ci` when `bun` is not available. This repo uses `pnpm-lock.yaml` and does not ship `package-lock.json`, so `npm ci` will fail in images/environments without `bun`.

This can cause runs to fail before the agent even reaches task intake (Role T), producing "test-only" or "unknown error" loops depending on the worker wrapper.

## Goal
Make dependency bootstrap lockfile-aware so a run can install dependencies deterministically regardless of whether `bun` is installed.

## Scope
- Update `/workspace/PROMPT_build.md` bootstrap snippet to:
  - Prefer `bun install` only when a bun lockfile exists.
  - Prefer `pnpm install --frozen-lockfile` when `pnpm-lock.yaml` exists.
  - Use `npm ci` only when `package-lock.json` exists.
  - Use `npm install` only as a last resort.

## Acceptance Criteria
- The snippet in `PROMPT_build.md` no longer suggests `npm ci` for this repo unless `package-lock.json` exists.
- A Weaver container without `bun` can still bootstrap dependencies using `pnpm-lock.yaml`.

