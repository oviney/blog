# SPEC — Fix 21 broken internal Markdown links in archived task artifacts (#970)

**Status:** Draft — auto-approved per /goal directive
**Issue:** [#970](https://github.com/oviney/blog/issues/970) (P2:medium, doc-debt)
**Labels:** `agent:qa-gatekeeper`, **`bulk-content`** (>15 files; atomic doc-audit cleanup)
**Date:** 2026-05-26
**Branch:** `fix/970-broken-archive-links`

---

## 1. Situation

`scripts/doc-audit.sh` reports 21 broken internal Markdown links across 18 files under `tasks/archive/*/`. All targets are in archived lifecycle artifacts (plan.md, todo.md, body files, archived SPEC.md files) — the audit issue #970 is auto-filed.

Pattern breakdown:

| Pattern | Count | Cause |
|---|---|---|
| `../SPEC.md` from archived plan/todo/followup | 15 | Was correct when active (`tasks/<live>/plan.md` → `tasks/../SPEC.md`); broken now under `tasks/archive/<name>/plan.md` (resolves to `tasks/SPEC.md`, missing) |
| `../../actions/workflows/research-sweep.yml` | 2 | Missing `.github/` prefix in relative path |
| `/2026/99/99/no-such-post/` | 2 | Deliberate test-data URL in link-validator/plan.md (intentional broken example) |
| `tasks/archive/2026-05-14-research-sweep-902/SPEC.md` (from `943/SPEC.md`) | 1 | Wrong relative path (resolves into 943's subtree) |
| `tasks/lessons.md` (from `943/SPEC.md`) | 1 | Wrong relative path (same root cause) |

---

## 2. Objective

Fix all 21 broken links. The 18 archive files are frozen-in-time records; references should point to stable targets or be converted to plain text where no stable target exists. Single PR with `bulk-content` label because the audit only closes when all links resolve; per-file fixes don't independently move the needle.

---

## 3. Design Decisions (auto-confirmed)

| Decision | Choice | Rationale |
|---|---|---|
| `../SPEC.md` fix | **Convert to plain text** (`**Spec:** [../SPEC.md](../SPEC.md)` → `**Spec:** _(archived)_`) | Repo-root `SPEC.md` is the *current* working spec (constantly changing); pointing archived plans at a moving target is incorrect. Plain text preserves the "this was a spec'd PR" semantic without a misleading link. |
| Workflow path fix | **`../../actions/workflows/research-sweep.yml` → `../../../.github/workflows/research-sweep.yml`** | From `tasks/archive/<dir>/`, `../../..` reaches repo root, then `.github/workflows/`. |
| `no-such-post` fix | **Escape as inline code** (`/2026/99/99/no-such-post/` → `` `/2026/99/99/no-such-post/` ``) | Deliberate test data in link-validator plan; backtick-escaped, audit skips inline code spans (per `scripts/doc-audit.sh` heuristics — to verify). Alternative: convert to plain text. |
| Cross-archive ref fix | **Use correct relative path** (`tasks/archive/2026-05-14-research-sweep-902/SPEC.md` → `../2026-05-14-research-sweep-902/SPEC.md`) | From `tasks/archive/2026-05-17-research-sweep-943/SPEC.md`, sibling archive dir is one level up. |
| `tasks/lessons.md` fix | **`tasks/lessons.md` → `../../lessons.md`** | Same root cause; correct relative path. |
| Label | **`bulk-content`** | 23 files (18 archive + 5 lifecycle) > 15-file cap. Atomic cleanup: audit only closes when all 21 fix. Per CLAUDE.md: "Atomic content backfills … where splitting would create a worse intermediate `main` state" — fits. |
| Scope | All 18 archive files in this PR | Splitting would leave the audit issue open with N stragglers; pattern is uniform mechanical. |

---

## 4. Acceptance Criteria

- [ ] **AC-1** All 21 broken links resolved per §3 patterns.
- [ ] **AC-2** `bash scripts/doc-audit.sh` reports no internal-Markdown-link findings (or the issue is auto-closed by the next audit run).
- [ ] **AC-3** Per-pattern verification:
  - `grep -r '\.\./SPEC\.md' tasks/archive/` returns 0 matches (15 → 0)
  - `grep -r '\.\./\.\./actions/workflows/' tasks/archive/` returns 0 matches (2 → 0)
  - `grep -r 'tasks/archive/2026-05-14-research-sweep-902/SPEC\.md' tasks/archive/2026-05-17-research-sweep-943/` returns 0 (1 → 0)
- [ ] **AC-4** `bundle exec jekyll build` exits 0.
- [ ] **AC-5** PR carries `bulk-content` + `agent:qa-gatekeeper` labels.
- [ ] **AC-6** Scope: 18 substantive (archive files) + 3 lifecycle + 2 archive carry-over (#952) = **23 files**. Above 15-file cap; `bulk-content` label exempts.
- [ ] **AC-7** No protected file or governance surface touched (`.claude/agents/`, `.github/skills/`, `.github/instructions/`, etc.).
- [ ] **AC-8** No archive *content* edited — only the link text. Frozen-in-time records stay frozen in everything except broken-link text.

---

## 5. Commands

```bash
bundle exec jekyll build                                          # AC-4
grep -r '\.\./SPEC\.md' tasks/archive/ | wc -l                    # AC-3 → 0 expected
grep -r '\.\./\.\./actions/workflows/' tasks/archive/ | wc -l     # AC-3 → 0 expected
git diff --name-only main...HEAD | wc -l                          # AC-6 → 23
```

---

## 6. Project Structure

```
tasks/archive/2026-05-10-link-validator/plan.md                          M
tasks/archive/2026-05-14-research-sweep-902/902-body.md                  M
tasks/archive/2026-05-14-research-sweep-902/902-followups-plan.md        M
tasks/archive/2026-05-14-research-sweep-902/902-followups.md             M
tasks/archive/2026-05-14-research-sweep-902/plan.md                      M
tasks/archive/2026-05-14-research-sweep-902/todo.md                      M
tasks/archive/2026-05-17-bulk-content-956/plan.md                        M
tasks/archive/2026-05-17-bulk-content-956/todo.md                        M
tasks/archive/2026-05-17-puppeteer-chrome-cache-958/plan.md              M
tasks/archive/2026-05-17-puppeteer-chrome-cache-958/todo.md              M
tasks/archive/2026-05-17-research-sweep-943/943-body.md                  M
tasks/archive/2026-05-17-research-sweep-943/943-followups-plan.md        M
tasks/archive/2026-05-17-research-sweep-943/943-followups.md             M
tasks/archive/2026-05-17-research-sweep-943/SPEC.md                      M
tasks/archive/2026-05-17-research-sweep-943/plan.md                      M
tasks/archive/2026-05-17-research-sweep-943/todo.md                      M
tasks/archive/2026-05-17-subtitle-backfill-951/plan.md                   M
tasks/archive/2026-05-17-subtitle-backfill-951/todo.md                   M
SPEC.md                                                                  M
tasks/plan.md                                                            M
tasks/todo.md                                                            M
tasks/archive/2026-05-26-skill-refs-952/{plan,todo}.md                   A (2 files)
```

**Total: 23 files.**

---

## 7. Code Style

- **Plain-text replacement style**: `**Spec:** _(archived)_` — italic to mark "this was a link but the target no longer applies."
- **Inline code escape style**: backticks around the URL. `` `/2026/99/99/no-such-post/` ``
- **Relative path fixes**: use the shortest correct relative path from each file.
- **Don't reflow surrounding content** — only the broken link line changes.

---

## 8. Boundaries

**Never:** modify archive content beyond the broken-link lines (these are frozen records); touch any protected file or governance surface.
**Always:** apply the per-pattern fix per §3; verify with `grep` + audit script before commit.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Audit script regex changes: backtick-escape doesn't actually skip inline code | Verify by running `bash scripts/doc-audit.sh` post-fix; if backticks still trip the audit, convert `/2026/99/99/no-such-post/` to plain text instead |
| `bulk-content` label not respected by scope guard | #989 anchored the `bulk-content` grep along with the other two labels; this PR tests that path |
| Frozen-archive content drift if someone reviews the diff strictly | The fixes are minimal — only the link text changes |
| Phantom `build` + 1-reviewer block | Admin-merge per precedent |

---

## 10. Out of Scope

- The `_posts/` broken-link warnings shown by the pre-commit hook (different audit, different scope, separate issue if filed)
- Refactoring archive directory naming / structure
- Adding a CI gate that prevents future `../SPEC.md` references in archived plans
- Touching the active (non-archived) lifecycle artifacts
