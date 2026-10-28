#!/usr/bin/env node
'use strict';

// Verify the runner's actual selections. A faster suite must not silently drop
// a spec, repeat an explicit viewport matrix, or miss a dedicated gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { contentSpecs, viewportSpecs, gateSpecs } = require('./playwright-policy.cjs');
const root = path.resolve(__dirname, '..');
const cli = path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
const env = {
  ...process.env, CI: 'true', PLAYWRIGHT_ALL_BROWSERS: '',
  PLAYWRIGHT_SHARD: '', PLAYWRIGHT_GREP: '', PLAYWRIGHT_SUITE: '',
};

function listing(mode, script) {
  const command = script ? 'npm' : process.execPath;
  const args = script
    ? ['run', '--silent', script, '--', '--list', '--reporter=json']
    : [cli, 'test', '--list', '--reporter=json'];
  const result = spawnSync(command, args, {
    cwd: root, env: { ...env, PLAYWRIGHT_SUITE: mode },
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  const cases = new Map();
  function walk(suite, ancestors = []) {
    const titles = [...ancestors, suite.title];
    for (const spec of suite.specs || []) {
      const file = path.basename(spec.file);
      const key = JSON.stringify([file, ...titles, spec.title]);
      const entry = cases.get(key) || { file, projects: [] };
      entry.projects.push(...spec.tests.map((test) => test.projectName));
      cases.set(key, entry);
    }
    for (const child of suite.suites || []) walk(child, titles);
  }
  for (const suite of report.suites) walk(suite);
  return cases;
}

const all = listing('');
const extended = listing('extended', 'test:playwright');
const contract = listing('', 'test:contract');
const visual = listing('', 'test:visual:snap');
const files = fs.readdirSync(path.join(root, 'tests/playwright-agents'))
  .filter((file) => file.endsWith('.spec.ts')).sort();
assert.deepEqual([...new Set([...all.values()].map((test) => test.file))].sort(), files,
  'Every spec must be selected by the default configuration');
for (const file of [...contentSpecs, ...viewportSpecs, ...gateSpecs]) {
  assert(files.includes(file), `Stale policy entry: ${file}`);
}

for (const [key, test] of all) {
  const expected = contentSpecs.includes(test.file) ? ['Content Chrome']
    : viewportSpecs.includes(test.file) ? ['Responsive Chrome']
    : ['Desktop Chrome', 'Mobile Chrome', 'Tablet Chrome'];
  assert.deepEqual([...test.projects].sort(), expected.sort(), `Wrong project routing: ${key}`);
  if (gateSpecs.includes(test.file)) {
    assert(!extended.has(key), `Gate duplicated in extended suite: ${key}`);
    const dedicated = test.file === 'visual-snapshot.spec.ts' ? visual : contract;
    const projects = test.file === 'visual-snapshot.spec.ts'
      ? ['Desktop Chrome', 'Mobile Chrome', 'Tablet Chrome']
      : ['Desktop Chrome', 'Mobile Chrome'];
    assert.deepEqual(dedicated.get(key)?.projects.slice().sort(), projects,
      `Dedicated gate omits coverage: ${key}`);
  } else {
    assert.deepEqual(extended.get(key), test, `Extended suite omits coverage: ${key}`);
  }
}
for (const key of extended.keys()) assert(all.has(key), `Unexpected extended case: ${key}`);
const executions = (cases) => [...cases.values()].reduce((n, test) => n + test.projects.length, 0);
console.log(`[selection] ${files.length} specs; ${executions(all)} default, ` +
  `${executions(extended)} extended, ${executions(contract)} contract, ${executions(visual)} visual executions. ` +
  'All cases accounted for; single-run specs and dedicated gates are not duplicated.');
