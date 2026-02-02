# Weaver Smoke Test

## Task
Create a simple verification file to confirm:
- Weaver can access the repository
- Codex can write files
- Authentication works
- File paths resolve correctly

## Action
Create file `docs/WEAVER_SMOKE.md` with content:

```markdown
# Weaver Smoke Test - PASSED

- Timestamp: [Current UTC timestamp in ISO 8601 format]
- Repository: /Users/m/git/clients/aol/europe-ttp
- Test: Successful file creation via coordinator
- Status: Connectivity verified

Next step: Submit first real build task.
```

## Success Criteria
- [ ] File created at docs/WEAVER_SMOKE.md
- [ ] File contains current UTC timestamp
- [ ] File contains repository path
- [ ] File is readable
