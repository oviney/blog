#!/bin/bash
# viney.ca blog — UserPromptSubmit hook (#1340)
# Restates the mandatory lifecycle on every prompt. A reminder only at session
# start fades in long sessions, which is where steps get skipped.

MESSAGE="viney.ca lifecycle (mandatory, see CLAUDE.md): spec -> plan -> build -> test -> review -> ship. Invoke the matching skill before doing that phase's work, including for bug fixes and follow-ups. git rejects your pushes unless test and review ran on exactly the content being pushed; any change after they run means running them again." \
  node -e 'process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: process.env.MESSAGE }
  }))'
