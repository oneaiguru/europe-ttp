# cca Diagnostic Results — 2026-04-06

## Summary

**The `--setting-sources local` flag is the culprit.** Removing it allows skills to load (70), but with it present, skills don't load (8).

## Test Results

| Test | Command | Skills Loaded | Conclusion |
|------|---------|---|---|
| A | Without `--setting-sources local` | **70** ✓ | This works |
| B | With `--setting-sources local` + explicit env var | **8** ✗ | Flag blocks skills |
| C | No env unsetting, with budget | **70** ✓ | Unsetting Anthropic vars is not the issue |
| D | Explicit `--model sonnet` | **70** ✓ | Model not the issue |

## Root Cause

The `cca` alias includes `--setting-sources local` which restricts Claude Code to loading settings from the local settings file ONLY. This flag appears to prevent Claude Code from reading `SLASH_COMMAND_TOOL_CHAR_BUDGET` from the environment, causing the budget to remain at the default 8K.

**The fix: Remove `--setting-sources local` from the `cca` alias.**

## Updated cca alias (proposed fix)

Current (broken):
```bash
env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_DEFAULT_OPUS_MODEL -u ANTHROPIC_DEFAULT_SONNET_MODEL -u ANTHROPIC_DEFAULT_HAIKU_MODEL claude --dangerously-skip-permissions --setting-sources local --settings ~/.claude/settings.anthropic.json
```

Proposed fix:
```bash
env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_DEFAULT_OPUS_MODEL -u ANTHROPIC_DEFAULT_SONNET_MODEL -u ANTHROPIC_DEFAULT_HAIKU_MODEL claude --dangerously-skip-permissions --settings ~/.claude/settings.anthropic.json
```

(Remove `--setting-sources local`)

## Next Step

User should update the `cca` alias in `~/.zshrc` or wherever it's defined, then test: `echo "List every skill name, one per line." | cca -p | wc -l` — should show ~70.
