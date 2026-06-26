# URL Slug Policy

**Status:** Active · **Owner:** editorial + qa-gatekeeper · **Tracks:** BLOG-024

This document defines the naming convention for viney.ca article URLs and the
build-time check that enforces it.

## Why this exists

Article URLs are derived from the post filename. The site permalink is:

```yaml
# _config.yml
permalink: /:year/:month/:day/:title/
```

so a file `_posts/2026-04-05-ai-quality-testing-automation.md` publishes at
`/2026/04/05/ai-quality-testing-automation/`. The **slug** is the filename with
the leading `YYYY-MM-DD-` date prefix and the `.md`/`.markdown` extension
removed.

Several early posts were published with slugs that an upstream tool **truncated
mid-word** at a fixed length (e.g. `…-and-sustai`, `…-maintenance-savi`,
`…-industrial-revolut`). Those URLs are already indexed by search engines, so we
cannot rename them — but we can stop new ones from being created.

## Convention

For every **new** post:

1. **Lowercase, hyphen-separated** words only (`a-z`, `0-9`, `-`). This matches
   Jekyll's slug normalisation.
2. **Complete words** — never cut a word mid-way. A slug must read as a finished
   phrase, not a truncated title.
3. **Length:** target **≤ 50 characters**; **55 is a soft cap** (warning); **60
   is the hard cap** (build error). Shorter, keyword-relevant slugs are better
   for sharing and SEO.
4. **No double hyphens** (`--`). Collapse to a single hyphen between words.
5. **Drop filler** — omit stop words (`the`, `a`, `of`, `and`, `to`) where the
   slug still reads clearly. Keep the keywords a reader would search for.

Examples:

| Good | Avoid |
|------|-------|
| `ai-quality-testing-automation` | `the-practical-applications-of-ai-in-software-developm` (truncated) |
| `test-coverage-productivity-paradox` | `the-productivity-paradox-of-test-coverage-metrics-and-more` (>60) |

## Existing URLs are immutable

`jekyll-redirect-from` is **not** installed and `Gemfile` is a protected file, so
there is no redirect mechanism. Therefore:

- **Never rename an existing post's slug.** Doing so breaks the live URL and any
  inbound links with no redirect to catch them.
- The legacy truncated slugs are **grandfathered**. They surface as non-blocking
  warnings (see below) to document the debt, not to demand a fix.
- If a URL migration is ever genuinely required, it must be an owner-approved
  change that first adds `jekyll-redirect-from` (a `Gemfile` edit) and backfills
  `redirect_from:` front matter on the affected post.

## Enforcement

`scripts/validate-post-quality.sh` checks every post's slug:

| Condition | Severity | CI effect |
|-----------|----------|-----------|
| slug length > 60 chars | **ERROR** (exit 1) | **blocks merge** |
| slug length ≥ 55 chars | warning (exit 2) | advisory, non-blocking |
| slug contains `--` | warning (exit 2) | advisory, non-blocking |

The hard cap is set at 60 so no existing URL is retroactively invalidated (the
longest current slug is exactly 60). New posts that would introduce an over-long
or truncation-prone slug are caught before they ship.

Run locally:

```bash
bash scripts/validate-post-quality.sh
```
