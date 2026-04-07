# TZ Interview Skill — Draft Idea

## What I understand (from voice notes)

TZ = техническое задание = requirements specification.
The human approves this before automation starts.

Key principle: ask the human as little as possible, yet enough
to avoid ambiguity later. Optimize for minimum human reading time.

## Two parallel outputs

1. **Human-facing summary** — short, only design choices and expected behavior.
   Example: "When I click Submit, the form saves to storage and I see a confirmation."
   No code details, no file paths, no implementation specifics.

2. **Agent-facing spec** — detailed technical document for planning and implementation.
   Includes: file paths, function signatures, data shapes, edge cases.
   Human never reads this. It's for agents only.

## The interview process

- Interviewer agent asks questions, builds both documents in parallel
- Each human answer expands both the summary and the detailed spec
- The interviewer converges when ALL design choices are covered
- Convergence test: "Could an agent implement this without asking the human anything else?"

## Self-improvement loop

After implementation, check: did we have to go back to the human for clarification?
If yes → the interview prompt missed something → improve the prompt for next time.
Two instances of the same missed question type → escalate into the interview prompt.

## WHAT I'M GUESSING (need clarification)

- Does the interviewer start from scratch or from an existing artifact (repo, PRD, legacy code)?
- Is the interviewer one agent or two (one asking questions, one building the spec)?
- The voice notes mention a "focus agent" during live interviews (speech recognition + 
  real-time question suggestions). Is that the same skill or a different one?
- The "interview tree" concept — pre-prepared branching questions based on answers.
  Is this for the TZ interview or for client expert interviews (different context)?
