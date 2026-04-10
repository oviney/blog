# Agent Skills Gap Analysis

**Issue:** [#697](https://github.com/oviney/blog/issues/697)  
**Date:** 2026-04-10  
**Source reference:** [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)

---

## Overview

This document compares the agent skill infrastructure of `oviney/blog` against the production-grade library at `addyosmani/agent-skills`. It identifies the gaps with the highest impact on agent quality and ranks the top 5 improvements to adopt.

---

## Our Current Skills (`oviney/blog/.github/skills/`)

| Skill file | Domain | Version |
|---|---|---|
| `economist-theme/SKILL.md` | CSS, SCSS, layouts, responsive design | 1.1.0 |
| `editorial/SKILL.md` | Blog posts, SEO, writing, documentation | 1.0.0 |
| `general/SKILL.md` | Cross-cutting, documentation, refactoring | 1.0.0 |
| `git-operations/SKILL.md` | Branching, commits, PRs | 1.0.0 |
| `github-issues-workflow/SKILL.md` | Bug lifecycle, labels, defect tracking | 1.2.0 |
| `jekyll-development/SKILL.md` | Jekyll server, build, Liquid templates | 1.1.0 |
| `jekyll-qa/SKILL.md` | CI/CD, Playwright tests, accessibility | 1.2.0 |

---

## `addyosmani/agent-skills` Inventory

### Skills

| Skill | Closest match in our repo | Gap severity |
|---|---|---|
| `api-and-interface-design` | None | Low (no APIs) |
| `browser-testing-with-devtools` | `jekyll-qa` (partial) | Medium |
| `ci-cd-and-automation` | `jekyll-qa` (partial) | Medium |
| `code-review-and-quality` | None | **High** |
| `code-simplification` | None | Low |
| `context-engineering` | None | Medium |
| `debugging-and-error-recovery` | `jekyll-qa` (partial — S0 section only) | **High** |
| `deprecation-and-migration` | None | Low |
| `documentation-and-adrs` | `general` (implicit) | Medium |
| `frontend-ui-engineering` | `economist-theme` (partial) | Medium |
| `git-workflow-and-versioning` | `git-operations` | Low |
| `idea-refine` | None | Low |
| `incremental-implementation` | None (only a PR limit rule) | **High** |
| `performance-optimization` | None (only a CI perf issue) | **High** |
| `planning-and-task-breakdown` | None | Medium |
| `security-and-hardening` | `jekyll-qa` (npm audit step only) | Medium |
| `shipping-and-launch` | None | Low (not applicable) |
| `source-driven-development` | `editorial` (cite data, prose only) | **High** |
| `spec-driven-development` | None | Medium |
| `test-driven-development` | `jekyll-qa` (partial) | Medium |
| `using-agent-skills` | `general` (partial) | Low |

### Reference documents (structured checklists)

| Reference | Closest match in our repo | Gap severity |
|---|---|---|
| `references/accessibility-checklist.md` | Prose in `jekyll-qa` and `economist-theme` | **High** |
| `references/performance-checklist.md` | None (prose mentions in issues) | **High** |
| `references/security-checklist.md` | None | Medium |
| `references/testing-patterns.md` | `.github/instructions/tests.instructions.md` (partial) | **High** |

### Structural patterns not present in our repo

| Pattern | Description | Effort to adopt |
|---|---|---|
| `.claude/commands/` slash commands | `/spec`, `/plan`, `/build`, `/test`, `/review` | High (Claude-specific) |
| `hooks/session-start.sh` | Pre-task context injection | Medium |
| `hooks/simplify-ignore.sh` | Prevents over-engineering | Medium |
| `agents/code-reviewer.md` | Dedicated reviewer agent definition | Medium |
| `agents/security-auditor.md` | Dedicated security auditor | Medium |
| `agents/test-engineer.md` | Dedicated test engineer | Medium |

---

## Detailed Gap Analysis

### Gap 1: No structured debugging protocol

**What they have:** `skills/debugging-and-error-recovery/SKILL.md` — a full stop-the-line rule, 6-step triage checklist covering reproduction, localisation, reduction, root-cause fixing, regression-test writing, and end-to-end verification. Explicit patterns for test failures, build failures, and runtime errors.

**What we have:** `jekyll-qa/SKILL.md` section S0 "Diagnose CI Failures" — lists 3 bash commands to view PR status and workflow runs. No triage checklist, no root-cause protocol, no guidance on when to stop vs when to continue.

**Impact:** When CI fails (common — issues #685, #691), agents either loop guessing or give up without a protocol. The stop-the-line rule alone would prevent compounding failures.

**Affected agents:** QA Gatekeeper (primary), all agents (secondary — any agent that causes a build failure).

---

### Gap 2: No incremental-implementation discipline

**What they have:** `skills/incremental-implementation/SKILL.md` — increment cycle (implement → test → verify → commit), 5 implementation rules including scope discipline, simplicity-first, rollback-friendly commits, and feature flags for incomplete work. Explicit "Scope Discipline" rule that prevents agents from touching files outside the task.

**What we have:** A single rule in `AGENTS.md` and `.github/copilot-instructions.md`: "Maximum 30 files per PR — if more are needed, split into multiple PRs." No guidance on *how* to stay under the limit, how to split, or how to keep the codebase in a working state between slices.

**Impact:** Agents regularly produce over-scoped PRs or make unrelated "improvements" while working on a task. The Scope Discipline rule ("Note it — don't fix it") would reduce review overhead significantly.

**Affected agents:** All agents equally.

---

### Gap 3: No structured accessibility checklist

**What they have:** `references/accessibility-checklist.md` — a structured WCAG 2.1 AA checklist with 40+ specific items across keyboard navigation, screen readers, visual, forms, and content categories. Includes common HTML patterns, ARIA examples, and testing tool commands.

**What we have:** Prose in two skill files:
- `economist-theme/SKILL.md`: "WCAG AA accessibility compliance (4.5:1 contrast minimum)"
- `jekyll-qa/SKILL.md`: "Accessibility (Pa11y)" listed as one of several CI checks

No structured checklist, no specific ARIA patterns for Jekyll templates, no testing tool reference.

**Impact:** Accessibility reviews are inconsistent because agents have no shared checklist. Pa11y failures in CI are the only feedback loop, and they catch only a subset of WCAG issues.

**Affected agents:** QA Gatekeeper (primary), Creative Director (secondary).

---

### Gap 4: No structured testing-patterns reference

**What they have:** `references/testing-patterns.md` — a structured reference for Arrange-Act-Assert, test naming, common assertions, mocking patterns (with explicit "mock at boundaries only" rule), React component testing, API/integration testing, and E2E Playwright patterns.

**What we have:** `.github/instructions/tests.instructions.md` — covers selectors, viewports, assertions, network state, touch targets, external links, and defensive patterns. This is Playwright-specific and already good. Missing: the meta-level AAA structure, naming conventions, the "mock at boundaries only" rule, and anti-patterns table.

**Impact:** The existing test instructions are solid but incomplete. Agents writing new test files don't have a shared vocabulary for test structure and naming, leading to inconsistent test quality.

**Affected agents:** QA Gatekeeper (primary), General Agent (secondary).

---

### Gap 5: No source verification protocol for editorial content

**What they have:** `skills/source-driven-development/SKILL.md` — a four-step process: detect stack/versions → fetch official documentation → implement following documented patterns → cite sources. Includes a source hierarchy (official docs > official blog > MDN > anything else), citation rules, and explicit "UNVERIFIED" flags for patterns that can't be verified.

**What we have:** In `editorial/SKILL.md`: "Citations: Include specific data points with sources." One sentence. No verification protocol, no source hierarchy, no citation format, no mechanism to flag unverifiable claims.

**Impact:** Issues #687 ("posts cite future-year research") and #695 ("editorial AI review must block unverifiable stats/quotes") both trace back to the absence of a source verification protocol. The editorial agent publishes statistics without checking whether they are real.

**Affected agents:** Editorial Chief (primary).

---

## Structural Patterns: Assessment

### `.claude/commands/` slash commands
**Verdict:** Do NOT adopt. These are Claude-specific commands. GitHub Copilot does not support the `.claude/commands/` protocol. Adopting them would add dead config files and confuse agents.

### `hooks/session-start.sh`
**Verdict:** Consider but do not adopt now. We already inject context via `.github/instructions/*.instructions.md` files (Copilot's native mechanism). A session-start hook would duplicate this and require Claude-specific setup.

### `agents/code-reviewer.md`, `agents/test-engineer.md`
**Verdict:** Valuable pattern but out of scope for this issue. These define dedicated reviewer agents that sit in the review pipeline. Worth exploring in a separate issue after our skill gaps are addressed.

---

## Top 5 Improvements Ranked by Impact

| Rank | Improvement | Source | Affected agents | New file(s) to create |
|---|---|---|---|---|
| 1 | Debugging and error recovery skill | `skills/debugging-and-error-recovery/SKILL.md` | All (especially QA Gatekeeper) | `.github/skills/debugging-and-error-recovery/SKILL.md` |
| 2 | Incremental implementation skill | `skills/incremental-implementation/SKILL.md` | All agents | `.github/skills/incremental-implementation/SKILL.md` |
| 3 | Accessibility checklist reference | `references/accessibility-checklist.md` | QA Gatekeeper, Creative Director | `.github/skills/references/accessibility-checklist.md` |
| 4 | Testing patterns reference | `references/testing-patterns.md` | QA Gatekeeper | `.github/skills/references/testing-patterns.md` |
| 5 | Source verification protocol for editorial | `skills/source-driven-development/SKILL.md` | Editorial Chief | `.github/skills/source-driven-development/SKILL.md` |

---

## Rationale for Rankings

**#1 Debugging and error recovery** scores highest because:
- CI failures are our most frequent pain point (issues #685, #691)
- We have no stop-the-line rule, meaning one broken build can cascade
- Applies to every agent that touches CI
- The skill requires zero infrastructure changes — it's purely guidance

**#2 Incremental implementation** scores second because:
- Scope creep is the root cause of the most review overhead
- We already have the 30-file rule but no guidance on how to slice
- Applies to every agent equally
- Directly addresses the issue constraint ("Keeps PRs under 30-file limit")

**#3 Accessibility checklist** scores third because:
- We have Pa11y in CI but it catches only ~30% of WCAG issues
- A structured checklist allows agents to self-check before CI runs
- Directly serves `agent:creative-director` and `agent:qa-gatekeeper`
- The source material is highly reusable with minimal adaptation needed

**#4 Testing patterns reference** scores fourth because:
- The existing `.github/instructions/tests.instructions.md` covers Playwright specifics but lacks meta-patterns
- A shared reference ensures consistent test quality as the test suite grows
- Primarily benefits QA Gatekeeper but also any agent that writes a regression test

**#5 Source verification for editorial** scores fifth because:
- Directly addresses active issues (#687, #695) 
- The editorial agent publishes content that reaches real users — hallucinated statistics are a credibility risk
- Adapting `source-driven-development` to journalism/editorial context (rather than code context) requires care but the core protocol is directly applicable

---

## Out of Scope for This Issue

The following improvements from `addyosmani/agent-skills` were evaluated and **not** selected for the top 5:

- `spec-driven-development` — valuable but the gated workflow (Specify → Plan → Tasks → Implement) requires human approval gates that our fully-automated agent pipeline doesn't currently support. Worth a separate architectural discussion.
- `security-and-hardening` — the OWASP Top 10 section is Node/Express-specific and most of it doesn't apply to a Jekyll static site. A lightweight, Jekyll-adapted security checklist would be more useful; deferred.
- `code-review-and-quality` — highly valuable but the multi-model review pattern requires infrastructure (agent routing for reviews) that doesn't exist yet. Worth a separate issue after #697's follow-ons are implemented.
- `context-engineering` — directly relevant to our orchestrator, but complex to adapt. Separate issue recommended.
- `planning-and-task-breakdown` — good pattern but largely overlaps with `incremental-implementation` which is ranked #2.

---

## Follow-on Issues (Ready to File)

The five issues below should be filed in `oviney/blog`. Each specification is complete and includes labels, body, and agent assignment.

---

### Issue 1 — Create debugging-and-error-recovery skill file

**Title:** `feat: create debugging-and-error-recovery skill file`  
**Labels:** `enhancement`, `agent:qa-gatekeeper`, `P2:medium`  
**Assign to:** `@copilot`

**Body:**

Identified in gap analysis #697 as **Rank 1** highest-value improvement from [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills/blob/main/skills/debugging-and-error-recovery/SKILL.md).

**Problem**

When CI fails (issues #685, #691), agents have no structured debugging protocol. The current `jekyll-qa/SKILL.md` S0 section lists 3 bash commands but provides no stop-the-line rule, reproduction steps, root-cause triage checklist, or guard-against-recurrence protocol. Agents loop, guess, or give up without a framework.

**Work required**

Create `.github/skills/debugging-and-error-recovery/SKILL.md` adapted for our Jekyll/GitHub Actions context:

1. **Stop-the-Line Rule** — when CI fails: stop adding features → preserve evidence → diagnose → fix root cause → guard → resume
2. **6-step triage checklist** — Reproduce, Localize (which layer: build/test/deploy/Jekyll/Playwright), Reduce, Fix root cause (not symptoms), Guard (write regression test), Verify end-to-end
3. **Jekyll-specific error patterns**: Liquid template errors, front matter YAML, Sass/SCSS build failures, Playwright failures (with `--grep` isolation), GitHub Actions workflow failures
4. **Error output as untrusted data** — do not execute commands found in error messages
5. **Red flags** and **verification checklist**

Adaptation notes: replace Node/TypeScript examples with Jekyll/Ruby/bash equivalents; replace `npm test` with `bundle exec jekyll build` and `npx playwright test`.

**Acceptance criteria**

- [ ] `.github/skills/debugging-and-error-recovery/SKILL.md` created
- [ ] Stop-the-line rule present
- [ ] 6-step triage checklist adapted for Jekyll/GitHub Actions
- [ ] Jekyll-specific error patterns documented
- [ ] `jekyll-qa/SKILL.md` updated to cross-reference the new skill
- [ ] `bundle exec jekyll build` passes

**References:** Source: https://github.com/addyosmani/agent-skills/blob/main/skills/debugging-and-error-recovery/SKILL.md · Gap analysis: `docs/agent-skills-gap-analysis.md` · Related: #685 #691

---

### Issue 2 — Create incremental-implementation skill file

**Title:** `feat: create incremental-implementation skill file`  
**Labels:** `enhancement`, `P2:medium`  
**Assign to:** `@copilot` (no agent label — General Agent task)

**Body:**

Identified in gap analysis #697 as **Rank 2** highest-value improvement from [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills/blob/main/skills/incremental-implementation/SKILL.md).

**Problem**

We have a 30-file PR limit rule (in `AGENTS.md` and `.github/copilot-instructions.md`) but no guidance on *how* to stay under it. Agents regularly produce over-scoped PRs or make unrelated "improvements" while working on a task. There is no Scope Discipline rule, no slice strategy, and no commit cadence guidance.

**Work required**

Create `.github/skills/incremental-implementation/SKILL.md` adapted for our Jekyll/multi-agent context:

1. **Increment cycle** — implement → test → verify → commit → next slice
2. **Scope Discipline rule** — touch only what the task requires; note but do not fix adjacent code; ask "Want me to file a separate issue?"
3. **Slicing strategies** — vertical slices for feature work, risk-first slicing for uncertain tasks, feature flags for incomplete work
4. **5 implementation rules** — simplicity-first, one-thing-at-a-time, keep-it-buildable, rollback-friendly, safe defaults
5. **Increment checklist** after each slice
6. **Common rationalizations** and **red flags**

Adaptation notes: replace `npm test`/`npm run build` with our Jekyll/Playwright commands; replace React/TypeScript examples with Jekyll/SCSS/Bash examples; reference our 30-file PR limit explicitly.

**Acceptance criteria**

- [ ] `.github/skills/incremental-implementation/SKILL.md` created
- [ ] Increment cycle present
- [ ] Scope Discipline rule adapted to our agent domain system
- [ ] Per-slice verification checklist references Jekyll build commands
- [ ] `AGENTS.md` cross-cutting conventions section updated to reference this skill
- [ ] `bundle exec jekyll build` passes

**References:** Source: https://github.com/addyosmani/agent-skills/blob/main/skills/incremental-implementation/SKILL.md · Gap analysis: `docs/agent-skills-gap-analysis.md`

---

### Issue 3 — Create accessibility checklist reference

**Title:** `feat: create accessibility checklist reference for agent use`  
**Labels:** `enhancement`, `agent:qa-gatekeeper`, `P2:medium`  
**Assign to:** `@copilot`

**Body:**

Identified in gap analysis #697 as **Rank 3** highest-value improvement from [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills/blob/main/references/accessibility-checklist.md).

**Problem**

Our `jekyll-qa/SKILL.md` and `economist-theme/SKILL.md` mention WCAG AA compliance but provide only prose descriptions. Pa11y in CI catches ~30% of WCAG issues. There is no structured checklist agents can use to self-check before CI runs.

**Work required**

Create `.github/skills/references/accessibility-checklist.md` adapted for our Jekyll/Liquid template context:

1. **Essential checks** — keyboard navigation, screen reader, visual (contrast, resize), forms, content
2. **Jekyll-specific HTML patterns** — accessible navigation in Liquid, `aria-label` for pagination, skip-link in `default.html`, form labels in search
3. **ARIA live regions** reference table
4. **Testing tools** — Pa11y CLI commands, Playwright a11y assertions, browser DevTools accessibility tree
5. **Common anti-patterns** table

Adaptation notes: replace React JSX examples with Jekyll Liquid/HTML examples; add Jekyll-specific patterns like `{% for post %}` lists with `role="list"` and `aria-label`; reference our Playwright test commands.

**Acceptance criteria**

- [ ] `.github/skills/references/accessibility-checklist.md` created
- [ ] Covers all 5 essential check categories (keyboard, screen reader, visual, forms, content)
- [ ] Jekyll/Liquid HTML pattern examples present
- [ ] Pa11y and Playwright testing commands included
- [ ] `economist-theme/SKILL.md` and `jekyll-qa/SKILL.md` updated to cross-reference the checklist
- [ ] `bundle exec jekyll build` passes

**References:** Source: https://github.com/addyosmani/agent-skills/blob/main/references/accessibility-checklist.md · Gap analysis: `docs/agent-skills-gap-analysis.md`

---

### Issue 4 — Create testing-patterns reference

**Title:** `feat: create testing-patterns reference for Playwright/Jekyll`  
**Labels:** `enhancement`, `agent:qa-gatekeeper`, `P2:medium`  
**Assign to:** `@copilot`

**Body:**

Identified in gap analysis #697 as **Rank 4** highest-value improvement from [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills/blob/main/references/testing-patterns.md).

**Problem**

The existing `.github/instructions/tests.instructions.md` covers Playwright selector conventions and viewport testing but lacks: Arrange-Act-Assert structure, test naming conventions, the "mock at boundaries only" rule, and an anti-patterns table. Agents writing new spec files have no shared vocabulary for test structure.

**Work required**

Create `.github/skills/references/testing-patterns.md` adapted for our Playwright/Jekyll stack:

1. **Test structure** — Arrange-Act-Assert pattern with Jekyll/Playwright examples
2. **Test naming conventions** — `[page] [expected behavior] [condition]` pattern
3. **Common Playwright assertions** — `toBeVisible`, `toHaveURL`, `toContainText`, `toBeGreaterThan`
4. **Defensive patterns** — count-before-interact, try/catch for optional elements, log-then-skip
5. **Viewport testing patterns** — how to test across 320/768/1920 viewports
6. **Anti-patterns table** — implementation detail testing, snapshot-everything, shared mutable state, using `test.skip` permanently

Adaptation notes: this reference is specific to our Playwright/TypeScript setup; examples should use our actual base URL (`http://localhost:4000`) and spec file conventions; replace React Testing Library examples with Playwright equivalents; reference our `@REQ-*` tag convention.

**Acceptance criteria**

- [ ] `.github/skills/references/testing-patterns.md` created
- [ ] AAA structure with Jekyll/Playwright examples
- [ ] Test naming convention documented
- [ ] Defensive patterns section matches our existing `tests.instructions.md`
- [ ] Anti-patterns table present
- [ ] Cross-referenced from `jekyll-qa/SKILL.md`
- [ ] `bundle exec jekyll build` passes

**References:** Source: https://github.com/addyosmani/agent-skills/blob/main/references/testing-patterns.md · Existing: `.github/instructions/tests.instructions.md` · Gap analysis: `docs/agent-skills-gap-analysis.md`

---

### Issue 5 — Adapt source-driven-development skill for editorial agent

**Title:** `feat: add source-verification protocol to editorial skill`  
**Labels:** `enhancement`, `agent:editorial-chief`, `P1:high`  
**Assign to:** `@copilot`

**Body:**

Identified in gap analysis #697 as **Rank 5** highest-value improvement from [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills/blob/main/skills/source-driven-development/SKILL.md).

**Problem**

Issues #687 (posts cite future-year research) and #695 (editorial AI review must block unverifiable stats/quotes) both trace back to the absence of a source verification protocol in `editorial/SKILL.md`. The current guidance is one sentence: "Citations: Include specific data points with sources."

The editorial agent publishes statistics without verifying they are real, from the cited source, and in the correct year.

**Work required**

Update `editorial/SKILL.md` (or create a companion `source-verification.md`) with a source verification protocol adapted from `source-driven-development/SKILL.md` for journalism/editorial context:

1. **DETECT** — identify every statistic, data point, quote, or claim in the draft that cites an external source
2. **VERIFY** — fetch the cited source and confirm the claim exists, is accurate, and is from the correct year
3. **SOURCE HIERARCHY** for editorial:
   - Primary: official government data, peer-reviewed research, official company announcements
   - Secondary: reputable news sources (Reuters, AP, FT, The Economist)
   - Never cite: blog posts, AI-generated summaries, or sources that don't exist
4. **CITE** — include year, author/org, and URL for every statistic
5. **UNVERIFIED flag** — if a source cannot be verified, remove the statistic or explicitly flag it as `[UNVERIFIED — awaiting source]` for human review
6. **Red flags** — future-year citations, round numbers without sources, statistics that seem too convenient

Adaptation notes: focus on editorial context (not code); the "fetch documentation" step becomes "fetch the primary source"; the "version detection" step becomes "year and edition detection"; examples should be blog-post statistics, not API usage patterns.

**Acceptance criteria**

- [ ] Source verification protocol added to `editorial/SKILL.md` (or companion file)
- [ ] DETECT → VERIFY → CITE workflow present
- [ ] Source hierarchy for editorial context defined
- [ ] UNVERIFIED flag convention established
- [ ] Red flags for hallucinated citations documented
- [ ] `validate-posts.sh` is referenced as a validation step
- [ ] `bundle exec jekyll build` passes

**References:** Source: https://github.com/addyosmani/agent-skills/blob/main/skills/source-driven-development/SKILL.md · Gap analysis: `docs/agent-skills-gap-analysis.md` · Related: #687 #695
