# Roadmap — viney.ca

## Purpose

A personal engineering blog offering professional commentary on software quality,
test automation, and AI — written in The Economist's voice — for senior engineers
and engineering leaders.

## Content Goals

| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| Published posts | 19 | 30 | End of 2026 |
| Post cadence | Ad-hoc | 2 per month | Ongoing |

**Topic priorities** (current distribution is heavily skewed):

- **Security** (1 post) — most underrepresented; publish 4–5 new posts
- **Software Engineering** (2 posts) — grow to 6–8 posts
- **Test Automation** (1 as primary) — grow to 5–6 posts
- **Quality Engineering** (15 posts) — well-covered; maintain but don't over-index

The [economist-agents](https://github.com/oviney/economist-agents) pipeline can
generate 2–3 drafts per week; the bottleneck is human review, not production.

## Feature Goals

1. **Retire stale drafts** — 7 drafts from 2023 use pre-Economist formatting.
   Decide per-draft: rewrite with the pipeline, or delete.
2. **Add an RSS/Atom subscribe prompt** — the feed exists (`/feed.xml`) but is
   not discoverable from the homepage or post layout.
3. **Related-posts section** — surface 2–3 related articles at the end of each
   post to improve engagement and reduce bounce rate.

## Tech Debt

1. **Sass `@import` → `@use`/`@forward`** — Dart Sass has deprecated `@import`;
   migrate `_sass/economist-theme.scss` before Dart Sass 3.0 drops support.
   *(Source: `docs/DEVELOPMENT_WORKFLOW.md`)*
2. **Non-standard categories** — several posts use `"AI Testing"`, which is not
   in the approved taxonomy (ADR-002). Normalise to the four permitted values.

## Out of Scope

- Newsletter or email subscription service
- Comments or discussion system (Disqus, Giscus, etc.)
- Multi-author support — this is a single-author blog
- E-commerce, sponsorships, or monetisation
- Migrating away from Jekyll / GitHub Pages

---

*Last updated: April 2026*
