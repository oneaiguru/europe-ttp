# File Reviews — Feedback from Gap Analysis Session

## parity-testing-skill-draft.md — CLEAR, minor additions

**Verdict: Good. Covers the gap well.** The 14 checkpoints, persona architecture, collision seeds, and test pattern are all solid.

**Missing from gap analysis sources:**

1. **Side-by-side methodology not captured.** The GPT chat describes running ChatGPT Agent Mode against BOTH Python and TS deployments simultaneously with identical data. Your draft assumes testing only the new system. Add a section:
   ```
   ## Side-by-Side Verification (optional)
   When legacy system is deployable: run same persona through both systems,
   compare responses field-by-field. Divergence = either regression or
   intentional improvement (must be tagged which).
   ```

2. **Form completeness parity trap missing.** GPT chat warns: legacy derives completeness from blank/non-blank values, not schema-required. If TS "improves" this, reporting changes silently. Add to checkpoint 4 or as a warning box.

3. **Timezone normalization.** GPT chat flags: legacy uses Eastern inconsistently. Worth one line in the checklist: "Verify timezone handling matches legacy (Eastern for deadlines) or document the change."

4. **Whole-user blob concurrency.** Legacy stores all user data as one JSON blob. Photo upload and form save can overwrite each other. Worth noting as "legacy behavior to NOT replicate — use proper transactional updates."

5. **Evidence contract missing.** GPT chat specifies what the AI tester must RETURN per scenario: pass/fail, screenshot, request/response evidence, DB diff, mail sink evidence, report-row before/after, root-cause guess, failure classification (UI/API/data/auth/aggregation). Your draft has "results to per-bundle markdown" but doesn't specify the evidence contract. Consider adding it — it's what prevents fluffy "looks good" reports.

---

## agent-autonomy-guardrails.md — CLEAR AND COMPLETE

**Verdict: This is tight.** Four categories (hard limits, soft limits, data safety, convergence) are well-structured.

**One addition from sources:**

1. **Daily summary always surfaces** (from Things Bridge vision safety rails). Even when auto-progression is running and human is away, system produces a daily summary. This ensures the human can't lose awareness for more than 24h. Add under hard limits:
   ```
   7. **Daily summary mandatory** — even in full auto-progression, system produces
      daily digest of what happened, what's pending, what failed
   ```

2. **Hold tag override** (from Things Bridge auto-progression spec): human can tag any task `hold` to prevent auto-progression. This is the escape hatch for the soft limits. Worth one line:
   ```
   5. **Hold override**: any task tagged `hold` stops auto-progression regardless of deadline
   ```

Otherwise this file is clean — nothing missing that the gap analysis flagged.

---

## next-session-prompt.md — FEEDBACK

**Verdict: Functional but has stale paths.**

**Issues:**

1. **Source material paths are wrong.** Lines 54-58 reference `/Users/m/Downloads/voicenotes.md` and `/Users/m/Desktop/dl7/ru.md` which DON'T EXIST. Correct paths:
   - `/Users/m/Desktop/en.md` — English voice notes
   - `/Users/m/Desktop/ru.md` — Russian original

2. **Missing B06/B07 bundles.** Section 3 mentions "Rerun all 5 bundles for clean 44/44" but doesn't mention B06 (admin) and B07 (reports) specifically. These are the hardest bundles — worth calling out.

3. **No mention of the documentation-gaps top 10.** Section 4 lists "remaining high-priority gaps to write" but only 3. The gap analysis identified 10. The next session should see the full prioritized list, not a subset.

**Questions for the user (if relevant):**

- Is Alexei handoff (section 5) still the goal for next session, or has priority shifted to documentation gaps?
- Should the next session also address the `first-client-delivery-workflow.md` gap (#10 in the top 10)? That's the "single most important operational gap" per the vision gap analysis.
- The `composable-migration-service.md` exists but doesn't incorporate the GPT chat's detailed E2E test plan (8 phases, 40+ scenarios). Should next session merge those?
