# TASK-092: fix-loop-mix-review-prompt-path - Research

## Problem Statement

Both `loop_mix.sh` and `loop_mix_pretty.sh` reference a non-existent review prompt path.

## Evidence

### File: scripts/loop_mix.sh
- **Line 27**: `PROMPT_FILE="docs/review/REVIEW_PROMPT.md"`
- This path is used when `MODE="review"` (line 26)

### File: scripts/loop_mix_pretty.sh
- **Line 32**: `PROMPT_FILE="docs/review/REVIEW_PROMPT.md"`
- This path is used when `MODE="review"` (line 31)

### Actual File in docs/review/
- `docs/review/REVIEW_DRAFTS.md` exists (17KB file)
- `docs/review/REVIEW_PROMPT.md` does NOT exist

## Root Cause

The scripts were created assuming a `REVIEW_PROMPT.md` file, but the actual review backlog is stored in `REVIEW_DRAFTS.md`. This causes the scripts to fail with "Error: docs/review/REVIEW_PROMPT.md not found" when run in review mode.

## Files to Modify

1. `scripts/loop_mix.sh` (line 27)
2. `scripts/loop_mix_pretty.sh` (line 32)

## Correct Path

Both scripts should use `docs/review/REVIEW_DRAFTS.md` instead of `docs/review/REVIEW_PROMPT.md`.
