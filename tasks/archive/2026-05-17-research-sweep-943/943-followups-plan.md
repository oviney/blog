# Follow-ups Plan — Research Sweep #943 (pre-creation)

**Spec:** _(archived)_ §6, §10 · **Plan:** [plan.md](plan.md) T4-dedup, T4-collision
**Status:** Populated by T4; awaiting CHECKPOINT-A user review before T7.
**Pinned:** §1/§3 floor `2026-05-01` · §4 floor `2026-02-15` · plan SHA `bfe8f5c` · synthesis SHA `530a728`
**Dedup target:** #945, #946, #947 (open from #902)

**Hard cap (SPEC §10 / AC-9):** ≤ **4** rows with `Status = Planned spawn`. **Current count: 4** (after T4-collision merge of §4 F1 + §4 F3). Cap satisfied — no user override needed.

---

## Planned spawns + dedup decisions

| Rec # | Section | Title | Label | Files to change | Acceptance criterion (summary) | Status | Collides with |
|---|---|---|---|---|---|---|---|
| 1 | §1 #1 | `docs(skills): reference Claude Code /goal + claude agents in using-agent-skills and jekyll-qa SKILLs` | `agent:qa-gatekeeper` *(governance-update label required — touches `.github/skills/`)* | `.github/skills/using-agent-skills/SKILL.md`, `.github/skills/jekyll-qa/SKILL.md` | grep for `/goal` and `claude agents` returns ≥ 2; jekyll build passes | Planned spawn | — |
| 2 | §4 #1 + #3 (merged) | `feat(cards): standardise excerpt length and add author byline across discovery surfaces` | `agent:creative-director` | `blog/index.html`, `security.md`, `software-engineering.md`, `test-automation.md`, `index.md`, `_layouts/post.html`, `_includes/byline.html` (new) | Card excerpts use same `truncatewords`; hero retains 40 with code comment; every card and post header renders "By {author}"; Playwright asserts byline on one post and one card surface | Planned spawn (**merged from §4 F1 + §4 F3**) | — |
| 3 | §4 #2 | `chore(posts): backfill subtitle: front-matter on all 24 posts and add validator check` | `agent:editorial-chief` | `_posts/*.md` (24 files), `scripts/validate-post-quality.sh` | `grep -L "^subtitle:" _posts/*.md` returns no results; `validate-post-quality.sh` exits non-zero when subtitle missing | Planned spawn | — |
| 4 | §4 #4 | `feat(mobile): add thumb-zone bottom navigation on mobile viewports` | `agent:creative-director` | `_layouts/default.html`, `_sass/economist-theme.scss`, `tests/playwright-agents/` | Bottom nav visible at 375×667; hidden ≥1024×768; pa11y passes mobile; Lighthouse mobile score unchanged | Planned spawn | — |

---

## Dedup reclassifications (Tracked in #N — recorded in sweep body, NOT spawned)

| Finding | Existing issue | Reason | New research adds |
|---|---|---|---|
| §1 F3 — A2A Linux Foundation standard + 150-org adoption | **#946** (`docs(agents): AGENTS.md handoff targets + Mermaid graph`) | #946 already adopts the LangGraph/OpenAI-Agents-SDK "Handoff" primitive. A2A standardisation reinforces the same direction without changing scope. | One-line note that handoff vocabulary aligns with the A2A LF standard. #946's PR author may absorb it or skip. |
| §3 F2 — Playwright 1.60.0 page-level ARIA snapshots, `test.abort()`, HAR tracing | **#947** (`feat(tests): bump @playwright/test to ^1.60.0`) | Exact AC + Files-to-change match (`package.json`, `package-lock.json`, `tests/playwright-agents/`, `.github/skills/jekyll-qa/SKILL.md`). #947 is unblocked (#944 merged in `01eb11c`). | 1.61.0-alpha line exists on npm; informational only, doesn't change #947's scope (target stable 1.60). |

---

## File-overlap map (after dedup)

| File | Touched by |
|---|---|
| `.github/skills/using-agent-skills/SKILL.md` | Rec 1 |
| `.github/skills/jekyll-qa/SKILL.md` | Rec 1 |
| `blog/index.html` | Rec 2 |
| `security.md` | Rec 2 |
| `software-engineering.md` | Rec 2 |
| `test-automation.md` | Rec 2 |
| `index.md` | Rec 2 |
| `_layouts/post.html` | Rec 2 |
| `_includes/byline.html` (new) | Rec 2 |
| `_posts/*.md` (24 files) | Rec 3 |
| `scripts/validate-post-quality.sh` | Rec 3 |
| `_layouts/default.html` | Rec 4 |
| `_sass/economist-theme.scss` | Rec 4 |
| `tests/playwright-agents/` | Rec 4 |

**No remaining file overlaps after the §4 F1 + §4 F3 merge.** All 4 planned spawns can ship in parallel.

---

## Collision decisions

- **§4 F1 (excerpt consistency) + §4 F3 (author byline) → MERGE into Rec 2.**

  Pre-merge state: both findings touched the same 5 card files (`blog/index.html`, `security.md`, `software-engineering.md`, `test-automation.md`, `index.md`). Both routed to `agent:creative-director`. Both are card-template-consistency work.

  Rationale for merge over sequence: splitting would force the second PR to rebase against the first's edits to the same Liquid templates; reviewer would have to re-read the same files twice for two related changes. The merged issue carries two clearly delineated AC checklists (excerpt-truncation block + byline-presence block), which keeps the review tractable.

  Trade-off: a slightly larger PR (5 card files + `_layouts/post.html` + new `_includes/byline.html`). Still well under the scope-guard's 15-file limit.

---

## §4 persona-routing notes (for CHECKPOINT-A review)

Per SPEC §10 boundary "Ask first about whether to add §4 spawn label `agent:audience-researcher` vs. `agent:editorial-chief` vs. `agent:creative-director`":

- **Rec 1 (§1 #1):** `agent:qa-gatekeeper` + `governance-update` label. The skill files are documentation, but they're in `.github/skills/` which the scope guard treats as governance surface (per the #948 PR precedent). `agent:qa-gatekeeper` is the best fit because the personas this SKILL.md serves are mostly QA-domain (test-engineer, playwright-* agents). Alternatives: no `agent:*` label (general agent); not a great fit because skill files are governance-tagged and need active ownership.
- **Rec 2 (§4 F1+F3 merged):** `agent:creative-director`. Card-template work + layout decision (byline placement). Alternative: `agent:editorial-chief` if user prefers editorial polish included — but the byline data already exists, so no editorial copy is authored, just templating.
- **Rec 3 (§4 F2):** `agent:editorial-chief`. Authoring 24 standfirst summaries is the bulk of the work; the validator script is a small ancillary edit. Alternative: split into two issues (24-post backfill vs. validator) — rejected because the validator only matters once the backfill exists, and pairing them avoids a stalled "validator added but no posts have subtitle yet" intermediate state.
- **Rec 4 (§4 F4):** `agent:creative-director`. Pure CSS + layout + responsive media-query work. Alternative: none — clear-cut design persona.

---

## Cap status

- Planned-spawn row count: **4** (after merge)
- Cap: **4**
- Override required: **No** — cap satisfied exactly
- Tracked-in row count (informational): **2** (§1 F3 → #946, §3 F2 → #947)

---

## CHECKPOINT-A gate checklist (for user)

- [ ] Review `tasks/943-body.md` — 10 findings total, counts/justifications recorded.
- [ ] Confirm dedup decisions in the table above — §1 F3 → Tracked in #946, §3 F2 → Tracked in #947.
- [ ] Approve the **collision-pass merge** of §4 F1 + §4 F3 into Rec 2 (alternative: keep them separate and override the cap to 5).
- [ ] Approve persona-routing for each of Rec 1–4 (especially Rec 1's `governance-update` label).
- [ ] Confirm spawn count of 4 is acceptable (no override needed).
- [ ] Approve closure justification for §3 (AC-8 substance floor satisfied via "no substantive change identified" wording).

Once approved, T6 pushes the body to #943 and T7 spawns issues in any order — all 4 are independent post-merge.
