#!/usr/bin/env node
// viney.ca blog — PreToolUse lifecycle gate (#1340)
//
// Denies pushes and PR creation until the `test` and `review` skills have run
// after the session's last file edit. Evidence comes from the session
// transcript (JSONL): a `Skill` tool call, or a user-typed /test or /review.
//
// Gated: `git push` (incl. chained, `git -C dir push`, env-prefixed),
// `gh pr create`, `gh api` writes to .../pulls, and the GitHub MCP tools that
// write to the remote (create_pull_request, push_files, create_or_update_file,
// delete_file).
//
// Escape hatch: BLOG_LIFECYCLE_GATE_BYPASS=1 in the Claude Code process
// environment. Hooks inherit Claude Code's environment, not a tool command's,
// so the agent cannot set it from a Bash call.
//
// Fails closed for gated actions (unreadable transcript → deny). Fails open
// only when stdin is not valid JSON, since then no gated action is visible.

const fs = require('fs');

const REQUIRED = ['test', 'review'];
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const MCP_WRITE_TOOLS = new Set([
  'mcp__github__create_pull_request',
  'mcp__github__push_files',
  'mcp__github__create_or_update_file',
  'mcp__github__delete_file',
]);

const GIT_PUSH = /^git(?:\s+(?:-C|-c)\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+push(?:\s|$)/;
const GH_PR_CREATE = /^gh\s+pr\s+create(?:\s|$)/;
const GH_API = /^gh\s+api(?:\s|$)/;
const PULLS_ENDPOINT = /repos\/\S+\/pulls(?:[\s"'?]|$)/;
const GH_API_WRITE = /(?:-X|--method)[\s=]*(?:POST|PUT|PATCH)\b|\s(?:-f|-F|--field|--raw-field|--input)(?:[\s=]|$)/i;
const LEADING_NOISE = /^(?:[({!]\s*|(?:then|do|else|sudo|command|exec|time)\s+|[A-Za-z_]\w*=(?:"[^"]*"|'[^']*'|\S*)\s+)+/;

function gatedBashSegment(command) {
  for (const raw of command.split(/\n|&&|\|\||;|\|/)) {
    const seg = raw.trim().replace(LEADING_NOISE, '');
    if (GIT_PUSH.test(seg)) return 'git push';
    if (GH_PR_CREATE.test(seg)) return 'gh pr create';
    if (GH_API.test(seg) && PULLS_ENDPOINT.test(seg) && GH_API_WRITE.test(seg)) return 'gh api pull request write';
  }
  return null;
}

function gatedAction(input) {
  const tool = input.tool_name || '';
  if (MCP_WRITE_TOOLS.has(tool)) return tool;
  if (tool === 'Bash') return gatedBashSegment(String((input.tool_input || {}).command || ''));
  return null;
}

// Name of a required skill a user-typed message invokes, or null.
function typedSkill(text) {
  const tag = text.match(/<command-name>\/?([\w:-]+)<\/command-name>/);
  const name = tag ? tag[1] : (text.match(/^\s*\/([\w:-]+)(?:\s|$)/) || [])[1];
  return name && REQUIRED.includes(name) ? name : null;
}

// Returns { [skill]: position } for required skills run after the last edit.
function freshSkills(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  const seen = {};
  let lastEdit = -1;
  let pos = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const content = entry.message && entry.message.content;
    const items = typeof content === 'string' ? [{ type: 'text', text: content }]
      : Array.isArray(content) ? content : [];
    for (const item of items) {
      pos += 1;
      if (entry.type === 'assistant' && item.type === 'tool_use') {
        if (EDIT_TOOLS.has(item.name)) lastEdit = pos;
        if (item.name === 'Skill') {
          const skill = String((item.input || {}).skill || '');
          if (REQUIRED.includes(skill)) seen[skill] = pos;
        }
      } else if (entry.type === 'user' && item.type === 'text' && typeof item.text === 'string') {
        const skill = typedSkill(item.text);
        if (skill) seen[skill] = pos;
      }
    }
  }
  return REQUIRED.filter((s) => seen[s] > lastEdit);
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

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch {
    process.stderr.write('lifecycle-gate: stdin is not JSON; allowing\n');
    return;
  }
  const action = gatedAction(input);
  if (!action) return;
  if (process.env.BLOG_LIFECYCLE_GATE_BYPASS === '1') {
    process.stderr.write(`lifecycle-gate: ${action} allowed by BLOG_LIFECYCLE_GATE_BYPASS\n`);
    return;
  }

  let fresh;
  try {
    fresh = freshSkills(input.transcript_path);
  } catch (err) {
    deny(`Lifecycle gate (#1340): cannot read the session transcript (${err.message}), so ${action} is blocked. ` +
      'The owner can set BLOG_LIFECYCLE_GATE_BYPASS=1 when launching Claude Code to override.');
    return;
  }
  const missing = REQUIRED.filter((s) => !fresh.includes(s));
  if (missing.length === 0) return;

  deny(`Lifecycle gate (#1340): ${action} is blocked until the test and review skills have run after your ` +
    `last file edit (missing: ${missing.join(', ')}). Invoke the missing skill(s) with the Skill tool, ` +
    'fix anything they find, then retry. CLAUDE.md makes this lifecycle mandatory. ' +
    'Only the owner can bypass, by launching Claude Code with BLOG_LIFECYCLE_GATE_BYPASS=1.');
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => main(raw));
