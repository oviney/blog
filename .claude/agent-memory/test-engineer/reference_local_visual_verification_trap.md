---
name: local-visual-verification-trap
description: Jekyll's _site is shared across servers — a second `jekyll serve` on another port silently overwrites it, so an already-running server starts serving the new build
metadata:
  type: reference
---

`_site/` is a single shared build directory at the repo root. A `jekyll serve`
on any port serves *that* directory and rebuilds into it.

Consequence: if a server is already running on :4000 and you start a second one
on :4010 to compare a branch against main, the second build overwrites `_site`
and **:4000 immediately starts serving the branch too**. Both ports then return
byte-identical CSS and the comparison silently reads as "no change".

**Why:** hit this on 2026-08-02 comparing PR #1203's compiled `styles.css`
against main. The two ports agreed perfectly — which looked like evidence and
was actually the same file.

**How to apply:** to compare two revisions' rendered output, build each in its
own `git worktree` with an explicit `--destination` outside the repo, e.g.
`git worktree add <tmp> origin/main` then
`BUNDLE_GEMFILE=<repo>/Gemfile bundle exec jekyll build --destination <tmp>/_site_main`.
Never rely on two ports off one checkout. Also rebuild `_site` at the end — a
stray branch build left in place makes the next session's greps lie.

Related: [[visual-gate-blind-spots]].
