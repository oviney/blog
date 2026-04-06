#!/usr/bin/env node
/**
 * update-defect-log.js
 *
 * Upserts a defect entry in docs/defect-log.json for a production bug.
 * Called by .github/workflows/auto-regression.yml
 *
 * Environment variables:
 *   ISSUE_NUMBER         - GitHub issue number
 *   ISSUE_TITLE          - GitHub issue title
 *   ISSUE_URL            - GitHub issue HTML URL
 *   AREA                 - Test group area
 *   REQ_IDS              - Comma-separated requirement IDs
 *   TEST_FILE            - Path to the generated test file (optional)
 *   REGRESSION_PR        - PR number to record (optional, set after PR creation)
 */

'use strict';

const fs = require('fs');

const LOG_FILE   = 'docs/defect-log.json';
const issueNumber = parseInt(process.env.ISSUE_NUMBER || '0', 10);
const now         = new Date().toISOString();

// Read existing log
let log = [];
if (fs.existsSync(LOG_FILE)) {
  try {
    log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (err) {
    console.error(`Warning: Could not parse ${LOG_FILE}:`, err.message);
    log = [];
  }
}

const idx = log.findIndex(e => e.issue_number === issueNumber);

if (idx >= 0) {
  // Update existing entry
  if (process.env.TEST_FILE) {
    log[idx].regression_test_created     = true;
    log[idx].regression_test_file        = process.env.TEST_FILE;
    log[idx].regression_test_created_at  = now;
  }
  if (process.env.REGRESSION_PR) {
    log[idx].regression_pr = parseInt(process.env.REGRESSION_PR, 10);
  }
} else {
  // Insert new entry
  log.push({
    issue_number:                issueNumber,
    issue_title:                 process.env.ISSUE_TITLE   || '',
    issue_url:                   process.env.ISSUE_URL     || '',
    area:                        process.env.AREA          || '',
    req_ids:                     (process.env.REQ_IDS || '')
                                   .split(',').map(r => r.trim()).filter(Boolean),
    logged_at:                   now,
    regression_test_created:     Boolean(process.env.TEST_FILE),
    regression_test_file:        process.env.TEST_FILE || null,
    regression_test_created_at:  process.env.TEST_FILE ? now : null,
    regression_pr:               process.env.REGRESSION_PR
                                   ? parseInt(process.env.REGRESSION_PR, 10)
                                   : null,
  });
}

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2) + '\n', 'utf8');
console.log(`✅ Updated ${LOG_FILE}`);
