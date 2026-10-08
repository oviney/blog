#!/usr/bin/env node
// viney.ca blog — lifecycle snapshot recorder (#1340, Amendment 1)
//
// Records a working-tree snapshot when the `test` or `review` skill runs, for
// hooks/lifecycle-gate.js to compare against the content being pushed.
//
//   PostToolUse (matcher Skill): fires only after a successful call, so a
//   denied or failed skill call records nothing. The skill name must be exactly
//   `test` or `review`; `code-review` and plugin-prefixed names do not count.
//   UserPromptSubmit: a prompt that starts with /test or /review.
//
// Never blocks and never prints to stdout: on any error it logs to stderr and
// exits 0. A missed recording only means the gate asks for the skill again.

const { REQUIRED, repoRoot, recordSnapshot, hookCwd } = require('./lifecycle-snapshot');

function skillFor(input) {
  if (input.hook_event_name === 'PostToolUse' && input.tool_name === 'Skill') {
    const skill = String((input.tool_input || {}).skill || '');
    return REQUIRED.includes(skill) ? skill : null;
  }
  if (input.hook_event_name === 'UserPromptSubmit') {
    const typed = (String(input.prompt || '').match(/^\s*\/([\w:-]+)(?:\s|$)/) || [])[1];
    return REQUIRED.includes(typed) ? typed : null;
  }
  return null;
}

function main(raw) {
  try {
    const input = JSON.parse(raw);
    if (!input || typeof input !== 'object') return;
    const skill = skillFor(input);
    if (skill) recordSnapshot(repoRoot(hookCwd(input)), skill);
  } catch (err) {
    process.stderr.write(`lifecycle-record: not recorded (${err.message})\n`);
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => main(raw));
