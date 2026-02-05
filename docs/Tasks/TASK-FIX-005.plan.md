# TASK-FIX-005: Implementation Plan

## Summary
**Research Conclusion: No code fix needed.** Cucumber.js v11.1.0 correctly expands Scenario Outline examples. The 9-scenario "gap" was due to an incorrect verification script using `keyword=='Scenario'` instead of `type=='scenario'`.

## What Needs to Be Done

### 1. Update Verification Scripts
Fix the counting method in any documentation/scripts that use the wrong field.

**Files to update:**
- `docs/Tasks/TASK-FIX-005.task.md` - Update the verification commands

**Change:**
```bash
# OLD (incorrect - filters out expanded examples)
python3 -c "import json; t=json.load(open('test/reports/typescript_bdd.json')); print(sum(1 for f in t for e in f.get('elements',[]) if e.get('keyword')=='Scenario'))"

# NEW (correct - counts all scenarios including expanded examples)
python3 -c "import json; t=json.load(open('test/reports/typescript_bdd.json')); print(sum(1 for f in t for e in f.get('elements',[]) if e.get('type')=='scenario'))"
```

### 2. Verify Current State
Run the corrected verification to confirm parity:

```bash
bun run bdd:all
python3 << 'EOF'
import json
with open('test/reports/python_bdd.json') as f:
    py = sum(1 for feat in json.load(f) for el in feat.get('elements', []) if el.get('type') == 'scenario')
with open('test/reports/typescript_bdd.json') as f:
    ts = sum(1 for feat in json.load(f) for el in feat.get('elements', []) if el.get('type') == 'scenario')
print(f'Python: {py} scenarios')
print(f'TypeScript: {ts} scenarios')
print(f'Match: {"✓" if py == ts else "✗"}')
EOF
```

### 3. Document the Correct Counting Method
Create or update documentation showing the proper way to count scenarios:
- Use `type=='scenario'` for counting
- Both Python and TypeScript keep `keyword='Scenario Outline'` for expanded examples
- Python adds `-- @1.1` suffix to distinguish examples

### 4. Clean Up
- Mark task as complete in tracking documents
- Remove `docs/Tasks/ACTIVE_TASK.md`

## Acceptance Criteria
- [ ] Verification script in TASK-FIX-005.task.md uses correct `type=='scenario'` field
- [ ] Running verification confirms Python: 99, TypeScript: 99, Match: ✓
- [ ] No changes to `.cucumberrc.cjs` or `scripts/bdd/run-typescript.ts` needed
- [ ] Documentation updated with correct counting method
- [ ] Task marked complete and ACTIVE_TASK.md removed

## Test Commands
```bash
# Run all BDD tests
bun run bdd:all

# Verify scenario counts match
python3 << 'EOF'
import json
with open('test/reports/python_bdd.json') as f:
    py = sum(1 for feat in json.load(f) for el in feat.get('elements', []) if el.get('type') == 'scenario')
with open('test/reports/typescript_bdd.json') as f:
    ts = sum(1 for feat in json.load(f) for el in feat.get('elements', []) if el.get('type') == 'scenario')
print(f'Python: {py} scenarios')
print(f'TypeScript: {ts} scenarios')
print(f'Match: {"✓" if py == ts else "✗"}')
EOF
```

## Notes
- This is a **documentation/verification fix only**
- Cucumber.js v11.1.0 is working correctly
- Behave (Python) is also working correctly
- The JSON output format differences are expected behavior between the two tools
