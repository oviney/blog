# Jekyll Theme Migration Log

## Date: December 31, 2025

## Summary
Migrated blog from Cayman theme to Minimal Mistakes v4.27.3, upgrading from Jekyll 3.10.0 (GitHub Pages automatic build) to Jekyll 4.3.2 (GitHub Actions custom workflow).

## Motivation
1. Minimal Mistakes provides professional features (author profiles, TOC, social sharing, related posts)
2. GitHub Pages automatic build restricted to Jekyll 3.10.0 (incompatible with modern themes)
3. Need for better content organization and reader engagement features

## Technical Changes

### 1. Dependency Management

**Gemfile** - Changed from github-pages gem to explicit Jekyll 4.x:

```ruby
# Before (restricted to Jekyll 3.10.0)
gem "github-pages", group: :jekyll_plugins

# After (Jekyll 4.3.2)
gem "jekyll", "~> 4.3.2"

# Added Minimal Mistakes required plugins:
gem "jekyll-include-cache"
gem "jekyll-paginate"
gem "jekyll-sitemap"
gem "jekyll-gist"
gem "jemoji"
gem "jekyll-feed"
gem "jekyll-remote-theme"
gem "jekyll-seo-tag"
```

### 2. Theme Configuration

**_config.yml** - Activated Minimal Mistakes theme:

```yaml
remote_theme: "mmistakes/minimal-mistakes@4.27.3"
minimal_mistakes_skin: "default"

# Plugins
plugins:
  - jekyll-feed
  - jekyll-remote-theme
  - jekyll-seo-tag
  - jekyll-include-cache
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-gist
  - jemoji

# Author configuration
author:
  name: "Ouray Viney"
  bio: "Quality Engineering leader with 20+ years experience in software testing and automation"
  location: "Canada"
  email: "ouray@viney.ca"
  links:
    - label: "GitHub"
      icon: "fab fa-fw fa-github"
      url: "https://github.com/oviney"
    - label: "LinkedIn"
      icon: "fab fa-fw fa-linkedin"
      url: "https://linkedin.com/in/ourayviney"

# Post defaults
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: single
      author_profile: true
      read_time: true
      comments: false
      share: true
      related: true
      toc: true
      toc_sticky: true
```

### 3. Post Front Matter Migration

Updated all posts from `layout: post` to `layout: single`:

```yaml
# Before
---
layout: post
title: "Article Title"
date: 2024-12-31
categories: blog
ai_assisted: true
---

# After
---
layout: single
title: "Article Title"
date: 2024-12-31
categories: blog
author: Ouray Viney
ai_assisted: true
classes: wide
---
```

**Files updated:**
- `_posts/2024-12-31-testing-times.md`
- `_posts/2023-08-09-building-a-test-strategy-that-works.md`
- `_posts/2023-08-08-practical-applications-of-ai-in-software-development.md`
- `_posts/2023-12-28-understanding-opendns-cybersecurity-protection.md`

### 4. GitHub Actions Workflow

Created `.github/workflows/jekyll.yml` to replace GitHub Pages automatic build:

```yaml
name: Deploy Jekyll site to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
          
      - name: Setup Pages
        uses: actions/configure-pages@v5
        
      - name: Build with Jekyll
        run: bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"
        env:
          JEKYLL_ENV: production
          
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

**Key differences from automatic build:**
- Uses Jekyll 4.3.2 instead of 3.10.0
- Full control over build environment (Ruby 3.3, Ubuntu)
- Complete build logs for debugging
- All plugins enabled without restrictions
- Same deployment target (GitHub Pages)

### 5. Automation Configuration

**Playwright MCP Bridge** - Configured for automated browser tasks:

File: `~/Library/Application Support/Code/User/mcp.json`

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--extension"
      ]
    }
  },
  "inputs": []
}
```

The `--extension` flag enables connection to authenticated Chrome browser sessions via Playwright MCP Bridge extension, allowing Copilot to automate GitHub repository settings changes.

## Implementation Timeline

1. **Theme Research** (30 min) - Evaluated Minimal Mistakes, Chirpy, al-folio
2. **First Migration Attempt** (30 min) - Updated config, attempted build with Jekyll 3.x (failed)
3. **Troubleshooting** (1 hour) - Multiple attempts to make MM work with github-pages gem (all failed)
4. **Strategic Pivot** (15 min) - Decided on GitHub Actions approach
5. **Workflow Implementation** (45 min) - Created workflow, updated Gemfile, tested locally
6. **Documentation** (30 min) - Created migration docs and setup guides
7. **Automation Setup** (30 min) - Configured MCP Bridge for repository settings

**Total Time:** ~4 hours (original estimate: 2 hours)

## Lessons Learned

### What Worked Well
✅ Remote theme approach (no need to vendor theme files)  
✅ Incremental testing with `bundle install` before pushing  
✅ Pre-commit validation caught syntax errors  
✅ GitHub Actions provides full control and debugging capability  

### Challenges Encountered
⚠️ Jekyll 3.x incompatibility not immediately obvious  
⚠️ github-pages gem restrictions blocked multiple approaches  
⚠️ Local `jekyll serve` still broken (remote theme SSL issues)  
⚠️ Repository settings require authentication (manual or MCP Bridge needed)  

### Best Practices Established
1. **Always check theme Jekyll version requirements** before starting
2. **GitHub Actions > GitHub Pages automatic build** for modern themes
3. **Pre-commit validation sufficient** for content changes (no local server needed)
4. **MCP Bridge automation** saves time on repetitive GitHub settings changes

## Post-Migration Tasks

### Completed
- [x] Update Gemfile for Jekyll 4.x
- [x] Configure Minimal Mistakes theme
- [x] Migrate post front matter
- [x] Create GitHub Actions workflow
- [x] Configure MCP Bridge for automation
- [x] Document migration process

### Pending
- [ ] Enable GitHub Actions in repository settings (automated via MCP Bridge or manual)
- [ ] Verify first successful GitHub Actions build
- [ ] Confirm Minimal Mistakes theme visible on production
- [ ] Test all theme features (author profile, TOC, sharing, related posts)
- [ ] Close Issue #7: "Enhance Blog with Theme Upgrade"

## Rollback Plan

If issues arise, revert to Cayman theme:

```bash
# Restore github-pages gem
git checkout backup-cayman-theme -- Gemfile
git checkout backup-cayman-theme -- _config.yml
git checkout backup-cayman-theme -- _posts/

# Remove GitHub Actions workflow
rm .github/workflows/jekyll.yml

# Repository settings: Change back to "Deploy from a branch"
# Branch: main, folder: / (root)

# Push changes
git add -A
git commit -m "Rollback to Cayman theme"
git push origin main
```

## References

- [Minimal Mistakes Documentation](https://mmistakes.github.io/minimal-mistakes/)
- [GitHub Actions for Jekyll](https://jekyllrb.com/docs/continuous-integration/github-actions/)
- [Playwright MCP Bridge](https://github.com/microsoft/playwright-mcp)
- [Jekyll 4.x Documentation](https://jekyllrb.com/docs/)

## Future Enhancements

1. **Theme Customization**
   - Custom color scheme matching brand
   - Additional sidebar widgets
   - Footer customization

2. **Content Features**
   - Featured posts carousel
   - Category/tag landing pages
   - Reading time estimates
   - Author bio box on posts

3. **SEO & Analytics**
   - Enhanced structured data
   - Social media preview cards
   - Performance monitoring
   - Search analytics

4. **Automation**
   - Automated theme updates via Dependabot
   - Visual regression testing for theme changes
   - Scheduled builds for time-sensitive content
