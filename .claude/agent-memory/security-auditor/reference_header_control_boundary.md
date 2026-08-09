---
name: header-control-boundary
description: Site is GitHub Pages (www.viney.ca) — no response-header control, so CSP/HSTS/X-Frame-Options findings are structurally unfixable in-repo; only meta-equiv CSP is available
metadata:
  type: reference
---

The blog deploys via `actions/deploy-pages` in `.github/workflows/jekyll.yml` to
GitHub Pages, custom domain `www.viney.ca` (see `CNAME`).

**Standing consequence:** GitHub Pages does not let you set custom HTTP response
headers. There is no `_headers`, `netlify.toml`, `vercel.json`, or
`staticwebapp.config.json` in this repo, and there never can be a useful one.
As of the 2026-08-02 audit there is also no `<meta http-equiv="Content-Security-Policy">`
anywhere in the layouts.

**How to apply:**
- Do NOT report "missing CSP / HSTS / X-Frame-Options / Referrer-Policy" as a
  finding on ordinary PRs. It is a pre-existing platform boundary, not a
  regression, and no PR touching content or styles can fix it. Reporting it
  repeatedly is noise that trains the maintainer to skim audits.
- The *only* in-repo lever is a `<meta http-equiv="Content-Security-Policy">` tag
  in the head include. If a CSP is ever genuinely wanted, that is the one real
  proposal to make — and it is a deliberate project, not an audit drive-by.
- HSTS is served by GitHub Pages itself for custom domains with HTTPS enforced;
  verify at the edge rather than looking for it in the repo.

Related: [[css-orphan-grep-antipattern]]
