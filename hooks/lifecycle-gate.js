#!/usr/bin/env node
// viney.ca blog — PreToolUse lifecycle gate (#1340)
//
// Denies pushes and PR creation unless the `test` and `review` skills ran on
// exactly the content being pushed. hooks/lifecycle-record.js snapshots the
// working tree when each skill runs; this gate compares those snapshots with
// HEAD^{tree} (git push, gh pr create, gh api PR writes) or, for the GitHub MCP
// remote-write tools, with the current working tree. Any change after review,
// made by any tool, shell command or subagent, therefore makes it stale.
//
// Gated: `git push` (chained, in subshells, behind env/timeout/nohup/xargs,
// inside `sh -c`/`bash -c`, absolute git paths, `git -C dir`), `gh pr create`,
// `gh api` writes to .../pulls, and the MCP tools create_pull_request,
// push_files, create_or_update_file, delete_file. Merges are not gated (#1340).
// Heredoc bodies and quoted text are not treated as commands.
//
// Escape hatch: BLOG_LIFECYCLE_GATE_BYPASS=1 in the Claude Code process
// environment. Hooks inherit Claude Code's environment, not a tool command's,
// so the agent cannot set it from a Bash call.
//
// Fails closed: any error while checking a gated action denies it. Input that
// shows no gated action (malformed, null, or another tool) is allowed.
// Not a sandbox: $(...), backticks, eval and scripts that push are out of scope.

const { REQUIRED, repoRoot, worktreeTree, headTree, readState, changedPaths, hookCwd } = require('./lifecycle-snapshot');

const MCP_WRITE_TOOLS = new Set([
  'mcp__github__create_pull_request',
  'mcp__github__push_files',
  'mcp__github__create_or_update_file',
  'mcp__github__delete_file',
]);

const GIT_PUSH = /^(?:\S*\/)?git(?:\s+(?:-C|-c)\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+push(?=[\s>]|$)/;
const GH_PR_CREATE = /^gh\s+pr\s+create(?=\s|$)/;
const GH_API = /^gh\s+api(?=\s|$)/;
const PULLS_ENDPOINT = /repos\/\S+\/pulls(?=[\s"'?]|$)/;
const GH_API_WRITE = /(?:-X|--method)[\s=]*(?:POST|PUT|PATCH)\b|\s(?:-f|-F|--field|--raw-field|--input)(?=[\s=]|$)/i;
const GH_API_GET = /(?:-X|--method)[\s=]*GET\b/i;
const LEADING_NOISE = new RegExp('^(?:' + [
  '[!{]\\s*',
  '\\\\',
  '(?:then|do|else|sudo|command|exec|time|nohup|nice)\\s+',
  '(?:env|xargs)(?:\\s+-\\S+)*\\s+',
  'timeout(?:\\s+-\\S+)*\\s+\\S+\\s+',
  '[A-Za-z_]\\w*=\\S*\\s+',
].join('|') + ')+');
const HEREDOC = /<<[-~]?\s*(['"]?)([A-Za-z_]\w*)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g;
const SHELL_C = /\b(?:ba|z|da)?sh\s+-c\s+(?:"((?:\\.|[^"\\])*)"|'([^']*)')/g;
const QUOTED = /"(?:\\.|[^"\\])*"|'[^']*'/g;
const SEPARATORS = /\n|&&|\|\||[;|&()`]|\$\(/;

// Heredoc bodies are data, not commands; keep the rest of the operator line.
function stripHeredocs(command) {
  return command.replace(HEREDOC, ' $3');
}

// Keep quoted text as one inert token so separators and words inside it do not count.
function neutralizeQuotes(command) {
  return command.replace(QUOTED, (q) => q.replace(/[\s;&|()`$<>]/g, '_'));
}

function gatedBash(command) {
  const cmd = stripHeredocs(command);
  for (const m of cmd.matchAll(SHELL_C)) {
    const inner = gatedBash(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : m[2]);
    if (inner) return inner;
  }
  for (const raw of neutralizeQuotes(cmd).split(SEPARATORS)) {
    const seg = raw.trim().replace(LEADING_NOISE, '');
    if (GIT_PUSH.test(seg)) return 'git push';
    if (GH_PR_CREATE.test(seg)) return 'gh pr create';
    if (GH_API.test(seg) && PULLS_ENDPOINT.test(seg) && GH_API_WRITE.test(seg) && !GH_API_GET.test(seg)) {
      return 'gh api pull request write';
    }
  }
  return null;
}

// Returns { name, target } for a gated action, else null. `target` says which
// tree the snapshots must match.
function gatedAction(input) {
  const tool = input.tool_name || '';
  if (MCP_WRITE_TOOLS.has(tool)) return { name: tool, target: 'worktree' };
  if (tool === 'Bash') {
    const name = gatedBash(String((input.tool_input || {}).command || ''));
    return name ? { name, target: 'head' } : null;
  }
  return null;
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

function check(input, action) {
  const root = repoRoot(hookCwd(input));
  const target = action.target === 'head' ? headTree(root) : worktreeTree(root);
  const state = readState(root);
  const stale = REQUIRED.filter((s) => !state[s] || state[s].tree !== target);
  if (stale.length === 0) return;

  const changed = new Set();
  for (const s of stale) {
    if (state[s]) changedPaths(root, state[s].tree, target).forEach((p) => changed.add(p));
  }
  const files = [...changed];
  const detail = files.length
    ? ` Changed since they ran: ${files.slice(0, 10).join(', ')}${files.length > 10 ? `, and ${files.length - 10} more` : ''}.`
    : '';
  deny(`Lifecycle gate (#1340): ${action.name} is blocked. Not yet run on this content: ${stale.join(', ')}.` +
    `${detail} ${HOW}`);
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch {
    process.stderr.write('lifecycle-gate: stdin is not JSON; no gated action visible, allowing\n');
    return;
  }
  if (!input || typeof input !== 'object') return;

  let action;
  try { action = gatedAction(input); } catch (err) {
    deny(`Lifecycle gate (#1340): could not parse this tool call (${err.message}), so it is blocked. ${HOW}`);
    return;
  }
  if (!action) return;
  if (process.env.BLOG_LIFECYCLE_GATE_BYPASS === '1') {
    process.stderr.write(`lifecycle-gate: ${action.name} allowed by BLOG_LIFECYCLE_GATE_BYPASS\n`);
    return;
  }
  try {
    check(input, action);
  } catch (err) {
    deny(`Lifecycle gate (#1340): could not verify the lifecycle for ${action.name} (${err.message.split('\n')[0]}), ` +
      `so it is blocked. ${HOW}`);
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => main(raw));
