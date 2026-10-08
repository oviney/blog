#!/usr/bin/env node
// viney.ca blog — PreToolUse lifecycle gate (#1340, Amendment 2)
//
// Pushes are enforced by git itself: hooks/lifecycle-prepush.js runs as the
// pre-push hook and checks the exact refs being sent. This gate covers what
// git cannot see, without parsing shell (whole-command substring checks only):
//
//   1. Evasion guards. Deny Bash commands that would skip or disable the
//      pre-push check: `--no-verify` with `push`, `core.hooksPath`,
//      `.git/hooks`, `lifecycle-gate` anywhere except the snapshot files and
//      hooks/lifecycle-gate.js (R34, R41), the checker's uninstall (R37),
//      `update-ref` or a fetch of local content into a remote-tracking ref
//      (R38, #1350), `send-pack`, or setting CLAUDECODE or the owner bypass.
//      Deny Edit/Write/NotebookEdit under .git/hooks/ and .git/lifecycle-gate/.
//   2. Install on push. When a command mentions `push`, make sure the pre-push
//      shim is installed in the session's repo; deny with the reason if it
//      cannot be (a foreign pre-push hook, or core.hooksPath set).
//   3. Writes that bypass git: the GitHub MCP file tools (push_files,
//      create_or_update_file, delete_file) and `gh api` writes to contents/,
//      git/{refs,trees,commits,blobs,tags}, or GraphQL commit/ref mutations.
//      Both snapshots must equal the current working tree, as a proxy for
//      what those calls send.
//
// PR creation is not gated: its head branch had to pass pre-push. Merges are
// not gated. Escape hatch: BLOG_LIFECYCLE_GATE_BYPASS=1 in the Claude Code
// process environment. Fails closed on errors in a gated action.
// See specs/agent-skills-lifecycle-enforcement.md.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { REQUIRED, repoRoot, worktreeTree, readState, changedPaths, hookCwd } = require('./lifecycle-snapshot');
const { installHook } = require('./lifecycle-prepush');

// Any MCP server whose name contains "github" (R26); the settings matcher uses
// the same pattern.
const MCP_FILE_WRITE = /^mcp__.*github.*__(?:push_files|create_or_update_file|delete_file)$/i;
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const PROTECTED_GIT_PATH = /(^|\/)\.git\/(?:hooks|lifecycle-gate)(\/|$)/;
// `fetch [options] <local source> ... :[refs/]remotes/origin/...`, where the
// source is `.`, `..`, a relative, absolute or home path, or a file:// URL.
const LOCAL_FETCH_INTO_REMOTES =
  /\bfetch\b(?:\s+-{1,2}[\w-]+(?:=\S+)?)*\s+['"]?(?:\.{1,2}(?:\/\S*)?|\/\S*|~\S*|file:\/\/\S*)['"]?\s[\s\S]*:(?:refs\/)?remotes\/origin\//;

const GUARDS = [
  [(c) => /--no-verify/.test(c) && /\bpush\b/.test(c), '`--no-verify` would skip the pre-push lifecycle check'],
  [(c) => /core\.hooksPath/i.test(c), 'changing core.hooksPath would disable the pre-push lifecycle check'],
  [(c) => /\.git\/hooks/.test(c), 'commands touching .git/hooks could remove the pre-push lifecycle check'],
  // `lifecycle-gate` anywhere (R34, R41), except the snapshot files and the hook sources under hooks/.
  [(c) => /lifecycle-gate/.test(c.replace(/lifecycle-gate-(?:test|review)\.json/g, '').replace(/hooks\/lifecycle-gate\.js/g, '')),
    'commands touching the lifecycle-gate checker copy could change the pre-push lifecycle check'],
  [(c) => /lifecycle-prepush/.test(c) && /--uninstall/.test(c), 'only the owner can remove the pre-push lifecycle check, from ' +
    'their own terminal or by launching Claude Code with BLOG_LIFECYCLE_GATE_BYPASS=1'],
  // Ordinary commands that point origin's tracking refs (the installer reads
  // refs/remotes/origin/main, R38) at local content: update-ref, and a fetch
  // from `.`, a path or file:// into (refs/)remotes/origin/ (R42, R43).
  // Fetches from a named remote can only select commits that remote has, and
  // install refuses when origin/main lacks the hooks (R49), so they are allowed.
  [(c) => /\bupdate-ref\b/.test(c), '`git update-ref` can rewrite local tracking refs'],
  [(c) => LOCAL_FETCH_INTO_REMOTES.test(c), 'fetching local content into a remote-tracking ref rewrites it'],
  [(c) => /\bsend-pack\b/.test(c), '`git send-pack` pushes without running the pre-push hook'],
  [(c) => /\bCLAUDECODE\b/.test(c), 'CLAUDECODE scopes the pre-push check to Claude sessions and must not be changed'],
  [(c) => /\bBLOG_LIFECYCLE_GATE_BYPASS\b/.test(c), 'only the owner can bypass, from the environment Claude Code is launched with'],
];

const GH_API = /\bgh\s+api\b/;
const CONTENT_ENDPOINT = /\/contents\/|\/git\/(?:refs|trees|commits|blobs|tags)\b/;
const GRAPHQL_WRITE = /\bgraphql\b[\s\S]*\b(?:createCommitOnBranch|createRef|updateRef|updateRefs)\b/;
const EXPLICIT_GET = /(?:-X|--method)[\s=]*GET\b/i;
const WRITE_SIGNAL = /(?:-X|--method)[\s=]*(?:POST|PUT|PATCH|DELETE)\b|\s(?:-f|-F|--field|--raw-field|--input)(?=[\s=])/i;

function ghApiContentWrite(command) {
  if (!GH_API.test(command)) return false;
  if (GRAPHQL_WRITE.test(command)) return true;
  return CONTENT_ENDPOINT.test(command) && !EXPLICIT_GET.test(command) && WRITE_SIGNAL.test(command);
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

const HOW = 'Invoke the skill(s) with the Skill tool (exactly `test` / `review`; the built-in /code-review does not count), ' +
  'fix anything they find, commit, then retry. CLAUDE.md makes this lifecycle mandatory. ' +
  'Only the owner can bypass, by launching Claude Code with BLOG_LIFECYCLE_GATE_BYPASS=1.';

// Proxy check for writes that bypass git: snapshots must equal the working tree.
function proxyProblem(input, name) {
  const root = repoRoot(hookCwd(input));
  const tree = worktreeTree(root);
  const state = readState(root);
  const stale = REQUIRED.filter((s) => !state[s] || state[s].tree !== tree);
  if (stale.length === 0) return null;
  const changed = new Set();
  for (const s of stale) {
    if (state[s]) changedPaths(root, state[s].tree, tree).forEach((p) => changed.add(p));
  }
  const files = [...changed];
  const detail = files.length
    ? ` Changed since they ran: ${files.slice(0, 10).join(', ')}${files.length > 10 ? `, and ${files.length - 10} more` : ''}.`
    : '';
  return `Lifecycle gate (#1340): ${name} is blocked. Not yet run on this content: ${stale.join(', ')}.${detail} ${HOW}`;
}

function commonDir(dir) {
  const out = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return path.resolve(dir, out.trim());
}

// Install only into this project's repo (any worktree of it) or another clone
// of the blog; never into unrelated repos the session happens to push from (R21).
function isBlogRepo(root) {
  if (fs.existsSync(path.join(root, 'hooks', 'lifecycle-prepush.js'))) return true;
  const project = process.env.CLAUDE_PROJECT_DIR;
  if (!project) return false;
  try { return commonDir(root) === commonDir(project); } catch { return false; }
}

// Returns a deny reason, or null to allow.
function evaluate(input) {
  const tool = input.tool_name || '';
  const toolInput = input.tool_input || {};

  if (EDIT_TOOLS.has(tool)) {
    const file = String(toolInput.file_path || toolInput.notebook_path || '');
    return PROTECTED_GIT_PATH.test(path.resolve(hookCwd(input), file))
      ? 'Lifecycle gate (#1340): editing .git/hooks or .git/lifecycle-gate could change the pre-push lifecycle check, so it is blocked.'
      : null;
  }
  if (MCP_FILE_WRITE.test(tool)) return proxyProblem(input, tool);
  if (tool !== 'Bash') return null;

  const command = String(toolInput.command || '');
  for (const [matches, why] of GUARDS) {
    if (matches(command)) {
      return `Lifecycle gate (#1340): this command is blocked because ${why}. These guards match text anywhere in ` +
        'the command; if the words are only in a commit message or other text, write it to a file first ' +
        '(for example `git commit -F <file>`).';
    }
  }
  if (/\bpush\b/.test(command)) {
    let root = null;
    try { root = repoRoot(hookCwd(input)); } catch { /* not in a repo: nothing to install into */ }
    if (root && isBlogRepo(root)) {
      const result = installHook(root);
      if (!result.ok) {
        return `Lifecycle gate (#1340): pushes are blocked because the pre-push lifecycle check is not active: ${result.message}. ` +
          'Ask the owner to resolve it.';
      }
    }
  }
  if (ghApiContentWrite(command)) return proxyProblem(input, 'gh api content write');
  return null;
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch {
    process.stderr.write('lifecycle-gate: stdin is not JSON; no gated action visible, allowing\n');
    return;
  }
  if (!input || typeof input !== 'object') return;
  if (process.env.BLOG_LIFECYCLE_GATE_BYPASS === '1') return;
  let reason;
  try {
    reason = evaluate(input);
  } catch (err) {
    reason = `Lifecycle gate (#1340): could not verify the lifecycle for ${input.tool_name || 'this call'} ` +
      `(${String(err.message).split('\n')[0]}), so it is blocked. ${HOW}`;
  }
  if (reason) deny(reason);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => main(raw));
