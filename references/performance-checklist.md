# Performance Checklist

Quick reference for performance verification on oviney/blog. Use alongside `performance-optimization` and `jekyll-qa`.

## Core Repo Checks

```bash
bundle exec jekyll build
bundle exec jekyll serve --config _config_dev.yml
npm run test:lighthouse
```

The current Lighthouse baseline covers `/`, `/blog/`, and `/about/` on the local server.

## What to Check First

- [ ] Largest contentful image is appropriately sized and compressed
- [ ] Images and visual containers reserve space to avoid CLS
- [ ] No new third-party script or embed was added without a clear need
- [ ] Typography changes do not introduce excessive font weight or format cost
- [ ] Listing pages remain readable and lightweight on mobile widths

## Lighthouse Thresholds Already in Repo

- [ ] Performance score stays at or above 0.90
- [ ] LCP stays at or below 2500 ms
- [ ] CLS stays at or below 0.1
- [ ] Total blocking time stays at or below 200 ms

## Static-Site Anti-Patterns

| Anti-pattern | Impact | Better move |
|---|---|---|
| Oversized hero image | hurts LCP immediately | resize/compress before shipping |
| Missing image dimensions | causes layout shift | set predictable dimensions |
| New third-party widget | adds JS cost and latency | prefer static content or defer entirely |
| Heavy navigation redesign | affects every page load | keep shared chrome lean |
| Rich content added above the fold | slows article entry | push non-critical media lower |

## Responsive Spot Checks

- [ ] 320 px — no overflow, cramped controls, or shifted media
- [ ] 768 px — cards and navigation still balance correctly
- [ ] 1024 px — layout remains stable on laptop-sized screens
- [ ] 1920 px — wide layout does not reveal oversized assets or awkward spacing

## Useful Commands

```bash
bundle exec jekyll build
bundle exec jekyll serve --config _config_dev.yml
npm run test:lighthouse
npm run test:playwright
```
