# TODO — Backfill `subtitle:` Front-Matter + Validator (#951)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
**Plan SHA:** `f56c219` · 24 posts (8 with `summary:`, 16 without)

---

## Phase 1 — Validator (RED setup)
- [x] **T1** Extended `validate-post-quality.sh` section 12 (subtitle present + length). RED phase verified: 24 missing-subtitle errors on unchanged corpus; 45-word fixture → WARN; 70-word fixture → ERROR. Committed as `6027895`.

## Phase 2 — Editorial backfill
- [x] **T2** Repurposed `summary:` → `subtitle:` on 8 posts; deleted summary lines. Intermediate state: 8 subtitles, 0 summaries, 16 missing-subtitle errors remaining (down from 24).
- [x] **T3** Authored `subtitle:` on 16 remaining posts (description seed → editorial rewrite). AC-3 byte-equality check returned 0 violations across all 24.

## CHECKPOINT-A — User editorial review (PRE-COMMIT GATE)
- [x] All 24 posts have `subtitle:`; 0 have `summary:`
- [x] Validator exit 0 (all 24 pass, no warnings)
- [x] AC-3 byte-equality check clean
- [x] **User approved** after reading all 24 subtitles in the listing

## Phase 2.5 — Code review (added per lifecycle audit)
- [x] **/review** via `code-reviewer` agent — Approve with revisions. One real fix applied: dropped transient SHA reference in section 12 comment (committed as `49b4db9`). Other findings informational (9 subtitles at 29-31 words above 20-28 target but under 40 cap; YAML edge cases verified safe).

## Phase 3 — Verification
- [x] **T4** `bundle exec jekyll build` exits 0 (1.078s); 24/24 rendered post HTML files contain `<h2 class="article-subtitle">`; AC-7 boundary check empty (no `_layouts/_includes/_sass/index.md` touches); validator final pass clean.

## Phase 4 — Ship
- [x] **T5 (commits)** Branch `chore/951-subtitle-backfill` carries 3 commits: T1 validator (6027895), review fix (49b4db9), T2+T3 post edits (29b38ed).
- [ ] **T5 (push + PR)** Push branch; `gh pr create` with repurposed/seeded table.
- [ ] **T5 (CI + merge)** CI green; `gh pr merge --admin --squash --delete-branch`; verify #951 CLOSED.

---

## Acceptance criteria checklist (mirrors SPEC §3)

- [ ] **AC-1** Every post in `_posts/*.md` has `subtitle:` populated
- [ ] **AC-2** Zero posts retain the dead `summary:` field
- [ ] **AC-3** No subtitle is byte-for-byte identical to its post's `description:`
- [ ] **AC-4** Validator: missing subtitle → exit 1; > 60 words → exit 1; 41–60 words → exit 2; ≤ 40 words on full corpus → exit 0
- [ ] **AC-5** Every rendered post HTML shows `<h2 class="article-subtitle">…</h2>`
- [ ] **AC-6** `bundle exec jekyll build` exits 0
- [ ] **AC-7** Zero changes to `_layouts/`, `_includes/`, `_sass/`, `index.md`, or any non-`_posts/` site file (besides the validator script)
- [ ] **AC-8** PR description includes the 24-post repurposed/seeded table + 3 sample subtitles + AC-7 boundary note
