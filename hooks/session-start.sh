#!/bin/bash
# viney.ca blog — session start hook
# Injects the using-agent-skills meta-skill into every new session.
#
# Registered in .claude/settings.json (and hooks/hooks.json for plugin installs).
# Claude Code reads hookSpecificOutput.additionalContext; any other JSON shape is
# ignored, which is how this hook went silently dead before #1340.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(dirname "$SCRIPT_DIR")}"
META_SKILL="$REPO_ROOT/.github/skills/using-agent-skills/SKILL.md"

# Install (or confirm) the git pre-push lifecycle check; report the outcome either way.
INSTALL=$(node "$SCRIPT_DIR/lifecycle-prepush.js" --install "$REPO_ROOT" 2>&1) || INSTALL="WARNING: $INSTALL. Claude's pushes will be blocked until this is resolved."

if [ -f "$META_SKILL" ]; then
  MESSAGE="agent-skills loaded for viney.ca blog. The lifecycle in CLAUDE.md is mandatory: invoke spec, plan, build, test, review and ship in order. git rejects your pushes (pre-push hook) unless test and review ran on exactly the content being pushed.
Pre-push check: $INSTALL

$(cat "$META_SKILL")"
else
  MESSAGE="blog agent-skills: using-agent-skills meta-skill not found at $META_SKILL. The lifecycle in CLAUDE.md is still mandatory.
Pre-push check: $INSTALL"
fi

MESSAGE="$MESSAGE" node -e 'process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: process.env.MESSAGE }
}))'
