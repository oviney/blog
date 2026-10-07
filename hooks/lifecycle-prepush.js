#!/usr/bin/env node
// viney.ca blog — git pre-push lifecycle check (#1340, Amendment 2)
//
// As git's pre-push hook: git passes one line per ref on stdin,
//   <local ref> <local sha> <remote ref> <remote sha>
// after every shell expansion, config default (push.default,
// remote.<name>.push) and environment variable has been applied. Each pushed
// commit's tree must equal both the `test` and `review` snapshots recorded by
// hooks/lifecycle-record.js. Deletes (all-zero local sha) publish nothing.
// Bulk pushes (--all, --tags) arrive ref by ref and are checked the same way.
// On any failure this prints why and exits 1, which makes git abort the push.
//
// Enforces only when CLAUDECODE=1 (set by Claude Code on its shell commands),
// so pushes from outside Claude Code are unaffected. Honours
// BLOG_LIFECYCLE_GATE_BYPASS=1 from the Claude Code process environment.
// Fails closed: any error while checking blocks the push.
//
//   lifecycle-prepush.js --install [repo]
// installs the .git/hooks/pre-push shim that runs this file. It never
// overwrites a pre-push hook it did not write, and refuses when core.hooksPath
// is set; both exit 2 with the reason.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { REQUIRED, refTree, readState, changedPaths } = require('./lifecycle-snapshot');

const SHIM_MARK = '# lifecycle-gate pre-push shim (#1340)';
const ZERO = /^0+$/;

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, "'\\''")}'`;
}

// The shim checks the owner bypass before anything else, then runs the copy
// of the checker kept in the git common dir, so neither depends on the branch
// that happens to be checked out (R23).
function shim(checker) {
  return [
    '#!/bin/sh',
    SHIM_MARK,
    '# Installed by hooks/lifecycle-prepush.js --install; not committed. Enforces only in Claude Code',
    '# sessions: see specs/agent-skills-lifecycle-enforcement.md.',
    '[ "$CLAUDECODE" = "1" ] || exit 0',
    '[ "$BLOG_LIFECYCLE_GATE_BYPASS" = "1" ] && exit 0',
    `if [ ! -f ${shellQuote(checker)} ]; then`,
    '  echo "lifecycle gate (#1340): the checker copy is missing, so this push is blocked. Start a new Claude Code session to reinstall it." >&2',
    '  exit 1',
    'fi',
    `exec node ${shellQuote(checker)} "$@"`,
    '',
  ].join('\n');
}

const COPIED = ['lifecycle-prepush.js', 'lifecycle-snapshot.js'];

function writeIfChanged(file, content, mode) {
  const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content
    && (fs.statSync(file).mode & 0o777) === mode;
  if (same) return false;
  fs.writeFileSync(file, content, { mode });
  fs.chmodSync(file, mode); // also repairs a shim that lost its executable bit (R24)
  return true;
}

// Returns { ok, message }. Never throws for the expected refusals.
function installHook(repo) {
  const root = git(repo, ['rev-parse', '--show-toplevel']);
  let hooksPath = '';
  try { hooksPath = git(root, ['config', '--get', 'core.hooksPath']); } catch { /* unset */ }
  if (hooksPath) {
    return { ok: false, message: `core.hooksPath is set (${hooksPath}), so the lifecycle pre-push hook cannot be installed` };
  }
  const hookFile = path.resolve(root, git(root, ['rev-parse', '--git-path', 'hooks/pre-push']));
  if (fs.existsSync(hookFile) && !fs.readFileSync(hookFile, 'utf8').includes(SHIM_MARK)) {
    return { ok: false, message: `${hookFile} already exists and was not written by the lifecycle gate; it was left alone` };
  }
  const copyDir = path.join(path.resolve(root, git(root, ['rev-parse', '--git-common-dir'])), 'lifecycle-gate');
  fs.mkdirSync(copyDir, { recursive: true });
  let changed = false;
  if (path.resolve(__dirname) !== copyDir) {
    for (const name of COPIED) {
      changed = writeIfChanged(path.join(copyDir, name), fs.readFileSync(path.join(__dirname, name), 'utf8'), 0o644) || changed;
    }
  }
  fs.mkdirSync(path.dirname(hookFile), { recursive: true });
  changed = writeIfChanged(hookFile, shim(path.join(copyDir, 'lifecycle-prepush.js')), 0o755) || changed;
  return {
    ok: true,
    message: changed ? `lifecycle pre-push shim installed at ${hookFile}` : `lifecycle pre-push shim already installed at ${hookFile}`,
  };
}

// True when the commit is already reachable from the remote's tracking refs,
// i.e. pushing it publishes nothing new (R27).
function alreadyPublished(cwd, remote, sha) {
  if (!remote) return false;
  try {
    return git(cwd, ['for-each-ref', '--contains', sha, '--format=%(refname)', `refs/remotes/${remote}/`]) !== '';
  } catch {
    return false;
  }
}

// Returns a list of failure descriptions for the pushed refs.
function check(cwd, lines, remote) {
  const state = readState(cwd);
  const failures = [];
  for (const line of lines) {
    const [localRef, localSha, remoteRef] = line.trim().split(/\s+/);
    if (!localSha || ZERO.test(localSha)) continue;
    if (alreadyPublished(cwd, remote, localSha)) continue;
    const tree = refTree(cwd, localSha);
    if (!tree) { failures.push(`${remoteRef}: cannot resolve ${localSha}`); continue; }
    const stale = REQUIRED.filter((s) => !state[s] || state[s].tree !== tree);
    if (stale.length === 0) continue;
    const changed = new Set();
    for (const s of stale) {
      if (state[s]) changedPaths(cwd, state[s].tree, tree).forEach((p) => changed.add(p));
    }
    const files = [...changed];
    const detail = files.length
      ? ` changed since they ran: ${files.slice(0, 10).join(', ')}${files.length > 10 ? `, and ${files.length - 10} more` : ''}`
      : '';
    failures.push(`${remoteRef} (from ${localRef}): not yet run on this content: ${stale.join(', ')}${detail ? `;${detail}` : ''}`);
  }
  return failures;
}

function runHook() {
  if (process.env.CLAUDECODE !== '1') return 0;
  if (process.env.BLOG_LIFECYCLE_GATE_BYPASS === '1') {
    process.stderr.write('lifecycle gate (#1340): push allowed by BLOG_LIFECYCLE_GATE_BYPASS\n');
    return 0;
  }
  let failures;
  try {
    const lines = fs.readFileSync(0, 'utf8').split('\n').filter((l) => l.trim());
    // git runs pre-push at the top of the work tree, with GIT_DIR exported when it was set.
    // git passes the remote's name (or URL) as the first argument.
    failures = check(process.cwd(), lines, process.argv[2]);
  } catch (err) {
    failures = [`could not verify the lifecycle (${String(err.message).split('\n')[0]})`];
  }
  if (failures.length === 0) return 0;
  process.stderr.write([
    'Lifecycle gate (#1340): push rejected. The test and review skills must both run on exactly',
    'the content being pushed (CLAUDE.md rule 2).',
    ...failures.map((f) => `  - ${f}`),
    'Invoke the skill(s) with the Skill tool (exactly `test` / `review`; the built-in /code-review does',
    'not count), fix anything they find, commit, then push again. Only the owner can bypass, by',
    'launching Claude Code with BLOG_LIFECYCLE_GATE_BYPASS=1.',
    '',
  ].join('\n'));
  return 1;
}

if (require.main === module) {
  if (process.argv[2] === '--install') {
    let result;
    try { result = installHook(process.argv[3] || process.cwd()); } catch (err) {
      result = { ok: false, message: `could not install the lifecycle pre-push hook (${String(err.message).split('\n')[0]})` };
    }
    process.stdout.write(`${result.message}\n`);
    process.exitCode = result.ok ? 0 : 2;
  } else {
    process.exitCode = runHook();
  }
}

module.exports = { installHook, SHIM_MARK };
