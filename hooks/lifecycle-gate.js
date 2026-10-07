#!/usr/bin/env node
// viney.ca blog — PreToolUse lifecycle gate (#1340)
//
// Denies pushes and PR creation unless the `test` and `review` skills ran on
// exactly the content being published. hooks/lifecycle-record.js snapshots the
// working tree when each skill runs; this gate resolves what each action would
// publish and requires both snapshots to equal it:
//
//   git push            every source ref in the refspecs (none means HEAD);
//                       deletes and --dry-run publish nothing; --all, --mirror,
//                       --tags and --branches are always denied
//   gh pr create        the --head/-H branch, else HEAD
//   gh api PR writes    the `head` field (-f/-F/--field, or --input JSON), else HEAD
//   MCP create_pull_request   its `head` branch
//   MCP push_files, create_or_update_file, delete_file   the working tree (a proxy)
//
// The repo is the one the command targets: `git -C <dir>`, `--git-dir <dir>`,
// or a preceding `cd <dir>` in the same command, else the hook's cwd. Pushes
// are found when chained, in subshells, behind env/timeout/nohup/xargs/sudo,
// inside `sh -c`/`bash -c`, with absolute git paths or line continuations.
// Heredoc bodies and quoted text are not commands. Merges are not gated.
//
// Escape hatch: BLOG_LIFECYCLE_GATE_BYPASS=1 in the Claude Code process
// environment. Hooks inherit Claude Code's environment, not a tool command's,
// so the agent cannot set it from a Bash call.
//
// Fails closed: any error while checking a gated action denies it. Input that
// shows no gated action (malformed, null, or another tool) is allowed.
// Not a sandbox: $(...), backticks, eval and scripts that push are out of scope.
// See specs/agent-skills-lifecycle-enforcement.md.

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  REQUIRED, repoRoot, worktreeTree, refTree, readState, changedPaths, hookCwd,
} = require('./lifecycle-snapshot');

const MCP_FILE_WRITE_TOOLS = new Set([
  'mcp__github__push_files',
  'mcp__github__create_or_update_file',
  'mcp__github__delete_file',
]);
const MCP_CREATE_PR = 'mcp__github__create_pull_request';

const LEADING_NOISE = new RegExp('^(?:' + [
  '[!{]\\s*',
  '\\\\',
  '(?:then|do|else|command|exec|time|nohup|nice)\\s+',
  'sudo(?:\\s+(?:-[ugCDhpRrTtU]\\s+\\S+|-\\S+))*\\s+',
  '(?:env|xargs)(?:\\s+-\\S+)*\\s+',
  'timeout(?:\\s+-\\S+)*\\s+\\S+\\s+',
  '[A-Za-z_]\\w*=\\S*\\s+',
].join('|') + ')+');
const HEREDOC = /<<[-~]?\s*(['"]?)([A-Za-z_]\w*)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g;
const SHELL_C = /\b(?:ba|z|da)?sh\s+-c\s+(?:"((?:\\.|[^"\\])*)"|'([^']*)')/g;
const QUOTED = /"(?:\\.|[^"\\])*"|'[^']*'/g;
const SEPARATORS = /\n|&&|\|\||[;|&()`]|\$\(/;
const BULK = new Set(['--all', '--mirror', '--tags', '--branches']);
const PUSH_OPTS_WITH_ARG = new Set(['-o', '--push-option', '--receive-pack', '--exec', '--repo']);
const GIT_OPTS_WITH_ARG = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

// Characters that would split a quoted string are swapped for private-use
// code points, so quoted text stays one inert token and can be decoded back.
const SPECIAL = ' \t\n;&|()`$<>';
const ENCODE = Object.fromEntries([...SPECIAL].map((c, i) => [c, String.fromCharCode(0xe000 + i)]));
const DECODE = Object.fromEntries(Object.entries(ENCODE).map(([c, e]) => [e, c]));

function encodeQuotes(command) {
  return command.replace(QUOTED, (q) => q.replace(/[ \t\n;&|()`$<>]/g, (c) => ENCODE[c]));
}

// A token as the shell would pass it: placeholders decoded, quotes removed.
function word(token) {
  return token.replace(/[\ue000-\ue00b]/g, (c) => DECODE[c]).replace(/^(["'])([\s\S]*)\1$/, '$2');
}

function tokens(segment) {
  const out = [];
  const raw = segment.split(/\s+/).filter(Boolean);
  for (let i = 0; i < raw.length; i += 1) {
    if (/^\d*[<>]+&?$/.test(raw[i])) { i += 1; continue; } // `> file`, `2> file`
    if (/^\d*[<>]/.test(raw[i])) continue; // `>file`, `2>&1`
    out.push(word(raw[i]));
  }
  return out;
}

function expandHome(p) {
  return p === '~' || p.startsWith('~/') ? path.join(os.homedir(), p.slice(1)) : p;
}

// `git [global options] push [options] [remote [refspec...]]`
function parseGitPush(t, dir) {
  let i = 1;
  let gitDir = null;
  let workTree = null;
  while (i < t.length && t[i].startsWith('-')) {
    const [opt, inline] = t[i].split(/=(.*)/s);
    const value = inline !== undefined ? inline : (GIT_OPTS_WITH_ARG.has(opt) ? t[++i] : undefined);
    if (opt === '-C' && value) dir = path.resolve(dir, expandHome(value));
    if (opt === '--git-dir' && value) gitDir = path.resolve(dir, expandHome(value));
    if (opt === '--work-tree' && value) workTree = path.resolve(dir, expandHome(value));
    i += 1;
  }
  if (t[i] !== 'push') return null;

  const action = { name: 'git push', dir, gitDir, workTree, refs: [] };
  const positional = [];
  let dryRun = false;
  let deleting = false;
  for (i += 1; i < t.length; i += 1) {
    const arg = t[i];
    if (BULK.has(arg)) return { ...action, bulk: arg };
    if (arg === '--dry-run' || arg === '--delete') { dryRun = dryRun || arg === '--dry-run'; deleting = deleting || arg === '--delete'; continue; }
    if (PUSH_OPTS_WITH_ARG.has(arg)) { i += 1; continue; }
    if (/^-[A-Za-z]+$/.test(arg)) { dryRun = dryRun || arg.includes('n'); deleting = deleting || arg.includes('d'); continue; }
    if (arg.startsWith('-')) continue;
    positional.push(arg);
  }
  if (dryRun || deleting) return { ...action, refs: [] };
  const refspecs = positional.slice(1);
  for (const spec of refspecs.length ? refspecs : ['HEAD']) {
    const src = spec.replace(/^\+/, '').split(':')[0];
    if (!src) continue; // `:branch` deletes a remote ref
    if (src.includes('*')) return { ...action, bulk: spec };
    action.refs.push(src);
  }
  return action;
}

function branchName(ref) {
  return String(ref).replace(/^[^:]+:/, ''); // `owner:branch` → `branch`
}

function parseGhPrCreate(t, dir) {
  let head = 'HEAD';
  for (let i = 3; i < t.length; i += 1) {
    const [opt, inline] = t[i].split(/=(.*)/s);
    if (opt === '--head' || opt === '-H') head = branchName(inline !== undefined ? inline : t[i + 1]);
  }
  return { name: 'gh pr create', dir, refs: [head] };
}

function parseGhApi(t, dir) {
  const endpoint = t.slice(2).find((x) => !x.startsWith('-') && /repos\/\S+\/pulls$/.test(x.replace(/\?.*$/, '')));
  if (!endpoint) return null;
  let method = null;
  let head = null;
  let input = null;
  let hasFields = false;
  for (let i = 2; i < t.length; i += 1) {
    const [opt, inline] = t[i].split(/=(.*)/s);
    const value = () => (inline !== undefined ? inline : t[++i]);
    if (opt === '-X' || opt === '--method') method = String(value()).toUpperCase();
    else if (['-f', '-F', '--field', '--raw-field'].includes(opt)) {
      hasFields = true;
      const field = String(value());
      if (field.startsWith('head=')) head = branchName(field.slice(5));
    } else if (opt === '--input') input = value();
  }
  const writes = method ? ['POST', 'PUT', 'PATCH'].includes(method) : hasFields || input !== null;
  if (!writes) return null;
  if (!head && input) {
    if (input === '-') return { name: 'gh api pull request write', dir, unknownHead: 'it reads the body from stdin' };
    head = branchName(JSON.parse(fs.readFileSync(path.resolve(dir, input), 'utf8')).head || 'HEAD');
  }
  return { name: 'gh api pull request write', dir, refs: [head || 'HEAD'] };
}

function gatedBash(command, startDir) {
  const actions = [];
  const cmd = stripHeredocs(command).replace(/\\\n[ \t]*/g, ' ');
  for (const m of cmd.matchAll(SHELL_C)) {
    actions.push(...gatedBash(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : m[2], startDir));
  }
  let dir = startDir;
  for (const raw of encodeQuotes(cmd).split(SEPARATORS)) {
    const t = tokens(raw.trim().replace(LEADING_NOISE, ''));
    if (t.length === 0) continue;
    if (t[0] === 'cd') { dir = path.resolve(dir, expandHome(t[1] || '~')); continue; }
    let action = null;
    if (/^(?:\S*\/)?git$/.test(t[0])) action = parseGitPush(t, dir);
    else if (t[0] === 'gh' && t[1] === 'pr' && t[2] === 'create') action = parseGhPrCreate(t, dir);
    else if (t[0] === 'gh' && t[1] === 'api') action = parseGhApi(t, dir);
    if (action) actions.push(action);
  }
  return actions;
}

// Heredoc bodies are data, not commands; keep the rest of the operator line.
function stripHeredocs(command) {
  return command.replace(HEREDOC, ' $3');
}

function gatedActions(input) {
  const tool = input.tool_name || '';
  const toolInput = input.tool_input || {};
  const dir = hookCwd(input);
  if (MCP_FILE_WRITE_TOOLS.has(tool)) return [{ name: tool, dir, worktree: true }];
  if (tool === MCP_CREATE_PR) {
    return [toolInput.head ? { name: tool, dir, refs: [branchName(toolInput.head)] }
      : { name: tool, dir, unknownHead: 'it has no head branch' }];
  }
  if (tool === 'Bash') return gatedBash(String(toolInput.command || ''), dir);
  return [];
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

function rootFor(action) {
  if (action.workTree) return repoRoot(action.workTree);
  if (action.gitDir) {
    if (path.basename(action.gitDir) === '.git') return repoRoot(path.dirname(action.gitDir));
    throw new Error(`cannot tell which working tree --git-dir ${action.gitDir} belongs to`);
  }
  return repoRoot(action.dir);
}

// Returns a deny reason for one action, or null if it may proceed.
function problem(action) {
  if (action.bulk) {
    return `Lifecycle gate (#1340): \`git push ${action.bulk}\` is blocked: bulk pushes cannot be checked ref by ref. ` +
      'Push named branches one at a time, after test and review have run on each.';
  }
  if (action.unknownHead) {
    return `Lifecycle gate (#1340): ${action.name} is blocked because ${action.unknownHead}, so the gate cannot tell ` +
      'what it publishes. Name the head branch explicitly (for example -f head=<branch>).';
  }
  const root = rootFor(action);
  const state = readState(root);
  const targets = action.worktree ? [{ label: 'the working tree', tree: worktreeTree(root) }]
    : action.refs.map((ref) => ({ label: ref, tree: refTree(root, ref) }));
  for (const { label, tree } of targets) {
    if (!tree) return `Lifecycle gate (#1340): ${action.name} is blocked: could not resolve \`${label}\` in ${root}. ${HOW}`;
    const stale = REQUIRED.filter((s) => !state[s] || state[s].tree !== tree);
    if (stale.length === 0) continue;
    const changed = new Set();
    for (const s of stale) {
      if (state[s]) changedPaths(root, state[s].tree, tree).forEach((p) => changed.add(p));
    }
    const files = [...changed];
    const detail = files.length
      ? ` Changed since they ran: ${files.slice(0, 10).join(', ')}${files.length > 10 ? `, and ${files.length - 10} more` : ''}.`
      : '';
    return `Lifecycle gate (#1340): ${action.name} of \`${label}\` is blocked. Not yet run on this content: ` +
      `${stale.join(', ')}.${detail} ${HOW}`;
  }
  return null;
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch {
    process.stderr.write('lifecycle-gate: stdin is not JSON; no gated action visible, allowing\n');
    return;
  }
  if (!input || typeof input !== 'object') return;

  let actions;
  try { actions = gatedActions(input); } catch (err) {
    deny(`Lifecycle gate (#1340): could not parse this tool call (${err.message}), so it is blocked. ${HOW}`);
    return;
  }
  if (actions.length === 0) return;
  if (process.env.BLOG_LIFECYCLE_GATE_BYPASS === '1') {
    process.stderr.write(`lifecycle-gate: ${actions.map((a) => a.name).join(', ')} allowed by BLOG_LIFECYCLE_GATE_BYPASS\n`);
    return;
  }
  for (const action of actions) {
    let reason;
    try {
      reason = problem(action);
    } catch (err) {
      reason = `Lifecycle gate (#1340): could not verify the lifecycle for ${action.name} ` +
        `(${String(err.message).split('\n')[0]}), so it is blocked. ${HOW}`;
    }
    if (reason) { deny(reason); return; }
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => main(raw));
