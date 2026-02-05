# Research: bdd verify detect placeholder impls

## Task ID
bdd-verify-detect-placeholder-impls

## Investigation Findings

### Current `verify-alignment.ts` Implementation

The script at `scripts/bdd/verify-alignment.ts` currently checks:
1. All feature steps have registry entries
2. All registry entries have Python impl path
3. All registry entries have TypeScript impl path
4. Orphan steps (in registry but not in features)
5. Dead steps (in features but not in registry)

### Placeholder Detection Check

Let me search for common placeholder patterns in step definitions: