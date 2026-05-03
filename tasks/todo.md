# TODO — Issue #907: Tag Taxonomy Policy

## Phase 1 — Enforcer (RED)

- [ ] **T1** Add tag presence + count (≥2) ERROR checks to `scripts/validate-posts.sh` (AC-1, AC-2)
- [ ] **CHECKPOINT A** `validate-posts.sh --all | grep tags | wc -l` == 18

## Phase 2 — Remediation + Scoring

- [ ] **T3** Add canonical vocabulary + casing rule to `.github/skills/editorial/SKILL.md` (AC-6)
- [ ] **T4a** Add tags to 7 Quality Engineering posts (testing-times, building-test-strategy, copq×2, productivity-paradox, testing-theater, end-of-manual-qa)
- [ ] **T4b** Add tags to 7 Test Automation posts (self-healing-tests, hidden-technical-debt, surprising-economics, real-cost-test-automation, ai-quality-testing, ai-test-generation, concealed-price-tag)
- [ ] **T4c** Add tags to 2 Software Engineering posts (ai-assisted-development, practical-applications)
- [ ] **T4d** Add tags to 2 Security posts (understanding-opendns, hidden-economics-of-security-debt)
- [ ] **T5** Fix `AI` → `ai` casing in `ai-threat-detection-enterprise.md`
- [ ] **CHECKPOINT B** `validate-posts.sh --all` → PASSED (all 24 posts)
- [ ] **T2** Add 10-pt tag scoring to `scripts/content-review.js` (AC-3) — commit AFTER T4/T5

## Phase 3 — Final

- [ ] **T6** `validate-posts.sh --all` ✓ · `content-review.js` all ≥90 ✓ · `jekyll build` ✓ · close #907 (AC-4, AC-5, AC-7)
