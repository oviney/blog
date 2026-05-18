# Ouray's Tech Blog

[![Deploy Jekyll site to Pages](https://github.com/oviney/blog/actions/workflows/jekyll.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/jekyll.yml)
[![Test Jekyll Build](https://github.com/oviney/blog/actions/workflows/test-build.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-build.yml)
[![Quality Tests](https://github.com/oviney/blog/actions/workflows/test-quality.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-quality.yml)
[![Healing Monitor](https://github.com/oviney/blog/actions/workflows/healing-monitor.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/healing-monitor.yml)
[![Security Audit](https://github.com/oviney/blog/actions/workflows/test-quality.yml/badge.svg)](https://github.com/oviney/blog/actions/workflows/test-quality.yml)

![Healing Success](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/oviney/blog/main/.github/badges/healing-success.json)
![Healing Trend](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/oviney/blog/main/.github/badges/healing-trend.json)

This repository is the publication and site source for [viney.ca](https://www.viney.ca): posts, layouts, styling, assets, search data, scripts, and the GitHub Actions workflows that validate and deploy the site.

The blog publishes software engineering commentary on quality, test automation, security, and AI in an Economist-inspired editorial style.

## What lives here

- Jekyll source for the production site
- Published posts and supporting page content
- Custom Economist-inspired theme assets and layouts
- QA, accessibility, performance, and security automation for the site
- Contributor and governance docs for working safely in this repository

## Quick start

```bash
bundle install
npm install
bundle exec jekyll serve --config _config.yml,_config_dev.yml
```

Visit http://localhost:4000 after the server starts.

## Local validation

Run the canonical site build before opening a PR:

```bash
bundle exec jekyll build
bash scripts/check-pr-scope.sh
```

Run additional existing repo checks as needed for your change:

```bash
npm run test:playwright
npm run test:a11y
npm run test:lighthouse
npm run test:security
```

If a PR intentionally changes `.github/skills/` or `.github/instructions/`, mirror CI locally with:

```bash
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```

## Publishing workflow

Use a feature branch and Pull Request for changes to this repository.

```bash
git checkout -b docs/short-description
git add <files>
git commit -m "docs: concise description"
git push origin docs/short-description
```

After the PR is merged to `main`, GitHub Actions builds and deploys the site to GitHub Pages.

## CI/CD at a glance

- `test-build.yml` validates the Jekyll build
- `test-quality.yml` runs QA, accessibility, performance, and security checks
- `jekyll.yml` deploys the site after changes land on `main`
- Workflow runs are visible at <https://github.com/oviney/blog/actions>

## Project structure

```text
_posts/          Blog articles
_layouts/        Site layouts
_includes/       Reusable Liquid partials
_sass/           Theme styles
assets/          Images, CSS, charts, and JS
docs/            Contributor and operational documentation
scripts/         Repo automation and guardrails
.github/workflows/ CI and deploy workflows
```

## Related docs

- [GETTING_STARTED.md](GETTING_STARTED.md)
- [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
- [AGENTS.md](AGENTS.md)
- [CLAUDE.md](CLAUDE.md)

For the external AI content-generation pipeline that feeds this site, see [oviney/economist-agents](https://github.com/oviney/economist-agents).
