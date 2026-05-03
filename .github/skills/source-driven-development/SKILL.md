---
name: source-driven-development
description: Grounds implementation decisions in authoritative sources. Use when framework behavior, tool syntax, or workflow guidance must be verified before editing oviney/blog.
version: 1.0.1
triggers:
  - Verifying framework or tool behavior before editing docs
  - Reconciling official guidance with repo-local commands
  - Updating workflow docs that other agents will copy
---

# Source-Driven Development

## Overview

Verify the source before you write the change. For oviney/blog, that means combining **official upstream documentation** with **repo-local truth** such as `CLAUDE.md`, `package.json`, `playwright.config.ts`, and the existing skill/command layer. Official docs tell you what a tool supports; the repo tells you which subset this project actually uses.

## When to Use

- Updating Jekyll, Liquid, Playwright, Lighthouse, Pa11y, or GitHub Actions guidance
- Creating or revising skill docs that point agents to concrete commands
- Writing reusable examples that other agents will copy
- Resolving whether a pattern is current, deprecated, or unsupported in this repo
- Reviewing docs that were likely written from memory rather than verified sources

## The Rule: Source-Backed, Repo-Ratified

A recommendation is only safe when both checks pass:

1. **Source-backed** — supported by official docs or a first-party reference
2. **Repo-ratified** — consistent with this repo's actual commands, files, and protected boundaries

If upstream docs suggest a command the repo does not use, prefer the repo.

## Verification Workflow

### Step 1: Detect the Local Stack

Read the repo files that define the real environment:

```text
- Gemfile / README / CLAUDE.md for Jekyll workflow
- package.json for executable npm scripts
- playwright.config.ts for browser test behavior
- lighthouserc.json for performance thresholds
- SECURITY.md for security posture
```

State the result explicitly before documenting anything:

```text
STACK DETECTED:
- Jekyll site validated with `bundle exec jekyll build`
- Playwright tests via `npm run test:playwright`
- Accessibility checks via `npm run test:a11y`
- Lighthouse checks via `npm run test:lighthouse`
- Security audit via `npm run test:security`
```

### Step 2: Fetch the Smallest Authoritative Source

Use the exact upstream page that governs the change:

| Area | Preferred source |
|---|---|
| Jekyll / Liquid | jekyllrb.com or shopify.github.io/liquid |
| Playwright | playwright.dev |
| Lighthouse / LHCI | github.com/GoogleChrome/lighthouse-ci or developer.chrome.com |
| Pa11y | pa11y.org / GitHub project docs |
| GitHub Actions | docs.github.com |

Avoid tutorial blogs and generic AI summaries as primary sources.

### Step 3: Reconcile with Repo Constraints

Ask the repo-specific questions that generic docs cannot answer:

- Is the command present in `package.json`?
- Does the repo already encode a preferred workflow in `CLAUDE.md`, `AGENTS.md`, or the relevant skill file?
- Does the change cross a protected or governance surface?
- Does the repo intentionally omit a tool (for example generic lint or typecheck defaults)?

### Step 4: Write the Recommendation

Prefer wording like this:

```text
Official docs support X.
This repo implements it via Y.
Therefore the doc should tell agents to run Z.
```

## Conflict Handling

Surface conflicts instead of silently choosing one side:

```text
CONFLICT DETECTED:
Upstream examples use a generic build command,
but oviney/blog validates changes with `bundle exec jekyll build`.

Decision:
Keep the repo command in local docs and cite the upstream source only for
behavior, not for the command wrapper.
```

## Citation Rules for This Repo

- Cite upstream sources when they justify framework behavior or terminology
- Cite local files when they justify workflow, commands, paths, or boundaries
- If something is unverified, say so plainly rather than inventing certainty
- Do not turn unsupported tooling into a required default

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The upstream README is enough" | Not for this repo. Local command wrappers and scope rules matter just as much. |
| "This command is probably standard" | Standard elsewhere does not mean valid here. Check `package.json`. |
| "It is only an example" | Agents copy examples literally. One wrong example becomes repeated bad output. |
| "I know this tool from memory" | Version drift and repo-specific wrappers make memory unreliable. |

## Red Flags

- Generic commands appear without proof from local files
- A doc cites upstream examples but ignores repo rules
- The recommendation assumes tools the repo does not install or run
- The writer cannot name the local file that validates the command
- Conflicts between upstream docs and repo practice are hidden

## Verification

After writing or updating a source-driven doc:

- [ ] The repo files defining the command or workflow were read first
- [ ] The upstream reference is first-party and specific to the feature
- [ ] Every recommended command exists in this repo
- [ ] No unsupported default tooling was introduced
- [ ] Repo-specific constraints override generic examples where needed
- [ ] Any unresolved gaps are explicitly marked as unverified

## Related Files

- [`../../../package.json`](../../../package.json) — local QA and security commands
- [`../../../playwright.config.ts`](../../../playwright.config.ts) — local Playwright runtime behavior
- [`../../../lighthouserc.json`](../../../lighthouserc.json) — local Lighthouse thresholds
- [`../context-engineering/SKILL.md`](../context-engineering/SKILL.md) — how to load only the right sources
