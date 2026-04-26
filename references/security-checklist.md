# Security Checklist

Quick reference for security review on oviney/blog. Use alongside `security-and-hardening` and `code-review-and-quality`.

## Pre-Commit Checks

- [ ] No secrets or token-like strings added to docs, scripts, or examples
- [ ] `npm run test:security` completed for dependency-sensitive changes
- [ ] `bundle exec jekyll build` completed if templates, Markdown, or JSON output changed
- [ ] `bash scripts/check-pr-scope.sh` (or the governance variant) completed before PR handoff

## Content and Rendering Safety

- [ ] Untrusted content is escaped in Liquid output (`escape`, `jsonify`, or equivalent safe serialization)
- [ ] No hand-built JSON strings where `jsonify` should be used
- [ ] Raw HTML or inline JavaScript was not added without clear review
- [ ] External links opened in a new tab include `rel="noopener noreferrer"`
- [ ] Search or feed data does not expose more information than intended

## Dependency and Supply Chain

- [ ] No new dependency was added without explicit justification
- [ ] Moderate-or-higher audit findings were reviewed, not ignored
- [ ] Third-party scripts, embeds, fonts, or analytics were treated as trust decisions
- [ ] Workflow docs do not encourage downloading or executing unverified code

## Workflow and Automation

- [ ] Secrets stay in GitHub or local environment configuration, not tracked files
- [ ] Automation examples do not paste real secret values
- [ ] Governance docs keep the `governance-update` label flow accurate when needed
- [ ] CI or script instructions do not recommend unsupported commands

## Review Prompts

Ask before merging:

- Does this change expose new data in HTML, JSON, or browser storage?
- Does it trust external content, scripts, or embeds more than before?
- Does any example normalize unsafe behavior that a contributor might copy?
- Would `SECURITY.md` still agree with this guidance?

## Useful Commands

```bash
npm run test:security
bundle exec jekyll build
bash scripts/check-pr-scope.sh
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```
