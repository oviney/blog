#!/bin/bash
# viney.ca blog — session start hook
# Injects the using-agent-skills meta-skill into every new session

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
META_SKILL="$REPO_ROOT/.github/skills/using-agent-skills/SKILL.md"

if [ -f "$META_SKILL" ]; then
  CONTENT=$(cat "$META_SKILL")
  cat <<EOF
{
  "priority": "IMPORTANT",
  "message": "agent-skills loaded for viney.ca blog. Use the skill discovery flowchart to find the right skill.\n\n$CONTENT"
}
EOF
else
  echo '{"priority": "INFO", "message": "blog agent-skills: using-agent-skills meta-skill not found."}'
fi
