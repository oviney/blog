// viney.ca blog — lifecycle snapshot helpers (#1340, Amendment 1)
//
// A snapshot is the git tree of the whole working directory: tracked files
// plus untracked, non-ignored ones. It is built in a throwaway copy of the
// index, so the real index is never touched. Snapshots for the `test` and
// `review` skills live in .git/lifecycle-gate.json, which is never committed.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REQUIRED = ['test', 'review'];

function git(cwd, args, env) {
  return execFileSync('git', args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function repoRoot(cwd) {
  return git(cwd, ['rev-parse', '--show-toplevel']);
}

function gitPath(root, name) {
  return path.resolve(root, git(root, ['rev-parse', '--git-path', name]));
}

function worktreeTree(root) {
  const tmpIndex = path.join(os.tmpdir(), `lifecycle-index-${process.pid}-${Date.now()}`);
  try {
    const realIndex = gitPath(root, 'index');
    // Copying the real index keeps git's stat cache, so `add -A` only hashes changed files.
    if (fs.existsSync(realIndex)) fs.copyFileSync(realIndex, tmpIndex);
    git(root, ['add', '-A'], { GIT_INDEX_FILE: tmpIndex });
    return git(root, ['write-tree'], { GIT_INDEX_FILE: tmpIndex });
  } finally {
    fs.rmSync(tmpIndex, { force: true });
  }
}

function headTree(root) {
  return git(root, ['rev-parse', 'HEAD^{tree}']);
}

function readState(root) {
  try {
    return JSON.parse(fs.readFileSync(gitPath(root, 'lifecycle-gate.json'), 'utf8'));
  } catch {
    return {};
  }
}

function recordSnapshot(root, skill) {
  const state = readState(root);
  state[skill] = { tree: worktreeTree(root), recordedAt: new Date().toISOString() };
  fs.writeFileSync(gitPath(root, 'lifecycle-gate.json'), `${JSON.stringify(state, null, 2)}\n`);
}

function changedPaths(root, fromTree, toTree) {
  const out = git(root, ['diff', '--name-only', fromTree, toTree]);
  return out ? out.split('\n') : [];
}

// Where the hook runs: the directory Claude Code reports, else the project.
function hookCwd(input) {
  return (input && input.cwd) || process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

module.exports = { REQUIRED, repoRoot, worktreeTree, headTree, readState, recordSnapshot, changedPaths, hookCwd };
