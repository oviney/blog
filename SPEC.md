# SPEC — Backfill `subtitle:` Front-Matter + Validator (#951)

**Status:** Draft — awaiting approval
**Issue:** [#951](https://github.com/oviney/blog/issues/951)
**Labels:** `agent:editorial-chief`
**Date:** 2026-05-17
**Lifecycle phase:** DEFINE
**Spawned from:** #943 (research sweep §4)

---

## 1. Situation

`_layouts/post.html` line 24 and `index.md` line 42 both bind to `page.subtitle` / `hero_post.subtitle`, but **0 of 24** posts in `_posts/` populate `subtitle:`. The Economist-style standfirst block is wired up in the design system but never authored, costing the inverted-pyramid scanability advantage NN/G credits with up to a 124% usability lift.

**Adjacent state worth surfacing:** 8 of 24 posts carry a `summary:` field that the templates **do not read** — it's dead front-matter, possibly a remnant from earlier experimentation. Repurposing the existing copy as the seed for `subtitle:` on those 8 posts saves authoring effort and removes the inconsistency.

Repo evidence at synthesis SHA `f56c219`:
- `grep -l "^subtitle:" _posts/*.md | wc -l` → 0 (of 24)
- `for f in _posts/*.md; do awk '/^---$/{n++; if(n==2)exit} n==1 && /^summary:/' "$f"; done | wc -l` → 8
- `_layouts/post.html:24` → `{% if page.subtitle %}`
- `index.md:42` → `{% if hero_post.subtitle %}`

---

## 2. Objective

1. Author a `subtitle:` line on every post in `_posts/*.md` (24 files), placed immediately under `title:`.
2. For the 8 posts that already carry `summary:`, **repurpose that text as the subtitle seed** (rephrase to fit standfirst voice if needed), then **delete the `summary:` line** to remove dead front-matter.
3. For the remaining 16 posts, source the subtitle from each post's existing `description:` field as a starting point, rewritten to fit Economist-standfirst voice — declarative, intriguing, ~25 words. The `description:` field is SEO meta and stays unchanged; the subtitle is editorial copy.
4. Extend `scripts/validate-post-quality.sh` so missing `subtitle:` is an **ERROR** (exit 1, blocks merge) and over-long subtitles emit a **WARNING** (>40 words) or **ERROR** (>60 words).

---

## 3. Acceptance Criteria

- [ ] **AC-1** `grep -L "^subtitle:" _posts/*.md` returns no results (every post has the field).
- [ ] **AC-2** `grep -l "^summary:" _posts/*.md | wc -l` returns 0 (the dead `summary:` field is removed from the 8 posts that had it).
- [ ] **AC-3** Every subtitle is ≤ 40 words; soft target ~25 words. No subtitle is identical-byte-for-byte to its post's `description:` (subtitle is editorial copy, distinct from SEO meta).
- [ ] **AC-4** `bash scripts/validate-post-quality.sh` exits 1 when run against a test post with `subtitle:` removed; exits 1 against a test subtitle > 60 words; exits 2 against a test subtitle 41–60 words; exits 0 on the actual post corpus after backfill.
- [ ] **AC-5** Rendered post HTML shows `<h2 class="article-subtitle">…</h2>` on every post (spot-check at least 3 posts in `_site/` after `bundle exec jekyll build`).
- [ ] **AC-6** `bundle exec jekyll build` exits 0.
- [ ] **AC-7** **No changes** to `_layouts/post.html`, `_layouts/default.html`, `index.md`, `_includes/`, `_sass/`, or other site templates. This issue is content + validator only.
- [ ] **AC-8** PR description includes the table of "8 posts repurposed from summary / 16 posts seeded from description" so reviewer can sample each path.

---

## 4. Commands

```bash
# Audit before
grep -l "^subtitle:" _posts/*.md | wc -l        # expected: 0
grep -l "^summary:"  _posts/*.md | wc -l        # expected: 8

# After backfill
grep -L "^subtitle:" _posts/*.md                # expected: empty
grep -l "^summary:"  _posts/*.md | wc -l        # expected: 0

# Validator
bash scripts/validate-post-quality.sh           # expected: exit 0

# Build sanity
bundle exec jekyll build
ls -1 _site/*/*.html | head -3 | xargs grep -l 'class="article-subtitle"' # spot-check
```

---

## 5. Files to change

| File | Change |
|---|---|
| `_posts/*.md` (24 files) | Add `subtitle: "…"` line under `title:`. For 8 posts with `summary:`, repurpose that text and remove the `summary:` line. For 16 others, seed from `description:` and rewrite editorially. |
| `scripts/validate-post-quality.sh` | New check `2x. Subtitle present and length-bounded`: ERROR if missing, WARNING if 41–60 words, ERROR if > 60 words. Follow the script's existing `fm_value` + ERRORS/WARNINGS accumulator pattern. Add to header comment. |

No new files. No deletions of `_posts/` files. No template/layout/CSS touches.

---

## 6. Subtitle Style Guide (binding for this PR)

- **Length:** soft target 20–28 words; hard cap 40. Never identical to `description:`.
- **Voice:** declarative, present-tense or past-tense (not future). Avoid first-person pronouns. No exclamation marks.
- **Function:** delivers the "what the reader will learn" payoff in one breath; the title hooks, the subtitle pays off.
- **Avoid:** clickbait phrasing ("You won't believe…"), generic claims ("Important insights into X"), or restating the title.

Reference: Economist standfirst conventions — see the existing 8 `summary:` examples for tonal calibration before authoring the 16 new ones.

---

## 7. Validator Design (`scripts/validate-post-quality.sh` extension)

New check block placed immediately after the existing `description:` checks. Pseudocode:

```bash
# 2x. Subtitle present and length-bounded
subtitle=$(fm_value "$post" subtitle)
if [[ -z "$subtitle" ]]; then
  echo "❌  $rel — missing required front-matter: subtitle"
  ERRORS=$((ERRORS + 1))
else
  wc=$(echo "$subtitle" | wc -w)
  if [[ $wc -gt 60 ]]; then
    echo "❌  $rel — subtitle exceeds 60 words ($wc words)"
    ERRORS=$((ERRORS + 1))
  elif [[ $wc -gt 40 ]]; then
    echo "⚠️   $rel — subtitle exceeds soft cap of 40 words ($wc words)"
    WARNINGS=$((WARNINGS + 1))
  fi
fi
```

Header comment updated to add `2x. Subtitle: present, ≤ 40 words soft cap, ≤ 60 words hard cap`.

---

## 8. Boundaries

| Always | Ask first | Never |
|---|---|---|
| Place the new `subtitle:` line directly under `title:` for consistency | Whether a subtitle's voice is too clickbait/promotional before merging | Edit `_layouts/`, `_includes/`, `_sass/`, `index.md`, or any non-`_posts/` file (besides the validator) |
| Use `description:` as a seed for the 16 posts without `summary:` — but rewrite it | Whether to fix obvious typos in existing post bodies you happen to read (defer to a separate PR) | Modify post titles, dates, slugs, categories, tags, or body copy |
| Remove `summary:` from the 8 posts whose text is repurposed | Whether the validator's WARNING tier (41–60 words) should be lifted to ERROR | Touch `_drafts/` (out of scope) |
| Run the validator locally before pushing | — | Use the same string for both `description:` and `subtitle:` (defeats the purpose of two distinct fields) |

---

## 9. Out of Scope

- Editing `_layouts/post.html`, `_layouts/default.html`, `index.md`, or any template/style file (template already supports the field).
- Rewriting post titles, dates, body copy, images, captions, or other front-matter fields.
- Adding `subtitle:` to `_drafts/` — only `_posts/`. Drafts get the validator gate when they move to `_posts/`.
- Backfilling other dead/unused front-matter fields (this PR addresses `summary:` only because it's directly relevant).
- Designing a long-form "author about the article" block — different surface, different decision.
- Changing how `description:` is generated or used elsewhere (SEO meta is its own concern).

---

## 10. Definition of Done

- All 8 ACs checked.
- `bash scripts/validate-post-quality.sh` exits 0 on the post-backfill corpus; spot-tested edge cases (missing, >40 words, >60 words) produce the expected exit codes / classifications.
- `bundle exec jekyll build` succeeds.
- PR description includes:
  - Table mapping each of 24 posts to "repurposed from summary" or "seeded from description"
  - One sample rendered subtitle for spot-check by reviewer
  - Note that no template/layout/CSS files were touched
- PR carries no extra labels beyond `agent:editorial-chief` (this isn't governance work).
- Merged via standard PR flow with CI green; admin-merge acceptable per repo convention.
