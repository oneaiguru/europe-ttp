A few task-file fixes are still worth making. I would not change the plan; I would change the decomposition.

1. **[P1] Group 7 is not actually parallel-safe**
   - [`TASK_ORDER.md:62`](/Users/m/ttp-split-experiment/.agent/tasks/TASK_ORDER.md#L62)-[`67`](/Users/m/ttp-split-experiment/.agent/tasks/TASK_ORDER.md#L67) says all four Phase 5 tasks can run in parallel.
   - But [`task-5-admin-wiring.md:30`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L30)-[`31`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L31) and [`task-5-admin-wiring.md:91`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L91)-[`101`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L91) both write `app/utils/admin-helpers.ts`.
   - Also Task 1 and Task 3 both touch the same admin page route files at [`task-5-admin-wiring.md:22`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L22)-[`24`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L24) and [`task-5-admin-wiring.md:137`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L137)-[`145`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L145).
   - I’d sequence `5.1 -> 5.2 -> 5.3`, and let `5.4` run separately.

2. **[P1] `task-4-route-wiring.md` has broken relative import snippets**
   - [`task-4-route-wiring.md:32`](/Users/m/ttp-split-experiment/.agent/tasks/task-4-route-wiring.md#L32)-[`33`](/Users/m/ttp-split-experiment/.agent/tasks/task-4-route-wiring.md#L33), [`48`](/Users/m/ttp-split-experiment/.agent/tasks/task-4-route-wiring.md#L48)-[`49`](/Users/m/ttp-split-experiment/.agent/tasks/task-4-route-wiring.md#L48), and [`68`](/Users/m/ttp-split-experiment/.agent/tasks/task-4-route-wiring.md#L68)-[`69`](/Users/m/ttp-split-experiment/.agent/tasks/task-4-route-wiring.md#L68) use `../../../../utils/...`.
   - For those files, the correct depth is `../../../../../utils/...`.
   - This is exactly the kind of copy-paste handoff bug that will waste an agent cycle.

3. **[P1] The user-report task still diverges from the plan**
   - The plan says [`golden-forging-marble.md:308`](/Users/m/.claude/plans/golden-forging-marble.md#L308) `get-user-application` returns raw form-data JSON.
   - But [`task-5-admin-wiring.md:173`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L173)-[`224`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L224) tells the agent to build full HTML rendering for that route.
   - Since the plan is your source of truth, the task file should match the plan exactly here.

4. **[P1] Phase 5.1 under-specifies the reports-page `ttcCountryAndDates` work**
   - The plan explicitly calls out the reports route’s hardcoded `ttcCountryAndDates: '[]'` at [`golden-forging-marble.md:271`](/Users/m/.claude/plans/golden-forging-marble.md#L271)-[`275`](/Users/m/.claude/plans/golden-forging-marble.md#L275).
   - [`task-5-admin-wiring.md:24`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L24) notices that, but [`task-5-admin-wiring.md:72`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L72) only instructs replacing `DEFAULT_TTC_LIST_HTML`.
   - I’d explicitly say: summary/integrity get `html`, reports gets both `html` and `json`.

5. **[P2] The decomposition is missing an owner for Phase 5.5 validation**
   - The plan has a real rollout step at [`golden-forging-marble.md:315`](/Users/m/.claude/plans/golden-forging-marble.md#L315)-[`316`](/Users/m/.claude/plans/golden-forging-marble.md#L316): validate real data shape against what the UI expects.
   - But [`TASK_ORDER.md:80`](/Users/m/ttp-split-experiment/.agent/tasks/TASK_ORDER.md#L80) stops at `5.4`; there is no task for `5.5`.
   - I’d add a small final verification task, or append it explicitly to `task-5-admin-wiring.md`.

6. **[P2] The plan’s known fixture fix also has no owner**
   - The plan explicitly says to fix `test/fixtures/test-config.json` at [`golden-forging-marble.md:375`](/Users/m/.claude/plans/golden-forging-marble.md#L375)-[`376`](/Users/m/.claude/plans/golden-forging-marble.md#L376).
   - None of the task files currently assign that.
   - I’d either add a tiny verification/fixtures task or fold it into the new `5.5` task.

7. **[P3] Timestamp return keys drift from the plan**
   - The plan uses `user_summary_last_updated_datetime` / `user_integrity_last_updated_datetime` at [`golden-forging-marble.md:280`](/Users/m/.claude/plans/golden-forging-marble.md#L280)-[`281`](/Users/m/.claude/plans/golden-forging-marble.md#L281).
   - [`task-5-admin-wiring.md:93`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L93)-[`95`](/Users/m/ttp-split-experiment/.agent/tasks/task-5-admin-wiring.md#L95) uses camelCase names.
   - Easy consistency cleanup.

What looks good:
- **Group 1 still looks clean to run in parallel.** [`TASK_ORDER.md:7`](/Users/m/ttp-split-experiment/.agent/tasks/TASK_ORDER.md#L7)-[`11`](/Users/m/ttp-split-experiment/.agent/tasks/TASK_ORDER.md#L11) are genuinely disjoint new-file tasks.
- The decomposition is close; the remaining issues are mostly handoff quality and sequencing, not architecture.

So my recommendation is:
1. Keep the plan unchanged.
2. Patch the task files and `TASK_ORDER.md` for the 7 points above.
3. Then I’d be comfortable with the first parallel group going out.