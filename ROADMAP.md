# Roadmap — viney.ca

## Purpose

A personal engineering blog offering professional commentary on software quality,
test automation, and AI — written in The Economist's voice — for senior engineers
and engineering leaders.

## Content Goals

| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| Published posts | 24 | 30 | End of 2026 |
| Post cadence | Ad-hoc | 2 per month | Ongoing |

**Topic priorities** (current distribution is improving, but still uneven):

- **Security** (3 posts) — still the thinnest category; make this the next 2-post priority so the archive is less lopsided
- **Software Engineering** (5 posts) — second priority; add 1–2 strong essays to close the gap with the two testing-heavy categories
- **Test Automation** (7 posts) — maintain a steady cadence, but avoid letting it crowd out the smaller categories
- **Quality Engineering** (9 posts) — best-covered topic today; publish selectively when there is a distinct data point or strong contrarian angle

_Post counts above are generated from `_posts/` front matter — regenerate with `bash scripts/content-inventory.sh` (run `--check` to detect drift)._

The [economist-agents](https://github.com/oviney/economist-agents) pipeline can
generate 2–3 drafts per week; the bottleneck is human review, not production.

There is currently **no `_drafts/` backlog** in this repository. New content ideas
should be prioritised through issues and only opened as drafts when there is a
clear publication path.

## Feature Goals

1. **Improve topic discovery** — make Security and Software Engineering easier to
   browse from the homepage, blog index, and archive surfaces so backlog
   priorities are reflected in reader journeys.
2. **Tune shipped discovery features** — RSS entry points and related-reading are
   already live; the next step is optimising placement, copy, and internal
   linking rather than treating those features as missing.
3. **Strengthen series planning** — package new posts into short thematic runs
   (for example, security debt, platform engineering, or AI adoption) so the
   roadmap produces clusters rather than isolated essays.

## Operating Model

This repository's roadmap is for the **publication** first: content, discovery,
reader experience, and the quality gates required to ship viney.ca safely.

Operational automation is in scope only when it directly improves publishing,
validation, deployment, or reader-facing reliability. Agent orchestration,
governance experiments, and reusable workflow tooling should be treated as
supporting infrastructure and, where they become broader than the blog itself,
as candidates for extraction into a separate repository.

## Tech Debt

1. **Sass `@import` → `@use`/`@forward`** — Dart Sass has deprecated `@import`;
   migrate `_sass/economist-theme.scss` before Dart Sass 3.0 drops support.
   *(Source: `docs/DEVELOPMENT_WORKFLOW.md`)*
2. **Manual content inventory reporting** — published-post counts and category
   mix are still updated by hand in roadmap documents, which makes drift likely.
   Add a lightweight way to regenerate these metrics when planning changes land.

## Out of Scope

- Newsletter or email subscription service
- Comments or discussion system (Disqus, Giscus, etc.)
- Multi-author support — this is a single-author blog
- E-commerce, sponsorships, or monetisation
- Migrating away from Jekyll / GitHub Pages

---

*Last updated: May 2026*
