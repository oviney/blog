#!/usr/bin/env node
'use strict';

// Wraps `npm audit` so the security gate can carry documented exceptions.
//
// Plain `npm audit --audit-level=moderate` is all-or-nothing, which is a poor
// fit here: package.json has no runtime dependencies at all, so every advisory
// it reports lives in CI tooling (Playwright, Lighthouse, pa11y). When such an
// advisory has no non-breaking remedy the only ways to get green are to
// downgrade the tool or to drop the gate entirely. This keeps the gate and
// allows a small, dated allowlist instead.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const AUDIT_LEVEL = 'moderate';
const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const allowlistPath = path.join(__dirname, 'npm-audit-allowlist.json');

function loadAllowlist() {
  if (!fs.existsSync(allowlistPath)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  return parsed.allow || [];
}

// `npm audit` exits non-zero when it finds anything, so the exit code says
// nothing useful on its own — the JSON body is the real result.
function runAudit() {
  const result = spawnSync('npm', ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  if (!result.stdout) {
    console.error('[security] npm audit produced no output');
    if (result.stderr) {
      console.error(result.stderr);
    }
    process.exit(1);
  }

  return JSON.parse(result.stdout);
}

// One advisory usually surfaces once per affected package in the tree; collapse
// to the underlying advisory so counts match what a human would report.
function collectAdvisories(report) {
  const advisories = new Map();

  for (const vulnerability of Object.values(report.vulnerabilities || {})) {
    for (const via of vulnerability.via || []) {
      if (typeof via !== 'object' || !via.source) {
        continue;
      }

      if (!advisories.has(via.source)) {
        advisories.set(via.source, {
          id: via.source,
          package: via.name,
          title: via.title,
          severity: via.severity,
          url: via.url,
        });
      }
    }
  }

  return [...advisories.values()];
}

function isAtOrAboveThreshold(severity) {
  return (SEVERITY_RANK[severity] || 0) >= SEVERITY_RANK[AUDIT_LEVEL];
}

const allowlist = loadAllowlist();
const advisories = collectAdvisories(runAudit());
const relevant = advisories.filter((advisory) => isAtOrAboveThreshold(advisory.severity));
const allowedIds = new Set(allowlist.map((entry) => entry.id));

const blocking = relevant.filter((advisory) => !allowedIds.has(advisory.id));

// An exception that has expired, or that no longer matches a live advisory, is
// itself a failure — otherwise the allowlist silently outlives its rationale.
const today = new Date().toISOString().slice(0, 10);
const liveIds = new Set(advisories.map((advisory) => advisory.id));
const staleEntries = allowlist.filter(
  (entry) => entry.reviewBy < today || !liveIds.has(entry.id)
);

for (const entry of allowlist.filter((item) => liveIds.has(item.id) && item.reviewBy >= today)) {
  console.log(`[security] allowed: ${entry.package} #${entry.id} — ${entry.title} (review by ${entry.reviewBy})`);
}

if (staleEntries.length > 0) {
  console.error('[security] Allowlist entries need attention:');
  staleEntries.forEach((entry) => {
    const why = !liveIds.has(entry.id)
      ? 'advisory no longer reported — remove this entry'
      : `review date ${entry.reviewBy} has passed — re-justify or remove`;
    console.error(`- ${entry.package} #${entry.id}: ${why}`);
  });
}

if (blocking.length > 0) {
  console.error(`[security] ${blocking.length} advisory/advisories at or above "${AUDIT_LEVEL}" with no exception:`);
  blocking.forEach((advisory) => {
    console.error(`- [${advisory.severity}] ${advisory.package} #${advisory.id}: ${advisory.title}`);
    if (advisory.url) {
      console.error(`  ${advisory.url}`);
    }
  });
  console.error('[security] Fix with `npm audit fix`, or add a dated exception to scripts/npm-audit-allowlist.json.');
}

if (blocking.length > 0 || staleEntries.length > 0) {
  process.exit(1);
}

console.log(`[security] No unreviewed advisories at or above "${AUDIT_LEVEL}".`);
