# SPEC — Tag Taxonomy Policy (Issue #907)

**Status:** Draft  
**Issue:** [#907](https://github.com/oviney/blog/issues/907)  
**Label:** `agent:editorial-chief`  
**Date:** 2026-05-03

---

## 1. Objective

Establish and enforce a consistent tag taxonomy across the 24-post archive. Currently 18 of 24 posts have zero tags; the 6 that do use inconsistent casing. Validators do not check tags. The editorial skill shows tags as expected but does not enforce them.

**Target users:** the editorial agent (enforcing on new posts) and future readers/search indexers (benefiting from consistent metadata).

---

## 2. Policy Decision

**Tags are required.** The policy:

- Every post must have 2–5 tags from the canonical vocabulary below.
- New tags may be introduced when none of the existing ones fit; they must use `lowercase-hyphen` format.
- `validate-posts.sh` will issue an **ERROR** (not warning) on missing tags — consistent with how `categories` is treated.
- `content-review.js` will deduct 10 points for missing tags (same as the existing internal-links penalty).

**Rationale for ERROR not warning:** 75% of posts already lack tags. Making it a warning risks perpetuating the status quo. Since the remediation below adds tags to all 18 gaps, the archive will be fully compliant before the stricter check lands.

---

## 3. Canonical Tag Vocabulary

Organised by primary category; tags may be used across categories.

### Quality Engineering
`quality-engineering` · `software-testing` · `defect-prevention` · `quality-metrics` · `cost-of-quality` · `qa-strategy` · `quality-management`

### Test Automation
`test-automation` · `ci-cd` · `self-healing-tests` · `playwright` · `test-maintenance` · `test-roi` · `testing-theater`

### Software Engineering
`software-engineering` · `engineering-leadership` · `technical-debt` · `platform-engineering` · `developer-experience` · `digital-transformation` · `architecture`

### Security
`security` · `security-debt` · `cybersecurity` · `enterprise-security` · `threat-detection`

### Cross-cutting
`ai` · `ai-testing` · `code-quality` · `productivity` · `devops` · `cost-benefit`

**Casing rule:** always lowercase-hyphen. Acronyms become lowercase: `AI` → `ai`, `QA` → `qa-strategy`.

---

## 4. Remediation Map

Tags to add to the 18 untagged posts:

| Post | Proposed tags |
|---|---|
| `2023-12-28-understanding-opendns-cybersecurity-protection.md` | `security`, `cybersecurity`, `enterprise-security` |
| `2025-12-31-testing-times.md` | `ai-testing`, `test-automation`, `quality-engineering` |
| `2026-01-02-self-healing-tests-myth-vs-reality.md` | `self-healing-tests`, `test-automation`, `test-maintenance` |
| `2026-01-18-ai-assisted-development-the-new-industrial-revolut.md` | `ai`, `software-engineering`, `code-quality`, `productivity` |
| `2026-01-18-the-hidden-technical-debt-of-test-automation.md` | `test-automation`, `technical-debt`, `test-maintenance` |
| `2026-01-18-the-productivity-paradox-of-test-coverage-metrics.md` | `test-automation`, `quality-metrics`, `productivity` |
| `2026-01-18-the-real-cost-of-testing-theater-when-quality-metr.md` | `testing-theater`, `quality-metrics`, `cost-of-quality` |
| `2026-01-19-the-surprising-economics-of-test-automation-roi.md` | `test-roi`, `test-automation`, `cost-benefit` |
| `2026-04-04-the-real-cost-of-test-automation--balancing-speed-and-sustai.md` | `test-automation`, `test-roi`, `technical-debt` |
| `2026-04-05-ai-quality-testing-automation.md` | `ai-testing`, `test-automation`, `qa-strategy` |
| `2026-04-05-building-a-test-strategy-that-works.md` | `qa-strategy`, `test-automation`, `software-testing` |
| `2026-04-05-copq-in-software-engineering-and-how-quality-engin.md` | `cost-of-quality`, `quality-engineering`, `software-engineering` |
| `2026-04-05-cost-of-poor-quality-copq.md` | `cost-of-quality`, `quality-engineering`, `defect-prevention` |
| `2026-04-05-practical-applications-of-ai-in-software-development.md` | `ai`, `software-engineering`, `productivity`, `code-quality` |
| `2026-04-05-the-end-of-manual-qa-why-2026-is-the-tipping-point.md` | `test-automation`, `qa-strategy`, `ai-testing` |
| `2026-04-05-why-ai-test-generation-tools-overpromise-on-maintenance-savi.md` | `ai-testing`, `test-maintenance`, `test-automation` |
| `2026-04-06-the-concealed-price-tag-of-test-automation.md` | `test-roi`, `cost-of-quality`, `test-automation` |
| `2026-04-12-the-hidden-economics-of-security-debt.md` | `security-debt`, `security`, `cost-benefit` |

**Also fix casing** in the 6 posts that have tags: `AI` → `ai`.

---

## 5. Acceptance Criteria

- [ ] **AC-1** `validate-posts.sh` issues an ERROR when a post has no tags
- [ ] **AC-2** `validate-posts.sh` issues an ERROR when a post has fewer than 2 tags  
- [ ] **AC-3** `content-review.js` deducts 10 points when `tags` is absent
- [ ] **AC-4** All 24 posts pass `validate-posts.sh --all` after remediation
- [ ] **AC-5** All 24 posts score ≥ 90 on `content-review.js` after remediation
- [ ] **AC-6** The canonical tag vocabulary and tag format rules are documented in `.github/skills/editorial/SKILL.md`
- [ ] **AC-7** `bundle exec jekyll build` succeeds with no errors

---

## 6. Files Under Change

| File | Change |
|---|---|
| `scripts/validate-posts.sh` | Add tag presence and count checks (ERROR) |
| `scripts/content-review.js` | Add tag score component (10 pts) |
| `.github/skills/editorial/SKILL.md` | Add canonical tag vocabulary and enforcement rules |
| 18 `_posts/*.md` files | Add tags front matter |
| 6 `_posts/*.md` files | Normalise tag casing (`AI` → `ai`) |

---

## 7. Boundaries

| Always | Ask first | Never |
|---|---|---|
| Use `lowercase-hyphen` format for all tags | Add a tag outside the canonical list | Fabricate tags that don't match post content |
| Match tags to actual post content | Change the canonical vocabulary significantly | Modify `_config.yml`, `Gemfile`, layouts |
| Run `validate-posts.sh --all` before committing | — | Remove existing tags |
| Run `content-review.js` before committing | — | Touch posts' title, date, or slug |

---

## 8. Out of Scope

- Building tag archive pages (no `/tags/` landing pages exist; creating them is a separate feature)
- Changing the category taxonomy (separate from tags)
- Adding tag-based filtering to search (separate feature)
