---
name: performance-optimization
description: Optimizes oviney/blog performance with a measure-first workflow. Use when Lighthouse scores dip, page assets grow, or Jekyll output changes risk Core Web Vitals regressions.
version: 1.0.1
triggers:
  - Lighthouse or runtime performance signals regress
  - Page weight or asset size grows
  - A change risks Core Web Vitals degradation
---

# Performance Optimization

## Overview

Measure before you optimize. For this repo, performance work is about static-site output quality: fast pages, stable layout, lean assets, and good Lighthouse scores on the core routes the project already monitors.

## When to Use

- Lighthouse scores regress or hover near the repo thresholds
- A template, asset, font, image, or script change affects page weight
- New content risks layout shift, oversized images, or slow mobile rendering
- A new third-party asset or embed is proposed
- Search, navigation, or article pages feel slower after a change

## Measure First

Start with the repo's existing verification path:

```bash
bundle exec jekyll build
npm run test:lighthouse
```

The current Lighthouse config monitors:

- `http://localhost:4000/`
- `http://localhost:4000/blog/`
- `http://localhost:4000/about/`

Use those routes as the baseline unless the change targets a different page that also needs spot checks.

## Local Budgets Already Encoded

From `lighthouserc.json`, treat these as the repo's working targets:

- Performance score ≥ 0.90 (warn below)
- Accessibility score ≥ 0.95 (warn below)
- Best practices score ≥ 0.90 (error below)
- SEO score ≥ 0.90 (error below)
- LCP ≤ 2500 ms
- CLS ≤ 0.1
- Total blocking time ≤ 200 ms

## Common Static-Site Bottlenecks

| Symptom | Likely cause | First thing to inspect |
|---|---|---|
| Slow LCP | oversized hero image, render-blocking asset, slow font | touched page template and image dimensions |
| High CLS | images without width/height, late-loading embeds | article markup or responsive image changes |
| High TBT | heavy JavaScript, unnecessary third-party script | touched JS files or new embeds |
| Lower scores on `/blog/` | card images, feed size, typography assets | blog index markup and asset payloads |
| Lower scores on `/about/` | content-heavy layout or large media | page-specific media and script additions |

## Performance Fix Order

1. Remove or reduce the heaviest asset
2. Fix layout stability (`width`, `height`, predictable containers)
3. Defer or remove non-critical JavaScript
4. Check fonts and external origins
5. Re-run Lighthouse before considering deeper changes

## Repo-Specific Patterns

### Images

- Keep featured and inline images sized for their actual display context
- Include explicit dimensions where markup allows it
- Prefer modern, compressed assets already used by the site
- Do not add decorative large images to above-the-fold areas without a measurable reason

### Scripts and embeds

- Every new script competes with article readability and mobile performance
- Prefer static rendering over client-side enhancement when both achieve the same result
- Treat analytics and embeds as optional, not default

### Content-heavy pages

- Avoid bloating listing pages with oversized excerpts, media, or repeated metadata
- Keep navigation and header changes lightweight across 320 px, 768 px, 1024 px, and 1920 px

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It is only one image" | One oversized hero image can dominate LCP on mobile. |
| "Static sites are automatically fast" | Asset choices, fonts, embeds, and layout shifts still matter. |
| "The Lighthouse warning is close enough" | This repo already encodes thresholds — use them. |
| "I will optimise after merge" | Performance regressions are easier to stop before they ship. |

## Red Flags

- Large new images or fonts with no before/after measurement
- Third-party scripts added without a clear need
- Missing image dimensions in changed templates
- Performance guidance that ignores `lighthouserc.json`
- Layout or navigation changes not checked at the core responsive widths

## Verification

After performance-related work:

- [ ] `bundle exec jekyll build` passes
- [ ] `npm run test:lighthouse` completes
- [ ] The affected route was compared against the baseline route set when relevant
- [ ] No avoidable large assets or blocking scripts were introduced
- [ ] Changed layouts remain stable at 320 px, 768 px, 1024 px, and 1920 px
- [ ] The fix is based on measured regression, not assumption alone

## Related Files

- [`../../../lighthouserc.json`](../../../lighthouserc.json) — local performance thresholds and monitored URLs
- [`../../../references/performance-checklist.md`](../../../references/performance-checklist.md) — quick optimization checklist
- [`../jekyll-qa/SKILL.md`](../jekyll-qa/SKILL.md) — repo QA and performance workflow
