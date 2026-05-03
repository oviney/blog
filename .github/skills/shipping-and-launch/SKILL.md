---
name: shipping-and-launch
description: Prepares oviney/blog changes for release. Use when turning a completed branch into a reviewable PR, verifying production readiness, or planning safe rollout and rollback steps.
version: 1.0.1
triggers:
  - A branch is ready for PR review or merge
  - Deployment readiness needs a checklist
  - Rollout or rollback planning is needed
---

# Shipping and Launch

## Overview

Shipping is more than opening a PR. For oviney/blog, a safe launch means the branch is scoped correctly, the site builds, relevant QA commands have been run, governance labeling is correct, and the production site can be verified after merge.

## When to Use

- A feature or docs batch is ready for PR review
- A governance-surface update is being prepared for merge
- A release note or deployment verification plan is needed
- You need a rollback-minded checklist before shipping to `main`

## Pre-PR Checklist

Run the smallest complete verification story for the change:

```bash
bundle exec jekyll build
```

Add the relevant existing QA command(s):

```bash
npm run test:security
npm run test:playwright
npm run test:a11y
npm run test:lighthouse
```

Then run the scope guard:

```bash
bash scripts/check-pr-scope.sh
```

If the PR changes `.github/skills/` or `.github/instructions/`, use:

```bash
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```

## Governance-Surface Shipping Rules

- Apply the `governance-update` label when the PR changes skill or instruction surfaces
- Mention that label in the PR description if the change depends on it
- If CI started before the label was present, rerun checks after the label is added

## Production Verification Pattern

After merge, verify at the right level for the change:

1. Confirm the relevant GitHub Actions checks passed
2. Confirm the site deployed successfully
3. Check the production site responds:

```bash
curl -sI https://www.viney.ca/ | grep HTTP
```

4. Visit the affected route(s) on `https://www.viney.ca`
5. For visual work, spot-check 320 px, 768 px, and desktop widths

## Rollback Mindset

Before merging, know what the recovery move is:

- docs-only or governance rollback → revert the PR cleanly
- content/template regression → revert or hotfix with a scoped follow-up PR
- QA or performance regression → disable or revert the specific change before stacking more work

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The branch is ready because the diff looks right" | Shipping requires build, QA, and scope evidence. |
| "It is only a docs PR" | Docs changes in this repo can alter agent behavior and scope gates. |
| "CI will catch anything" | Local verification shortens the feedback loop and prevents noisy reruns. |
| "We can fix production after merge" | Safe shipping includes knowing the rollback path before merge. |

## Red Flags

- PR opens without a passing `bundle exec jekyll build`
- Governance changes ship without the `governance-update` label flow
- Production verification stops at "CI passed"
- The release notes omit which commands were run locally

## Verification

Before shipping:

- [ ] `bundle exec jekyll build` passed
- [ ] Relevant existing QA/security commands passed
- [ ] Scope validation passed with the right label context
- [ ] The PR references the issue and explains what changed
- [ ] A rollback path is obvious if the change regresses

After shipping:

- [ ] GitHub checks are green
- [ ] `https://www.viney.ca` responds normally
- [ ] The affected route or workflow behaves as expected in production

## Related Files

- [`../git-workflow-and-versioning/SKILL.md`](../git-workflow-and-versioning/SKILL.md) — branch and commit discipline
- [`../../../scripts/check-pr-scope.sh`](../../../scripts/check-pr-scope.sh) — scope and governance gate
- [`../../../CLAUDE.md`](../../../CLAUDE.md) — lifecycle backbone and shipping entry points
