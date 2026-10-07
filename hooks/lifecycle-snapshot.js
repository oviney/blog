// viney.ca blog — lifecycle snapshot helpers (#1340, Amendments 1 and 1.1)
//
// A snapshot is the git tree of the whole working directory: tracked files
// plus untracked, non-ignored ones. It is built in a throwaway copy of the
// index inside a private temp directory, so the real index is never touched.
// Each skill's snapshot is its own file, .git/lifecycle-gate-<skill>.json
// (per worktree, via --git-path), written atomically so concurrent records of
// `test` and `review` cannot overwrite each other. Never committed.

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

function statePath(root, skill) {
  return gitPath(root, `lifecycle-gate-${skill}.json`);
}

function worktreeTree(root) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifecycle-'));
  const tmpIndex = path.join(dir, 'index');
  try {
    const realIndex = gitPath(root, 'index');
    // Copying the real index keeps git's stat cache, so `add -A` only hashes changed files.
    if (fs.existsSync(realIndex)) fs.copyFileSync(realIndex, tmpIndex);
    git(root, ['add', '-A'], { GIT_INDEX_FILE: tmpIndex });
    return git(root, ['write-tree'], { GIT_INDEX_FILE: tmpIndex });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// The tree a ref points at, or null if it does not resolve.
function refTree(root, ref) {
  try {
    return git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{tree}`]) || null;
  } catch {
    return null;
  }
}

function headTree(root) {
  return git(root, ['rev-parse', 'HEAD^{tree}']);
}

function readState(root) {
  const state = {};
  for (const skill of REQUIRED) {
    try {
      state[skill] = JSON.parse(fs.readFileSync(statePath(root, skill), 'utf8'));
    } catch {
      // Not recorded yet.
    }
  }
  return state;
}

function recordSnapshot(root, skill) {
  const target = statePath(root, skill);
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ tree: worktreeTree(root), recordedAt: new Date().toISOString() }, null, 2)}\n`);
  fs.renameSync(tmp, target);
}

function changedPaths(root, fromTree, toTree) {
  const out = git(root, ['diff', '--name-only', fromTree, toTree]);
  return out ? out.split('\n') : [];
}

// Where the hook runs: the directory Claude Code reports, else the project.
function hookCwd(input) {
  return (input && input.cwd) || process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

module.exports = {
  REQUIRED, repoRoot, worktreeTree, refTree, headTree, readState, recordSnapshot, changedPaths, hookCwd,
};
