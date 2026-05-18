# Development Workflow

This repository is the working source for the viney.ca publication site. Use this workflow when changing posts, layouts, styles, scripts, tests, or contributor docs in `oviney/blog`.

## 1. Install dependencies

```bash
bundle install
npm install
```

## 2. Run the site locally

Use the development config for local work:

```bash
bundle exec jekyll serve --config _config.yml,_config_dev.yml --livereload
```

The site is served at http://localhost:4000.

## 3. Make a focused change

Work on a feature branch and keep the diff scoped to the issue you are solving.

```bash
git checkout -b docs/short-description
```

Examples:

- `docs/issue-963-repo-boundary`
- `fix/post-slug-date`
- `feat/mobile-bottom-nav`

## 4. Run the canonical validations

Before opening or updating a PR, run:

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

Browser-facing tests expect the Jekyll server to be running on port 4000.

## 5. Commit and push

```bash
git add <files>
git commit -m "docs: concise description"
git push origin docs/short-description
```

Open a Pull Request after pushing. Do not treat direct pushes to `main` as the normal contributor workflow.

## 6. Let CI validate the PR

GitHub Actions is the source of truth for repository validation:

- `test-build.yml` checks the Jekyll build
- `test-quality.yml` runs quality, accessibility, performance, and security checks
- `jekyll.yml` deploys the site after merge to `main`

Monitor runs at <https://github.com/oviney/blog/actions>.

## 7. Merge and deploy

Once the PR is reviewed and merged, the deployment workflow publishes the site to GitHub Pages. Verify the published result on <https://www.viney.ca/> when the workflow completes.

## Governance-surface changes

If a PR intentionally changes `.github/skills/` or `.github/instructions/`, mirror the labeled CI path locally:

```bash
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```

Those PRs must also carry the `governance-update` label on GitHub.

## Pre-commit hook

The repository pre-commit hook is useful early feedback, especially for content changes, but it does not replace the full validation commands above.

## Troubleshooting

### `bundle exec jekyll build` fails because a gem is missing

Run:

```bash
bundle install
```

Then rerun the build.

### GitHub Actions fails

1. Open <https://github.com/oviney/blog/actions>
2. Inspect the failing workflow
3. Fix the issue on your branch
4. Push again to rerun CI

### Scope guard fails

Check whether the PR:

- touches a protected file
- changes too many files
- needs the `governance-update` label flow for governance surfaces

## Related docs

- [README.md](../README.md)
- [GETTING_STARTED.md](../GETTING_STARTED.md)
- [AGENTS.md](../AGENTS.md)
- [CLAUDE.md](../CLAUDE.md)
