# SPEC — Memory-write guardrails for code-reviewer and security-auditor (#990)

**Status:** Draft — awaiting approval
**Issue:** [#990](https://github.com/oviney/blog/issues/990)
**Labels:** `agent:qa-gatekeeper`
**Date:** 2026-05-25
**Lifecycle phase:** DEFINE
**Spawned from:** PR [#991](https://github.com/oviney/blog/pull/991) (closed #945) /ship parallel review — both `code-reviewer` and `security-auditor` independently flagged the absence of memory-write guardrails as a Critical-but-deferred / MEDIUM-advisory finding.

---

## 1. Situation

PR #991 (closed #945) added `memory: project` frontmatter to all 6 subagent definitions in `.claude/agents/`. The mechanism enables Claude Code's per-subagent persistent markdown store, scoped to this repo on this host. The mechanism is now **armed but unguarded**.

Two of the six agents are most likely to encounter sensitive content in the course of their normal work:

- `code-reviewer` reads PR diffs that may contain pre-merge tokens, debugging credentials, unreleased code, internal URLs, fix-for-CVE patch contents, or customer PII appearing in issue-body excerpts.
- `security-auditor` is **explicitly tasked with finding secrets** — without a guardrail, a naive "remember what you saw" memory write could pickle a discovered API token into the persistent file. Ironic and harmful.

The other 4 agents (`test-engineer`, `playwright-test-planner/generator/healer`) work primarily with Playwright spec shapes, locators, viewport conventions, and flake catalogs — lower-sensitivity surface, deferred to a separate follow-up if appetite arises.

Memory file storage details (verified during #991 /ship):
- Path: `~/.claude/projects/<project-slug>/memory/` (or adjacent), `drwx------` (mode 700)
- Local-only by default; no remote sync unless the user opts in
- Persists across sessions until manually purged

The cross-cutting concern is **what NOT to persist**, not what to persist (which the agents self-curate). This PR adds explicit forbidden-content guidance to the two highest-sensitivity prose bodies.

---

## 2. Objective

Add a `## Memory Discipline` section to the prose body of `.claude/agents/code-reviewer.md` and `.claude/agents/security-auditor.md`, placed immediately after the role intro paragraph and before the existing first framework section (Review Framework / Threat Model). Each section:

1. Names what kind of repo-wide knowledge the agent IS expected to persist (a positive framing — memory has value)
2. Lists explicit forbidden content categories with at least 3 examples
3. Notes the storage location and threat model in one sentence (so the agent understands the stakes without being told to second-guess every write)

No frontmatter changes. No edits to the other 4 subagents. No new files.

---

## 3. Design Decisions (confirmed 2026-05-25)

| Decision | Choice | Rationale |
|---|---|---|
| Scope | **Only `code-reviewer.md` + `security-auditor.md`** | Issue #990 explicitly scopes here. Other 4 agents have lower-sensitivity surface; deferred. |
| Section heading | **`## Memory Discipline`** | Meta-rule framing — names the *practice*, not the *prohibition*. Parallel to "Output Format" already in both files. |
| Section placement | **Between role intro paragraph and first framework section** | Top-of-body placement; mirrors `set -euo pipefail` discipline-at-the-top convention. Maximally discoverable; ensures any agent reading the prose top-down hits it before any review/audit instruction. |
| Section structure | **3 paragraphs** — (a) what to persist, (b) what NOT to persist with examples, (c) storage context | Positive framing first prevents the agent from over-rejecting all memory writes. Negative framing with examples gives concrete rules. Storage context grounds the why. |
| Forbidden-content examples | **At least 3 explicit categories per file**, agent-specific | Per issue AC. code-reviewer focuses on PR-diff content; security-auditor focuses on finding artefacts. |
| Tone | **Imperative, second-person ("you")** matching existing prose voice | Consistent with the rest of the agent body. |
| Frontmatter | **Untouched** | Already done by #991. |
| Other 4 agents | **Untouched** | Out of scope; separate issue if needed. |

---

## 4. Acceptance Criteria

- [ ] **AC-1** `.claude/agents/code-reviewer.md` contains a new `## Memory Discipline` section between the role intro paragraph (currently lines 7–9) and `## Review Framework` (currently line 11).
- [ ] **AC-2** `.claude/agents/security-auditor.md` contains a new `## Memory Discipline` section between the role intro paragraph (currently lines 7–9) and `## Threat Model for This Blog` (currently line 11).
- [ ] **AC-3** Each new section contains the phrase **"Never persist to memory"** (exact substring, case-sensitive). `grep -c "Never persist to memory" .claude/agents/{code-reviewer,security-auditor}.md` returns 1 per file.
- [ ] **AC-4** Each new section names at least **3 explicit examples** of forbidden content categories, agent-specific:
  - **code-reviewer:** examples include (at minimum) PR-diff tokens/secrets, unreleased code excerpts, internal URLs or credentials
  - **security-auditor:** examples include (at minimum) discovered secrets/tokens, dependency CVE details from in-flight advisories, internal threat-intel sources
- [ ] **AC-5** Each new section also names at least **2 things the agent SHOULD persist** (positive framing — prevents over-rejection). Examples for code-reviewer: review patterns, recurring PR-history pitfalls. Examples for security-auditor: threat-model boundaries, governance-surface conventions.
- [ ] **AC-6** No frontmatter changes (`git diff main...HEAD -- .claude/agents/{code-reviewer,security-auditor}.md` shows zero changes within the `---` fences).
- [ ] **AC-7** No edits to the other 4 subagents (`test-engineer.md`, `playwright-test-planner.md`, `playwright-test-generator.md`, `playwright-test-healer.md`).
- [ ] **AC-8** `bundle exec jekyll build` exits 0.
- [ ] **AC-9** Scope-guard boundary: `git diff --name-only main...HEAD` returns exactly 2 substantive (`code-reviewer.md`, `security-auditor.md`) + 3 lifecycle (`SPEC.md`, `tasks/plan.md`, `tasks/todo.md`) + 2 archive carry-over (`tasks/archive/2026-05-25-subagent-memory-945/{plan,todo}.md`) = **7 files**. Well under the 15-file scope-explosion cap (no `bulk-content` label needed).
- [ ] **AC-10** No protected file (`_config.yml`, `Gemfile*`, `AGENTS.md`, `ARCHITECTURE.md`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`) and no governance surface (`.github/skills/`, `.github/instructions/`) touched. `.claude/agents/` is **not** in `PROTECTED_FILES` per `scripts/check-pr-scope.sh` — no label exemption needed.

---

## 5. Commands

```bash
# Validation
bundle exec jekyll build                                              # AC-8
grep -c "Never persist to memory" .claude/agents/code-reviewer.md      # AC-3 — expect 1
grep -c "Never persist to memory" .claude/agents/security-auditor.md   # AC-3 — expect 1
grep -c "^## Memory Discipline" .claude/agents/code-reviewer.md        # AC-1 — expect 1
grep -c "^## Memory Discipline" .claude/agents/security-auditor.md     # AC-2 — expect 1

# Frontmatter unchanged (AC-6)
awk '/^---$/{f=!f;next} !f && /memory: project/' .claude/agents/code-reviewer.md     # frontmatter region: line still present
awk '/^---$/{f=!f;next} f' .claude/agents/code-reviewer.md | diff - <(git show main:.claude/agents/code-reviewer.md | awk '/^---$/{f=!f;next} f')  # frontmatter region: byte-identical to main

# Scope
git diff --name-only main...HEAD | wc -l                              # AC-9 — expect 7
```

---

## 6. Project Structure (touched files)

```
.claude/agents/code-reviewer.md           M   + ## Memory Discipline section (~10 lines after role intro)
.claude/agents/security-auditor.md        M   + ## Memory Discipline section (~10 lines after role intro)
SPEC.md                                   M   This file
tasks/plan.md                             M   #990 plan
tasks/todo.md                             M   #990 todo
tasks/archive/2026-05-25-subagent-memory-945/  A   Carry-over: archived #945 plan + todo (2 files)
```

**Total scope:** 2 substantive + 3 lifecycle + 2 archive carry-over = **7 files**.

---

## 7. Code Style

- **Markdown style** — `## Memory Discipline` H2 heading; no emoji. Body uses second-person imperative voice ("You may persist..."; "Never persist..."). Matches existing prose voice in both files.
- **No reflow of unchanged sections** — only the new section is inserted; surrounding content stays byte-identical.
- **Forbidden-content list style** — short bulleted list, one example per line, no parenthetical clauses. Reads as a quick-reference checklist.
- **One paragraph per concern** — what-to-persist (1 paragraph), what-NOT-to-persist (1 paragraph + bullet list), storage-context (1 sentence).
- **Section length cap** — ~10–15 lines per new section. The guardrail should be obvious but not dominate the file.

### Proposed wording (final form in plan.md)

**code-reviewer.md:**

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for repo-wide
review patterns that compound across sessions: this repo's `has_label()`
helper convention, the scope-guard rule numbering, recurring PR-history
pitfalls (e.g. the case-collision artifact on `SECURITY.md` ↔ `security.md`),
and frontmatter conventions that catch reviewers off guard.

**Never persist to memory:**

- Secrets, API tokens, or credentials seen in any PR diff
- Unreleased code excerpts or fix-for-CVE patch contents
- Customer PII or internal URLs / email addresses that appear in issue
  bodies
- The specific content of any one PR you reviewed (review *patterns*
  generalise; specific diffs do not)

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`),
not synced anywhere. Treat what you persist as if it were grep-able by
anyone with shell access to that machine.
```

**security-auditor.md:**

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for the repo's
threat model that compounds across sessions: governance-surface boundaries
(`.github/skills/`, `.github/instructions/`), protected-file rules,
dependency hygiene posture, recurring antipatterns (e.g. the substring-
match label-grep antipattern closed by #987), and supply-chain assumptions.

**Never persist to memory:**

- Any string you would flag as a finding (tokens, keys, credentials)
- Dependency-CVE specifics from in-flight advisories that haven't published
- Internal threat-intel sources, vendor contacts, or incident details
- Customer PII appearing in any reviewed surface

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`),
not synced anywhere. Anything you persist is grep-able by anyone with shell
access to that machine. Audit before write.
```

---

## 8. Testing Strategy

| Layer | Check |
|---|---|
| Static | `grep -c "^## Memory Discipline"` returns 1 per file (AC-1, AC-2) |
| Static | `grep -c "Never persist to memory"` returns 1 per file (AC-3) |
| Static | At least 3 bulleted forbidden-content examples per section (AC-4) — visual inspection / line-count via `awk` between `^Never persist` and next blank line |
| Static | Frontmatter byte-identical to `main` (AC-6) |
| Static | The other 4 agents unchanged (AC-7) |
| Build | `bundle exec jekyll build` exits 0 (AC-8) |
| Scope | `git diff --name-only main...HEAD | wc -l` → 7 (AC-9) |

No fixture tests — this is a metadata/documentation change. No new behavioural surface to test. The "test" for whether the agent actually honours the guardrail is the next time it's invoked and chooses what to write to memory — which is unobservable from CI.

---

## 9. Boundaries

**Always:**
- Insert `## Memory Discipline` as a top-of-body section (after role intro, before first framework).
- Use second-person imperative voice consistent with existing prose.
- Include at least 3 explicit forbidden-content examples per section.
- Include positive framing (what TO persist) to prevent over-rejection.
- Match the proposed wording in §7 as a starting point; minor wording polish is fine.
- Run AC battery before commit.

**Ask first about:**
- Expanding scope to the other 4 subagents (per Decision §3 currently No).
- Adding guardrails to non-prose surfaces (frontmatter notes, separate docs file).
- Material wording changes to the proposed §7 templates.
- Section placement other than top-of-body.

**Never:**
- Modify frontmatter on either file (`memory: project` line stays).
- Reorder existing sections (`## Review Framework`, `## Threat Model`, `## Output Format`, etc. retain positions).
- Touch the other 4 subagents (`test-engineer.md`, `playwright-test-*.md`).
- Touch any protected file or governance surface.
- Add new files outside `tasks/`.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| The agent ignores the guardrail and writes a secret anyway | Soft enforcement — instruction-only, no runtime enforcement. Storage is local-only + 700 perms; user can audit memory files manually. Future Claude Code may add a `memory_redact:` field for hard enforcement (Watch item from #902). |
| Wording is too restrictive and the agent persists nothing | Positive framing in §7 ("Use it for...") explicitly names categories the agent SHOULD persist. AC-5 requires this. |
| Section placement disrupts existing structure | Inserted as a new section, no reorder. Diff confined to additive hunks; existing sections byte-identical post-insertion (AC-6, AC-7). |
| `## Memory Discipline` heading collides with an existing heading | Verified: neither file has any `## Memory*` heading today. Safe. |
| Reviewer asks for the same guardrails on other 4 agents | Filed as out-of-scope follow-up if asked; SPEC §3 cites the rationale. |
| Phantom `build` + 1-reviewer block | Yes — recurring. Admin-merge per precedent. |
| `bundle exec jekyll build` flakes on local `worktrees/` pollution | Recurring; move `worktrees/` aside before AC-8 verification. |

---

## 11. Out of Scope

Per issue #990:

- Memory-write guardrails for `test-engineer.md`, `playwright-test-planner.md`, `playwright-test-generator.md`, `playwright-test-healer.md` — lower-sensitivity surface, file separately if appetite arises.
- A scope-guard rule (`scripts/check-pr-scope.sh`) that flags PRs modifying `.claude/agents/*.md` prose bodies as `governance-update`-equivalent. Security-auditor flagged this as a forward-looking concern but out of scope here.
- Auditing existing memory files for already-persisted secrets — none exist yet (this is the first session after #991 merged).
- Runtime enforcement of the guardrail (e.g. a `memory_redact:` frontmatter field) — Watch item from #902, awaits Claude Code feature support.
- Frontmatter edits — done by #991, unchanged here.
- Adding new subagents or removing existing ones.
- `AGENTS.md` / governance surface changes.
