#!/usr/bin/env bash
# Wrapper script to push to GitHub and trigger Codex bot review
# Usage: ./scripts/trigger-review.sh

set -euo pipefail

BRANCH="session/8b7771dc-1f9e-480a-8645-dc2a724578dd"
REPO="oneaiguru/europe-ttp"

echo "=========================================="
echo "Triggering GitHub Review for Codex Bot"
echo "=========================================="
echo ""

# Step 1: Push to GitHub remote
echo "Step 1: Pushing to GitHub..."
if git push github "$BRANCH" --force-with-lease; then
    echo "✓ Push successful"
else
    echo "⚠ Push failed - you may need to retry when network is stable"
    echo "  Run: git push github $BRANCH"
    exit 1
fi

echo ""

# Step 2: Create or update PR to trigger Codex bot
echo "Step 2: Creating/updating PR to trigger Codex bot..."
PR_TITLE="Complete TypeScript migration, security hardening, and BDD infrastructure"
PR_BODY=$(cat <<'EOF'
## Summary
Comprehensive TypeScript migration with security hardening and BDD infrastructure improvements.

## Major Changes
- **Remove all legacy .js artifacts** (render files, BDD scripts, step registry)
- **Complete TypeScript conversion** for all routes and utilities
- **Security middleware** (CSP headers blocking eval/new Function)
- **Utility modules**: auth, crypto, pdf, request
- **Upload verification endpoint** with timing-safe token validation
- **Deterministic PDF generation** with BDD tests

## Security Fixes
- Remove experimental/jsPDF-master (vulnerable PDF.js library)
- Add CSP middleware preventing dynamic code execution
- Harden upload token verification (timing-safe comparisons)
- Add session token hardening documentation

## BDD Infrastructure
- Add comprehensive task documentation (plan/research/task triples)
- Add new feature files: upload_form_body_size, upload_api_auth, deterministic_pdf
- Add TypeScript BDD steps: deterministic_pdf_steps
- Add test fixtures and utilities
- Update step registry with new patterns

## Testing
- All BDD tests passing
- Step registry aligned
- Type checking clean
- ESLint passing

## Request
@codex-bot please review this changeset for:
- Security vulnerabilities
- Code quality
- Test coverage
- Documentation completeness

EOF
)

# Try to create PR or update existing one
if gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base main 2>/dev/null; then
    echo "✓ PR created successfully"
elif gh pr edit "$BRANCH" --body "$PR_BODY" 2>/dev/null; then
    echo "✓ PR updated successfully"
else
    echo "⚠ Could not create/update PR via gh CLI"
    echo "  Please create PR manually at: https://github.com/$REPO/compare/main...$BRANCH"
fi

echo ""
echo "=========================================="
echo "Review trigger complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Codex bot should review the PR automatically"
echo "2. For local review, run: ./scripts/loop_mix.sh review"
echo "3. Check PR status at: https://github.com/$REPO/pulls"
echo ""
