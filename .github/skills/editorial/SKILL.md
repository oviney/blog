---
name: editorial
description: 'Editorial standards for blog content. Use when writing posts, editing articles, managing SEO, updating documentation, or reviewing content quality.'
version: 1.1.0
triggers:
  - Write or edit a blog post
  - SEO improvements needed
  - Content review or proofreading
  - Documentation writing or cleanup
---

## Context

The Editorial Chief maintains content quality across the blog. This includes writing blog posts, editing documentation, ensuring SEO best practices, and maintaining the Economist editorial voice.

**Production URL**: https://www.viney.ca
**Content Directory**: `_posts/`
**Drafts Directory**: `_drafts/`

## Blog Post Standards

### Front Matter (required)

```yaml
---
layout: post
title: "Title in Title Case"
date: YYYY-MM-DD
author: "Ouray Viney"
categories: ["Quality Engineering"]  # One of: Quality Engineering, Software Engineering, Test Automation, Security
tags: [tag1, tag2]
image: /assets/images/post-slug.png
---
```

### Categories (use exactly one)

- `Quality Engineering` — QE strategy, testing practices, quality metrics
- `Software Engineering` — development practices, architecture, AI in development
- `Test Automation` — automation frameworks, self-healing tests, CI/CD
- `Security` — cybersecurity, network security, compliance

### Writing Style

- **Voice**: Professional, analytical, data-driven — inspired by The Economist
- **Structure**: Lead with the key insight, support with data, conclude with implications
- **Length**: 800-1500 words (4-7 min read)
- **Citations**: Include specific data points with sources
- **Tone**: Authoritative but accessible, avoid jargon without explanation

### SEO Checklist

- [ ] Title under 60 characters
- [ ] Meta description via excerpt (first paragraph, under 160 chars)
- [ ] One H1 (the title), logical H2/H3 hierarchy
- [ ] Image with descriptive alt text
- [ ] Internal links to related posts where natural
- [ ] Category and tags set correctly

## Documentation Standards

### When editing docs (not blog posts)

- Be concise — remove filler words
- Lead with what the reader needs to do, not background
- Use code blocks for commands and file paths
- Keep files focused — one topic per file
- Update version numbers in front matter when editing skill files

### Documentation cleanup rules

- **Delete** files that document completed one-time tasks (migrations, setup)
- **Update** files that have outdated information but are still useful
- **Keep** files that define active standards, conventions, or workflows
- Anything deleted is preserved in git history — don't hesitate to remove stale docs

## File Naming

- Posts: `YYYY-MM-DD-slug-with-hyphens.md`
- Images: `/assets/images/slug-matching-post.png`
- Charts: `/assets/charts/slug-matching-post.png`

## Editorial Review Format

Every AI-generated editorial review **must** contain two sections in the following order.

### Section A — Editorial Notes

Standard qualitative feedback covering:
- Structure and argument flow
- Tone and voice consistency with The Economist style
- Missing context or logical gaps
- Readability and audience fit

Any new copy suggested by the reviewer that does not appear in the original post must be labeled `[Suggested rewrite]` so the author can distinguish reviewer suggestions from original content.

### Section B — Verification Report

A **mandatory** table listing every statistic, data point, percentage, and quote-like line found in the post. The table must appear under its own heading.

```markdown
## Verification Report

| # | Claim | Type | Source in post | Status |
|---|-------|------|----------------|--------|
| 1 | "73% of teams report improved velocity" | Stat | Para 2 | ✅ VERIFIED — links to [World Quality Report 2025](url) |
| 2 | "velocity improved 2x" | Stat | Para 4 | ❌ UNVERIFIED — no source provided |
| 3 | "Netflix said quality is everyone's job" | Quote | Para 6 | ❌ UNVERIFIED — paraphrase, not verbatim |
| 4 | "$4.45 million average breach cost" | Stat | Para 3 | ⚠️ NEEDS-LINK — source cited but hyperlink missing |
```

#### Status labels

| Label | Meaning |
|-------|---------|
| ✅ VERIFIED | Stat or quote has a valid source link in the post |
| ⚠️ NEEDS-LINK | Source is mentioned but the hyperlink is missing or broken |
| ❌ UNVERIFIED | No source provided, or a paraphrase is presented as a direct quote |

#### Blocking rule

If **any** row in the Verification Report has status ❌ UNVERIFIED or ⚠️ NEEDS-LINK, the review **must**:

1. Flag the count at the top of the review: `⚠️ VERIFICATION FAILURES: N items unverified`
2. List the required actions to resolve each failure
3. **Not** approve the post for merge

A post may only be approved when every row in the Verification Report is ✅ VERIFIED.

#### `[Suggested rewrite]` convention

When the reviewer proposes alternative wording — a rewritten sentence, a new paragraph, or a replacement heading — it must be wrapped with the `[Suggested rewrite]` label:

```markdown
[Suggested rewrite] Consider replacing "tests broke a lot" with:
"Regression failures increased 40% quarter-over-quarter, according to the team's internal dashboard."
```

This prevents AI-generated copy from being mistaken for original author text.

### Example Review

Below is a complete example showing both sections applied to a hypothetical post.

---

> **Editorial Review — "The Hidden Cost of Flaky Tests"**
>
> ### Section A — Editorial Notes
>
> **Structure**: The post opens strong with a real-world anecdote but loses momentum in paragraphs 4–5 where it lists framework features without tying them back to the cost argument. Consider cutting the feature list and replacing it with a before/after comparison.
>
> **Tone**: Mostly on-brand. Paragraph 7 shifts to an informal register ("tests broke a lot") that clashes with the analytical voice used elsewhere.
>
> [Suggested rewrite] Consider replacing "tests broke a lot" with:
> "Regression failures increased 40% quarter-over-quarter, according to the team's internal dashboard."
>
> **Missing context**: The conclusion references "industry benchmarks" without naming them. Either cite the benchmark or remove the claim.
>
> ### Section B — Verification Report
>
> ⚠️ VERIFICATION FAILURES: 2 items unverified
>
> | # | Claim | Type | Source in post | Status |
> |---|-------|------|----------------|--------|
> | 1 | "Flaky tests cost Google $3.5 billion/year" | Stat | Para 1 | ✅ VERIFIED — links to [Google Testing Blog 2023](https://testing.googleblog.com/2023/flaky-tests) |
> | 2 | "60% of CI failures are non-deterministic" | Stat | Para 3 | ❌ UNVERIFIED — no source provided |
> | 3 | "as Martin Fowler noted, 'non-deterministic tests are useless'" | Quote | Para 5 | ✅ VERIFIED — links to [martinfowler.com](https://martinfowler.com/articles/nonDeterminism.html) |
> | 4 | "industry benchmarks show 15% productivity loss" | Stat | Para 8 | ❌ UNVERIFIED — "industry benchmarks" not identified |
>
> **Required actions before approval:**
> 1. Item 2 — Add a source for the 60% CI failure claim, or remove the statistic
> 2. Item 4 — Name the specific benchmark and add a link, or soften to qualitative language

---

## Validation

After creating or editing content:

```bash
bundle exec jekyll build
```

Check that:
- Post appears in `_site/` with correct URL
- Images load (check paths)
- No Liquid template errors in build output
- Front matter YAML is valid

## Version History

- **1.1.0** (2026-04-11): Added mandatory two-section editorial review format with Verification Report, blocking rule for unverified claims, and `[Suggested rewrite]` convention
- **1.0.0** (2026-04-04): Initial skill creation — editorial standards, blog post conventions, documentation guidelines
