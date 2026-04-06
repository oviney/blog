#!/usr/bin/env node
/**
 * regression-coverage-report.js
 *
 * Generates a Markdown regression coverage table from docs/defect-log.json
 * and appends it to the GitHub Actions step summary (GITHUB_STEP_SUMMARY).
 *
 * Called by .github/workflows/auto-regression.yml
 *
 * Environment variables:
 *   REPO   - GitHub repository (owner/name), e.g. oviney/blog
 */

'use strict';

const fs = require('fs');

const LOG_FILE = 'docs/defect-log.json';
const repo     = process.env.REPO || 'oviney/blog';

let log = [];
if (fs.existsSync(LOG_FILE)) {
  try {
    log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (err) {
    console.error(`Warning: Could not parse ${LOG_FILE}:`, err.message);
    log = [];
  }
}

let table = '## Regression Coverage\n\n';
table += '| Bug | Issue | Test file | Status |\n';
table += '|-----|-------|-----------|--------|\n';

if (log.length === 0) {
  table += '| — | — | — | No entries yet |\n';
} else {
  for (const entry of log) {
    const issueRef  = `[${repo}#${entry.issue_number}](${entry.issue_url || '#'})`;
    const testCell  = entry.regression_test_file
      ? `\`${entry.regression_test_file}\``
      : '—';
    let status;
    if (entry.regression_pr) {
      status = `⏳ draft PR #${entry.regression_pr}`;
    } else if (entry.regression_test_created) {
      status = '⏳ test created';
    } else {
      status = '❌ no test yet';
    }
    const title = (entry.issue_title || '?').replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
    table += `| ${title} | ${issueRef} | ${testCell} | ${status} |\n`;
  }
}

// Write to GitHub Actions step summary if available
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  fs.appendFileSync(summaryFile, table + '\n', 'utf8');
}

// Always print to stdout for local debugging
process.stdout.write(table + '\n');
