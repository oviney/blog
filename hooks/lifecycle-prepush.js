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
// copies the checker and its helpers from refs/remotes/origin/main (never
// origin/HEAD, R38; the file list comes from that checker's COPIED line,
// #1350) into <git common dir>/lifecycle-gate/ and installs the
// .git/hooks/pre-push shim that runs the copy. It uses the working tree
// instead only while origin/main has none of the files, or when the copy fails
// to load (R39), and says so. It refuses (exit 2, with the reason) when
// origin/main has only some of the listed files (R40), when the list names
// anything but bare .js files, when core.hooksPath is set, or when a pre-push
// hook it did not write exists.
//   lifecycle-prepush.js --uninstall [repo]
// removes the shim and the copy; a foreign pre-push hook is left alone (exit 2).
// Refused inside a Claude Code session unless the owner bypass is set (R37).
//
// Already-published skip: a ref whose new commit git's live remote sha already
// contains (a no-op or a force-push rewind) publishes nothing and is not
// checked. Local tracking refs are never trusted for this (R32, R38).

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

function locations(root) {
  const hookFile = path.resolve(root, git(root, ['rev-parse', '--git-path', 'hooks/pre-push']));
  const copyDir = path.join(path.resolve(root, git(root, ['rev-parse', '--git-common-dir'])), 'lifecycle-gate');
  return { hookFile, copyDir };
}

const SOURCE_REF = 'refs/remotes/origin/main'; // never origin/HEAD, which `git remote set-head` rewrites (R38)

function workingTreeSource() {
  return { names: COPIED, files: COPIED.map((name) => fs.readFileSync(path.join(__dirname, name), 'utf8')) };
}

const BARE_JS_NAME = /^[\w-]+(?:\.[\w-]+)*\.js$/;

// The files to copy, read from the COPIED line of origin/main's own checker,
// so a later main that adds or renames a helper still installs from an older
// branch (#1350). Without that line, this checker's list. null when the line
// names anything but bare .js file names in hooks/ (no paths).
function copiedList(checker) {
  const line = /^const COPIED = \[([^\]]*)\];/m.exec(checker);
  if (!line) return COPIED;
  const names = [...line[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2]);
  const valid = names.includes('lifecycle-prepush.js') && names.every((n) => BARE_JS_NAME.test(n));
  return valid ? names : null;
}

// The checker's source: the committed origin/main, so unmerged edits to the
// hooks cannot weaken the installed check (R33). Returns { names, files, note }
// or { refuse } when origin/main carries only some of the files (R40) or
// lists files outside hooks/ (#1350).
function checkerSource(root) {
  // Not git(): file contents must keep their trailing newline.
  const show = (name) => {
    try {
      return execFileSync('git', ['show', `${SOURCE_REF}:hooks/${name}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch { return null; }
  };
  const notInstalled = 'so the lifecycle pre-push hook was not installed';
  const checker = show('lifecycle-prepush.js');
  if (checker === null) {
    if (COPIED.some((name) => show(name) !== null)) {
      return { refuse: `${SOURCE_REF} carries only some of ${COPIED.join(', ')}, ${notInstalled}` };
    }
    return { ...workingTreeSource(), note: `checker copied from the working tree, because ${SOURCE_REF} does not carry the lifecycle hooks yet` };
  }
  const names = copiedList(checker);
  if (!names) return { refuse: `the checker on ${SOURCE_REF} lists files to copy that are not bare .js names in hooks/, ${notInstalled}` };
  const files = names.map((name) => (name === 'lifecycle-prepush.js' ? checker : show(name)));
  if (files.some((f) => f === null)) return { refuse: `${SOURCE_REF} carries only some of ${names.join(', ')}, ${notInstalled}` };
  return { names, files, fromRef: true, note: `checker copied from ${SOURCE_REF}` };
}

// Loads the copied checker in a child process; returns an error line or null.
function loadError(copy) {
  try {
    execFileSync(process.execPath, ['-e', `require(${JSON.stringify(copy)})`], { stdio: ['ignore', 'ignore', 'pipe'] });
    return null;
  } catch (err) {
    return String(err.stderr || err.message).split('\n').find((l) => /Error/.test(l)) || 'unknown error';
  }
}

function writeCopies(copyDir, { names, files }) {
  let changed = false;
  names.forEach((name, i) => {
    changed = writeIfChanged(path.join(copyDir, name), files[i], 0o644) || changed;
  });
  return changed;
}

// Returns { ok, message }. Never throws for the expected refusals.
function installHook(repo) {
  const root = git(repo, ['rev-parse', '--show-toplevel']);
  let hooksPath = '';
  try { hooksPath = git(root, ['config', '--get', 'core.hooksPath']); } catch { /* unset */ }
  if (hooksPath) {
    return { ok: false, message: `core.hooksPath is set (${hooksPath}), so the lifecycle pre-push hook cannot be installed` };
  }
  const { hookFile, copyDir } = locations(root);
  if (fs.existsSync(hookFile) && !fs.readFileSync(hookFile, 'utf8').includes(SHIM_MARK)) {
    return { ok: false, message: `${hookFile} already exists and was not written by the lifecycle gate; it was left alone` };
  }
  const source = checkerSource(root);
  if (source.refuse) return { ok: false, message: source.refuse };
  fs.mkdirSync(copyDir, { recursive: true });
  let changed = writeCopies(copyDir, source);
  let { note } = source;
  const copy = path.join(copyDir, 'lifecycle-prepush.js');
  const broken = source.fromRef ? loadError(copy) : null;
  if (broken) { // R39: never leave a checker that cannot run
    changed = writeCopies(copyDir, workingTreeSource()) || changed;
    note = `the checker on ${SOURCE_REF} failed to load (${broken}); copied from the working tree instead`;
  }
  fs.mkdirSync(path.dirname(hookFile), { recursive: true });
  changed = writeIfChanged(hookFile, shim(copy), 0o755) || changed;
  const state = changed ? 'installed' : 'already installed';
  return { ok: true, message: `lifecycle pre-push shim ${state} at ${hookFile} (${note})` };
}

// Removes the shim and the checker copy (R35). Leaves a foreign hook alone.
// Refused inside a Claude Code session unless the owner bypass is set (R37).
function uninstallHook(repo) {
  if (process.env.CLAUDECODE === '1' && process.env.BLOG_LIFECYCLE_GATE_BYPASS !== '1') {
    return {
      ok: false,
      message: 'removing the lifecycle pre-push check is refused inside a Claude Code session. The owner can run ' +
        'this command from their own terminal, or launch Claude Code with BLOG_LIFECYCLE_GATE_BYPASS=1 (Claude Code ' +
        'on the web has no terminal outside a session).',
    };
  }
  const root = git(repo, ['rev-parse', '--show-toplevel']);
  const { hookFile, copyDir } = locations(root);
  if (fs.existsSync(hookFile) && !fs.readFileSync(hookFile, 'utf8').includes(SHIM_MARK)) {
    return { ok: false, message: `${hookFile} was not written by the lifecycle gate; it was left alone` };
  }
  fs.rmSync(hookFile, { force: true });
  fs.rmSync(copyDir, { recursive: true, force: true });
  return { ok: true, message: `lifecycle pre-push check removed from ${root}` };
}

function isAncestor(cwd, sha, of) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, of], { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// True when pushing <sha> publishes nothing new: git's live <remote sha> for
// this ref already contains it (a no-op or a rewind). git fetched that sha
// from the remote during the push, so local refs cannot fake it. Local
// tracking refs are never trusted (R32, R38).
function alreadyPublished(cwd, sha, remoteSha) {
  return Boolean(remoteSha) && !ZERO.test(remoteSha) && isAncestor(cwd, sha, remoteSha);
}

// Returns a list of failure descriptions for the pushed refs.
function check(cwd, lines) {
  const state = readState(cwd);
  const failures = [];
  for (const line of lines) {
    const [localRef, localSha, remoteRef, remoteSha] = line.trim().split(/\s+/);
    if (!localSha || ZERO.test(localSha)) continue;
    if (alreadyPublished(cwd, localSha, remoteSha)) continue;
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
    failures = check(process.cwd(), lines);
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
    'launching Claude Code with BLOG_LIFECYCLE_GATE_BYPASS=1. (Note for the owner, not the agent: on a',
    'branch from before the lifecycle gate, which has no recorder, run',
    '`node .git/lifecycle-gate/lifecycle-prepush.js --uninstall` from your own terminal.)',
    '',
  ].join('\n'));
  return 1;
}

if (require.main === module) {
  if (process.argv[2] === '--install' || process.argv[2] === '--uninstall') {
    const install = process.argv[2] === '--install';
    let result;
    try { result = (install ? installHook : uninstallHook)(process.argv[3] || process.cwd()); } catch (err) {
      result = { ok: false, message: `could not ${install ? 'install' : 'remove'} the lifecycle pre-push hook (${String(err.message).split('\n')[0]})` };
    }
    process.stdout.write(`${result.message}\n`);
    process.exitCode = result.ok ? 0 : 2;
  } else {
    process.exitCode = runHook();
  }
}

module.exports = { installHook, SHIM_MARK };
