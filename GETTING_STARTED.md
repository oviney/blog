# Getting Started

This guide covers local setup, validation, and the standard Pull Request workflow for changes to https://www.viney.ca/.

## Prerequisites

- **Ruby 3.3** — install via [rbenv](https://github.com/rbenv/rbenv) (`rbenv install 3.3.6`)
- **Bundler** — `gem install bundler`
- **Node.js 20+** — install via [nvm](https://github.com/nvm-sh/nvm)
- **Git**

## Local setup

```bash
git clone https://github.com/oviney/blog.git
cd blog
bundle install
npm install
```

## Run the site locally

Use the development config so local-only settings stay out of production:

```bash
bundle exec jekyll serve --config _config.yml,_config_dev.yml --livereload
```

Visit http://localhost:4000 after the server starts.

## Validate your changes

Run the canonical build before opening a PR:

```bash
bundle exec jekyll build
bash scripts/check-pr-scope.sh
```

Run the existing repo QA commands that match your change:

```bash
npm run test:playwright
npm run test:a11y
npm run test:lighthouse
npm run test:security
```

If you need the full browser-facing suite, keep the Jekyll server running on port 4000 in a separate terminal.

## Pre-commit hook

The repository includes a pre-commit hook that validates Jekyll builds for content changes and skips the build for docs-only changes. Treat it as an early warning, not a replacement for the full commands above.

## Standard workflow

All non-trivial changes should ship through a feature branch and Pull Request.

```bash
git checkout -b docs/short-description
# make changes
git add <files>
git commit -m "docs: concise description"
git push origin docs/short-description
```

Open a PR after pushing, then let GitHub Actions run the repo checks. Once the PR is merged to `main`, the site deploys automatically to GitHub Pages.

## Publishing a new article

Create new posts on a branch, not directly on `main`:

```bash
touch _posts/YYYY-MM-DD-article-slug.md
git checkout -b post/article-slug
git add _posts/YYYY-MM-DD-article-slug.md
git commit -m "docs: add article slug"
git push origin post/article-slug
```

## Governance-surface PRs

If your PR intentionally changes `.github/skills/` or `.github/instructions/`, run the scope guard with the governance label mirrored locally:

```bash
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```

Those PRs must also carry the `governance-update` label on GitHub.

## Useful links

- **Production site**: https://www.viney.ca/
- **GitHub Actions**: https://github.com/oviney/blog/actions
- **Development workflow**: [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
- **Architecture overview**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Full documentation**: [docs/](docs/)
