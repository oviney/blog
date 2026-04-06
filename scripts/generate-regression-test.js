#!/usr/bin/env node
/**
 * generate-regression-test.js
 *
 * Generates a skeleton Playwright regression test file for a production bug issue.
 * Called by .github/workflows/auto-regression.yml
 *
 * Environment variables (all required):
 *   ISSUE_NUMBER         - GitHub issue number
 *   ISSUE_TITLE          - GitHub issue title
 *   ISSUE_URL            - GitHub issue HTML URL
 *   SLUG                 - URL-safe slug derived from title
 *   AREA                 - Test group tag (navigation, seo, content, accessibility, etc.)
 *   REQ_IDS              - Comma-separated requirement IDs (e.g. REQ-NAV-01,REQ-SEO-02)
 *   REPRO_URL            - URL where the bug was observed
 *   STEPS_B64            - Base64-encoded reproduction steps (optional)
 *   REPO                 - GitHub repository (owner/name)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const issueNumber = process.env.ISSUE_NUMBER  || '0';
const issueTitle  = process.env.ISSUE_TITLE   || 'Unknown bug';
const issueUrl    = process.env.ISSUE_URL      || '';
const slug        = process.env.SLUG           || `issue-${issueNumber}`;
const area        = process.env.AREA           || 'regression';
const reqIds      = process.env.REQ_IDS        || 'REQ-UNKNOWN';
const reproUrl    = process.env.REPRO_URL      || 'https://www.viney.ca/';
const stepsB64    = process.env.STEPS_B64      || '';
const repo        = process.env.REPO           || 'oviney/blog';

// Decode reproduction steps from base64
let stepComments = `    // TODO: Add reproduction steps from issue #${issueNumber}`;
if (stepsB64) {
  try {
    const decoded = Buffer.from(stepsB64, 'base64').toString('utf8').trim();
    const lines   = decoded.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      stepComments = lines.map(l => `    // ${escapeForComment(l)}`).join('\n');
    }
  } catch (_) { /* keep default */ }
}

// Derive navigation path from reproduction URL (use path portion if on viney.ca)
let navPath = '/';
try {
  const url = new URL(reproUrl);
  if (url.hostname.includes('viney.ca')) {
    navPath = url.pathname || '/';
  }
} catch (_) { /* keep default */ }

// Format REQ IDs as @tag tokens
const reqTags = reqIds.split(',').map(r => r.trim()).filter(Boolean).join(' ');

// Escape characters that would break a TypeScript single-quoted string or template literal
// (backslash must be escaped first to avoid double-escaping)
function escapeForTS(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Escape characters in comment lines (backslash only — these are inside // comments)
function escapeForComment(str) {
  return str.replace(/\\/g, '\\\\');
}

const safeTitle = escapeForTS(issueTitle);

const testContent = [
  `/**`,
  ` * Regression test for production bug ${repo}#${issueNumber}`,
  ` * ${issueTitle}`,
  ` * @requirements ${reqTags}`,
  ` * @bug ${issueUrl}`,
  ` */`,
  `import { test, expect } from '@playwright/test';`,
  ``,
  `// Regression for production bug #${issueNumber}`,
  `test.describe('@${area} regression ${repo}#${issueNumber}', () => {`,
  `  test('reproduces and verifies fix for: ${safeTitle}', async ({ page }) => {`,
  `    await page.setViewportSize({ width: 320, height: 568 });`,
  `    await page.goto('${navPath}');`,
  `    await page.waitForLoadState('networkidle');`,
  stepComments,
  `    // TODO: Replace with specific assertions that verify the bug is fixed`,
  `    // Example: await expect(page.getByRole('navigation')).toBeVisible();`,
  `    await expect(page).toHaveURL('${navPath}');`,
  `  });`,
  `});`,
  ``,
].join('\n');

const testFile = path.join(
  'tests', 'playwright-agents', 'regression',
  `issue-${issueNumber}-${slug}.spec.ts`
);

fs.mkdirSync(path.dirname(testFile), { recursive: true });
fs.writeFileSync(testFile, testContent, 'utf8');

// Output the file path for the calling workflow step
process.stdout.write(`test_file=${testFile}\n`);
console.error(`✅ Generated: ${testFile}`);
