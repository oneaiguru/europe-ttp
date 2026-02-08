# TASK-092: fix-loop-mix-review-prompt-path - Implementation Plan

## Summary
Fix the review prompt path in `loop_mix.sh` and `loop_mix_pretty.sh` to correctly reference `docs/review/REVIEW_DRAFTS.md` instead of the non-existent `docs/review/REVIEW_PROMPT.md`.

## Changes Required

### 1. scripts/loop_mix.sh
- **Line 27**: Change `PROMPT_FILE="docs/review/REVIEW_PROMPT.md"` to `PROMPT_FILE="docs/review/REVIEW_DRAFTS.md"`

### 2. scripts/loop_mix_pretty.sh
- **Line 32**: Change `PROMPT_FILE="docs/review/REVIEW_PROMPT.md"` to `PROMPT_FILE="docs/review/REVIEW_DRAFTS.md"`

## Implementation Steps

1. Edit `scripts/loop_mix.sh` line 27:
   - Replace `docs/review/REVIEW_PROMPT.md` with `docs/review/REVIEW_DRAFTS.md`

2. Edit `scripts/loop_mix_pretty.sh` line 32:
   - Replace `docs/review/REVIEW_PROMPT.md` with `docs/review/REVIEW_DRAFTS.md`

## Verification

After making changes, verify with:

```bash
# Check that the scripts can find the review file
bash scripts/loop_mix.sh review --help 2>&1 | head -20
bash scripts/loop_mix_pretty.sh review --help 2>&1 | head -20

# Or manually verify the file exists
test -f docs/review/REVIEW_DRAFTS.md && echo "REVIEW_DRAFTS.md exists"
```

## Risks / Rollback

- **Risk**: Low - single-line changes to path variables
- **Rollback**: Revert the two lines to `docs/review/REVIEW_PROMPT.md` if needed

## Notes

- The actual review backlog file is `REVIEW_DRAFTS.md` (17KB)
- Both scripts were created assuming `REVIEW_PROMPT.md` which doesn't exist
- This change only affects the "review" mode of both scripts
