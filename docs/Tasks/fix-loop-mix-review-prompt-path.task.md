# TASK-092: fix-loop-mix-review-prompt-path

## Goal
Fix the review prompt path in loop_mix scripts to ensure they correctly reference the review drafts directory.

## Refs
- `scripts/loop_mix.sh`
- `scripts/loop_mix_pretty.sh`
- `docs/review/`

## Acceptance Criteria
- [ ] Both `loop_mix.sh` and `loop_mix_pretty.sh` use the correct path to review prompts
- [ ] The review prompt path is consistent across both scripts
- [ ] Scripts successfully find and use the review prompt file(s)
- [ ] `bun run lint` passes (if applicable)

## Files to Modify
- [ ] `scripts/loop_mix.sh`
- [ ] `scripts/loop_mix_pretty.sh`

## Test Commands
```bash
# Verify the scripts can find the review prompt
bash scripts/loop_mix.sh --help 2>&1 | head -20
bash scripts/loop_mix_pretty.sh --help 2>&1 | head -20
```

## Notes
- The review drafts are located in `docs/review/REVIEW_DRAFTS.md`
- Ensure scripts reference the correct relative path from their location in `scripts/`
