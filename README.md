# Ouray's Tech Blog

[![Deploy Jekyll site to Pages](https://github.com/oviney/blog/actions/workflows/jekyll.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/jekyll.yml)
[![Test Jekyll Build](https://github.com/oviney/blog/actions/workflows/test-build.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-build.yml)
[![Quality Tests](https://github.com/oviney/blog/actions/workflows/test-quality.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-quality.yml)

Software engineering insights on quality, testing, and AI - written in The Economist's signature style.

**Theme:** Custom Economist-inspired design system  
**Typography:** Merriweather (serif) + Inter (sans-serif)  
**Build:** Jekyll 4.3.2 via GitHub Actions  
**Deployment:** GitHub Pages

## About

Professional commentary on software quality engineering, test automation, and emerging technologies. 

**Content Generation**: Articles are produced using [economist-agents](https://github.com/oviney/economist-agents), a multi-agent AI system that generates publication-quality content with The Economist's voice.

## Local Development

```bash
# Install Jekyll
bundle install

# Run locally
bundle exec jekyll serve

# Visit http://localhost:4000
```

**Testing Locally:**

```bash
# Install testing dependencies
npm install

# Create baseline screenshots (first time only)
npm run test:visual:reference

# Run visual regression tests
npm run test:visual

# Run accessibility audit
npm run test:a11y

# Run Lighthouse performance/SEO tests
npm run test:lighthouse

# Run security audit
npm run test:security

# Run all tests
npm test
```

**Pre-commit Hook:**
The pre-commit hook automatically validates Jekyll builds before commits. This catches build errors locally before pushing to GitHub.

## Publishing

Content is published via Git:

```bash
git add _posts/new-article.md
git commit -m "Publish: Article title"  
git push origin main
```

GitHub Actions automatically builds and deploys changes to GitHub Pages.

**Build & Deployment:**
- Triggers on push to `main` branch
- Uses Jekyll 4.3.2 with custom Economist theme
- Deployment time: 1-2 minutes
- Monitor progress: https://github.com/oviney/blog/actions

**Quality Gates:**
- ✅ Pre-commit: Jekyll build validation (local)
- ✅ CI: Jekyll build test + HTML validation
- ✅ CI: Visual regression testing (BackstopJS)
- ✅ CI: Accessibility testing (pa11y-ci WCAG 2.1 AA)
- ✅ CI: Performance testing (Lighthouse CI - Performance, SEO, Best Practices)
- ✅ CI: Security audit (npm audit)
- ✅ Deployment: Automated to GitHub Pages

## Custom Theme

The site features a bespoke design system inspired by The Economist:

- **Typography**: Merriweather serif for body text, Inter for UI elements
- **Colors**: The Economist red (#E3120B) for accents, clean blacks and grays
- **Layout**: Red header banner, horizontal navigation, article cards, dark footer
- **Components**: Category breadcrumbs, read time indicators, featured images, related posts
- **Responsive**: Mobile-first design with breakpoints at 768px and 1024px

Theme source: `_sass/economist-theme.scss` (600+ lines)

## Project Structure

```
blog/
├── _posts/          # Blog articles (markdown)
├── _layouts/        # Custom theme layouts (default.html, post.html)
├── _sass/           # Custom Economist theme SCSS  
├── _includes/       # Reusable components
├── assets/          # Images, CSS, charts
├── _config.yml      # Jekyll configuration
└── Gemfile          # Ruby dependencies
```

## Content Generation System

For details on the AI content generation pipeline, see [oviney/economist-agents](https://github.com/oviney/economist-agents).
