---
description: 'Jekyll blog post conventions for front matter, categories, writing style, SEO, and image paths.'
applyTo: "_posts/**/*.md,_drafts/**/*.md"
---

# Jekyll Blog Post Conventions

## Required Front Matter

```yaml
---
layout: post
title: "Title in Title Case"
date: YYYY-MM-DD
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [tag1, tag2]
image: /assets/images/post-slug.png
---
```

## Categories (use exactly one)

- `Quality Engineering` — QE strategy, testing practices, quality metrics
- `Software Engineering` — development practices, architecture, AI in development
- `Test Automation` — automation frameworks, self-healing tests, CI/CD
- `Security` — cybersecurity, network security, compliance

## File Naming

- Posts: `YYYY-MM-DD-slug-with-hyphens.md`
- Images: `/assets/images/slug-matching-post.png`
- Charts: `/assets/charts/slug-matching-post.png`

## Image Paths

- Featured image: `/assets/images/<post-slug>.png`
- If no featured image, the template falls back to `/assets/images/blog-default.svg`
- Do not inline base64 images — always reference `/assets/images/` paths

## Writing Style

- **Voice**: Professional, analytical, data-driven — inspired by The Economist
- **Structure**: Lead with the key insight, support with data, conclude with implications
- **Length**: 800–1500 words (4–7 min read)
- **Tone**: Authoritative but accessible; define jargon before using it
- **Citations**: Include specific data points with sources

## SEO Checklist

- Title under 60 characters
- Meta description via excerpt (first paragraph, under 160 chars)
- One H1 (the title), logical H2/H3 hierarchy
- Image with descriptive alt text
- Internal links to related posts where natural
- Category and tags set correctly

## Validation

After creating or editing a post, confirm the build succeeds:

```bash
bundle exec jekyll build
```

- Post appears in `_site/` with correct URL
- Images load (verify paths)
- No Liquid template errors in build output
- Front matter YAML is valid
