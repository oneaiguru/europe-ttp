# Playwright UAT Playbooks

## Overview
Playbooks are structured verification scripts for agents using Playwright MCP tools. Each playbook documents manual or agent-driven UAT scenarios with clear prerequisites, steps, assertions, and evidence capture.

## Prerequisites
- Dev server running: `npm run dev` or `npx next dev`
- Server should be accessible at `http://localhost:3000`
- Browser tools available (browser_navigate, browser_snapshot, browser_click, etc.)

## Playbook Structure

Each playbook includes:

1. **Prerequisites** - Setup requirements and assumptions
2. **Steps** - Numbered browser actions (navigate, snapshot, click, fill, etc.)
3. **Assertions** - Expected outcomes to verify
4. **Evidence** - Screenshot or snapshot capture points
5. **Checklist** - UAT sign-off items

## How Agents Use Playbooks

1. Read the playbook file
2. Execute steps using available Playwright MCP tools:
   - `browser_navigate` - Navigate to URLs
   - `browser_snapshot` - Capture accessibility snapshot
   - `browser_click` - Click elements
   - `browser_fill_form` - Fill form fields
   - `browser_take_screenshot` - Capture visual evidence
3. Verify assertions match actual behavior
4. Document evidence in checklist
5. Report results and any discrepancies

## Naming Convention
- Format: `{feature}.playbook.md`
- Examples: `portal-home.playbook.md`, `security-checks.playbook.md`

## Coverage
Playbooks cover:
- Core portal flows (home, tabs)
- Form rendering (application, feedback)
- Admin sections (settings, reports)
- Security verification (XSS, schemes, sanitization)
- Migration parity (new vs legacy)
