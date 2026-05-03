# TODO — Issue #908: Editorial Strengthening of Two April AI Posts

> Score target already met (100/100 both posts). Remaining work: cross-post linking and editorial depth.

## Phase 1 — Post A: "AI Testing Tools: The Adoption Chasm Nobody Discusses"

- [ ] **T1** Add 3 cross-post links in `_posts/2026-04-05-ai-quality-testing-automation.md` (AC-3)
  - testing-times → "The capability gap" ¶1
  - ai-test-generation-costs → "The capability gap" ¶2
  - test-automation-roi → new ¶ in "The compounding divide"
- [ ] **T2** Expand "The compounding divide" with ~110-word mechanism paragraph (AC-5)
- [ ] **CHECKPOINT A** `grep -c '(/20'` ≥ 3 · word count in range · `validate-posts.sh` exits 0

## Phase 2 — Post B: "Code Generators: The Brilliant Interns Nobody Supervises"

- [ ] **T3** Add 3 cross-post links in `_posts/2026-01-18-ai-assisted-development-the-new-industrial-revolut.md` (AC-4)
  - ai-quality-testing-automation → new content in "The narrow value corridor"
  - practical-applications → "measuring its actual impact"
  - self-healing-tests → final paragraph
- [ ] **T4** Expand "The narrow value corridor" + add closing synthesis paragraph (AC-6)
- [ ] **CHECKPOINT B** Both posts 100/100 · cross-post links ≥ 3 each · `validate-posts.sh --all` exits 0

## Phase 3 — Ship

- [ ] **T5** `bundle exec jekyll build` succeeds
- [ ] **T6** Commit both posts, record before/after scores, close #908 (AC-10)
