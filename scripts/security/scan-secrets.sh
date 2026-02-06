#!/bin/bash
# Scan for potential secrets in the repository
# Usage: ./scripts/security/scan-secrets.sh

set -e

echo "=========================================="
echo "Secrets Scan - Europe TTP Repository"
echo "=========================================="
echo ""

FOUND=0

echo "1. Scanning for SendGrid API keys (SG.*)..."
SG_RESULTS=$(git grep -n "SG\.[a-zA-Z0-9_-]\{20,\}" -- '*.py' '*.yaml' '*.html' '*.js' '*.md' 2>/dev/null | grep -v "SG.REDACTED" || true)
if [ -n "$SG_RESULTS" ]; then
    echo "   ❌ FOUND:"
    echo "$SG_RESULTS"
    FOUND=1
else
    echo "   ✓ No SendGrid keys found (only placeholders)"
fi
echo ""

echo "2. Scanning for Google API keys (AIza*)..."
GOOGLE_RESULTS=$(git grep -n "AIza[A-Za-z0-9_-]\{28,\}" -- '*.py' '*.yaml' '*.html' '*.js' '*.md' 2>/dev/null | grep -v "AIza.REDACTED" | grep -v "experimental/" || true)
if [ -n "$GOOGLE_RESULTS" ]; then
    echo "   ❌ FOUND:"
    echo "$GOOGLE_RESULTS"
    FOUND=1
else
    echo "   ✓ No Google API keys found (only placeholders)"
fi
echo ""

echo "3. Scanning for Harmony keys..."
HARMONY_RESULTS=$(git grep -n "56499d8fcaa45b2d" -- '*.py' '*.yaml' '*.html' '*.js' '*.md' 2>/dev/null | grep -v "HARMONY.REDACTED" || true)
if [ -n "$HARMONY_RESULTS" ]; then
    echo "   ❌ FOUND:"
    echo "$HARMONY_RESULTS"
    FOUND=1
else
    echo "   ✓ No Harmony keys found (only placeholders)"
fi
echo ""

echo "4. Scanning for service account filenames with embedded key IDs..."
SA_RESULTS=$(git grep -n "artofliving-ttcdesk-dev-[a-f0-9]\{12\}\.json" -- '*.yaml' '*.py' 2>/dev/null | grep -v "REDACTED" || true)
if [ -n "$SA_RESULTS" ]; then
    echo "   ❌ FOUND:"
    echo "$SA_RESULTS"
    FOUND=1
else
    echo "   ✓ No service account filenames with embedded keys found"
fi
echo ""

echo "=========================================="
if [ $FOUND -eq 0 ]; then
    echo "✓ Secrets scan PASSED - No secrets found"
    echo "=========================================="
    exit 0
else
    echo "❌ Secrets scan FAILED - Secrets detected!"
    echo "=========================================="
    exit 1
fi
