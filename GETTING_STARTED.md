# Getting Started

This guide covers local setup, running tests, and deploying changes to the blog at https://www.viney.ca/.

## Prerequisites

- **Ruby 3.3** — install via [rbenv](https://github.com/rbenv/rbenv) (`rbenv install 3.3.6`)
- **Bundler** — `gem install bundler`
- **Node.js 18+** — install via [nvm](https://github.com/nvm-sh/nvm)
- **Git**

## Local Setup

```bash
# Clone the repository
git clone https://github.com/oviney/blog.git
cd blog

# Install Ruby dependencies
bundle install

# Install Node.js dependencies
npm install
```

## Running the Site Locally

```bash
bundle exec jekyll serve --livereload
```

Visit http://localhost:4000 in your browser. The site auto-reloads on file changes.

> **Note**: If you encounter SSL errors related to remote themes, the pre-commit hook handles this gracefully. You can still commit and rely on GitHub Actions for full builds.

### Development config

Use `_config_dev.yml` to override settings for local development:

```bash
bundle exec jekyll serve --config _config.yml,_config_dev.yml --livereload
```

## Running Tests

Tests require the Jekyll server to be running on port 4000 first.

```bash
# Start the server (in a separate terminal)
bundle exec jekyll serve

# Run all tests
npm test

# Run individual test suites
npm run test:visual          # Visual regression (BackstopJS)
npm run test:a11y            # Accessibility (pa11y-ci, WCAG 2.1 AA)
npm run test:lighthouse      # Performance/SEO (Lighthouse CI)
npm run test:playwright      # Playwright end-to-end tests
npm run test:security        # Security audit (npm audit)
```

### First-time visual baseline

Before running visual regression tests for the first time, generate reference screenshots:

```bash
npm run test:visual:reference
```

## Pre-commit Hook

A pre-commit hook runs automatically on `git commit`. It validates Jekyll builds for content changes and skips the build for docs-only changes. No setup is required — the hook is included in the repository.

## Deploying Changes

Push to `main` to trigger an automatic deployment:

```bash
git add .
git commit -m "your message"
git push origin main
```

GitHub Actions builds and deploys to GitHub Pages within ~1–2 minutes. Monitor progress at https://github.com/oviney/blog/actions.

### Publishing a new article

```bash
# Create the post file
touch _posts/YYYY-MM-DD-article-slug.md

# Add front matter and content, then commit
git add _posts/YYYY-MM-DD-article-slug.md
git commit -m "Publish: Article title"
git push origin main
```

## Feature Branch Workflow

All bug fixes and new features should use feature branches and Pull Requests — never commit directly to `main`.

```bash
git checkout -b fix/issue-description
# make changes
git push origin fix/issue-description
# open a Pull Request on GitHub
```

## Useful Links

- **Production site**: https://www.viney.ca/
- **GitHub Actions**: https://github.com/oviney/blog/actions
- **Healing dashboard**: https://oviney.github.io/blog/dashboard/
- **Architecture overview**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Full documentation**: [docs/](docs/)
