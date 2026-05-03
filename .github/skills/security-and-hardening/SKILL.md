---
name: security-and-hardening
description: Hardens oviney/blog against content, dependency, and workflow vulnerabilities. Use when handling untrusted input, external scripts, search data, or CI/CD configuration.
version: 1.0.1
triggers:
  - Editing trust boundaries or untrusted input flows
  - Adding external scripts, APIs, or workflow permissions
  - Reviewing hardening needs for content, dependencies, or automation
---

# Security and Hardening

## Overview

Treat every external input as untrusted, every secret as non-committable, and every new integration as a review point. Even though oviney/blog is a Jekyll site, it still exposes risk through Markdown content, Liquid rendering, JavaScript, workflow permissions, service-worker behavior, and npm dependencies.

## When to Use

- Editing templates, JSON feeds, JavaScript, or search data
- Adding external scripts, embeds, analytics, fonts, or APIs
- Updating workflow or automation guidance
- Reviewing dependency and supply-chain risk
- Writing docs that tell agents how to verify security safely

## Repo Threat Model

Focus first on these surfaces:

1. **Secrets and tokens** in scripts, workflows, or copied examples
2. **Unsafe rendering** in Liquid, JSON generation, or raw HTML/JS snippets
3. **Third-party assets** that add script, tracking, or supply-chain risk
4. **Workflow permissions** and automation that can leak data or widen access
5. **Dependency vulnerabilities** reported by `npm audit`

## Always Do

- Validate untrusted data before rendering it into HTML, JSON, or script contexts
- Prefer escaped or serialized Liquid output, for example:

```liquid
<h2>{{ page.title | escape }}</h2>
<script>
  window.searchIndex = {{ site.data.search | jsonify }};
</script>
```

- Add `rel="noopener noreferrer"` to external links opened in a new tab
- Keep secrets in GitHub Actions secrets or local environment configuration, never in tracked files
- Run the repo audit command before merging security-sensitive work:

```bash
npm run test:security
```

- Rebuild after security-relevant content or template changes:

```bash
bundle exec jekyll build
```

## Ask First

These changes need explicit human review or issue-level approval:

- Introducing a new third-party script, tracker, or hosted widget
- Relaxing workflow permissions or broadening token access
- Changing how search data, service workers, or browser storage handle user data
- Adding auth, file-upload, webhook, or form-processing behavior beyond the current static-site model
- Weakening CSP/header guidance in repo docs or workflows

## Never Do

- Commit real secrets, tokens, private keys, or copied production config
- Recommend wildcard CORS, public secrets, or client-side secret storage as defaults
- Render untrusted input through raw HTML or JavaScript string concatenation
- Treat a third-party snippet as safe just because it is common on blogs
- Silence moderate-or-higher npm audit findings without documentation and human approval

## Review Patterns for This Repo

### Liquid and JSON output

```liquid
{% raw %}
<!-- Better: serialize JSON safely -->
<script type="application/json" id="search-data">
  {{ site.data.navigation | jsonify }}
</script>

<!-- Risky: hand-built JSON or script strings -->
<script>
  const title = "{{ page.title }}";
</script>
{% endraw %}
```

### External links

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External reference
</a>
```

### Dependency posture

Use the repo policy in `SECURITY.md`: moderate-or-higher findings matter, and no new runtime dependency should be added without clear justification.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It is a static site, so security is simple" | Static sites still ship JavaScript, data files, search indexes, and CI automation. |
| "This embed is just content" | Third-party embeds execute trust decisions in the browser. Treat them as code. |
| "The example secret is fake" | Reviewers cannot safely infer that. Never normalize secret-like strings in tracked docs. |
| "npm audit is noisy" | This repo intentionally treats moderate-or-higher findings as meaningful. |

## Red Flags

- Raw Liquid output inserted into JSON or `<script>` without serialization
- External links with `target="_blank"` but no `rel` protection
- Workflow examples showing secrets inline
- New third-party scripts added without a trust review
- Security docs recommending commands or tools the repo does not actually run

## Verification

After security-relevant work:

- [ ] `npm run test:security` completed
- [ ] `bundle exec jekyll build` passed if rendered output changed
- [ ] No secrets or secret-like examples were introduced
- [ ] Untrusted data is escaped or serialized safely
- [ ] External `_blank` links include `rel="noopener noreferrer"`
- [ ] Any workflow or integration change reflects the repo's current security policy

## Related Files

- [`../../../SECURITY.md`](../../../SECURITY.md) — repo security policy and audit threshold
- [`../../../references/security-checklist.md`](../../../references/security-checklist.md) — quick review checklist
- [`../../../package.json`](../../../package.json) — `test:security` command definition
