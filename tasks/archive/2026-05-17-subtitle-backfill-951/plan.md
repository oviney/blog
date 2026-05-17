# Plan — Backfill `subtitle:` Front-Matter + Validator (#951)

**Spec:** [SPEC.md](../SPEC.md)
**Issue:** [#951](https://github.com/oviney/blog/issues/951)
**Date:** 2026-05-17
**Lifecycle phase:** PLAN
**Plan SHA:** `f56c219`
**Validator insertion point:** section "5. Subtitle" between the existing "4. SEO description" (line 155+) and whatever currently sits at the next numbered check in `scripts/validate-post-quality.sh`.

---

## Context

24 posts, 0 with `subtitle:`. Of those:
- **8 posts** already carry a dead `summary:` field — its text is repurposable as the subtitle seed.
- **16 posts** have no summary; subtitle is authored fresh from `description:` (rewritten to standfirst voice).

Validator extension is small (~20 lines) and isolated. **TDD applies cleanly:** extend the validator first (RED — all 24 posts fail the new check), then backfill posts in two passes (GREEN). Spec's AC-3 — "no subtitle is byte-for-byte identical to its post's `description:`" — is the AC the validator does **not** check; that one is held by editorial judgment + CHECKPOINT-A review.

---

## Dependency graph

```
T1 (extend validator → RED: 24/24 fail)
  │
  ▼
T2 (backfill 8 summary→subtitle posts; remove summary lines)
  │
  ▼
T3 (backfill 16 description→subtitle posts; fresh editorial work)
  │
  ▼
CHECKPOINT-A — user reviews all 24 drafted subtitles
  │
  ▼
T4 (full verification: validator green, jekyll build, AC-7 boundary check)
  │
  ▼
T5 (branch + commit + PR + CI + admin-merge → close #951)
```

T2 and T3 are technically independent (different post sets) but sequencing T2 first lets the 8 existing summary lines calibrate editorial voice for T3's fresh authoring. Recommendation: serial T2 → T3.

---

## Phase 1 — Validator (RED)

### T1 — Extend `scripts/validate-post-quality.sh` with subtitle check

**ACs satisfied:** AC-4 (validator behaviour)
**Touches:** `scripts/validate-post-quality.sh`

**Steps:**

1. Add a new numbered check `5. Subtitle: present, ≤ 40 words (warning), ≤ 60 words (error)` after the existing `4. SEO description` check (around line 175).
2. Use the existing `fm_value "$post" "subtitle"` helper. Increment `ERRORS` for missing or > 60 words; increment `WARNINGS` for 41–60 words.
3. Update the script's header comment (the `# Validates ...` block) to add the new check to the documented list.

**Snippet (pattern after the existing description block):**

```bash
# 5. Subtitle — present and length-bounded   [ERROR / WARNING]
subtitle_val=$(fm_value "$post" "subtitle")
if [[ -z "$subtitle_val" ]]; then
  echo "❌  $rel — missing required front-matter: subtitle"
  ERRORS=$((ERRORS + 1))
  post_errors=$((post_errors + 1))
else
  wc_words=$(echo "$subtitle_val" | wc -w | tr -d ' ')
  if [[ $wc_words -gt 60 ]]; then
    echo "❌  $rel — subtitle exceeds 60 words ($wc_words words)"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  elif [[ $wc_words -gt 40 ]]; then
    echo "⚠️   $rel — subtitle exceeds soft cap of 40 words ($wc_words words)"
    WARNINGS=$((WARNINGS + 1))
  fi
fi
```

**Verify (RED phase — the test is the script's exit code against the unchanged corpus):**

- `bash scripts/validate-post-quality.sh; echo $?` → expect `1`
- Output shows 24 lines of `❌  <post> — missing required front-matter: subtitle`
- Sanity-test the warning band: temporarily add a 45-word subtitle to one post, re-run → expect that post's check to **warn** (not error). Restore.
- Sanity-test the hard cap: temporarily add a 70-word subtitle to one post, re-run → expect that post's check to **error**. Restore.

T1 is its own commit (validator change is reviewable on its own).

---

## Phase 2 — Editorial backfill

### T2 — Repurpose `summary:` → `subtitle:` on 8 posts

**ACs satisfied:** AC-1 (partial 8/24), AC-2 (full)
**Touches:** 8 files in `_posts/*.md` (the ones with a `summary:` line)

**Steps:**

1. Identify the 8 posts: `grep -l "^summary:" _posts/*.md`.
2. For each post:
   - Read the `summary:` text.
   - If it already reads as a standfirst (~25 words, declarative, not clickbait, not identical to title): copy verbatim into a new `subtitle:` line placed directly under `title:`.
   - If it needs polishing: lightly rewrite for SPEC §6 voice while staying close to the original meaning.
   - Delete the `summary:` line entirely.
3. Spot-check each by running `fm_value` mentally: post should now have `subtitle:` and no `summary:`.

**Verify (intermediate GREEN — 8/24):**

- `grep -l "^subtitle:" _posts/*.md | wc -l` → 8
- `grep -l "^summary:" _posts/*.md | wc -l` → 0
- `bash scripts/validate-post-quality.sh; echo $?` → still 1, but error count drops from 24 to 16

---

### T3 — Author `subtitle:` on 16 posts (description seed → editorial rewrite)

**ACs satisfied:** AC-1 (remaining 16/24), AC-3 (no byte-identical subtitle/description)
**Touches:** 16 files in `_posts/*.md` (the ones without `summary:`)

**Steps:**

1. Identify the 16: `comm -23 <(ls _posts/*.md | sort) <(grep -l "^subtitle:" _posts/*.md | sort)`.
2. For each post:
   - Read the existing `title:`, `description:`, and the opening paragraph of the body.
   - Author a subtitle: declarative, 20–28 words target, not byte-for-byte identical to `description:`, follows SPEC §6 style guide.
   - Place `subtitle:` immediately under `title:`.
3. After all 16 are drafted, run a byte-equality check across all 24 posts to enforce AC-3:
   ```bash
   for f in _posts/*.md; do
     s=$(fm_value "$f" subtitle); d=$(fm_value "$f" description)
     if [[ -n "$s" && "$s" == "$d" ]]; then echo "AC-3 VIOLATION: $f"; fi
   done
   ```
   Expect zero output.

**Verify (intermediate GREEN — 24/24):**

- `grep -L "^subtitle:" _posts/*.md` → empty
- `bash scripts/validate-post-quality.sh; echo $?` → 0 (or 2 if any 41–60 word warnings; acceptable)
- AC-3 byte-equality check returns no violations.

---

### CHECKPOINT-A — User editorial review

**Gate criteria (all must be true before T4):**

- [ ] All 24 posts have a `subtitle:` field; 0 have `summary:`.
- [ ] Validator output is exit 0 (preferred) or exit 2 with only word-count warnings the author intentionally accepted.
- [ ] AC-3 byte-equality check is clean.
- [ ] User has read every drafted subtitle and approves or amends. **This is the editorial gate** — `agent:editorial-chief` work should not ship without an editorial pass.

Specific things for user to review at CHECKPOINT-A:
- Voice consistency across 24 (do they read like the same author?)
- No subtitles that just paraphrase the title without adding payoff
- No clickbait phrasing or first-person pronouns
- Calibration against the 8 repurposed-from-summary subtitles as the tonal anchor

---

## Phase 3 — Verification

### T4 — Full build + boundary verification

**ACs satisfied:** AC-5, AC-6, AC-7
**Touches:** none (read-only verification)

**Steps:**

1. `bundle exec jekyll build` → exit 0; capture build time for the PR.
2. Verify `<h2 class="article-subtitle">` renders for every post:
   ```bash
   for d in _site/20*/*/; do
     html=$(ls "$d"*.html 2>/dev/null | head -1)
     [ -z "$html" ] && continue
     grep -q 'class="article-subtitle"' "$html" || echo "MISSING SUBTITLE IN RENDER: $html"
   done
   ```
   Expect zero "MISSING" output.
3. Enforce AC-7 (no templates touched):
   ```bash
   git diff --stat _layouts/ _includes/ _sass/ index.md
   ```
   Expect empty.
4. Final validator pass: `bash scripts/validate-post-quality.sh; echo $?` → 0 (or 2 with only intentional warnings).

---

## Phase 4 — Ship

### T5 — Branch + commit + PR + CI + admin-merge

**ACs satisfied:** AC-8 (PR description structure)
**Touches:** git remote, GitHub PR.

**Steps:**

1. `git checkout -b chore/951-subtitle-backfill`
2. Commits (grouped logically — two commits, not one):
   - **Commit 1:** validator extension only (T1 work). Message: `chore(validators): add subtitle: presence + length check to validate-post-quality.sh (#951)`
   - **Commit 2:** all 24 post edits + 8 summary removals (T2 + T3 work). Message: `chore(posts): backfill subtitle: front-matter on all 24 posts (#951)`
   - Closes #951 in the second commit's footer.
3. `git push -u origin chore/951-subtitle-backfill`
4. `gh pr create` with body:
   - **Summary:** 24 posts backfilled, 8 `summary:` lines removed, validator extended.
   - **Table:** 24 posts → "repurposed from summary" / "seeded from description".
   - **Sample subtitles:** 3 examples for visual spot-check.
   - **Note:** AC-7 verified — zero template/layout/CSS changes.
   - **Test plan:** validator passes; jekyll build clean; spot-check rendered HTML.
5. Wait for CI; investigate any non-flake failure.
6. `gh pr merge --admin --squash --delete-branch` once CI green.
7. Verify `gh issue view 951 --json state` returns `CLOSED`.

---

## Risk register

| Risk | Mitigation |
|---|---|
| Authored subtitle ends up byte-identical to description (AC-3 violation) | T3 step 3 byte-equality check runs **before** CHECKPOINT-A; violators are fixed before user review. |
| Voice inconsistency across 24 subtitles | CHECKPOINT-A is the editorial pass; T2-first sequencing uses the existing 8 summary lines as voice anchors before T3 authors fresh. |
| One of the 8 repurposed `summary:` texts is itself low-quality | T2 step 2 explicitly allows lightweight rewriting under SPEC §6 voice; not all 8 must be verbatim. |
| Validator's word-counting splits unexpectedly on punctuation | `wc -w` is standard; sanity-tested at T1 against 45- and 70-word fixtures before backfill begins. |
| `bundle exec jekyll build` regresses despite AC-7 (e.g., a stray YAML colon in a subtitle string) | T4 build step catches this; YAML-quoting of subtitle values (`subtitle: "..."`) avoids ambiguity. **Convention:** always wrap subtitle in double quotes. |
| `_drafts/` is accidentally touched | Validator scans `_posts/` only (line 62 `find "$REPO_ROOT/_posts" ...`); T2/T3 grep targets `_posts/*.md` explicitly. AC-7 git-diff boundary check catches any straggler edits. |
| 8 + 16 = 24 partitioning is wrong (e.g., one post has both `summary:` and is in T3 batch) | T3 step 1 uses `comm -23` against the actual subtitle-present set from T2's output, not a pre-computed list. |
| CI on the validator commit (Commit 1) reports 24 failing checks and blocks merge | Commit 1 is **on the same branch** as Commit 2; CI runs on the final branch state where all 24 posts have subtitles. The intermediate state is never on `main`. |
