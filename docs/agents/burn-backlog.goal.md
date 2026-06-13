# Goal: Burn down the backlog using the agent-skills lifecycle

A reusable in-session goal for local Claude Code work. Drives `docs/BACKLOG.md`
to empty by running each task through the lifecycle backbone, stopping at every
human gate. Paste the **Goal prompt** below into a session (or `/loop` it).

## How it works

- The queue is `docs/BACKLOG.md` — one `Read`, highest-priority-first.
- The backbone is the **local lifecycle skills** (`/spec → /plan → /build →
  /test → /review → /ship`), with the upstream `agent-skills:*` guides as
  reference (per `CLAUDE.md`).
- Every iteration ends at a human gate (decomposition, PR-ready, or a task
  flagged "needs decision"). The loop never self-merges.

## Goal prompt

```
GOAL: Burn down docs/BACKLOG.md using the agent-skills lifecycle.

Each iteration:
1. Read docs/BACKLOG.md. Pull the TOP unchecked task in "Active" (highest
   priority first). If Active is empty, stop and report "backlog drained."
2. If the task is tagged "epic — decompose first": run /spec to break it into
   smaller atomic tasks, propose them as Active rows in priority order, then
   STOP for my review before writing them or building. Do not self-approve a
   decomposition.
3. Otherwise run the task through the backbone, invoking the LOCAL lifecycle
   skills in order and consulting the upstream agent-skills:* guides as
   reference:
     /spec   -> approved spec (GitHub issue ONLY if it needs a Copilot cloud
                agent; otherwise keep it local in the backlog)
     /plan   -> atomic task breakdown
     /build  -> implement one slice at a time on a branch (never on main)
     /test   -> Playwright + pa11y + Lighthouse + jekyll build must pass
     /review -> five-axis review before merge
     /ship   -> commit (atomic), push branch, open PR
4. STOP at the PR gate. Do NOT admin-merge — surface the PR for my review.
   When I confirm a merge, move the item to "Recently shipped" with its PR
   number, then continue.

Hard rules (from CLAUDE.md + memory):
- NEVER push directly to main; everything lands via PR (admin-merge is MY call).
- Atomic commits — split by concern, one reviewable change per PR.
- Don't touch protected files: _config.yml, Gemfile, Gemfile.lock,
  .github/CODEOWNERS, .github/copilot-instructions.md.
- Respect the scope guard (<=15 files; governance-update / protected-file-update
  / bulk-content labels only with explicit justification).
- Match complexity to scale — one script beats three workflows.
- Pause for me at: epic decompositions, PR-ready gates, and any task the backlog
  marks "needs decision".

End each iteration with a one-line status: task pulled, skill phase reached,
gate hit, and what you need from me to continue.
```

## Notes

- **First run is a decomposition, not a build.** The current top task (the
  agent-evals epic) is tagged "decompose first," so iteration 1 runs `/spec`
  and stops for review — no code yet.
- Fold any pending working-tree cleanup (e.g. a backlog reconciliation) into the
  first `/ship` rather than leaving it dangling.
