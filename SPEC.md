# SPEC — Editorial Strengthening of Two April AI Posts (Issue #908)

**Status:** Draft  
**Issue:** [#908](https://github.com/oviney/blog/issues/908)  
**Label:** `agent:editorial-chief`  
**Author:** Ouray Viney  
**Date:** 2026-05-02

---

## 1. Objective

Bring two under-performing April posts from their current score of 83 to ≥ 88 on the internal content-review scale by deepening their thinner analytical sections and adding natural internal cross-links to the archive. Both posts are coherent and well-sourced; the gap is structural isolation and argument brevity, not accuracy.

**Target files:**
- `_posts/2026-04-05-ai-quality-testing-automation.md` — "AI Testing Tools: The Adoption Chasm Nobody Discusses"
- `_posts/2026-01-18-ai-assisted-development-the-new-industrial-revolut.md` — "Code Generators: The Brilliant Interns Nobody Supervises"

**Target users:** Engineering leaders and senior developers who read the blog for evidence-based analysis of the AI tooling landscape.

---

## 2. Per-Post Diagnosis

### Post A — "AI Testing Tools: The Adoption Chasm Nobody Discusses"
**Current:** 650 words, 0 internal links, score 83  
**Category:** Test Automation

**What is thin:**
- The "compounding divide" section (~200 words) is the weakest. It cites forward projections (Deloitte, IDC, Rainforest QA) but never explains *how* companies that cross the adoption chasm actually do it — the mechanisms are absent. It reads as a forecast, not an analysis.
- No discussion of what partial adoption looks like vs. full integration, or what the organisational conditions are for success.

**What to add:**
1. **Expand "The compounding divide"** (~150–200 words): Describe the practical organisational pattern seen in successful deployments — typically a pilot owned by a platform/QE team with a dedicated 90-day prove-out window, budget ring-fenced from QA's operational budget, and explicit rollback criteria. This can draw on the World Quality Report finding about governance and the Deloitte projection. No fabrication: stay within what the existing citations support plus reasonable synthesis.
2. **Add a brief "What crossing looks like" paragraph** (~100 words) before the conclusion, describing the conditions that distinguish the 15% at enterprise scale from the 37% in production but not scaled — the difference between a team using AI testing and an organisation that has institutionalised it.
3. **Add 2–3 internal links** (see §4 below).

**Target word count after revision:** ~850–900

---

### Post B — "Code Generators: The Brilliant Interns Nobody Supervises"
**Current:** 780 words, 0 internal links, score 83  
**Category:** Software Engineering

**What is thin:**
- "The narrow value corridor" section (~170 words) is the weakest. It correctly identifies the domains where AI code generation works but gives only one concrete example (boilerplate/scaffolding) and one supporting data point (GitHub's unit-test-pass rate). The conclusion it draws — that the mistake is generalising narrow results — is right but under-argued.
- The section ends abruptly with the Kent Beck quote. The transition from "where it works" to "what to do about it" is missing.

**What to add:**
1. **Expand "The narrow value corridor"** (~150–200 words): Add two more concrete deployment patterns where AI code generation reliably delivers — specifically: API client generation from OpenAPI schemas, and test stub generation from existing function signatures (these are well-documented use cases that the GitHub Copilot research already partially covers). Add a sentence on what "measuring actual impact" looks like in practice — cycle time for AI-assisted tasks vs. human-only, tracked at the PR level.
2. **Add a closing synthesis paragraph** (~80 words): Connect the intern metaphor from the title back to the evidence — a good intern accelerates well-scoped work but creates supervision overhead on open-ended tasks, and the ROI calculation depends entirely on which kind of work you give them.
3. **Add 2–3 internal links** (see §4 below).

**Target word count after revision:** ~1,000–1,050

---

## 3. Internal Link Map

Both posts currently have zero internal links. These are the natural anchor points — links should be woven into existing prose where the concept is already mentioned, not appended.

### Post A — AI Testing Tools
| Insert near | Link target | Anchor text |
|---|---|---|
| "AI testing tools require a different mental model" (§ capability gap) | `/2025/12/31/testing-times/` | the broader pattern of AI adoption in QA |
| "when an AI test generator produces a scenario..." (§ capability gap) | `/2026/04/05/why-ai-test-generation-tools-overpromise-on-maintenance-savi/` | AI test generation tools promise maintenance savings |
| New paragraph on partial vs. full adoption | `/2026/01/19/the-surprising-economics-of-test-automation-roi/` | the economics of test automation ROI |

### Post B — Code Generators
| Insert near | Link target | Anchor text |
|---|---|---|
| "test stub generation" (§ narrow value corridor, new content) | `/2026/04/05/ai-quality-testing-automation/` | the adoption barriers in AI-augmented QA |
| "the cost of standing still" (conclusion, by analogy) | `/2026/01/02/self-healing-tests-myth-vs-reality/` | self-healing tests follow the same pattern |
| "measuring its actual impact" (§ narrow value corridor) | `/2026/04/05/practical-applications-of-ai-in-software-development/` | practical applications of AI in development |

**Link format** (Jekyll relative URL):
```markdown
[anchor text](/YYYY/MM/DD/post-slug/)
```

---

## 4. Acceptance Criteria

- [ ] **AC-1** Post A reaches content-review score ≥ 88 (`bash scripts/validate-post-quality.sh`)
- [ ] **AC-2** Post B reaches content-review score ≥ 88
- [ ] **AC-3** Post A has ≥ 3 internal links
- [ ] **AC-4** Post B has ≥ 3 internal links  
- [ ] **AC-5** Post A word count is 850–950
- [ ] **AC-6** Post B word count is 1,000–1,100
- [ ] **AC-7** All new prose is supported by existing cited sources or logical synthesis — no new statistics fabricated
- [ ] **AC-8** `bash scripts/validate-posts.sh --all` exits 0
- [ ] **AC-9** `bundle exec jekyll build` succeeds with no errors
- [ ] **AC-10** Before/after scores recorded in the PR description

---

## 5. Editorial Style & Constraints

This blog follows an Economist-inspired register:
- Evidence-first: every claim is either directly cited, logically derived from cited data, or clearly marked as synthesis.
- No hedging language ("might", "could potentially") when the evidence is clear.
- Active voice; short paragraphs (3–5 sentences max).
- Section headings are declarative or metaphorical, not generic ("The capability gap", not "Challenges").
- Drop caps on first paragraph of each post (rendered by the theme automatically; do not add any special markup).

---

## 6. Tech Stack & Commands

```bash
bundle exec jekyll build                     # verify build
bash scripts/validate-posts.sh --all         # front matter + structural validation
bash scripts/validate-post-quality.sh        # content quality scoring
```

No new dependencies. Markdown only. No changes to layouts, SCSS, or config.

---

## 7. Boundaries

| Always do | Ask first | Never do |
|---|---|---|
| Cite every new data point against an existing reference already in the post | Add a new external citation not present in the original | Fabricate statistics or invent quotes |
| Preserve all existing headings and section order | Restructure sections significantly | Change the post's core thesis |
| Use only relative internal links (`/YYYY/MM/DD/slug/`) | Add more than 5 internal links per post | Link to external pages that are not already in the References section |
| Keep both posts in their existing categories | — | Move posts to a different category |
| Run validation before calling the task complete | — | Introduce AI image-generation prompt patterns in `image_alt` or `image_caption` |

---

## 8. Out of Scope

- Updating post images or charts
- Adding new external citations (work within existing sources)
- Changing post titles, slugs, or front matter dates
- Fixing issues from #907 (tag taxonomy) or #906 (recommendation UX) — those are separate
