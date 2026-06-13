#!/usr/bin/env bash
# check-agent-memory-discipline.sh — guard against silent regression of the
# subagent memory-discipline guardrails added across #991/#998/#999.
#
# Usage: bash scripts/check-agent-memory-discipline.sh
#
# Every agent definition in .claude/agents/*.md must retain BOTH:
#   1. A "## Memory Discipline" section heading
#   2. A "Never persist to memory" forbidden-list anchor line
#
# These two markers are the load-bearing parts of the guardrail prose that tells
# each subagent what it must NOT write to project memory (secrets, PII, single-PR
# content, etc.). An edit that drops either marker silently re-opens the leak
# surface, so CI fails loudly instead.
#
# Rationale: recommended by the security-auditor during the #997 /ship audit —
# the guardrails are prose, not enforced by any schema, so nothing else stops a
# future refactor from deleting them.
#
# Dependencies: bash and grep only. No other tools required.
# Exit codes: 0 = every agent file carries both markers, 1 = one or more missing.

set -euo pipefail

AGENT_DIR=".claude/agents"
VIOLATIONS=0

if [ ! -d "$AGENT_DIR" ]; then
  echo "❌ $AGENT_DIR not found — run from the repository root."
  exit 1
fi

shopt -s nullglob
AGENT_FILES=("$AGENT_DIR"/*.md)
shopt -u nullglob

if [ "${#AGENT_FILES[@]}" -eq 0 ]; then
  echo "❌ No agent definitions found in $AGENT_DIR — expected at least one *.md."
  exit 1
fi

echo "🔍 Checking memory-discipline markers in ${#AGENT_FILES[@]} agent file(s)..."

for f in "${AGENT_FILES[@]}"; do
  missing=()
  grep -q '^## Memory Discipline' "$f" || missing+=("## Memory Discipline heading")
  grep -q 'Never persist to memory' "$f" || missing+=("\"Never persist to memory\" anchor")

  if [ "${#missing[@]}" -gt 0 ]; then
    VIOLATIONS=$((VIOLATIONS + 1))
    echo "❌ $f is missing:"
    for m in "${missing[@]}"; do echo "     - $m"; done
  else
    echo "✅ $f"
  fi
done

echo

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "❌ $VIOLATIONS agent file(s) lost a memory-discipline marker."
  echo "   Restore the '## Memory Discipline' section and its 'Never persist to memory'"
  echo "   forbidden-list before merging. See docs/agents and AGENTS.md for context."
  exit 1
fi

echo "✅ All agent files retain their memory-discipline guardrails."
exit 0
