# Skill Loading Issue — Root Cause and Fix

## Problem Statement
The user has ~70 skills in `~/.claude/skills/*/SKILL.md` but only 6 appear to load automatically in Claude Code sessions:
- `simplify`
- `loop`
- `claude-api`
- `update-config`
- `keybindings-help`
- `schedule`

Skills like `opus-workflow` (critical for delegation protocol) and `spark-loop` exist on disk but are functionally invisible during new sessions.

## Root Cause (From GLM Research)

From `/Users/m/ttp-integrity-experiment/.agent/skill-loading-findings.md` (read during session):

**Discovery 1: Auto-discovery mechanism works correctly**
> "Claude Code auto-discovers skills by scanning `~/.claude/skills/*/SKILL.md` at session start. **No registration, settings.json entry, or manifest is needed.** The filesystem IS the registry."

**Discovery 2: The character budget is the bottleneck**
> "All skill names + descriptions are injected into the system prompt. There is a **character budget** that defaults to **1% of the context window** (fallback: 8,000 characters). With 63 user skills totaling **30,178 characters** of descriptions alone, the budget is exceeded by ~4x."

**Discovery 3: Truncation causes invisibility**
> "When the budget is exceeded:
> - Descriptions get **truncated** to fit
> - Truncated descriptions may lose trigger keywords
> - Claude won't match truncated skills to user requests, making them *functionally* invisible even though they're 'loaded'"

**Discovery 4: Built-in skills are separate**
> "simplify, loop, claude-api, update-config are **bundled with Claude Code itself**, NOT user skills. They don't have SKILL.md files in `~/.claude/skills/`. They always appear because they ship with the product."

## Current Inventory

**Skill directories in `~/.claude/skills/`:**
From Glob output — 70 directories including:
- `opus-workflow/` (with references: codex-spark.md, glm-delegation.md)
- `spark-loop/`
- `glm-prompt-mastery/`
- `code-review-pipeline/`
- `loop-execution/`
- And 65+ others

**Total description characters:** ~30K (measured by GLM)
**Budget:** ~8K default
**Overflow:** ~22K over budget

## Recommended Fix

From `/Users/m/ttp-integrity-experiment/.agent/skill-loading-findings.md` §What Needs to Change:

**Option A: Shorten descriptions (recommended)**
> "The `description` field in SKILL.md frontmatter should be **under 100 characters**. Put trigger keywords in the first 80 chars so they survive truncation."

Example from current opus-workflow (265 chars):
```
Delegation protocol — preserve Opus context by delegating mechanical work to subagents and Spark. Triggers proactively when Opus is about to do mechanical tasks. Also triggers for "delegate", "use spark", "use haiku", "handoff", "cost pyramid", "delegation", "GLM".
```

Should be trimmed to ~95 chars:
```
Delegation protocol — delegate to subagents/Spark. Triggers: delegate, spark, haiku, handoff, GLM
```

**Option B: Increase the character budget**
> "Set environment variable in settings.json:
> ```json
> {
>   "env": {
>     "SLASH_COMMAND_TOOL_CHAR_BUDGET": "40000"
>   }
> }
> ```"

**Option C: Both (best)**
Shorten descriptions AND increase budget for maximum reliability.

## Implementation Steps

From the same findings:

1. **Trim all skill descriptions to ≤150 chars**, front-loading trigger keywords in first 80 chars
2. **Add to settings.json** (all profiles):
   ```json
   "SLASH_COMMAND_TOOL_CHAR_BUDGET": "40000"
   ```
3. **Prioritize critical skills** by giving them the shortest, most keyword-dense descriptions (e.g., opus-workflow, spark-loop)
4. **Clean up dead files** from `~/.claude/skills/`:
   - Remove `.md` review files that aren't skill files (not SKILL.md)
   - Clean up `.archive/` and `.backup/` directories (old SKILL.md files scanned unnecessarily)

## Additional Notes from GLM

> "`experiment-tracking` has an **empty description** (0 chars) — it will never trigger"
> 
> "5 non-skill files sit in `~/.claude/skills/` (`.md` review files) — these are noise"
> 
> "The frontmatter format only requires `description` (recommended); `name` defaults to directory name"

## Status in This Session

**Memory saved:** `/Users/m/.claude/projects/-Users-m-ttp-integrity-experiment/memory/feedback_skill_loading_budget.md` (in deleted worktree — re-save in new session)

**Priority:** Non-urgent, can be done during a natural pause in project work. It is a **cross-project improvement** affecting all Claude Code sessions, not specific to Europe TTP.

## References

- Research task: `/Users/m/ttp-integrity-experiment/.agent/glm-skill-loading-research.md`
- Findings file: `/Users/m/ttp-integrity-experiment/.agent/skill-loading-findings.md`
- GLM task ID: `b2dysucn8` (completed, output read during session)
