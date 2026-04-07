# Prompt Improvement Registry — Draft Idea

## Core concept
Every skill prompt produces outputs. When an output needs correction
(by gap closure, human, or stronger model), that correction is a data point.
Two similar corrections = escalate into the working prompt.

## How it works (waste-less version)

The data comes from the normal workflow — no extra eval runs needed.

1. Agent produces output using skill prompt X
2. Later step (gap closure / human / different model) corrects the output
3. The correction is logged: `{skill, prompt_version, correction_type, description}`
4. After the correction, agent sees the registry of previous corrections
5. Agent classifies: "novel" or "similar to entry #N"
6. If similar → increment count on that entry
7. When count >= 2 → propose prompt update, test on next real task

## Key design choices

- Show registry AFTER the correction, not before (avoid anchoring)
- Registry is a simple markdown file per skill — no infrastructure
- Measurement: does the updated prompt catch the issue on the next real task?
- No synthetic evals — the normal work IS the eval

## Applies to ALL skill prompts, not just code review

- TZ interview prompt → corrections from questions we had to ask later
- Planning prompt → corrections from plan reviewer findings
- Decomposition prompt → corrections when task files confused GLM
- Review prompt → corrections from second reviewer catches
- Implementation prompt → corrections from review findings

## Multi-angle review variant

Instead of one expensive Opus review, run N cheap GLM reviews with
different angle prompts. Each angle has its own registry. Improve
angles independently based on what they miss that others catch.

## Not yet implemented — mature when real correction data accumulates
