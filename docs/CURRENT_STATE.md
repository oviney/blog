# Current State — April 2026

## Summary

A production Jekyll blog with a **custom Economist-inspired theme**, deployed via GitHub Actions to GitHub Pages at **https://www.viney.ca/**.

## Site Overview

| Property | Value |
|---|---|
| **URL** | https://www.viney.ca/ |
| **Stack** | Jekyll 4.3.2 + custom SCSS theme |
| **Build** | GitHub Actions (`jekyll.yml`) |
| **Host** | GitHub Pages |
| **Ruby** | 3.3 (via rbenv locally, ruby/setup-ruby in CI) |
| **Analytics** | Google Analytics (G-GTFG819MNS) |
| **Domain** | CNAME: www.viney.ca |

## Theme

Custom Economist-inspired design system (`_sass/economist-theme.scss`, 600+ lines):

- **Typography**: Merriweather (serif) for body text, Inter (sans-serif) for UI
- **Colours**: Economist red (#E3120B) for accents only
- **Layouts**: `_layouts/default.html` (base), `_layouts/post.html` (articles)
- **Components**: Red header banner, horizontal navigation, article cards, dark footer
- **Responsive**: Mobile-first with breakpoints at 768px and 1024px

## CI/CD Pipeline

Four GitHub Actions workflows run automatically on push to `main`:

| Workflow | File | Purpose |
|---|---|---|
| Deploy | `jekyll.yml` | Build and deploy to GitHub Pages (~1–2 min) |
| Test Build | `test-build.yml` | Jekyll build validation + HTML checks |
| Quality Tests | `test-quality.yml` | Visual regression, a11y, Lighthouse, security |
| Healing Monitor | `healing-monitor.yml` | Playwright test healing (runs every 4 hours) |

## Quality Gates

- **Pre-commit**: Jekyll build validation (local hook)
- **CI**: HTML validation
- **CI**: Visual regression (BackstopJS)
- **CI**: Accessibility (pa11y-ci, WCAG 2.1 AA)
- **CI**: Performance/SEO (Lighthouse CI)
- **CI**: Security audit (npm audit)
- **Monitoring**: Playwright healing dashboard at `/dashboard/`

## Content

Blog articles are produced using the [economist-agents](https://github.com/oviney/economist-agents) multi-agent AI system, which generates publication-quality content in The Economist's voice. All content undergoes human review before publication.

## Key Files

| File | Description |
|---|---|
| `_config.yml` | Jekyll site configuration |
| `Gemfile` | Ruby dependencies (Jekyll 4.3.2) |
| `package.json` | Node.js test tooling |
| `_sass/economist-theme.scss` | Custom design system (600+ lines) |
| `_layouts/default.html` | Base page layout |
| `_layouts/post.html` | Article layout |
| `.github/workflows/jekyll.yml` | Deploy workflow |

## Links

- **Production**: https://www.viney.ca/
- **Repository**: https://github.com/oviney/blog
- **Actions**: https://github.com/oviney/blog/actions
- **Dashboard**: https://oviney.github.io/blog/dashboard/

---

**Last updated**: April 2026
