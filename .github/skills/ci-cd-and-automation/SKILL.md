---
name: ci-cd-and-automation
description: Maintains oviney/blog CI/CD and automation guidance. Use when updating workflows, quality gates, PR safeguards, or release automation for this Jekyll site.
---

# CI/CD and Automation

## Overview

CI is the enforcement layer for repo rules. In oviney/blog, automation should prove that the site builds, the existing QA checks still pass, and governance or scope rules are enforced without inventing extra tooling the repo does not run.

## When to Use

- Updating workflow guidance or release instructions
- Documenting required local verification before a PR
- Aligning skill docs with the current GitHub Actions and repo scripts
- Improving feedback loops for build, QA, security, or scope failures
- Reviewing governance-surface automation requirements

## The Repo Quality Gate Sequence

Use the repo's real commands as the default automation contract:

```bash
bundle exec jekyll build
bundle exec jekyll serve --config _config_dev.yml
npm run test:security
npm run test:playwright
npm run test:a11y
npm run test:lighthouse
bash scripts/check-pr-scope.sh
```

For governance-surface PRs, mirror CI locally with:

```bash
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```

## What This Repo Explicitly Does Not Need as Defaults

Do **not** turn these into required CI gates unless the repo is intentionally changed to support them:

- generic `npm run build`
- generic `npm run lint`
- `npx tsc --noEmit`

This repo's automation surface is Jekyll build + QA + security + scope gating.

## Automation Principles

### 1. Use Existing Repo Commands

Documentation and workflows should call the same commands contributors can run locally.

### 2. Keep Feedback Actionable

A failing check should tell the contributor what to run next:

- build failure → `bundle exec jekyll build`
- security failure → `npm run test:security`
- browser regression → `npm run test:playwright`
- accessibility regression → `npm run test:a11y`
- performance regression → `npm run test:lighthouse`
- scope failure → `bash scripts/check-pr-scope.sh`

### 3. Respect Governance Labeling

If a PR changes `.github/skills/` or `.github/instructions/`, it must carry the `governance-update` label and be checked locally with `PR_LABELS=governance-update bash scripts/check-pr-scope.sh`.

## Documentation Rules for CI/CD Changes

- Name the real command, not a generic category like "run the build"
- Mention when a server is needed for browser-based QA
- Keep local and CI guidance aligned so contributors can reproduce failures
- Avoid promising checks that the repo does not currently run

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "A standard Node pipeline is fine" | Not here. The repo is Jekyll-first and already encodes its own QA scripts. |
| "We can say lint even if it is not wired up" | That creates false verification stories and wastes reviewer time. |
| "Governance docs do not need CI treatment" | They do; the scope gate explicitly protects them. |
| "One more required tool will help" | Only if the repo actually adopts it. Fictional gates make docs rot. |

## Red Flags

- Workflow docs recommend commands missing from `package.json`
- CI guidance ignores the governance-update label flow
- A PR checklist mentions checks contributors cannot run locally
- Automation text describes broad "lint/typecheck" gates that do not exist here

## Verification

After updating CI/CD guidance:

- [ ] Every command mentioned exists in the repo
- [ ] `bundle exec jekyll build` remains the build truth
- [ ] Governance-update labeling is documented where relevant
- [ ] Local verification and CI verification tell the same story
- [ ] No unsupported default tools were added to the workflow docs

## Related Files

- [`../../../package.json`](../../../package.json) — executable QA and security scripts
- [`../../../scripts/check-pr-scope.sh`](../../../scripts/check-pr-scope.sh) — scope and governance guard
- [`../git-workflow-and-versioning/SKILL.md`](../git-workflow-and-versioning/SKILL.md) — PR and branch discipline
- [`../shipping-and-launch/SKILL.md`](../shipping-and-launch/SKILL.md) — release-stage follow-through
