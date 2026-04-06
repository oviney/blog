# Ouray's Tech Blog

[![Deploy Jekyll site to Pages](https://github.com/oviney/blog/actions/workflows/jekyll.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/jekyll.yml)
[![Test Jekyll Build](https://github.com/oviney/blog/actions/workflows/test-build.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-build.yml)
[![Quality Tests](https://github.com/oviney/blog/actions/workflows/test-quality.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-quality.yml)
[![Healing Monitor](https://github.com/oviney/blog/actions/workflows/healing-monitor.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/healing-monitor.yml)
[![Security Audit](https://github.com/oviney/blog/actions/workflows/test-quality.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-quality.yml)

![Healing Success](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/oviney/blog/main/.github/badges/healing-success.json)
![Healing Trend](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/oviney/blog/main/.github/badges/healing-trend.json)

Software engineering insights on quality, testing, and AI - written in The Economist's signature style.

**Theme:** Custom Economist-inspired design system  
**Typography:** Merriweather (serif) + Inter (sans-serif)  
**Build:** Jekyll 4.3.2 via GitHub Actions  
**Deployment:** GitHub Pages

## About

Professional commentary on software quality engineering, test automation, and emerging technologies. 

**Content Generation**: Articles are produced using [economist-agents](https://github.com/oviney/economist-agents), a multi-agent AI system that generates publication-quality content with The Economist's voice.

## Local Development

```bash
# Install Jekyll
bundle install

# Run locally
bundle exec jekyll serve

# Visit http://localhost:4000
```

**Testing Locally:**

```bash
# Install testing dependencies
npm install

# Create baseline screenshots (first time only)
npm run test:visual:reference

# Run visual regression tests
npm run test:visual

# Run accessibility audit
npm run test:a11y

# Run Lighthouse performance/SEO tests
npm run test:lighthouse

# Run security audit
npm run test:security

# Run all tests
npm test
```

**Pre-commit Hook:**
The pre-commit hook automatically validates Jekyll builds before commits. This catches build errors locally before pushing to GitHub.

## Publishing

Content is published via Git:

```bash
git add _posts/new-article.md
git commit -m "Publish: Article title"  
git push origin main
```

GitHub Actions automatically builds and deploys changes to GitHub Pages.

**Build & Deployment:**
- Triggers on push to `main` branch
- Uses Jekyll 4.3.2 with custom Economist theme
- Deployment time: 1-2 minutes
- Monitor progress: https://github.com/oviney/blog/actions

**Quality Gates:**
- ✅ Pre-commit: Jekyll build validation (local)
- ✅ CI: Jekyll build test + HTML validation
- ✅ CI: Visual regression testing (BackstopJS)
- ✅ CI: Accessibility testing (pa11y-ci WCAG 2.1 AA)
- ✅ CI: Performance testing (Lighthouse CI - Performance, SEO, Best Practices)
- ✅ CI: Security audit (npm audit)
- ✅ Deployment: Automated to GitHub Pages

## Custom Theme

The site features a bespoke design system inspired by The Economist:

- **Typography**: Merriweather serif for body text, Inter for UI elements
- **Colors**: The Economist red (#E3120B) for accents, clean blacks and grays
- **Layout**: Red header banner, horizontal navigation, article cards, dark footer
- **Components**: Category breadcrumbs, read time indicators, featured images, related posts
- **Responsive**: Mobile-first design with breakpoints at 768px and 1024px

Theme source: `_sass/economist-theme.scss` (600+ lines)

## Project Structure

```
blog/
├── _posts/          # Blog articles (markdown)
├── _layouts/        # Custom theme layouts (default.html, post.html)
├── _sass/           # Custom Economist theme SCSS  
├── _includes/       # Reusable components
├── assets/          # Images, CSS, charts
├── _config.yml      # Jekyll configuration
└── Gemfile          # Ruby dependencies
```

## Content Generation System

For details on the AI content generation pipeline, see [oviney/economist-agents](https://github.com/oviney/economist-agents).

## Agent PR Eval Harness

Tools that agents run to self-validate their PRs before requesting review.

### Scope Self-Check

**Script:** `scripts/check-pr-scope.sh`

A lightweight pre-push self-check that every agent should run before opening or updating a PR. It diffs the current branch against `origin/main` and enforces three scope rules:

| Rule | What it flags |
|------|--------------|
| **Protected files** | Any change to `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, `AGENTS.md`, or `ARCHITECTURE.md` |
| **Scope explosion** | More than 15 files changed in a single PR |
| **Governance surfaces** | Any change under `.github/skills/` or `.github/instructions/` — these require a dedicated issue |

**When to run:** Before every `git push` on an agent branch.

```bash
bash scripts/check-pr-scope.sh
```

- Exit `0` → no violations; safe to push.
- Exit `1` → one or more violations found; fix them before pushing.

No dependencies beyond `git` and `bash`.
## Agent Merge Unblocker

Every Copilot-authored PR passes through the normal branch-protection rules on
`main`.  Two settings were found (see [#586](https://github.com/oviney/blog/issues/586))
that silently block agent PRs from ever merging:

| # | Setting | Symptom | Fix |
|---|---------|---------|-----|
| 1 | `dismiss_stale_reviews = true` (branch protection, `main`) | Bot follow-up commits silently dismiss human approvals; PR drifts back to `REVIEW_REQUIRED`. | Set to `false` — approval survives subsequent bot commits. |
| 2 | Actions → "Require approval for all outside collaborators" | Copilot bot is treated as a first-time contributor; every workflow ends in `action_required` (0 s); `build` context never passes. | Change policy to "first-time contributors who are new to GitHub". |

**Setting 1** is patched automatically by the script.  
**Setting 2** must be changed manually in the web UI (GitHub does not expose this toggle via REST API for user-owned repositories).

### Running the fix script

```bash
# Requires: gh CLI (authenticated as a repo admin), jq
bash scripts/fix-agent-merge-blockers.sh [owner/repo]
```

The script is **idempotent** — it reads current state before every write and
exits 0 without making changes if a setting is already correct.

**What the script does automatically (via REST API):**

1. Reads the full branch-protection payload for `main`.
2. Patches `dismiss_stale_reviews → false` while preserving every other
   existing setting (required status checks, review count, admin enforcement,
   restrictions, etc.).
3. Confirms the write took effect.
4. Reports `default_workflow_permissions` and `can_approve_pull_request_reviews`
   for operator awareness — **no changes are made** to these values.
   `can_approve_pull_request_reviews` must remain `false`; enabling it would
   allow workflow tokens to self-approve PRs, removing the human-approval
   requirement.

**What must be done manually (web UI):**

GitHub does not expose the fork-PR approval gate via REST API for
user-owned repositories.  After running the script:

1. Open **https://github.com/oviney/blog/settings/actions**
2. Locate **"Fork pull request workflows from outside collaborators"**
3. Select **"Require approval for first-time contributors who are new to GitHub"**
   (or the least-restrictive option acceptable to the repository owner)
4. Click **Save**

### When to re-run

Re-run the script any time branch-protection settings are reset by a GitHub
UI change, a repository transfer, or a new admin modifying the settings.  The
script is safe to run repeatedly.
`scripts/eval-agent-pr.sh` scores any PR against a five-dimension quality rubric
and writes a JSON snapshot to `.agent-evals/<pr>.json`.

**Dependencies:** `gh` CLI (authenticated) and `jq`.

```bash
# Score PR #578
./scripts/eval-agent-pr.sh 578

# Score a PR in a different repo
./scripts/eval-agent-pr.sh 42 owner/other-repo
```

The script exits **0** when every dimension passes its hard threshold, **1** otherwise.

### Rubric

| Dimension | What is measured | Hard threshold |
|-----------|-----------------|----------------|
| **Scope adherence** | Changed files vs. protected files list (`_config.yml`, `Gemfile`, etc.) | Fail if any protected file is modified |
| **Atomic commits** | Commit-message heuristic: subject containing two distinct action verbs | Fail if any commit bundles multiple concerns |
| **Test coverage** | `test_loc / code_loc` for `.js/.ts/.sh/.rb/.py` files | Fail if `code_loc > 50` and `test_loc == 0` |
| **CI status** | All completed check-runs conclude `success` or `skipped` | Fail if any check-run fails |
| **Review churn** | Force-pushes after first non-pending review | Fail if > 2 force-pushes post-review |

### Interpreting scores

Each dimension in the output JSON contains:

- **`pass`** (`true`/`false`) — whether the hard threshold was met
- **`note`** — human-readable explanation
- Dimension-specific counters (e.g. `commit_count`, `force_push_count`)

**`all_pass: true`** means the PR passed every threshold — a signal of
high-quality, reviewable agent work.  Individual dimensions can be inspected
when `all_pass` is `false` to identify which governance rule was violated.

Fixture evaluations for reference PRs live in `.agent-evals/`
(e.g. `565.json`, `569.json`, `574.json`).
## Agent Merge Unblocker

A small collection of standalone scripts that correct repository settings which
can silently block Copilot-agent PRs from merging.  Each script is idempotent,
uses only `gh` CLI and `jq`, and follows a read → modify → write → verify
pattern so that no other protection setting is disturbed.

### Require up-to-date branches

**Script:** `scripts/require-up-to-date-branches.sh`

#### What it does

Patches `required_status_checks.strict → true` on the `main` branch
protection.  With this enabled, a PR cannot merge unless its base commit equals
the current tip of `main`, forcing an explicit rebase or merge-up that either
surfaces conflicts or confirms the diff is genuinely in-scope.

The script follows a strict read-modify-write pattern:

1. Reads the full branch-protection payload for `main` via `GET /repos/{owner}/{repo}/branches/main/protection`.
2. If `required_status_checks.strict` is already `true`, prints `✓` and exits 0 with **no API writes**.
3. Otherwise, builds a `PUT` payload that sets `strict → true` while preserving every other existing setting (review counts, dismiss-stale, code-owner reviews, restrictions, enforce-admins, etc.).
4. Verifies the write took effect by re-reading the endpoint and comparing.
5. Exits 1 on any API failure with a clear error message.

#### Why it is needed

The RCA in [#590](https://github.com/oviney/blog/issues/590) identified the primary root cause of phantom commits seen in PRs [#576](https://github.com/oviney/blog/issues/576), [#561](https://github.com/oviney/blog/issues/561), and [#578](https://github.com/oviney/blog/issues/578): all three branches forked from `main` before a large merge landed.  Copilot's platform auto-update mechanism then cherry-picked `main`'s new commits onto each stale branch with the original author date preserved, making the phantom commits invisible in reviewer diffs.

Requiring branches to be up to date before merge eliminates this failure mode at the root: Copilot must rebase or merge `main` explicitly, producing a visible, auditable diff.

#### Usage

```bash
# Requires: gh CLI (authenticated as a repo admin), jq
bash scripts/require-up-to-date-branches.sh [owner/repo]
```

`owner/repo` defaults to `oviney/blog`.  The script is safe to run with any
admin-scoped `gh` token.

#### When to re-run

Re-run any time branch-protection settings are reset — for example after a
GitHub UI change, a repository transfer, or a new admin modifying the
settings.  The script is safe to run repeatedly; it exits 0 immediately when
the setting is already correct.
