# Plan — Issues #904 / #905: Internal Link Validator Quality

**Spec:** _(archived)_  
**Date:** 2026-05-11

---

## Context

All 14 internal link targets currently used by posts resolve correctly. One registry design subtlety: the post `2026-04-04-the-real-cost-of-test-automation--balancing-speed-and-sustai.md` has a double-hyphen in its filename, but Jekyll normalizes that to a single hyphen in the generated URL. The registry builder must apply the same normalization (`--+` → `-`).

**Strategy (revised after staff engineer review):** Front-matter derivation is the **sole** source for the registry. `_site/` is explicitly excluded — it is a stale build artifact that creates false-positive cascades when a developer adds a new post and runs the validator before building. The spec's boundary ("Never: Require a Jekyll build") stands. HTML-Proofer in CI handles post-build link verification; these validators handle pre-build author feedback.

---

## Dependency graph

```
T1 (shared registry helper) ──► T2 (content-review.js update)
                             ──► T3 (validate-posts.sh update)
                                     │
                                 CHECKPOINT-A (24/24 pass, 100/100, no regressions)
                                     │
                                 T4 (docs + issue close)
```

T2 and T3 are independent of each other but both depend on T1's design being settled. T4 depends on T2 and T3 passing.

---

## Phase 1 — Registry design (settled in T1, implemented inline in T2 and T3)

### T1 — Design and verify the post URL registry

**Not a code task — design only.** Confirmed correct after staff engineer review.

**Registry algorithm (front-matter only, no `_site/` dependency):**

- Read `permalink:` field if present → use as the canonical URL (trim, ensure trailing `/`)
- Otherwise: read `date:` front-matter field for YYYY/MM/DD path; strip the `YYYY-MM-DD-` prefix from the filename for the slug; apply `--+` → `-` normalization (the only Jekyll slug normalization this corpus needs); construct `/YYYY/MM/DD/{slug}/`
- **Key:** `date:` in front matter overrides the filename date for the URL path. The slug always comes from the filename (after stripping the filename-date prefix), not from the front-matter title. This is correct for all four posts with a 2026-01-18 filename / 2026-04-05 front-matter date mismatch.

**Link entry filter (revised — no exclusion list needed):**
Only links containing a year segment are checked: `/\/(20\d\d)\//.test(url)`.
Every non-post page (`/blog/`, `/about/`, `/search/`, etc.) lacks a year segment and never matches. No exclusion list required.

**Verify (T1 output):** Python prototype confirms the registry contains 24 posts and all 14 linked URLs resolve, including the double-hyphen post after normalization.

---

## Phase 2 — Validator updates

### T2 — Update `scripts/content-review.js`

**AC:** AC-1, AC-2

**Changes:**

1. Add `buildPostRegistry(postsDir)` function before `scorePost`. Uses front-matter derivation only — no `_site/` dependency. Returns a `Set<string>`. Add an inline comment noting that `date:` front matter is used for the URL date path (not the filename date), and the slug comes from the filename after stripping the filename-date prefix.

2. Replace `countInternalLinks(body)` with `classifyInternalLinks(body, registry)` returning `{ canonical, broken, brokenUrls }`:
   - Entry filter: `if (!/\/(20\d\d)\//.test(url)) continue;` — only date-segment links are checked
   - No exclusion list needed: `/blog/`, `/about/`, etc. never contain a year segment
   - Checks each matched URL against `registry`
   - Returns `canonical` count (in registry) and `broken` count + list (not in registry)

3. Update section 7 in `scorePost`:
   ```javascript
   const { canonical, broken, brokenUrls } = classifyInternalLinks(body, registry);
   if (canonical >= 1) {
     score += 10;
   } else {
     warnings.push('No internal links to other posts — consider linking to related content');
   }
   if (broken > 0) {
     issues.push(`${broken} internal link(s) point to non-existent post(s): ${brokenUrls.join(', ')}`);
   }
   ```

4. Pass registry into `scorePost(fm, body, filename, registry)` — add it as the 4th parameter.

5. Build registry once in `main()` before the scoring loop.

6. Update return object: `{ ..., internalLinks: canonical, brokenInternalLinks: broken }`.

7. Update header comment line: `10 pts — Internal links (≥ 1 canonical link to an existing post)`.

**Verify (RED → GREEN):**
- Baseline: run `node scripts/content-review.js` — all 24 at 100/100 (no regressions)
- Manual test: temporarily add a markdown link pointing to the deliberately non-existent slug `/2026/99/99/no-such-post/` to a post body → should appear as a broken link issue but not drop score if ≥ 1 canonical link still present
- Restore after test

---

### T3 — Update `scripts/validate-posts.sh`

**AC:** AC-3, AC-4

**Changes:**

Add a new check section (before the closing `if [[ $post_errors -eq 0 ]]` line) that:

1. Builds the post registry once **outside the per-post loop** (before line ~76) using a Python one-liner:
   ```bash
   # Build post URL registry from front matter
   POST_REGISTRY=$(python3 - "$POSTS_DIR" <<'PYEOF'
   import sys, os, re
   posts_dir = sys.argv[1]
   urls = set()
   for f in os.listdir(posts_dir):
       if not f.endswith('.md'): continue
       content = open(os.path.join(posts_dir, f)).read()
       fm_end = content.find('---', 3)
       fm = content[3:fm_end]
       perma = re.search(r'^permalink:\s*(.+)', fm, re.M)
       date_m = re.search(r'^date:\s*(\d{4}-\d{2}-\d{2})', fm, re.M)
       if perma:
           urls.add(perma.group(1).strip().rstrip('/') + '/')
       elif date_m:
           slug = re.sub(r'^[0-9]{4}-[0-9]{2}-[0-9]{2}-', '', f).replace('.md', '')
           slug = re.sub(r'-{2,}', '-', slug)  # Jekyll normalizes -- to -
           d = date_m.group(1).replace('-', '/')
           urls.add(f'/{d}/{slug}/')
   print('\n'.join(sorted(urls)))
   PYEOF
   )
   ```

2. Inside the per-post loop, after tag checks, scan the post body for internal post links and validate each:
   ```bash
   # -- 2c. Internal link targets must resolve to known posts -------------------
   body_links=$(awk '/^---/{n++; if(n==2){found=1; next}} found{print}' "$post" \
     | grep -oE '\(/20[0-9][0-9]/[^)]+/\)' \
     | tr -d '()' \
     | sed 's|#.*||' \
     | sed 's|/*$|/|' \
     || true)
   while IFS= read -r link_url; do
     [[ -z "$link_url" ]] && continue
     if ! echo "$POST_REGISTRY" | grep -qF "$link_url"; then
       echo "❌  $rel — internal link points to non-existent post: '$link_url'"
       ERRORS=$((ERRORS + 1))
       post_errors=$((post_errors + 1))
     fi
   done <<< "$body_links"
   ```

3. Update header comment to add: `2c. Internal links: /20xx/ body links resolve to known posts`.
4. Add comment above the `sed 's|#.*||'` line in the body-link extractor explaining it strips URL fragments before registry lookup — do not remove it even though it looks like dead code (the `grep -oE` pattern captures `post/#section` as a single token).

**Verify (RED → GREEN):**
- `bash scripts/validate-posts.sh --all` → PASSED (24/24 — no regressions)
- Manual test: temporarily add a markdown link pointing to the deliberately non-existent slug `/2026/99/99/no-such-post/` to a post → should ERROR; restore

---

### CHECKPOINT A

After T2 and T3:
```bash
bash scripts/validate-posts.sh --all                          # PASSED 24/24
node scripts/content-review.js 2>&1 | grep -c "100/100"      # 24
bundle exec jekyll build                                       # clean
```

---

## Phase 3 — Docs + close

### T4 — Update jekyll-qa SKILL.md, close issues

**AC:** AC-7

Add to `.github/skills/jekyll-qa/SKILL.md` under the validator section:
- `validate-posts.sh` now checks that internal body links (`/20xx/…/`) resolve to known posts
- `content-review.js` now distinguishes canonical from broken internal links; broken links appear as issues

Close #904 (verified clean — no legacy links found in audit) and #905 (validator now detects broken internal targets).

---

## Risk register

| Risk | Mitigation |
|---|---|
| Registry misses a post due to slug normalization differences | T1 Python prototype already verified all 14 linked URLs match; `--` normalization explicitly applied |
| `_site/` not built when running locally | Registry falls back to front-matter derivation; same normalization logic used in both paths |
| `/blog/` or `/software-engineering/` links flagged as broken | Non-post page exclusion list hardcoded; only `/20xx/` date-pattern URLs are checked |
| The QA/QC Playwright test relies on specific link resolution | `validate-posts.sh` check + `content-review.js` broken-link issue catch the same gap; Playwright test (AC-5) is a browser-level guard that runs independently |
