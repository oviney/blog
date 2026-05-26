# SPEC — Expand Memory Discipline guardrails to remaining 4 subagents (#997)

**Status:** Draft — auto-approved per /goal directive (mechanical fan-out of #990 shape)
**Issue:** [#997](https://github.com/oviney/blog/issues/997)
**Labels:** `agent:qa-gatekeeper`
**Date:** 2026-05-26
**Lifecycle phase:** DEFINE
**Spawned from:** PR [#998](https://github.com/oviney/blog/pull/998) (closed #990) /ship review.

---

## 1. Situation

PR #998 added `## Memory Discipline` sections to `code-reviewer.md` and `security-auditor.md`. The other 4 — `test-engineer.md`, `playwright-test-planner.md`, `playwright-test-generator.md`, `playwright-test-healer.md` — were deferred per SPEC #990 §11.

State on `main` post-#998 (`d05b514e`):
- All 6 subagents declare `memory: project` in frontmatter (from #991)
- 2 of 6 have prose-body `## Memory Discipline` guardrails (from #998)
- **4 of 6 are armed but unguarded** — the asymmetry this PR resolves

Why the 4 matter:
- `test-engineer` reads CI logs that often contain tokens, internal URLs, hostnames, session IDs from third-party runners
- `playwright-test-planner` works with page-structure inventories that may include admin URL paths
- `playwright-test-generator` generates spec files that quote real selectors and sample data
- `playwright-test-healer` debugs failing tests using log output that can include cookies, tokens, stack traces

---

## 2. Objective

Add a `## Memory Discipline` section to each of the 4 remaining subagent prose bodies, mirroring #998's structure: positive framing → bulleted forbidden list (≥3 examples) → storage-context closer. Inserted between role intro and first framework section. No frontmatter changes. No new files.

---

## 3. Design Decisions (auto-confirmed 2026-05-26)

| Decision | Choice | Rationale |
|---|---|---|
| Scope | **All 4 remaining subagents** | Closes the asymmetric state from #998. |
| Section structure | **Identical to #998** | Same 3-paragraph shape; pattern validated by 2 prior /ship rounds. |
| Section placement | **Top-of-body, after role intro, before first framework section** | Identical to #998. |
| Per-agent forbidden lists | **4 bullets per file, agent-specific** | Matches #998. Lists in §7. |
| Per-agent positive framing | **3-5 concrete categories per agent, citing repo-specific examples** | Operational specificity; not boilerplate. |
| Storage-context closer | **Match #998**: code-reviewer-style ("grep-able") for 3 agents; security-auditor-style ("Audit before write") for `playwright-test-healer` (failure logs are genuinely sensitive) | Consistency, with one agent escalated. |
| Frontmatter | **Untouched** | `memory: project` + `tools`/`model`/`color` keys stay. |

---

## 4. Acceptance Criteria

- [ ] **AC-1** Each of the 4 target files contains a new `## Memory Discipline` section between role intro and first framework section.
- [ ] **AC-2** `grep -c "^## Memory Discipline" .claude/agents/*.md` returns **6** post-merge.
- [ ] **AC-3** "Never persist to memory" present in each new section (6 total across all agents).
- [ ] **AC-4** ≥3 bulleted forbidden examples per new section (4 in practice).
- [ ] **AC-5** Positive framing ("Use it for...") with ≥2 concrete categories per section.
- [ ] **AC-6** No frontmatter changes on any of the 4 target files.
- [ ] **AC-7** No edits to `code-reviewer.md` or `security-auditor.md` (out of scope).
- [ ] **AC-8** `bundle exec jekyll build` exits 0.
- [ ] **AC-9** Scope boundary: 9 files total in `git diff --name-only main...HEAD`.
- [ ] **AC-10** No protected file or governance surface touched.

---

## 5. Commands

```bash
bundle exec jekyll build                                          # AC-8 (move worktrees aside first)
grep -c "^## Memory Discipline" .claude/agents/*.md               # AC-2 → 6
grep -c "Never persist to memory" .claude/agents/*.md             # AC-3 → 6
for f in test-engineer playwright-test-planner playwright-test-generator playwright-test-healer; do
  grep -A 6 "Never persist to memory" .claude/agents/$f.md | grep -c "^- "  # AC-4 → 4 each
done
git diff --name-only main...HEAD | wc -l                          # AC-9 → 9
```

---

## 6. Project Structure (touched files)

```
.claude/agents/test-engineer.md                M
.claude/agents/playwright-test-planner.md      M
.claude/agents/playwright-test-generator.md    M
.claude/agents/playwright-test-healer.md       M
SPEC.md                                        M
tasks/plan.md                                  M
tasks/todo.md                                  M
tasks/archive/2026-05-26-memory-guardrails-990/  A   (2 files)
```

**Total:** 4 substantive + 3 lifecycle + 2 archive = **9 files**.

---

## 7. Per-agent wording (final form)

### test-engineer.md

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for the repo's CI and test-suite knowledge that compounds across sessions: the flake catalog (which spec on which viewport with which root cause), the relationship between CI shard naming and Playwright spec grouping, the rationale for `--no-watch` on the Jekyll dev server, and the known-environmental `worktrees/` build pollution.

**Never persist to memory:**

- CI logs containing auth tokens, OAuth credentials, or session IDs from third-party runners
- Specific incident timelines or post-mortem details for individual failures (the flake *pattern* generalises; the incident timeline does not)
- Vendor-side log lines from third-party services (BackstopJS, Pa11y, Lighthouse) containing internal hostnames or API endpoints
- The verbatim failure output of any one test run

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`), not synced anywhere. Treat what you persist as if it were grep-able by anyone with shell access to that machine.
```

### playwright-test-planner.md

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for the repo's page-structure inventory that compounds across sessions: the blog's pages (homepage, post, blog index, search, topic), viewport breakpoints (375 / 768 / 1024), the convention that test plans live in `specs/`, and the relationship between plan files and generator seed files.

**Never persist to memory:**

- Internal URL paths that are admin-only or unreleased
- Customer or staff names appearing in test-plan reference material
- Specific session IDs, cookies, or auth tokens from real browser sessions during planning
- The verbatim contents of any in-flight feature spec the plan references

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`), not synced anywhere. Treat what you persist as if it were grep-able by anyone with shell access to that machine.
```

### playwright-test-generator.md

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for the repo's spec-authoring conventions that compound across sessions: spec-file naming (`tests/playwright-agents/<topic>.spec.ts`), locator preferences (semantic over CSS, `getByRole` over `locator`), `.first()` / `.nth()` usage rationale, and the convention that ARIA snapshots are inline template literals.

**Never persist to memory:**

- Real customer data or names, even from anonymised fixtures
- Locator strings that include real session IDs, CSRF tokens, or one-shot URLs
- Generated spec contents containing pre-merge code or unreleased page structures
- Specific failing-spec snippets seen while drafting new tests

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`), not synced anywhere. Treat what you persist as if it were grep-able by anyone with shell access to that machine.
```

### playwright-test-healer.md

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for the repo's flake catalog and remediation recipes that compound across sessions: common flake patterns (network idle waits, race conditions in modal close), remediation recipes (the `aria-live` region race fixed by `waitForLoadState('networkidle')`), and the rule about element-scoped vs page-level snapshots established by #947.

**Never persist to memory:**

- Per-spec failure logs containing tokens, cookies, or session IDs
- Debug output from `expect(page).toHaveScreenshot()` failures that include URL params
- Stack traces with internal hostnames or vendor-side endpoint details
- The verbatim contents of any one failing test fixture

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`), not synced anywhere. Anything you persist is grep-able by anyone with shell access to that machine. Audit before write.
```

`playwright-test-healer.md` uses the stronger "Audit before write" closer (mirroring security-auditor in #998) because failure logs are the most directly leak-prone surface of the four.

---

## 8. Testing Strategy

Static grep checks per file; Ruby YAML for frontmatter parse; Jekyll build for compilation. No fixture tests (no behavioural surface). Same posture as #990.

---

## 9. Boundaries

**Always:** insert section after role intro, use §7 wording verbatim, run AC battery before commit.
**Ask first about:** material wording changes, section placement, scope expansion to a 7th file.
**Never:** touch `code-reviewer.md` / `security-auditor.md` (out of scope), modify any frontmatter, touch protected files or governance surfaces.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Soft enforcement only | Same as #998 — local storage + perms (perms tracked in #995) |
| Cross-file bullet leakage | Visual inspection during build phase |
| Phantom `build` + 1-reviewer block | Admin-merge per precedent |
| Local `bundle exec jekyll build` flakes | Move `worktrees/` aside before AC-8 |

---

## 11. Out of Scope

- User-global subagents
- Runtime enforcement (`memory_redact:`)
- Auditing existing memory files
- Frontmatter edits
- Scope-guard rule for prose-body changes (forward-looking)
- `AGENTS.md` / governance surface changes
