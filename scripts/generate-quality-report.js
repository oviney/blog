#!/usr/bin/env node
/**
 * scripts/generate-quality-report.js
 *
 * Reads Playwright JSON test results and generates:
 *   1. quality-report.json  — structured artefact uploaded to GitHub Actions
 *   2. A Markdown summary   — written to $GITHUB_STEP_SUMMARY (or stdout)
 *
 * Usage:
 *   node scripts/generate-quality-report.js [--results <path>] [--output <path>]
 *
 * Environment variables consumed:
 *   TEST_GROUPS        — comma-separated REQ IDs that were executed (or "ALL" / "NONE")
 *   FULL_SUITE         — "true" | "false"
 *   SKIP_PLAYWRIGHT    — "true" | "false"
 *   SELECTION_REASON   — human-readable reason for the selection
 *   GITHUB_STEP_SUMMARY — path to the step-summary file (provided by GitHub Actions)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const RESULTS_PATH = getArg('--results') || 'test-results/results.json';
const OUTPUT_PATH  = getArg('--output')  || 'quality-report.json';

// ---------------------------------------------------------------------------
// Requirement metadata
// ---------------------------------------------------------------------------

const REQUIREMENTS = {
  'REQ-NAV-01':     { area: 'Navigation',    description: 'Site nav renders at all viewports (320/768/1920 px)' },
  'REQ-NAV-02':     { area: 'Navigation',    description: 'Mobile nav opens/closes correctly' },
  'REQ-CONTENT-01': { area: 'Content',       description: 'Blog index lists posts with correct metadata' },
  'REQ-CONTENT-02': { area: 'Content',       description: 'Individual post pages render without layout breaks' },
  'REQ-SEARCH-01':  { area: 'Search',        description: 'Search returns relevant results' },
  'REQ-A11Y-01':    { area: 'Accessibility', description: 'WCAG AA contrast on all pages' },
  'REQ-A11Y-02':    { area: 'Accessibility', description: 'Keyboard navigation works across all pages' },
  'REQ-PERF-01':    { area: 'Performance',   description: 'Lighthouse score ≥ 80 (mobile), ≥ 90 (desktop)' },
  'REQ-VISUAL-01':  { area: 'Visual',        description: 'No visual regressions vs baseline screenshots' },
  'REQ-LINKS-01':   { area: 'Links',         description: 'No broken internal links' },
  'REQ-SEC-01':     { area: 'Security',      description: 'No vulnerable npm dependencies (audit-level=moderate)' },
};

// Map @tag annotations in test titles/describe names → requirement IDs
const TAG_TO_REQ = {};
Object.keys(REQUIREMENTS).forEach((id) => {
  TAG_TO_REQ[`@${id}`] = id;
});

// ---------------------------------------------------------------------------
// Parse Playwright results
// ---------------------------------------------------------------------------

let rawResults = null;
if (fs.existsSync(RESULTS_PATH)) {
  try {
    rawResults = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
  } catch (err) {
    console.error(`[quality-report] Failed to parse ${RESULTS_PATH}: ${err.message}`);
  }
}

/**
 * Extract REQ IDs mentioned in a test's title path (suite titles + test title).
 */
function extractReqIds(titlePath) {
  const full = titlePath.join(' ');
  const found = new Set();
  Object.keys(TAG_TO_REQ).forEach((tag) => {
    if (full.includes(tag)) {
      found.add(TAG_TO_REQ[tag]);
    }
  });
  return found;
}

// Tally pass/fail/skip per requirement
const reqStats = {};
Object.keys(REQUIREMENTS).forEach((id) => {
  reqStats[id] = { passed: 0, failed: 0, skipped: 0, timedOut: 0, duration: 0 };
});

let totalPassed  = 0;
let totalFailed  = 0;
let totalSkipped = 0;
let totalDuration = 0; // ms

if (rawResults && rawResults.suites) {
  // Playwright JSON format: { suites: [ { title, specs: [ { title, tests: [...] } ] } ] }
  const walk = (suites, titlePath) => {
    for (const suite of (suites || [])) {
      const path = [...titlePath, suite.title || ''];
      // Recurse into child suites
      walk(suite.suites || [], path);
      // Process specs
      for (const spec of (suite.specs || [])) {
        const specPath = [...path, spec.title || ''];
        const reqIds   = extractReqIds(specPath);
        for (const test of (spec.tests || [])) {
          const duration = (test.results || []).reduce((s, r) => s + (r.duration || 0), 0);
          totalDuration += duration;
          const status = test.status || (test.results && test.results[0] && test.results[0].status) || 'unknown';
          if (status === 'passed' || status === 'expected') {
            totalPassed++;
            reqIds.forEach((id) => { reqStats[id].passed++; reqStats[id].duration += duration; });
          } else if (status === 'failed' || status === 'unexpected') {
            totalFailed++;
            reqIds.forEach((id) => { reqStats[id].failed++; reqStats[id].duration += duration; });
          } else if (status === 'skipped' || status === 'pending') {
            totalSkipped++;
            reqIds.forEach((id) => { reqStats[id].skipped++; });
          } else if (status === 'timedOut') {
            totalFailed++;
            reqIds.forEach((id) => { reqStats[id].timedOut++; reqStats[id].failed++; reqStats[id].duration += duration; });
          }
        }
      }
    }
  };
  walk(rawResults.suites, []);
}

// ---------------------------------------------------------------------------
// Environment context
// ---------------------------------------------------------------------------

const testGroups    = process.env.TEST_GROUPS       || 'UNKNOWN';
const fullSuite     = process.env.FULL_SUITE        === 'true';
const skipPlaywright = process.env.SKIP_PLAYWRIGHT  === 'true';
const selectionReason = process.env.SELECTION_REASON || 'not specified';
const runAt         = new Date().toISOString();

// Determine which requirements were in scope
const inScopeReqs = new Set();
if (testGroups === 'ALL' || testGroups === 'UNKNOWN') {
  Object.keys(REQUIREMENTS).forEach((id) => inScopeReqs.add(id));
} else if (testGroups !== 'NONE') {
  testGroups.split(',').forEach((g) => {
    const t = g.trim();
    if (REQUIREMENTS[t]) inScopeReqs.add(t);
  });
}

const skippedReqs = Object.keys(REQUIREMENTS).filter((id) => !inScopeReqs.has(id));

// ---------------------------------------------------------------------------
// Build coverage rows
// ---------------------------------------------------------------------------

const coverageRows = Object.entries(REQUIREMENTS).map(([id, meta]) => {
  const stats  = reqStats[id];
  const total  = stats.passed + stats.failed + stats.skipped + stats.timedOut;
  const inScope = inScopeReqs.has(id);

  let status;
  if (!inScope) {
    status = 'skipped';
  } else if (total === 0) {
    status = 'no-tests';
  } else if (stats.failed > 0 || stats.timedOut > 0) {
    status = 'fail';
  } else {
    status = 'pass';
  }

  return {
    id,
    area:        meta.area,
    description: meta.description,
    status,
    inScope,
    passed:   stats.passed,
    failed:   stats.failed,
    skipped:  stats.skipped,
    timedOut: stats.timedOut,
    durationMs: stats.duration,
  };
});

// ---------------------------------------------------------------------------
// Build quality-report.json
// ---------------------------------------------------------------------------

const report = {
  generatedAt:   runAt,
  runType:       skipPlaywright ? 'ci-only' : fullSuite ? 'full' : 'partial',
  testGroups,
  selectionReason,
  summary: {
    totalTests:  totalPassed + totalFailed + totalSkipped,
    passed:      totalPassed,
    failed:      totalFailed,
    skipped:     totalSkipped,
    durationMs:  totalDuration,
    passRate:    totalPassed + totalFailed > 0
                  ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
                  : 'N/A',
  },
  requirementsCoverage: coverageRows,
  skippedRequirements:  skippedReqs,
  rawResultsAvailable:  !!rawResults,
};

// Write JSON artefact
try {
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
  console.log(`[quality-report] Written to ${OUTPUT_PATH}`);
} catch (err) {
  console.error(`[quality-report] Failed to write ${OUTPUT_PATH}: ${err.message}`);
}

// ---------------------------------------------------------------------------
// Build Markdown summary
// ---------------------------------------------------------------------------

const statusEmoji = (s) => {
  switch (s) {
    case 'pass':     return '✅';
    case 'fail':     return '❌';
    case 'skipped':  return '⏭️';
    case 'no-tests': return '⚠️';
    default:         return '❓';
  }
};

const fmtMs = (ms) => {
  if (!ms) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
};

const lines = [];

lines.push('## 🧪 Quality Report');
lines.push('');
lines.push(`**Run type:** ${report.runType === 'full' ? '🔁 Full suite' : report.runType === 'ci-only' ? '⏭️ CI-only (Playwright skipped)' : '⚡ Partial run'}`);
lines.push(`**Timestamp:** ${runAt}`);
lines.push(`**Selection reason:** ${selectionReason}`);
lines.push('');

// Summary box
lines.push('### Summary');
lines.push('');
lines.push('| Metric | Value |');
lines.push('|--------|-------|');
lines.push(`| Total tests | ${report.summary.totalTests} |`);
lines.push(`| ✅ Passed | ${report.summary.passed} |`);
lines.push(`| ❌ Failed | ${report.summary.failed} |`);
lines.push(`| ⏭️ Skipped | ${report.summary.skipped} |`);
lines.push(`| Pass rate | ${report.summary.passRate}% |`);
lines.push(`| Total duration | ${fmtMs(report.summary.durationMs)} |`);
lines.push('');

// Requirement coverage table
lines.push('### Requirements Coverage');
lines.push('');
lines.push('| Status | Requirement | Area | Description | Passed | Failed | Duration |');
lines.push('|--------|------------|------|-------------|--------|--------|----------|');
coverageRows.forEach((row) => {
  lines.push(
    `| ${statusEmoji(row.status)} | \`${row.id}\` | ${row.area} | ${row.description} | ${row.passed} | ${row.failed} | ${fmtMs(row.durationMs)} |`
  );
});
lines.push('');

// Skipped groups
if (skippedReqs.length > 0) {
  lines.push('### ⏭️ Skipped Requirement Groups');
  lines.push('');
  lines.push('The following requirements were **not** tested in this run (change-based selection):');
  lines.push('');
  skippedReqs.forEach((id) => {
    lines.push(`- \`${id}\` — ${REQUIREMENTS[id].description}`);
  });
  lines.push('');
}

if (!rawResults) {
  lines.push('> ⚠️ No Playwright JSON results found — coverage counts reflect zero test executions.');
  lines.push('');
}

const markdownSummary = lines.join('\n');

// Write to $GITHUB_STEP_SUMMARY if available, otherwise stdout
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  try {
    fs.appendFileSync(summaryFile, markdownSummary + '\n');
    console.log('[quality-report] Summary written to $GITHUB_STEP_SUMMARY');
  } catch (err) {
    console.error(`[quality-report] Failed to write step summary: ${err.message}`);
    console.log(markdownSummary);
  }
} else {
  console.log(markdownSummary);
}
