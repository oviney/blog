# Plan — Issue #908: Editorial Strengthening of Two April AI Posts

**Spec:** [SPEC.md](../SPEC.md)  
**Date:** 2026-05-02

---

## Situation at planning time

The remote "Sweep archive post quality" commit already resolved the score and opening-paragraph issues identified when #908 was filed. Fresh content-review scores are 100/100 for both posts. What remains is editorial depth and cross-post linking — the spec's AC-1/AC-2 (score ≥ 88) are already met; AC-3 through AC-6 and AC-10 are not.

| Post | Score | Words | Cross-post links |
|---|---|---|---|
| Post A — AI Testing Tools | 100/100 ✅ | 825 (target 850–950) | 0 ❌ |
| Post B — Code Generators | 100/100 ✅ | 878 (target 1,000–1,100) | 0 ❌ |

---

## Dependency graph

```
T1 (Post A links)  ──┐
T2 (Post A depth)  ──┼──► CHECKPOINT-A ──► T5 (validate A) ──┐
                      │                                          ├──► CHECKPOINT-B ──► T6 (build + close)
T3 (Post B links)  ──┤
T4 (Post B depth)  ──┴──► validate B (part of T4) ─────────────┘
```

T1 and T2 are independent (different lines in Post A). T3 and T4 are independent (different sections of Post B). Posts A and B are fully independent of each other. All four tasks could run in parallel; they are sequenced here for clarity.

---

## Phase 1 — Post A: "AI Testing Tools: The Adoption Chasm Nobody Discusses"

### T1 — Add 3 cross-post links to Post A

**File:** `_posts/2026-04-05-ai-quality-testing-automation.md`

**AC:** AC-3 (≥ 3 internal links — not counting the chart image)

**Exact insertions:**

1. **In "The capability gap", paragraph 1** — after "AI testing tools require a different mental model from traditional automation":
   - Extend the sentence or add a clause: `— a shift [Testing Times](/2025/12/31/testing-times/) documented as the gap between AI adoption claims and measurable outcomes`
   - OR weave it in naturally: link the phrase "the broader AI adoption pattern in QA" to `/2025/12/31/testing-times/`

2. **In "The capability gap", paragraph 2** — sentence about "AI test generator produces a scenario":
   - Link the phrase "AI test generation tools" to `/2026/04/05/why-ai-test-generation-tools-overpromise-on-maintenance-savi/` with anchor: `AI test generation tools promise maintenance savings`

3. **In "The compounding divide"** (new paragraph added in T2) — link the phrase "the economics of test automation ROI" to `/2026/01/19/the-surprising-economics-of-test-automation-roi/`

**Verify:** `grep -c '(/20' _posts/2026-04-05-ai-quality-testing-automation.md` returns ≥ 3

---

### T2 — Expand "The compounding divide" section in Post A

**File:** `_posts/2026-04-05-ai-quality-testing-automation.md`

**AC:** AC-5 (word count 850–950), editorial depth — mechanism analysis not just forecast

**What to write (~100–120 words to insert before the final paragraph):**

Insert a new paragraph between the Deloitte/IDC projections paragraph and the "economics are becoming inescapable" conclusion paragraph. The paragraph should describe the *organisational conditions* that differentiate the 15% at enterprise scale from the 37% in production but not scaled:

> The distinction is organisational, not technical. Teams that reach enterprise scale typically do so through a platform-owned pilot — a dedicated QE team with a 90-day prove-out window, budget ring-fenced from QA's operational spend, and explicit rollback criteria agreed in advance. That structure isolates the risk, gives the organisation time to build institutional trust, and creates a clear moment at which the pilot either graduates to the roadmap or is retired. The companies that skip this step — deploying AI testing tools team by team without central governance — discover that the tools work locally while the organisation fails to learn.

This is synthesis from the World Quality Report governance data already cited. No new statistics.

**Verify:** `wc -w _posts/2026-04-05-ai-quality-testing-automation.md` lands in the range 925–1,050 (includes front matter overhead).

---

### CHECKPOINT A

After T1 and T2:
- `grep -c '(/20' _posts/2026-04-05-ai-quality-testing-automation.md` ≥ 3
- `wc -w _posts/2026-04-05-ai-quality-testing-automation.md` in expected range
- `bash scripts/validate-posts.sh _posts/2026-04-05-ai-quality-testing-automation.md` exits 0

---

### T5 — Validate Post A and run live content review

Run: `node scripts/content-review.js 2>&1 | grep ai-quality`

Expected: 100/100 retained (no regressions from the additions).

---

## Phase 2 — Post B: "Code Generators: The Brilliant Interns Nobody Supervises"

### T3 — Add 3 cross-post links to Post B

**File:** `_posts/2026-01-18-ai-assisted-development-the-new-industrial-revolut.md`

**AC:** AC-4 (≥ 3 internal links — not counting the chart image)

**Exact insertions:**

1. **In "The narrow value corridor", new content** (added in T4) — link "test stub generation" or "AI-augmented QA" to `/2026/04/05/ai-quality-testing-automation/` with anchor: `the adoption barriers in AI-augmented QA`

2. **In "The narrow value corridor", existing text** — after "measure its actual impact", link "practical applications of AI in development" to `/2026/04/05/practical-applications-of-ai-in-software-development/`

3. **Final paragraph of the post** — near "the demo reel will always outperform the daily reality", add a reference: link phrase "self-healing tests follow the same pattern of oversold automation" to `/2026/01/02/self-healing-tests-myth-vs-reality/`

**Verify:** `grep -c '(/20' _posts/2026-01-18-ai-assisted-development-the-new-industrial-revolut.md` returns ≥ 3

---

### T4 — Expand "The narrow value corridor" and add closing synthesis in Post B

**File:** `_posts/2026-01-18-ai-assisted-development-the-new-industrial-revolut.md`

**AC:** AC-6 (word count 1,000–1,100), editorial completeness

**Two additions:**

**Addition 1** (~120 words) — after the existing boilerplate/scaffolding sentence and before the GitHub data point. Expand the "constrained tasks" theme with two more concrete patterns:

> The same dynamic holds for any task where the schema is explicit and the output is easily verified. Generating API client code from an OpenAPI specification — where the contract is machine-readable and the test is a compile check — is a clear win. So is producing test stubs from existing function signatures, where the structure is given and the developer's job is to fill in the assertions rather than design the architecture. In both cases, the AI is doing transcription, not design. The productivity gains are genuine because the problem is bounded.

**Addition 2** (~80 words) — replace the abrupt Kent Beck ending with a synthesis paragraph that closes the intern metaphor:

> A good intern accelerates well-scoped work. They slow you down on open-ended work because the supervision cost exceeds the contribution. The ROI calculation for AI code generation depends entirely on which category of work you give them — and most teams are not being honest about the ratio. The tools are not the problem. The problem is organisations treating boilerplate-speed gains as proof of design-quality improvement. That confusion is what the data, consistently, refuses to support.

(The Kent Beck quote can remain as a pull-quote before this synthesis paragraph.)

**Verify:** `wc -w _posts/2026-01-18-ai-assisted-development-the-new-industrial-revolut.md` in the range 1,075–1,225 (includes front matter overhead).

---

### CHECKPOINT B (combined final verification)

After T3 and T4, and after T5 (Post A validated):

1. `grep -c '(/20' _posts/2026-01-18-ai-assisted-development-the-new-industrial-revolut.md` ≥ 3
2. `node scripts/content-review.js 2>&1 | grep -E "ai-quality|ai-assisted"` — both still 100/100
3. `bash scripts/validate-posts.sh --all` exits 0

---

## Phase 3 — Build and close

### T6 — Jekyll build, commit, record scores

1. `bundle exec jekyll build` — must succeed with no errors
2. Commit both posts together with message referencing #908
3. In the PR description (or issue comment): record before/after scores
   - Before: 83/100, 0 cross-post links, 650/780 words
   - After: 100/100, 3 cross-post links each, ~900/1,040 words
4. Close #908

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| New prose drops score below 100 | Very low | Content-review only deducts for missing features (links, citations, word count), not for prose style |
| Word count overshoot changes tone | Low | Add prose incrementally, re-read for register fit |
| Internal link target URL changes | Very low | All 6 targets verified in `_site/` at planning time |
| The intern closing metaphor doesn't match the post's existing register | Low | Read the existing conclusion before writing; the metaphor is already in the title |

---

## Out of scope

- Updating charts or images
- Adding new external citations
- Changing post titles, slugs, or front matter dates
- Any changes to post C through Z
