---
name: Editorial Chief - Content & Publishing
description: Content creation, blog post writing, SEO optimization, and editorial standards
version: 1.0.0
triggers:
  - Write or edit a blog post
  - SEO improvements needed
  - Content review or proofreading
  - Documentation writing or cleanup
---

## Context

The Editorial Chief maintains content quality across the blog. This includes writing blog posts, editing documentation, ensuring SEO best practices, and maintaining the Economist editorial voice.

**Production URL**: https://www.viney.ca
**Content Directory**: `_posts/`
**Drafts Directory**: `_drafts/`

## Blog Post Standards

### Front Matter (required)

```yaml
---
layout: post
title: "Title in Title Case"
date: YYYY-MM-DD
author: "Ouray Viney"
categories: ["Quality Engineering"]  # One of: Quality Engineering, Software Engineering, Test Automation, Security
tags: [tag1, tag2]
image: /assets/images/post-slug.png
---
```

### Categories (use exactly one)

- `Quality Engineering` — QE strategy, testing practices, quality metrics
- `Software Engineering` — development practices, architecture, AI in development
- `Test Automation` — automation frameworks, self-healing tests, CI/CD
- `Security` — cybersecurity, network security, compliance

### Writing Style

- **Voice**: Professional, analytical, data-driven — inspired by The Economist
- **Structure**: Lead with the key insight, support with data, conclude with implications
- **Length**: 800-1500 words (4-7 min read)
- **Citations**: Include specific data points with sources
- **Tone**: Authoritative but accessible, avoid jargon without explanation

### SEO Checklist

- [ ] Title under 60 characters
- [ ] Meta description via excerpt (first paragraph, under 160 chars)
- [ ] One H1 (the title), logical H2/H3 hierarchy
- [ ] Image with descriptive alt text
- [ ] Internal links to related posts where natural
- [ ] Category and tags set correctly

## Documentation Standards

### When editing docs (not blog posts)

- Be concise — remove filler words
- Lead with what the reader needs to do, not background
- Use code blocks for commands and file paths
- Keep files focused — one topic per file
- Update version numbers in front matter when editing skill files

### Documentation cleanup rules

- **Delete** files that document completed one-time tasks (migrations, setup)
- **Update** files that have outdated information but are still useful
- **Keep** files that define active standards, conventions, or workflows
- Anything deleted is preserved in git history — don't hesitate to remove stale docs

## File Naming

- Posts: `YYYY-MM-DD-slug-with-hyphens.md`
- Images: `/assets/images/slug-matching-post.png`
- Charts: `/assets/charts/slug-matching-post.png`

## Validation

After creating or editing content:

```bash
bundle exec jekyll build
```

Check that:
- Post appears in `_site/` with correct URL
- Images load (check paths)
- No Liquid template errors in build output
- Front matter YAML is valid

## Version History

- **1.0.0** (2026-04-04): Initial skill creation — editorial standards, blog post conventions, documentation guidelines
