# SPEC — Internal Link Validator Quality (#904 / #905)

**Status:** Draft  
**Issues:** [#904](https://github.com/oviney/blog/issues/904) · [#905](https://github.com/oviney/blog/issues/905)  
**Labels:** `agent:editorial-chief` · `agent:qa-gatekeeper`  
**Date:** 2026-05-10

---

## 1. Situation

When these issues were filed, a scan found 16 "legacy redirect link" instances pointing to compatibility routes rather than canonical permalinks. A fresh audit confirms **all internal link targets currently resolve** in `_site/` — no `redirect_from` front matter exists in any post, and HTML-Proofer in CI passes cleanly. Prior content work (notably #908) remediated the specific links called out in #904.

The **remaining gap** (#905) is in the validator stack:

- `scripts/content-review.js` → `countInternalLinks()` awards the 10-pt internal-links credit for any link matching `/\/(20\d\d)\//` or `^\/`. It does **not** verify the target path exists.
- `scripts/validate-posts.sh` → does not check internal link targets at all.
- As a result, a post linking to `/2026/04/05/nonexistent-post/` scores full marks on internal links and passes validation.

The fix for #904 (content remediation) is moot today — all links are canonical. The fix for #905 (validator quality) is the real remaining work.

---

## 2. Objective

Make the validator stack detect internal body links that point to paths that do not exist in the site, without requiring a full Jekyll build to run first.

**Approach:** Build a lightweight in-process URL registry from post front matter (date + slug → canonical URL) and validate each internal body link against that registry.

---

## 3. Acceptance Criteria

- [ ] **AC-1** `content-review.js` distinguishes *canonical* internal links (target exists as a post) from *broken* internal links (target matches `/20xx/` pattern but has no corresponding post). Only canonical links earn the 10-pt credit; broken links generate an `issue`.
- [ ] **AC-2** `content-review.js` returns `internalLinks` (canonical count) and `brokenInternalLinks` (broken count) separately in the result object and in `content-review-results.json`.
- [ ] **AC-3** `validate-posts.sh` adds an ERROR for any internal body link whose target does not exist as a known post permalink.
- [ ] **AC-4** All 24 current posts pass both validators after the change (no regressions — all current links are already canonical).
- [ ] **AC-5** The Playwright navigation test `QA/QC article keeps one article heading and its internal references resolve` continues to pass (it already checks link resolution at the browser level).
- [ ] **AC-6** `bundle exec jekyll build` succeeds with no errors.
- [ ] **AC-7** The updated behavior is noted in `scripts/validate-posts.sh` header and in `.github/skills/jekyll-qa/SKILL.md`.

---

## 4. URL Registry Design

Build from `_posts/*.md` front matter at script start-up — no `_site/` build required:

```javascript
// In content-review.js
function buildPostRegistry(postsDir) {
  // Returns Set of canonical permalink strings like '/2026/04/05/self-healing-tests-myth-vs-reality/'
  const urls = new Set();
  for (const file of fs.readdirSync(postsDir)) {
    if (!file.endsWith('.md')) continue;
    const { fm } = parseFrontMatter(fs.readFileSync(path.join(postsDir, file), 'utf8'));
    if (fm.permalink) {
      urls.add(fm.permalink.replace(/\/?$/, '/'));
    } else if (fm.date) {
      const d = String(fm.date).slice(0, 10).replace(/-/g, '/');
      const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
      urls.add(`/${d}/${slug}/`);
    }
  }
  return urls;
}
```

For `validate-posts.sh`, build the registry with a short AWK/Python one-liner over front matter.

---

## 5. `countInternalLinks` Replacement

Replace the current function with one that returns `{ canonical, broken }`:

```javascript
function countInternalLinks(body, postRegistry) {
  const links = (body.match(/\[.*?\]\((.*?)\)/g) || []);
  let canonical = 0, broken = 0;
  for (const l of links) {
    const url = l.match(/\(([^)]+)\)/)[1].split('#')[0].replace(/\/?$/, '/');
    if (!/\/(20\d\d)\//.test(url) && !/^\/(?!http)/.test(url)) continue;
    if (/^https?:/.test(url)) continue; // external
    if (/^\/(assets|blog|software-engineering|test-automation|security|search)\b/.test(url)) continue; // non-post pages
    if (postRegistry.has(url)) canonical++;
    else broken++;
  }
  return { canonical, broken };
}
```

Credit logic:
- `canonical >= 1` → +10 pts, no issue
- `canonical === 0 && broken === 0` → +0 pts, warning (no links at all)
- `canonical === 0 && broken >= 1` → +0 pts, issue (links exist but all point nowhere)
- `broken >= 1` (regardless of canonical count) → issue listing the broken targets

---

## 6. Files Under Change

| File | Change |
|---|---|
| `scripts/content-review.js` | Build post registry at startup; replace `countInternalLinks` with registry-aware version; update score logic and return object |
| `scripts/validate-posts.sh` | Add check: for each `/20xx/` body link, verify it exists in the registry; ERROR if not |
| `.github/skills/jekyll-qa/SKILL.md` | Note the new validator behaviour |

No post front matter changes needed — all current links are already canonical.

---

## 7. Boundaries

| Always | Never |
|---|---|
| Build registry from `_posts/` front matter, not from `_site/` | Require a Jekyll build to run the validator |
| Treat `/blog/`, `/software-engineering/`, `/search/` etc. as non-post pages (not broken links) | Flag links to valid non-post site pages as broken |
| Run `validate-posts.sh --all` and `content-review.js` before committing | Change post content, front matter dates, or slugs |
| Keep the Playwright `QA/QC` link-resolution test as the browser-level guard | Remove HTML-Proofer from CI |

---

## 8. Out of Scope

- Fixing `redirect_from` usage (none exists currently)
- Checking external links (already handled by HTML-Proofer with `--disable-external`)
- Building tag archive pages or category-filtered link validators
