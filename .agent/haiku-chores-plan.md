# Haiku Chores Plan — Skill Budget Documentation + cca Diagnostic

> Created by Opus, 2026-04-06. Execute these tasks in order. Each produces a specific file or edit.

---

## Task 1: Diagnose why `cca -p` doesn't load user skills

**Context**: `c -p` (GLM) loads 70 skills. `cca -p` (Anthropic) loads only 6 built-in skills. Both have `SLASH_COMMAND_TOOL_CHAR_BUDGET=40000` in the shell env (confirmed via `echo $SLASH_COMMAND_TOOL_CHAR_BUDGET`).

The `cca` alias is:
```
env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_DEFAULT_OPUS_MODEL -u ANTHROPIC_DEFAULT_SONNET_MODEL -u ANTHROPIC_DEFAULT_HAIKU_MODEL claude --dangerously-skip-permissions --setting-sources local --settings ~/.claude/settings.anthropic.json
```

**Run these tests in order, report results of each:**

```bash
# Test A: cca WITHOUT --setting-sources local (is that flag the culprit?)
echo "List every skill name, one per line." | env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_DEFAULT_OPUS_MODEL -u ANTHROPIC_DEFAULT_SONNET_MODEL -u ANTHROPIC_DEFAULT_HAIKU_MODEL claude -p --dangerously-skip-permissions --settings ~/.claude/settings.anthropic.json 2>&1 | wc -l

# Test B: cca with --setting-sources local BUT explicit env var passed
echo "List every skill name, one per line." | env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_DEFAULT_OPUS_MODEL -u ANTHROPIC_DEFAULT_SONNET_MODEL -u ANTHROPIC_DEFAULT_HAIKU_MODEL SLASH_COMMAND_TOOL_CHAR_BUDGET=40000 claude -p --dangerously-skip-permissions --setting-sources local --settings ~/.claude/settings.anthropic.json 2>&1 | wc -l

# Test C: plain claude -p with Anthropic settings but NO env unsetting
echo "List every skill name, one per line." | SLASH_COMMAND_TOOL_CHAR_BUDGET=40000 claude -p --dangerously-skip-permissions --settings ~/.claude/settings.anthropic.json 2>&1 | wc -l

# Test D: check if the model matters — use --model sonnet explicitly
echo "List every skill name, one per line." | SLASH_COMMAND_TOOL_CHAR_BUDGET=40000 claude -p --dangerously-skip-permissions --model sonnet 2>&1 | wc -l
```

**Expected outcome**: One of these tests will show ~70, identifying which flag/combination is causing the issue. Report the results in `/Users/m/ttp-split-experiment/.agent/cca-diagnostic-results.md`.

**If Test A shows ~70**: The fix is removing `--setting-sources local` from the `cca` alias, or understanding why it blocks the budget. Update `~/wiki/claude-code-provider-switching.md` with the finding.

**If all tests show 6**: The env var name `SLASH_COMMAND_TOOL_CHAR_BUDGET` may not be the correct mechanism for Anthropic-backed sessions. Research needed — check Claude Code docs or source.

---

## Task 2: Document in skill-ops

**File**: `~/.claude/skills/skill-ops/references/audit-descriptions.sh` — already exists, no changes needed.

**File to edit**: `~/.claude/skills/skill-ops/SKILL.md`

Add a new section BEFORE "## Key principles" (which starts around line 109):

```markdown
## Skill loading budget

Claude Code injects all skill names + descriptions into the system prompt. There is a character budget that defaults to ~1% of the context window (~8,000 chars). With 63+ skills totaling ~30K chars, the budget is exceeded and most skills become invisible (truncated descriptions lose trigger keywords).

**Current fix (2026-04-06):**
- `SLASH_COMMAND_TOOL_CHAR_BUDGET=40000` exported in `~/.zshrc`
- Also set in `env` blocks of all 4 settings files: `settings.json`, `settings.anthropic.json`, `settings.opus-anthropic.json`, `settings.glm.json`
- **Known issue**: `cca` alias with `--setting-sources local` may not respect this. See `~/wiki/claude-code-skill-budget.md` for diagnosis.

**To verify skills are loading**: `echo "List every skill name, one per line." | c -p | wc -l` — should show ~70.

**To audit description budget**: `bash ~/.claude/skills/skill-ops/references/audit-descriptions.sh`

**To revert**: Remove `export SLASH_COMMAND_TOOL_CHAR_BUDGET=40000` from `~/.zshrc` and from all `settings.*.json` env blocks.
```

Use the Edit tool. Do NOT rewrite the whole file.

---

## Task 3: Create wiki entry

**File to create**: `~/wiki/claude-code-skill-budget.md`

```markdown
# Claude Code Skill Loading Budget

**Date**: 2026-04-06
**Status**: Partially working (GLM confirmed, Anthropic under investigation)

## Problem

Claude Code scans `~/.claude/skills/*/SKILL.md` and injects all skill names + descriptions into the system prompt. A character budget (~1% of context window, ~8K default) truncates descriptions when exceeded. With 63 skills at 30,054 total description chars, most user skills were invisible.

## Root Causes Found

1. **Budget exceeded 3.75x**: 30K chars vs 8K budget
2. **Backup/archive noise**: `.backup/` and `.archive/` dirs inside skills/ added 21 extra SKILL.md files (~30K extra chars). Moved to `~/Documents/claude-skills-archive/`.
3. **6 nested duplicate dirs**: `bid-writing/bid-writing/` etc. Purged (git-tracked, safe).
4. **Settings fragmentation**: Budget env var was only in `settings.json` (GLM). Anthropic profiles (`settings.anthropic.json`, `settings.opus-anthropic.json`) had no budget.

## Fix Applied

```bash
# ~/.zshrc
export SLASH_COMMAND_TOOL_CHAR_BUDGET=40000
```

Also added to `env` blocks in:
- `~/.claude/settings.json`
- `~/.claude/settings.anthropic.json`
- `~/.claude/settings.opus-anthropic.json`
- `~/.claude/settings.glm.json`

## Verification

```bash
# GLM (confirmed working — 70 skills):
echo "List every skill name, one per line." | c -p | wc -l

# Anthropic (shows 6 — UNDER INVESTIGATION):
echo "List every skill name, one per line." | cca -p | wc -l
```

## Known Issue: cca alias

The `cca` alias uses `--setting-sources local` which may prevent Claude Code from reading the budget env var. Diagnostic pending — see `.agent/cca-diagnostic-results.md` in any recent working directory.

## How to Revert

1. Remove `export SLASH_COMMAND_TOOL_CHAR_BUDGET=40000` from `~/.zshrc`
2. Remove `"SLASH_COMMAND_TOOL_CHAR_BUDGET": "40000"` from all `~/.claude/settings.*.json` files

## Related

- Audit script: `~/.claude/skills/skill-ops/references/audit-descriptions.sh`
- Full proposal: `~/Downloads/review-20260406-123028.md`
- Skill-ops skill: `~/.claude/skills/skill-ops/SKILL.md`
- Provider switching: `~/wiki/claude-code-provider-switching.md`
```

---

## Task 4: Update the proposal file

**File**: `~/Downloads/review-20260406-123028.md`

Find the "Budget bump" subsection under "### Budget bump" and append after the last bullet:

```
- **Known issue (2026-04-06)**: `cca -p` (Anthropic provider via `--setting-sources local`) still shows only 6 built-in skills despite env var being set. `c -p` (GLM) confirms 70 skills load correctly. Diagnostic pending — the `--setting-sources local` flag in the `cca` alias is the prime suspect. See `~/wiki/claude-code-skill-budget.md`.
```

Also find the "Appendix E: Next Steps" section, item 4 ("Confirm Claude Code's skill discovery"), and replace it with:

```
4. **BLOCKING**: Diagnose why `cca -p` (Anthropic) doesn't load user skills despite `SLASH_COMMAND_TOOL_CHAR_BUDGET=40000` being set. Run diagnostic tests in `.agent/haiku-chores-plan.md` Task 1. This blocks any routing/merging work that assumes skills load uniformly across providers.
```

---

## Task 5: Verify all changes

After Tasks 1-4, run these checks:
1. `grep SLASH_COMMAND ~/.claude/skills/skill-ops/SKILL.md` — should find the new section
2. `cat ~/wiki/claude-code-skill-budget.md | head -5` — should show the header
3. `grep "Known issue" ~/Downloads/review-20260406-123028.md` — should find the amendment
4. `cat .agent/cca-diagnostic-results.md | head -10` — should have test results

Report results to the user.
