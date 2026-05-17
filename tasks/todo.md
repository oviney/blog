# TODO — Backfill `subtitle:` Front-Matter + Validator (#951)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Plan SHA:** `f56c219` · 24 posts (8 with `summary:`, 16 without)

---

## Phase 1 — Validator (RED setup)
- [ ] **T1** Extend `scripts/validate-post-quality.sh` with section 5 (subtitle present + length); update header comment. RED-phase verification: script exits 1 with 24 "missing subtitle" errors; sanity-test 45-word (WARN) and 70-word (ERROR) fixtures. Commit on branch as separate commit before T2.

## Phase 2 — Editorial backfill
- [ ] **T2** Repurpose `summary:` → `subtitle:` on 8 posts; delete the `summary:` line on each. Verify: 8 posts with subtitle, 0 with summary, validator error count drops to 16.
- [ ] **T3** Author `subtitle:` on remaining 16 posts (description seed → editorial rewrite per SPEC §6 style guide). Verify: all 24 have subtitle; AC-3 byte-equality check (subtitle ≠ description) clean.

## CHECKPOINT-A — User editorial review (PRE-COMMIT GATE)
- [ ] All 24 posts have `subtitle:`; 0 have `summary:`
- [ ] Validator exit 0 (or 2 with only intentional word-count warnings)
- [ ] AC-3 byte-equality check clean
- [ ] **User reads every drafted subtitle, approves or amends** — this is the editorial gate

## Phase 3 — Verification
- [ ] **T4** `bundle exec jekyll build` clean; every rendered post HTML has `<h2 class="article-subtitle">`; AC-7 boundary check (`git diff --stat _layouts/ _includes/ _sass/ index.md` empty); validator final pass.

## Phase 4 — Ship
- [ ] **T5** Branch `chore/951-subtitle-backfill`; two commits (validator first, then post edits); push; `gh pr create` with table mapping each post to repurposed/seeded; CI passes; `gh pr merge --admin --squash --delete-branch`; verify #951 CLOSED.

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
