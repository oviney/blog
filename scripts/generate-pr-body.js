#!/usr/bin/env node
/**
 * generate-pr-body.js
 *
 * Writes the draft PR body for a regression test PR to /tmp/pr-body.md
 * Called by .github/workflows/auto-regression.yml
 *
 * Environment variables:
 *   ISSUE_NUMBER  - GitHub issue number
 *   ISSUE_TITLE   - GitHub issue title
 *   ISSUE_URL     - GitHub issue HTML URL
 *   TEST_FILE     - Path to the generated test file
 */

'use strict';

const fs = require('fs');

const issueNumber = process.env.ISSUE_NUMBER || '0';
const issueTitle  = process.env.ISSUE_TITLE  || 'Unknown bug';
const issueUrl    = process.env.ISSUE_URL    || '';
const testFile    = process.env.TEST_FILE    || 'tests/playwright-agents/regression/unknown.spec.ts';

const body = [
  `## Regression Test for Production Bug #${issueNumber}`,
  ``,
  `Auto-generated Playwright regression test to prevent recurrence of:`,
  `**[${issueTitle}](${issueUrl})**`,
  ``,
  `### Review Checklist`,
  `- [ ] Does the test reproduce the original bug?`,
  `- [ ] Does the test pass on the fixed code?`,
  `- [ ] Are the assertions meaningful (not just checking the page loads)?`,
  `- [ ] Are reproduction steps from the issue reflected in the test?`,
  ``,
  `### Files Changed`,
  `- \`${testFile}\``,
  `- \`docs/defect-log.json\` (updated with \`regression_test_created: true\`)`,
  ``,
  `### Human Review Required`,
  `This is a **draft PR** — the generated test is a skeleton that may need refinement.`,
  `See issue #${issueNumber} for full reproduction steps.`,
  ``,
  `Closes #${issueNumber}`,
].join('\n');

fs.writeFileSync('/tmp/pr-body.md', body, 'utf8');
console.log('Wrote PR body to /tmp/pr-body.md');
