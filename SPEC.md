# SPEC — Restore the product boundary of `oviney/blog`

**Cycle:** 2026-08-29 · **Branch series:** `chore/*`, `docs/*`
**Prior cycle:** [masthead grid alignment](tasks/archive/2026-08-29-masthead-grid-alignment/SPEC.md) (shipped as #1282)

## 1. Problem

`oviney/blog` is the source repository for the viney.ca publication. It is
currently running three products under one roof, and the two nobody asked for
consume most of the throughput.

Measured on 2026-08-29:

| Surface | Lines | Share |
|---|---:|---:|
| **The publication** — theme 4,694 · layouts/includes 884 · 29 posts 1,686 | ~7,300 | 24% |
| **Agent governance** — 25 skill files 7,453 · scripts 6,113 · meta docs 5,271 | ~18,800 | 62% |
| **Agent observability** — 21 workflows 3,430 · `.claude/` 937 | ~4,400 | 14% |

The same ratio shows in delivery. Of the last 250 merged PRs: **76** CI/agent
machinery, **51** docs/governance, **35** site/theme, **22** dependency bumps,
**7** content. And of the last **300 workflow runs, 295** were `CI Orchestrator`
(169) and `CI Health Monitor` (126) — automation observing automation. **None of
those 300 runs was a site deploy.**

The cost is not theoretical. On 2026-08-29 the repository was in this state:

- `main` had failed nightly Content Validation **seven consecutive nights**
- **no deploy since 2026-08-17** (12 days)
- **no human merge since 2026-08-16** (13 days)
- **#1282 had been green and unmerged for 14 days**
- 3,599 files of vendored Ruby gems were tracked *despite* `vendor/` appearing in
  `.gitignore` twice — **87% of all tracked files**, and a 211 MB `.git`

A publication that ships two posts a month should not be able to accumulate that.

This is not a new diagnosis. `CLAUDE.md` ("Product Boundary"), `ROADMAP.md`
("Operating Model") and `docs/CURRENT_STATE.md` all already say the machinery is
"supporting infrastructure" and a "candidate for extraction". **The recognition
was written months ago and never acted on.** This cycle acts on it.

## 2. Goal

Make the publication the thing this repository is optimised for, and make every
remaining piece of machinery earn its place by that measure.

## 3. Scope

### In scope

| ID | Outcome |
|----|---------|
| **D1** | `main` is green and deploying, and stays that way without a human noticing it broke |
| **D2** | The draft producer cannot redden `main` again |
| **D3** | Tracked files reflect the source, not the build — no vendored gems, no debug screenshots, no ignore rules contradicting reality |
| **D4** | Every workflow and script either runs and is acted on, or is deleted |
| **D5** | One backlog is authoritative; the rest are archived or deleted |
| **D6** | The extraction of the agent framework is specified precisely enough to execute, with a decision recorded |

### Out of scope

- **Executing** the extraction (D6 delivers the spec and the ADR; creating repos
  and moving code is a separate cycle and needs owner action)
- Rewriting git history to reclaim the 211 MB (untracking stops the growth;
  rewriting is destructive, needs owner sign-off, and can follow later)
- Any change to the theme, layouts, or published posts
- `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`,
  `.github/copilot-instructions.md` — protected, unbypassable

## 4. Acceptance criteria

**D1 — `main` green**
- `scripts/validate-post-quality.sh` reports 0 errors on `main`
- The nightly Quality Tests run succeeds
- A deploy has run since this cycle began

**D2 — producer cannot redden `main`**
- The defect fails in the producing repository, not in this one
- A regression test asserts the exact string that caused the outage
- #1289 is closed by a merged producer-side fix, not by another content patch

**D3 — tracked files reflect source**
- `git ls-files vendor | wc -l` is `0`
- `git ls-files .playwright-mcp | wc -l` is `0`
- No path is both listed in `.gitignore` and tracked
- `bundle exec jekyll build` still passes; local dev is unaffected

**D4 — machinery earns its place**
- Every retained workflow has run within 30 days *and* something acts on its output
- Every deleted workflow/script is named in the PR body with its last run date
- No workflow is left in a permanent `action_required` state
- CI run volume is no longer dominated by self-observation

**D5 — one backlog**
- Exactly one file is the local queue; the others are archived with a pointer
- The rule for what belongs in GitHub Issues vs. the local file is written down
- No open item is silently dropped in the consolidation

**D6 — extraction specified**
- An ADR records the decision, the alternatives, and the reversal cost
- The spec names exactly which paths move, what replaces them here, and how this
  repo consumes them afterwards
- The spec is executable by someone who was not in this session

## 5. Constraints

- Every change ships as its own PR through the existing gates. No direct pushes
  to `main`, including for the cleanup PRs.
- The scope guard caps a PR at 15 files (Rule 2). The `vendor/` untrack is
  structurally atomic and cannot be split without leaving `main` in a worse
  state, so it carries `bulk-content` — the one deliberate use of that label
  this cycle, justified in its PR body.
- Deletions must be *verified* unused, not assumed. Read before deleting.
- Nothing here may change what a reader sees on viney.ca.

## 6. Non-goals stated explicitly

This cycle does **not** argue that the agent machinery is bad work. Much of it is
careful, and the scope guard in particular has caught real defects. The argument
is only that it does not belong in the repository that publishes the blog, and
that keeping it here has measurably starved the publication.
