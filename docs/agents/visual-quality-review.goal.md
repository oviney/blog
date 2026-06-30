# Goal: Make the QA Gatekeeper actually catch visual bugs

A reusable in-session goal for local Claude Code work. The QA Gatekeeper
(`.github/skills/jekyll-qa/SKILL.md`) is shipping visual defects to production —
broken layouts, spacing, overflow, responsive breakage — because it trusts green
CI instead of *looking* at rendered pages, and because the visual coverage
(BackstopJS baselines, Playwright responsive specs) has gaps. This goal closes
the loop: find the bugs with eyes on the real site, prove why the gate missed
each one, then harden the agent and its tests so that class of bug can't slip
through again.

## How it works

- **Evidence first.** Nothing is hardened until a bug is reproduced and
  screenshotted on a real rendered page — production (https://www.viney.ca) and
  the local dev build. Green CI is not evidence the page looks right.
- **Every bug must explain the gap.** For each defect, answer: *why didn't the
  existing gate catch this?* (no test for that page/viewport, stale BackstopJS
  baseline, pa11y can't see layout, the agent skill never told the agent to view
  the rendered page, etc.). The gap is the thing we fix — the bug is just the
  symptom.
- **Harden the gate, not just the page.** Fixing the CSS is necessary but not
  sufficient. Each iteration must also add the missing guard: a Playwright
  responsive/visual assertion, a refreshed baseline, or a sharper instruction in
  the QA Gatekeeper skill.
- **Backbone is the local lifecycle skills** (`/spec → /plan → /build → /test →
  /review → /ship`), with `agent-skills:*` and `jekyll-qa` as reference.
- Every iteration ends at a human gate. The loop never self-merges.

## Goal prompt

```
GOAL: Stop the QA Gatekeeper from leaking visual bugs to production. Audit the
rendered site with real eyes, diagnose why the quality gate missed each defect,
and harden the gate so it can't miss that class again.

PHASE 0 — Build the evidence base (do this first, once):
1. Serve the site locally:
   bundle exec jekyll serve --config _config.yml,_config_dev.yml
2. Open the rendered pages in a real browser (claude-in-chrome or the
   playwright-test MCP) at 320px, 768px, 1024px, and 1440px. Cover at minimum:
   home, a post, an archive/category page, the bottom nav, and any page I call
   out. Compare each against production (https://www.viney.ca).
3. Catalog every visual defect in docs/defect-log.json style: page URL,
   viewport, what's wrong, a screenshot path, and a P0-P3 severity. STOP and
   show me the catalog before fixing anything — I confirm scope and priority.

Then, each iteration (one defect or one tight cluster at a time, P0 first):
1. REPRODUCE: confirm the defect on the rendered page with a screenshot.
2. DIAGNOSE THE GAP: state in one or two lines why the existing gate missed it.
   Map it to a root cause: missing Playwright coverage in
   tests/playwright-agents/, stale/absent BackstopJS baseline, a viewport never
   tested, or a hole in the QA Gatekeeper skill itself
   (.github/skills/jekyll-qa/SKILL.md) — e.g. the agent was never instructed to
   view rendered pages before approving.
3. /spec -> approved fix scope (keep it local in the backlog unless it needs a
   Copilot cloud agent).
4. /plan -> atomic task breakdown.
5. /build -> on a branch, never on main:
     a. Fix the defect (SCSS via variables in _sass/economist-theme.scss — never
        hardcode; consult the economist-theme skill).
     b. Add the guard that would have caught it: a failing-first Playwright
        responsive/visual assertion in tests/playwright-agents/, and/or a
        refreshed BackstopJS baseline, and/or a concrete instruction added to
        the jekyll-qa skill so the agent reviews rendered output next time.
6. /test -> the new guard fails on the old code and passes on the fix;
     Playwright + pa11y + Lighthouse + jekyll build all green.
7. /review -> five-axis review before merge.
8. /ship -> atomic commit(s), push branch, open PR. STOP at the PR gate. Do NOT
     admin-merge. Surface the PR for my review; when I confirm the merge, log the
     defect as closed and continue to the next.

Hard rules (from CLAUDE.md + memory):
- NEVER push directly to main; everything lands via PR (admin-merge is MY call).
- Atomic commits — split by concern, one reviewable change per PR. The CSS fix
  and a large test/baseline change are separate concerns if they bloat the diff.
- Don't touch protected files: _config.yml, Gemfile, Gemfile.lock,
  .github/CODEOWNERS, .github/copilot-instructions.md.
- Changes to .github/skills/ are governance work — carry the governance-update
  label and call it out in the PR description.
- Respect the scope guard (<=15 files). Refreshing many BackstopJS baselines at
  once may warrant the bulk-content label WITH explicit justification.
- Match complexity to scale — one Playwright spec beats a new framework.
- Pause for me at: the PHASE 0 catalog, every PR-ready gate, and any defect that
  needs a design decision.

End each iteration with a one-line status: defect addressed, the gap it exposed,
the guard added, the gate hit, and what you need from me to continue.
```

## Notes

- **The first run is an audit, not a fix.** PHASE 0 produces the defect catalog
  and stops for review. No CSS changes until I confirm scope and priority.
- **The deliverable is a tighter gate, not just a prettier page.** A PR that
  fixes a layout bug but adds no guard against its recurrence is incomplete —
  the bug will come back the next time someone touches that SCSS.
- **The likely root cause is process, not code:** the QA Gatekeeper approves on
  green CI without viewing rendered pages, and BackstopJS coverage doesn't span
  the pages/viewports where bugs appear. Expect at least one PR that hardens
  `.github/skills/jekyll-qa/SKILL.md` to mandate eyes-on-render review.
