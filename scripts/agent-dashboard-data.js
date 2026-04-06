#!/usr/bin/env node
/**
 * agent-dashboard-data.js — Aggregate agent observability metrics into
 * dashboard/agents-data.json for consumption by dashboard/agents.html.
 *
 * Data sources (all local — no network calls required for offline use):
 *   .agent-evals/*.json        — PR quality eval results
 *   content-review-results.json — editorial content scores
 *
 * Live data (via gh CLI — skipped gracefully when unavailable):
 *   gh api /repos/:owner/:repo/pulls   — recent merged PRs
 *   gh api /repos/:owner/:repo/issues  — open backlog by agent label
 *
 * Usage:
 *   node scripts/agent-dashboard-data.js [--offline]
 *
 *   --offline  Skip gh API calls; use only local JSON files.
 *
 * Output: dashboard/agents-data.json
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT     = path.resolve(__dirname, '..');
const EVALS_DIR     = path.join(REPO_ROOT, '.agent-evals');
const CONTENT_FILE  = path.join(REPO_ROOT, 'content-review-results.json');
const OUT_FILE      = path.join(REPO_ROOT, 'dashboard', 'agents-data.json');
const REPO_SLUG     = 'oviney/blog';

const OFFLINE = process.argv.includes('--offline');

const AGENT_LABELS = [
  'agent:creative-director',
  'agent:qa-gatekeeper',
  'agent:editorial-chief',
  'agent:editorial-manager',
];

const RUBRIC_DIMS = [
  'scope_adherence',
  'atomic_commits',
  'test_coverage',
  'ci_status',
  'review_churn',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ghApi(path, extra = '') {
  try {
    const out = execSync(`gh api "${path}" ${extra} 2>/dev/null`, { encoding: 'utf8', cwd: REPO_ROOT });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ── Agent eval aggregation ────────────────────────────────────────────────────

function aggregateEvals() {
  if (!fs.existsSync(EVALS_DIR)) return { evals: [], passRate: null, dimPassRates: {} };

  const files = fs.readdirSync(EVALS_DIR).filter(f => f.endsWith('.json'));
  const evals = files
    .map(f => safeReadJson(path.join(EVALS_DIR, f)))
    .filter(Boolean)
    .sort((a, b) => new Date(b.evaluated_at) - new Date(a.evaluated_at));

  const passRate = evals.length
    ? Math.round((evals.filter(e => e.all_pass).length / evals.length) * 100)
    : null;

  // Per-dimension pass rates
  const dimPassRates = {};
  for (const dim of RUBRIC_DIMS) {
    const withDim = evals.filter(e => e.rubric && e.rubric[dim] !== undefined);
    dimPassRates[dim] = withDim.length
      ? Math.round((withDim.filter(e => e.rubric[dim].pass).length / withDim.length) * 100)
      : null;
  }

  return { evals, passRate, dimPassRates };
}

// ── Content review aggregation ────────────────────────────────────────────────

function aggregateContent() {
  const data = safeReadJson(CONTENT_FILE);
  if (!data) return null;

  const results = data.results || [];
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const distribution = { excellent: 0, good: 0, needsWork: 0, critical: 0 };
  for (const r of results) {
    if      (r.score >= 90) distribution.excellent++;
    else if (r.score >= 75) distribution.good++;
    else if (r.score >= 60) distribution.needsWork++;
    else                    distribution.critical++;
  }

  // Category breakdown (use valid categories only)
  const VALID_CATS = ['Quality Engineering', 'Software Engineering', 'Test Automation', 'Security'];
  const catScores  = {};
  for (const cat of VALID_CATS) catScores[cat] = { total: 0, count: 0 };

  for (const r of results) {
    const cats = Array.isArray(r.fm.categories) ? r.fm.categories : [r.fm.categories].filter(Boolean);
    for (const cat of cats) {
      if (catScores[cat]) {
        catScores[cat].total += r.score;
        catScores[cat].count++;
      }
    }
  }

  const catAvgs = {};
  for (const [cat, { total, count }] of Object.entries(catScores)) {
    catAvgs[cat] = count > 0 ? Math.round(total / count) : null;
  }

  // Top issues across all posts
  const issueFreq = {};
  for (const r of results) {
    for (const issue of (r.issues || [])) {
      const key = issue.replace(/`[^`]+`/g, '…').slice(0, 60);
      issueFreq[key] = (issueFreq[key] || 0) + 1;
    }
  }
  const topIssues = Object.entries(issueFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([msg, count]) => ({ msg, count }));

  const cross = data.cross || {};

  return {
    postCount: results.length,
    avgScore: avg,
    distribution,
    catAvgs,
    topIssues,
    crossFlags: {
      duplicates: (cross.flags || []).filter(f => f.type === 'duplicate').length,
      coverage:   (cross.flags || []).filter(f => f.type === 'coverage').length,
      freshness:  (cross.flags || []).filter(f => f.type === 'freshness').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ── Live GitHub data ──────────────────────────────────────────────────────────

function fetchLiveData() {
  if (OFFLINE) {
    console.error('Offline mode — skipping gh API calls');
    return { recentPRs: [], openIssuesByLabel: {}, openPRCount: 0 };
  }

  console.error('Fetching live data from GitHub API…');

  // Recent merged PRs (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const closedPRs = ghApi(
    `/repos/${REPO_SLUG}/pulls`,
    `--method GET -F state=closed -F sort=updated -F direction=desc -F per_page=50`
  );

  const recentPRs = (closedPRs || [])
    .filter(pr => pr.merged_at && pr.merged_at > thirtyDaysAgo)
    .map(pr => ({
      number:   pr.number,
      title:    pr.title,
      author:   pr.user?.login || 'unknown',
      mergedAt: pr.merged_at,
      labels:   (pr.labels || []).map(l => l.name),
      isAgent:  (pr.user?.login || '').toLowerCase().includes('copilot') ||
                (pr.head?.ref || '').startsWith('copilot/') ||
                (pr.labels || []).some(l => l.name.startsWith('agent:')),
    }))
    .slice(0, 20);

  // Open issues by agent label
  const openIssuesByLabel = {};
  for (const label of AGENT_LABELS) {
    const issues = ghApi(
      `/repos/${REPO_SLUG}/issues`,
      `--method GET -F state=open -F labels="${label}" -F per_page=20`
    );
    openIssuesByLabel[label] = (issues || []).map(i => ({
      number: i.number,
      title:  i.title,
      age:    Math.round((Date.now() - new Date(i.created_at)) / (1000 * 60 * 60 * 24)),
    }));
  }

  // Open PRs count
  const openPRs = ghApi(
    `/repos/${REPO_SLUG}/pulls`,
    `--method GET -F state=open -F per_page=20`
  );
  const openPRCount = (openPRs || []).length;

  return { recentPRs, openIssuesByLabel, openPRCount };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.error('Building agent dashboard data…');

  const { evals, passRate, dimPassRates } = aggregateEvals();
  const contentData = aggregateContent();
  const liveData    = fetchLiveData();

  const agentPRsMerged = liveData.recentPRs.filter(pr => pr.isAgent).length;
  const totalBacklog   = Object.values(liveData.openIssuesByLabel)
    .reduce((s, arr) => s + arr.length, 0);

  const output = {
    generatedAt: new Date().toISOString(),
    kpis: {
      agentPRsMerged30d: agentPRsMerged,
      evalPassRate:      passRate,
      contentAvgScore:   contentData?.avgScore ?? null,
      openBacklog:       totalBacklog,
      openPRCount:       liveData.openPRCount,
      evalCount:         evals.length,
    },
    evalDimensions: {
      labels:    RUBRIC_DIMS.map(d => d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
      passRates: RUBRIC_DIMS.map(d => dimPassRates[d] ?? 0),
    },
    recentEvals: evals.slice(0, 10).map(e => ({
      pr:          e.pr_number,
      title:       e.pr_title,
      allPass:     e.all_pass,
      evaluatedAt: e.evaluated_at,
      dims: RUBRIC_DIMS.reduce((acc, d) => {
        acc[d] = e.rubric?.[d]?.pass ?? null;
        return acc;
      }, {}),
    })),
    content: contentData,
    recentPRs:         liveData.recentPRs,
    openIssuesByLabel: liveData.openIssuesByLabel,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.error(`Written: ${OUT_FILE}`);
  console.log(JSON.stringify({ kpis: output.kpis }, null, 2));
}

main();
