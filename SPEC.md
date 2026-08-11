# SPEC — Let Dependabot's bundler bumps pass the scope guard on their own

**Stream:** `docs/BACKLOG.md` top Active row (P2) · **Priority:** P2 · **Scope:** S
**Date:** 2026-08-11 · **Label:** `governance-update` · **Issue:** [#1253](https://github.com/oviney/blog/issues/1253)
**Status:** specified — approach approved 2026-08-11

---

## 1. Objective

`scripts/check-pr-scope.sh` has **no Dependabot handling**, and `Gemfile` /
`Gemfile.lock` sit in `PROTECTED_FILES` with the `protected-file-update` bypass
deliberately withheld. Every bundler bump therefore fails `check-agent-scope`
**structurally** and can never go green — each one needs an `--admin` merge.

A protected-file guard that is routinely overridden stops carrying signal. This
spec removes the recurring override without weakening the rule.

---

## 2. Evidence

Measured 2026-08-10, after rebasing all four open Dependabot PRs onto a `main`
that already carried the js-yaml fix (#1247):

| PR | Bump | `🔒 Security Audit` | `check-agent-scope` |
|----|------|--------------------|---------------------|
| #1242 | jekyll-remote-theme 0.4.3→0.5.2 | SUCCESS | **FAILURE** |
| #1243 | json 2.20.0→2.21.2 | SUCCESS | **FAILURE** |
| #1245 | jekyll-include-cache 0.2.1→0.2.2 | SUCCESS | **FAILURE** |
| #1244 | @playwright/test 1.62.0→1.62.1 | SUCCESS | SUCCESS |

The split is exactly bundler-vs-npm. #1244 passes only because
`package-lock.json` is **not** in `PROTECTED_FILES`. That confirms the cause is
the protected-file rule, not the bump content. #1243/#1244/#1245 were merged
with `--admin`; #1242 remains open.

### Why the rule is written that way

`check-pr-scope.sh:59-66` is explicit:

> Kept separate from `PROTECTED_FILES` so infra files (`_config.yml`, `Gemfile*`,
> `.github/CODEOWNERS`, `.github/copilot-instructions.md`) always trip Rule 1 —
> even with the label.

That reasoning is **correct for agent-authored PRs** and should not change.
Dependabot is not an agent — it is the mechanism by which those two files are
*supposed* to change.

---

## 3. The spoofing risk does not apply here

An author-based exemption is only as trustworthy as the author field. Checked
before committing to the design:

`test-build.yml:3-13` triggers on **`pull_request`**, not `pull_request_target`.
Under `pull_request`, `github.event.pull_request.user.login` comes from the
GitHub-generated event payload, not from anything inside the PR's own code or
branch. A fork PR cannot forge it.

**This would not hold under `pull_request_target`.** If that trigger is ever
introduced on this workflow, this exemption must be re-reviewed. Recorded in the
script so the constraint travels with the code.

---

## 4. Design — author gate AND path gate (D-1, approved)

Bypass Rule 1 only when **both** hold:

1. `PR_AUTHOR` is exactly `dependabot[bot]` — exact compare, not a substring
   match, matching the anchoring discipline cases D/E/F/K already pin; and
2. every changed file is in `{Gemfile, Gemfile.lock}` — so a bot PR that also
   reaches for `_config.yml` or `.github/CODEOWNERS` still trips the guard.

Gate 2 is what makes this safe. Gate 1 alone would give a mis-scoped or
compromised bot PR a free pass on both files.

npm bumps need no exemption: `package.json` / `package-lock.json` are not
protected, so Rule 1 never fires for them.

| Author | Diff | Rule 1 |
|--------|------|--------|
| `dependabot[bot]` | `Gemfile.lock` | **pass** |
| `dependabot[bot]` | `Gemfile` + `Gemfile.lock` | **pass** |
| `dependabot[bot]` | `Gemfile.lock` + `_config.yml` | **fail** — path escape |
| `dependabot[bot]` | `.github/CODEOWNERS` | **fail** |
| `dependabot[bot]-x` / any human | `Gemfile.lock` | **fail** — author gate |

Rules 2, 3 and 4 are untouched.

---

## 5. Out of scope

- **Widening the exemption to other protected files.** `_config.yml`,
  `.github/CODEOWNERS` and `.github/copilot-instructions.md` stay unbypassable
  by anyone. Dependabot has no reason to touch them.
- **#1242's merge decision.** Separate owner call. Note `remote_theme:` is
  commented out at `_config.yml:37`, so `jekyll-remote-theme` loads and does
  nothing — whether it should be a dependency at all is the better question, and
  both files involved are protected.
- **Auto-merge for Dependabot.** This makes the gate pass honestly; it does not
  change who merges.

---

## 6. Acceptance criteria

- **AC-1** A `dependabot[bot]` PR touching only `Gemfile` and/or `Gemfile.lock` exits 0.
- **AC-2** A `dependabot[bot]` PR touching those *plus* any other protected file exits 1.
- **AC-3** A non-Dependabot author touching `Gemfile.lock` still exits 1.
- **AC-4** An author string that merely *contains* `dependabot[bot]` does not qualify.
- **AC-5** Cases A–K still pass unchanged — no regression to existing bypasses.
- **AC-6** `test-build.yml` passes `PR_AUTHOR`; the guard degrades to today's behaviour when it is unset.
- **AC-7** The `pull_request`-trigger constraint from §3 is recorded in the script.
- **AC-8** `README.md`'s scope-guard section documents the exemption.
- **AC-9** The PR gate is green, and #1242 shows `check-agent-scope` passing without `--admin`.
