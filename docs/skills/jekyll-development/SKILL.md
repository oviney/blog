---
name: Jekyll Development Workflow
description: Complete workflow for developing, testing, and deploying Jekyll blog changes
version: 1.0.0
triggers:
  - Making content changes (posts, pages)
  - Modifying layouts or styles
  - Updating configuration
  - Need to verify changes before deployment
---

## Context

This blog uses Jekyll 4.3.2 with a custom Economist-inspired theme, deployed via GitHub Actions to GitHub Pages. The workflow is optimized to avoid local server issues (SSL, remote theme fetching) by relying on pre-commit validation and GitHub Actions for builds.

**Environment**:
- Jekyll 4.3.2
- Ruby 3.3 (via rbenv)
- Custom Economist theme (`_sass/economist-theme.scss`)
- GitHub Actions for CI/CD
- Pre-commit hook for validation

## Step-by-Step Instructions

### 1. Make Changes

Edit the relevant files:
- **Content**: `_posts/YYYY-MM-DD-title.md`, `*.md` pages
- **Styles**: `_sass/economist-theme.scss`
- **Layouts**: `_layouts/*.html`
- **Config**: `_config.yml` (requires server restart if testing locally)

### 2. Test Locally (Optional)

For CSS/layout work requiring rapid iteration:

```bash
cd /Users/ouray.viney/code/economist-blog-v5
bundle update --bundler  # If needed
bundle install
bundle exec jekyll serve --config _config_dev.yml --livereload
```

**URL**: http://localhost:4000/

**Note**: Config changes require full server restart (Ctrl+C, then restart).

### 3. Commit Changes

```bash
git add <files>
git commit -m "description"
```

**Pre-commit hook automatically validates**:
- ✅ Jekyll build succeeds
- ✅ No broken internal links
- ✅ YAML front matter is valid
- ✅ Required fields present (title, date)
- ✅ Future date warnings

**If validation fails**: Fix the issue before committing. Never use `--no-verify`.

### 4. Push to GitHub

```bash
git push origin main
```

### 5. Monitor Deployment

- GitHub Actions builds with Jekyll 4.3.2 (~45 seconds)
- Deploys to GitHub Pages (~30 seconds)
- **Total**: 1-2 minutes
- **Monitor**: https://github.com/oviney/blog/actions

### 6. Verify Production

- Visit https://www.viney.ca/
- Check the specific page/post you modified
- Verify responsive design (mobile, tablet, desktop)
- Check browser console for errors

## Common Pitfalls

### Pitfall 1: Config Changes Don't Reload
**Problem**: Changed `_config.yml` but changes not visible with `jekyll serve`  
**Solution**: Stop server (Ctrl+C) and restart. Config changes require full restart.  
**Note**: CSS/content changes auto-reload, but config does not.

### Pitfall 2: Pre-commit Hook Fails on SSL Error
**Problem**: Remote theme fetching fails with SSL certificate error  
**Solution**: This is expected. The hook is smart enough to skip this error. If Jekyll build fails for other reasons, fix those.  
**Note**: GitHub Actions has no SSL issues—production builds always work.

### Pitfall 3: Forgot to Test Responsive Design
**Problem**: Looks good on desktop but broken on mobile  
**Solution**: Always test at multiple breakpoints (320px, 768px, 1024px, 1920px)  
**Tool**: Browser DevTools responsive mode

### Pitfall 4: Bypassing Pre-commit Hook
**Problem**: Used `git commit --no-verify` to skip failing checks  
**Solution**: NEVER bypass checks. Fix the underlying issue. Pre-commit hooks prevent broken deployments.

### Pitfall 5: Hardcoded Values in SCSS
**Problem**: Used magic numbers like `16px`, `#E3120B` directly in styles  
**Solution**: Use variables from `_sass/economist-theme.scss` (e.g., `$economist-red`, `$spacing-unit`)

## Code Snippets/Patterns

### Starting Local Server

```bash
cd /Users/ouray.viney/code/economist-blog-v5
bundle exec jekyll serve --config _config_dev.yml --livereload
```

**When to use**: CSS/layout work requiring rapid iteration  
**Notes**: Config changes require restart; content/CSS auto-reloads

### Committing Changes

```bash
git add <files>
git commit -m "feat: add new blog post about X"
# Pre-commit hook runs automatically
git push origin main
```

**When to use**: Every code change  
**Notes**: Use conventional commit format (feat, fix, docs, style, refactor, test, chore)

### Emergency Bypass (Use Sparingly)

```bash
git commit --no-verify -m "Emergency fix"
```

**When to use**: ONLY in genuine emergencies (production down)  
**Notes**: Document why bypass was needed in commit message

### Manual Pre-commit Test

```bash
.git/hooks/pre-commit
```

**When to use**: Testing hook behavior without committing  
**Notes**: Useful for debugging hook issues

## Related Files

- [`docs/DEVELOPMENT_WORKFLOW.md`](../DEVELOPMENT_WORKFLOW.md) - Full workflow documentation
- [`docs/conventions/testing.md`](../conventions/testing.md) - Testing conventions
- [`.git/hooks/pre-commit`](../../.git/hooks/pre-commit) - Pre-commit validation script
- [`.github/workflows/jekyll.yml`](../../.github/workflows/jekyll.yml) - CI/CD pipeline
- [`_config_dev.yml`](../../_config_dev.yml) - Development config overrides

## Success Criteria

- [ ] Changes committed successfully (pre-commit hook passed)
- [ ] GitHub Actions build succeeded
- [ ] Changes visible on production (https://www.viney.ca/)
- [ ] No console errors in browser
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] No visual regressions on other pages

## Version History

- **1.0.0** (2026-01-05): Initial skill creation from DEVELOPMENT_WORKFLOW.md
