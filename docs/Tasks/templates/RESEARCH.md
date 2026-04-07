# Research: <slug>

## Findings (file:line ranges or doc:section references)
- <path:line-range>
- <doc>:<section> (if no line-level source available)

## Evidence Map

Every claim in this research must cite a source.
Format: `<file>:<start_line>-<end_line>` or `<doc>:<section>`

| claim | source | verified |
|-------|--------|----------|
| <factual assertion> | <file:line-range> | yes/no |

## Constraint Inventory

Which architectural decisions and guardrails apply to this task domain.

- **ADR-NN**: <title> — <why it applies> (source: docs/prds/prds/ADR.md:<line>)
- **Guardrail [Section:keyword]**: <rule> — <why it applies> (source: docs/guardrails.md:<line>)
- **ADR-NN**: <title> — <why it applies> (source: docs/ADR.md:<line>)
- **Guardrail [Section:keyword]**: <rule> — <why it applies> (source: docs/guardrails.md:<line>, if exists)

Source: context pack `<pack-name>` loaded for this task.

## Drift Guards

Assertions that MUST remain true for this research to be valid.
If any guard fails, research is stale and must be re-run.

- [ ] `<file>` exists at `<path>`
- [ ] Function `<name>` has signature `<sig>` at `<file>:<line>`
- [ ] Table `<name>` has column `<col>` (per migration `<file>`)
- [ ] Type `<Name>` exported from `<package>`

## Context Pack

Pack(s) loaded: `<pack-name>`
Token estimate for this research artifact: ~<N> tokens
