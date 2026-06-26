# SPEC — BLOG-024: Durable URL slug policy + truncation gate

**Stream:** GROWTH_DESIGN_BACKLOG · **Priority:** P2 · **Scope:** S · **Dependencies:** None
**Date:** 2026-06-25 · **Label:** `agent:qa-gatekeeper`

---

## 1. Objective

Some early article slugs were truncated mid-word by an upstream tool (e.g.
`…-and-sustai`, `…-maintenance-savi`, `…-industrial-revolut`). Those URLs are
indexed and immutable. Establish a documented slug convention and a build-time
check that **detects accidental truncation in new posts** without changing any
existing URL.

## 2. Approach

The site permalink is `/:year/:month/:day/:title/`; the slug is the post filename
minus the `YYYY-MM-DD-` prefix and extension. `jekyll-redirect-from` is absent and
`Gemfile` is protected, so existing slugs cannot be renamed — they are
grandfathered.

1. Document the policy in `docs/URL_SLUG_POLICY.md`: lowercase-hyphen, complete
   words, target ≤50 / soft cap 55 / hard cap 60 chars, no double hyphens,
   existing-URLs-immutable rule.
2. Extend `scripts/validate-post-quality.sh` (which already has a 0/1/2
   ERROR/WARNING model wired into CI) with a slug check:
   - **ERROR** if slug length > 60 (hard cap — no existing post exceeds 60, so
     CI is not retroactively broken; new over-long slugs are blocked).
   - **WARNING** if slug length ≥ 55 (truncation-prone) or contains `--`.
3. No protected files; no existing post renamed; warnings are non-blocking
   (both workflows gate only on exit 1).

## 3. Acceptance criteria

- [x] **AC-1** Maximum practical slug length + naming convention documented
      (`docs/URL_SLUG_POLICY.md`).
- [x] **AC-2** Guidance present so new posts use concise, complete,
      keyword-relevant slugs.
- [x] **AC-3** Existing URLs unchanged (no `_posts/` renames; legacy slugs
      grandfathered as non-blocking warnings).
- [x] **AC-4** The publishing workflow detects accidental truncation: slug > 60
      → build error; ≥ 55 or `--` → advisory warning.
- [x] **AC-5** Build-time validation added and CI-wired (the gate already runs in
      `test-build.yml` and `test-quality.yml`); verified exit 2 on current posts
      (0 errors, 5 warnings) so `main` CI stays green.
- [x] **AC-6** No protected file touched (`_config.yml`, `Gemfile`,
      `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`).

## 4. Commands

```bash
bash scripts/validate-post-quality.sh    # AC-4/AC-5 — expect exit 2 (warnings only)
```
