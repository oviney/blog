---
name: code-review
description: '5-axis code review framework for all agents. Use when reviewing PRs, evaluating code quality, or providing structured review feedback.'
version: 1.0.0
triggers:
  - Reviewing a pull request
  - Evaluating code quality
  - Providing structured review feedback
  - Assessing changes before merge
---

## Context

Every agent — Copilot, Codex, Gemini, Claude — must apply this 5-axis framework when reviewing code changes. The framework ensures consistent, thorough reviews regardless of which agent performs the review or which domain the change belongs to.

Adapted from the addyosmani/agent-skills code-review pattern.

**Applies to**: All agents (Creative Director, QA Gatekeeper, Editorial Chief, General Agent)

## The 5-Axis Review Framework

Every code review must evaluate changes across five axes. Score each axis as **Pass**, **Needs Work**, or **Fail**, then provide an overall verdict.

### Axis 1 — Correctness

Does the code do what it claims to do?

- [ ] Logic matches the stated intent (issue description, PR title)
- [ ] Edge cases are handled (empty inputs, boundary values, missing data)
- [ ] No regressions introduced to existing behaviour
- [ ] Error handling is present and appropriate
- [ ] Build passes (`bundle exec jekyll build`)

**Common issues in this repo:**
- Liquid template errors from malformed YAML front matter
- Broken internal links after renaming or moving files
- Missing image assets referenced in post front matter

### Axis 2 — Readability

Can another developer (or agent) understand this code quickly?

- [ ] Naming is clear and consistent with surrounding code
- [ ] Complex logic has explanatory comments
- [ ] Functions/blocks are small and focused
- [ ] Code follows existing patterns in the file and repo
- [ ] No unnecessary abstractions or indirection

**Common issues in this repo:**
- SCSS selectors nested more than 3 levels deep
- Shell scripts missing `set -euo pipefail`
- Inconsistent variable naming between adjacent files

### Axis 3 — Architecture

Does the change fit the system's structure?

- [ ] Change is in the correct file/directory for its domain
- [ ] No scope creep — only files related to the issue are modified
- [ ] Protected files are not touched (`_config.yml`, `Gemfile`, `.github/CODEOWNERS`)
- [ ] Agent scope rules are respected (see `AGENTS.md`)
- [ ] No new dependencies without explicit justification

**Common issues in this repo:**
- Editing files outside the assigned agent's scope
- Adding functionality that belongs in a different skill domain
- Introducing coupling between unrelated components

### Axis 4 — Security

Does the change avoid introducing vulnerabilities?

- [ ] No secrets or credentials committed
- [ ] External links use `rel="noopener"` or `rel="noreferrer"` when opening in new tabs
- [ ] User-supplied data is escaped or sanitized
- [ ] Dependencies are free of known vulnerabilities
- [ ] No `eval()` or dynamic code execution from untrusted input

**Common issues in this repo:**
- Missing `rel="noopener"` on external links with `target="_blank"`
- Unescaped Liquid template variables in HTML output
- Outdated npm dependencies with known CVEs

### Axis 5 — Performance

Does the change avoid unnecessary resource consumption?

- [ ] No redundant DOM queries or layout thrashing in JS
- [ ] Images are optimised (correct format, reasonable size)
- [ ] CSS changes don't introduce expensive selectors (e.g., universal selectors in deeply nested contexts)
- [ ] No blocking synchronous operations where async is available
- [ ] Build/CI time is not significantly increased

**Common issues in this repo:**
- Large unoptimised images in `/assets/images/`
- Overly broad CSS selectors that force full-page reflow
- Playwright tests without `waitForLoadState` causing flakiness

## Review Output Format

Use this template when writing a review:

```markdown
## Code Review — 5-Axis Assessment

| Axis | Verdict | Notes |
|------|---------|-------|
| Correctness | ✅ Pass | Logic matches issue #N; build passes |
| Readability | ✅ Pass | Follows existing SCSS patterns |
| Architecture | ⚠️ Needs Work | File X is outside agent scope |
| Security | ✅ Pass | No external inputs; links have rel="noopener" |
| Performance | ✅ Pass | No new assets; CSS selectors are scoped |

**Overall: Approve / Request Changes / Comment**

### Details

(Expand on any axis scored "Needs Work" or "Fail" with specific line references and suggested fixes.)
```

### Verdict Rules

| Condition | Overall verdict |
|-----------|----------------|
| All 5 axes pass | **Approve** |
| Any axis needs work (none fail) | **Request Changes** with clear action items |
| Any axis fails | **Request Changes** — block merge until resolved |

## Applying the Framework

### Before reviewing

1. Read the linked issue to understand the intent
2. Check the PR label to identify which agent authored the change
3. Review the file list to confirm scope alignment

### During review

4. Walk through each axis in order
5. Note specific files and line numbers for any findings
6. Distinguish blocking issues (Fail) from improvement suggestions (Needs Work)

### After review

7. Post the 5-axis table as the review summary
8. If requesting changes, list exactly what must be fixed before re-review
9. If approving, confirm all 5 axes pass

## Common Pitfalls

### Pitfall 1: Skipping axes that seem irrelevant
**Problem**: A "docs-only" PR skips the Security axis, missing a committed secret in a code block example.
**Solution**: Always evaluate all 5 axes. Mark an axis as "Pass — N/A" only if the axis genuinely cannot apply (e.g., Performance for a CHANGELOG update).

### Pitfall 2: Inconsistent severity
**Problem**: One reviewer marks missing comments as "Fail" while another marks a broken build as "Needs Work".
**Solution**: Use the definitions strictly — "Fail" means the code is incorrect or unsafe; "Needs Work" means it could be improved but is not broken.

### Pitfall 3: Reviewing beyond the diff
**Problem**: Reviewer flags pre-existing issues in unchanged code, inflating the review scope.
**Solution**: Only evaluate code within the PR diff. If you spot pre-existing issues, open a separate issue instead.

## Related Files

- [`AGENTS.md`](../../../AGENTS.md) — agent roster and scope rules
- [`.github/skills/_template/SKILL.md`](../_template/SKILL.md) — skill file template
- [`scripts/check-pr-scope.sh`](../../../scripts/check-pr-scope.sh) — automated scope validation
- [`scripts/eval-agent-pr.sh`](../../../scripts/eval-agent-pr.sh) — PR quality rubric scoring

## Success Criteria

- [ ] Review covers all 5 axes (correctness, readability, architecture, security, performance)
- [ ] Each axis has a clear Pass / Needs Work / Fail verdict
- [ ] Blocking issues cite specific files and line numbers
- [ ] Overall verdict follows the verdict rules table
- [ ] Pre-existing issues are filed as separate issues, not included in the review

## Version History

- **1.0.0** (2026-04-12): Initial skill creation — 5-axis review framework adapted from addyosmani/agent-skills
