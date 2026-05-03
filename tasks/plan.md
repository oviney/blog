# Plan — Issue #907: Tag Taxonomy Policy

**Spec:** [SPEC.md](../SPEC.md)  
**Date:** 2026-05-03

---

## Current state

- 18/24 posts have zero tags (failing after T1)
- 1/6 tagged posts has `AI` casing that needs normalising to `ai`
- Both validators ignore tags entirely
- Editorial SKILL.md mentions tags but gives no vocabulary or count rules

---

## Dependency graph

```
T1 (validator: error on missing tags) ──► CHECKPOINT-A (RED — 18 failures expected)
                                              │
T2 (content-review: 10pt tag score)  ──┐     │
T3 (SKILL.md docs)                   ──┤     ▼
                                        │  T4a (add tags: QE posts, 8)
                                        │  T4b (add tags: TA posts, 7)
                                        │  T4c (add tags: SE posts, 2)
                                        │  T4d (add tags: Security posts, 1)
                                        │  T5  (fix casing: 1 post)
                                        │     │
                                        └──►  CHECKPOINT-B (GREEN — all 24 pass)
                                              │
                                              ▼
                                          T6 (final build + close issue)
```

**Key sequencing rule:** T1 must land before any remediation so each fix can be verified against the real check. T2 and T3 can run in parallel with T4/T5 — they touch different files.

---

## Phase 1 — Enforcer (TDD RED)

### T1 — Add tag checks to `validate-posts.sh`

**Files:** `scripts/validate-posts.sh`  
**ACs:** AC-1, AC-2

Add a tag-presence check immediately after the existing required-field loop (line ~92). Tags use inline YAML array format: `tags: [tag1, tag2]`. The `fm_value` helper already reads this line.

```bash
# -- 2b. Tag checks ----------------------------------------------------------
tags_val=$(fm_value "$post" "tags")
if [[ -z "$tags_val" ]]; then
  echo "❌  $rel — missing required front-matter field: 'tags' (add 2–5 lowercase-hyphen tags)"
  ERRORS=$((ERRORS + 1))
  post_errors=$((post_errors + 1))
else
  # Count tags in inline array: strip brackets, count comma-separated items
  tag_count=$(echo "$tags_val" | tr -d '[]' | tr ',' '\n' | grep -c '[^[:space:]]' || true)
  if [[ "$tag_count" -lt 2 ]]; then
    echo "❌  $rel — too few tags: $tag_count found (minimum 2 required)"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi
fi
```

**Verify (RED):** `bash scripts/validate-posts.sh --all 2>&1 | grep "❌" | grep "tags" | wc -l` → should be 18.

---

### CHECKPOINT A

Run `bash scripts/validate-posts.sh --all 2>&1 | grep -c "tags"` → confirms exactly 18 (or 19 if the casing post's `AI` tag count is also wrong) failures before any remediation.

---

## Phase 2 — Remediation and Scoring (GREEN)

T2, T3, T4, T5 can run in any order. T4/T5 each self-verify with the validator.

---

### T2 — Add tag scoring to `content-review.js`

**File:** `scripts/content-review.js`  
**AC:** AC-3

Add a new section after the existing `// ── 7. Internal links` block (currently the last scoring section before citations):

```javascript
// ── 3b. Tags (10 pts) ───────────────────────────────────────────────────────
const tags = Array.isArray(fm.tags) ? fm.tags : [];
if (tags.length >= 2) {
  score += 10;
} else if (tags.length === 1) {
  score += 5;
  warnings.push('Only 1 tag — add at least one more (target: 2–5 lowercase-hyphen tags)');
} else {
  issues.push('No tags — add 2–5 lowercase-hyphen tags from the canonical vocabulary');
}
```

Also update the header comment (lines ~10-15) to add: `10 pts — Tags (≥ 2 canonical tags)` and raise the implicit max from 100.

**Note:** After adding this section, any post currently at 100/100 without tags will drop to 90/100. All 18 untagged posts must be remediated (T4/T5) before this is committed, or commit T2 after T4/T5.

**Sequencing adjustment:** Commit T2 last in Phase 2 — after T4/T5 — so the score doesn't regress for the archive while remediation is in flight.

**Verify:** `node scripts/content-review.js 2>&1 | grep -E "100/100|90/100"` — after T2+T4+T5 all posts should show ≥ 90/100.

---

### T3 — Update `.github/skills/editorial/SKILL.md`

**File:** `.github/skills/editorial/SKILL.md`  
**AC:** AC-6

Add a `### Tags` section after the existing `### Categories` section:

```markdown
### Tags (required: 2–5 per post)

Use `lowercase-hyphen` format. Acronyms become lowercase (`AI` → `ai`).

**Canonical vocabulary** (add new tags by exception only):

| Group | Tags |
|---|---|
| Quality Engineering | `quality-engineering` `software-testing` `defect-prevention` `quality-metrics` `cost-of-quality` `qa-strategy` `quality-management` |
| Test Automation | `test-automation` `ci-cd` `self-healing-tests` `playwright` `test-maintenance` `test-roi` `testing-theater` |
| Software Engineering | `software-engineering` `engineering-leadership` `technical-debt` `platform-engineering` `developer-experience` `digital-transformation` `architecture` |
| Security | `security` `security-debt` `cybersecurity` `enterprise-security` `threat-detection` |
| Cross-cutting | `ai` `ai-testing` `code-quality` `productivity` `devops` `cost-benefit` |

Tags outside this list are allowed when none of the above fit; document the addition in the PR.
```

Also update the SEO checklist item from `- [ ] Category and tags set correctly` to:
`- [ ] Category correct (one of the four allowed values)`  
`- [ ] Tags: 2–5 entries, lowercase-hyphen, from canonical vocabulary`

**Verify:** No script check — visual review of the SKILL.md diff.

---

### T4a — Add tags to Quality Engineering posts (8 posts)

Tags to add (see SPEC §4 Remediation Map):

| Post | Tags |
|---|---|
| `2025-12-31-testing-times.md` | `ai-testing, test-automation, quality-engineering` |
| `2026-04-05-building-a-test-strategy-that-works.md` | `qa-strategy, test-automation, software-testing` |
| `2026-04-05-copq-in-software-engineering-and-how-quality-engin.md` | `cost-of-quality, quality-engineering, software-engineering` |
| `2026-04-05-cost-of-poor-quality-copq.md` | `cost-of-quality, quality-engineering, defect-prevention` |
| `2026-01-18-the-productivity-paradox-of-test-coverage-metrics.md` | `test-automation, quality-metrics, productivity` |
| `2026-01-18-the-real-cost-of-testing-theater-when-quality-metr.md` | `testing-theater, quality-metrics, cost-of-quality` |
| `2026-04-05-the-end-of-manual-qa-why-2026-is-the-tipping-point.md` | `test-automation, qa-strategy, ai-testing` |
| `2026-04-12-understanding-qa-qc-and-quality-engineering.md` _(has tags)_ | No change needed — already has correct tags |

Wait — `understanding-qa-qc` already has tags. Remove from this batch.

Actual T4a posts (7 untagged QE posts):
- `2025-12-31-testing-times.md`
- `2026-04-05-building-a-test-strategy-that-works.md`
- `2026-04-05-copq-in-software-engineering-and-how-quality-engin.md`
- `2026-04-05-cost-of-poor-quality-copq.md`
- `2026-01-18-the-productivity-paradox-of-test-coverage-metrics.md`
- `2026-01-18-the-real-cost-of-testing-theater-when-quality-metr.md`
- `2026-04-05-the-end-of-manual-qa-why-2026-is-the-tipping-point.md`

**Verify after each post:** `bash scripts/validate-posts.sh <post-file>` shows ✅ for that post.

---

### T4b — Add tags to Test Automation posts (7 posts)

| Post | Tags |
|---|---|
| `2026-01-02-self-healing-tests-myth-vs-reality.md` | `self-healing-tests, test-automation, test-maintenance` |
| `2026-01-18-the-hidden-technical-debt-of-test-automation.md` | `test-automation, technical-debt, test-maintenance` |
| `2026-01-19-the-surprising-economics-of-test-automation-roi.md` | `test-roi, test-automation, cost-benefit` |
| `2026-04-04-the-real-cost-of-test-automation--balancing-speed-and-sustai.md` | `test-automation, test-roi, technical-debt` |
| `2026-04-05-ai-quality-testing-automation.md` | `ai-testing, test-automation, qa-strategy` |
| `2026-04-05-why-ai-test-generation-tools-overpromise-on-maintenance-savi.md` | `ai-testing, test-maintenance, test-automation` |
| `2026-04-06-the-concealed-price-tag-of-test-automation.md` | `test-roi, cost-of-quality, test-automation` |

**Verify:** `bash scripts/validate-posts.sh` passes for all 7.

---

### T4c — Add tags to Software Engineering posts (2 posts)

| Post | Tags |
|---|---|
| `2026-01-18-ai-assisted-development-the-new-industrial-revolut.md` | `ai, software-engineering, code-quality, productivity` |
| `2026-04-05-practical-applications-of-ai-in-software-development.md` | `ai, software-engineering, productivity, code-quality` |

**Verify:** both pass validator.

---

### T4d — Add tags to Security posts (2 posts)

| Post | Tags |
|---|---|
| `2023-12-28-understanding-opendns-cybersecurity-protection.md` | `security, cybersecurity, enterprise-security` |
| `2026-04-12-the-hidden-economics-of-security-debt.md` | `security-debt, security, cost-benefit` |

**Verify:** both pass validator.

---

### T5 — Fix casing: `AI` → `ai` in one post

**File:** `_posts/2026-04-12-ai-threat-detection-enterprise.md`

Current: `tags: [cybersecurity, AI, threat-detection, machine-learning, enterprise-security]`  
New: `tags: [cybersecurity, ai, threat-detection, machine-learning, enterprise-security]`

**Note:** `machine-learning` is outside the canonical vocabulary (it's fine — the policy allows it).

**Verify:** `bash scripts/validate-posts.sh _posts/2026-04-12-ai-threat-detection-enterprise.md` → ✅

---

### CHECKPOINT B

After T1 + T4a + T4b + T4c + T4d + T5:

```bash
bash scripts/validate-posts.sh --all
```

Expected: `validate-posts: PASSED — all posts valid.`

---

## Phase 3 — Verification

### T6 — Final build, content-review, close issue

1. `bash scripts/validate-posts.sh --all` → PASSED
2. `node scripts/content-review.js 2>&1 | grep -E "🔴|🟡|score"` → all ≥ 90/100
3. `bundle exec jekyll build` → clean
4. `gh issue close 907 --repo oviney/blog --comment "..."` → closed

---

## Risk register

| Risk | Mitigation |
|---|---|
| T1 grep-based tag count fails for multi-line YAML block arrays | All current posts use inline `tags: [...]` format; the count logic handles this correctly |
| T2 adds tag scoring and existing 100/100 posts drop | Commit T2 after T4/T5 so no regression window |
| A proposed tag in the remediation map is wrong for a post's content | Read each post title/category before applying tags |
| `AI` in `ai-threat-detection` post has other implications | It's just a tag value, not a category; normalising to `ai` is purely stylistic |
