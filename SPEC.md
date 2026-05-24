# SPEC — Make AGENTS.md handoff targets explicit + Mermaid graph (#946)

**Status:** Draft — awaiting approval
**Issue:** [#946](https://github.com/oviney/blog/issues/946)
**Labels:** `agent:qa-gatekeeper`
**Date:** 2026-05-24
**Lifecycle phase:** DEFINE
**Spawned from:** Research Sweep [#902](https://github.com/oviney/blog/issues/902) (2026-05-01)

---

## 1. Situation

`AGENTS.md` documents five personas and references handoffs in prose (`**Handoff triggers**:` lines on Creative Director, QA Gatekeeper, Editorial Chief, Audience Researcher) but does not enumerate which personas may transfer to which others. The General Agent block has no handoff prose at all.

LangGraph 1.0 (GA 2025-10) and the OpenAI Agents SDK April 2026 evolution have both standardised **Handoffs** as an explicit primitive — agents transfer control with carried context and a declared list of valid handoff targets. Making the handoff graph explicit and machine-readable lets future automation (and human reviewers) detect when a new persona is added without wiring up its routing.

The handoff *topology* is already implicit in the existing prose; this spec promotes it to a structured row on each persona plus a Mermaid diagram.

**File at HEAD `f07e15de`:**
- `AGENTS.md` — 226 lines; persona blocks at lines 44, 60, 76, 92, 108; `## Cross-Agent Conventions` at line 134.

Mermaid rendering: the repo already supports Mermaid code fences in Markdown (confirmed via existing Mermaid usage; Jekyll's mermaid-jekyll plugin is loaded). Verify with `bundle exec jekyll build` + a local dev server preview.

---

## 2. Objective

Make the persona handoff graph explicit and machine-checkable in `AGENTS.md` by (a) adding a `**Valid handoff targets:**` row to each of the five persona blocks and (b) adding a top-level `## Handoff Graph` section rendering the targets as a Mermaid `graph LR` diagram. Single-file change, no governance surface touched, no functional behaviour change.

---

## 3. Design Decisions (confirmed 2026-05-24)

| Decision | Choice | Rationale |
|---|---|---|
| Topology source | **Derive from existing `**Handoff triggers**` prose** (lines 56, 72, 88, 104) | Single source of truth; no new routing decisions invented in this PR. |
| General Agent topology | **Terminal — `_(terminal — handles work end-to-end)_`** | General Agent is the cross-cutting / refactor catch-all; once it owns work, it ships it. Keeps the graph minimal. |
| Section placement | **New top-level `## Handoff Graph` between `## Agent Roster` and `## Protected Files`** | Adjacent to the personas it describes; readers see the graph immediately after meeting the personas. |
| Row placement inside each persona | **Add as a new row in the existing property table** (above `**Handoff triggers**` prose where present) | Keeps structured info in the table; prose paragraph below explains *when* the transfer happens. |
| Diagram syntax | **`graph LR` Mermaid block** | Per issue AC; horizontal layout reads better at typical viewing widths than `graph TD` for a 5-node graph. |
| Diagram node labels | **Short persona names** ("Creative Director", "QA Gatekeeper", etc.) — no labels/abbreviations | Matches the persona headings; avoids a separate legend. |
| Terminal node visual | **Distinct node shape** `GeneralAgent(["General Agent"])` (rounded rectangle) vs default rectangle for others | Visually signals terminal status without needing a legend; falls back gracefully if shape is unsupported. |

---

## 4. Handoff Topology (derived from existing prose)

| From | To | Source line in AGENTS.md |
|---|---|---|
| Creative Director | Editorial Chief | line 56 ("design change requires content edits") |
| Creative Director | QA Gatekeeper | line 56 ("visual change requires CI/test updates") |
| QA Gatekeeper | Creative Director | line 72 ("failing tests stem from a design regression") |
| QA Gatekeeper | Editorial Chief | line 72 ("content error is caught in CI") |
| Editorial Chief | Creative Director | line 88 ("post requires a new layout or styling") |
| Editorial Chief | QA Gatekeeper | line 88 ("published post causes a build failure") |
| Audience Researcher | Creative Director | line 104 ("layout or visual hierarchy changes") |
| Audience Researcher | Editorial Chief | line 104 ("copy, headline, SEO, or internal-link improvements") |
| Audience Researcher | QA Gatekeeper | line 104 ("accessibility, interaction, or regression-proofing work") |
| General Agent | — (terminal) | No existing handoff prose; confirmed terminal 2026-05-24 |

**Mermaid sketch:**

```
graph LR
    CD[Creative Director] --> EC[Editorial Chief]
    CD --> QA[QA Gatekeeper]
    QA --> CD
    QA --> EC
    EC --> CD
    EC --> QA
    AR[Audience Researcher] --> CD
    AR --> EC
    AR --> QA
    GA(["General Agent (terminal)"])
```

---

## 5. Acceptance Criteria

- [ ] **AC-1** Each of the five persona blocks (`### 1. Creative Director` through `### 5. General Agent`) gains a `**Valid handoff targets:**` row.
- [ ] **AC-2** `grep -c "Valid handoff targets" AGENTS.md` returns exactly `5`.
- [ ] **AC-3** A new top-level `## Handoff Graph` section exists between `## Agent Roster` and `## Protected Files`, containing a Mermaid `graph LR` code fence.
- [ ] **AC-4** The Mermaid graph encodes exactly the 9 edges in §4 plus the terminal General Agent node.
- [ ] **AC-5** General Agent's row reads `**Valid handoff targets:** _(terminal — handles work end-to-end)_` — no empty target sets.
- [ ] **AC-6** `bundle exec jekyll build` exits 0.
- [ ] **AC-7** The Mermaid diagram renders on the local dev server (visual check at `http://localhost:4000/agents/` or wherever AGENTS.md is exposed; if AGENTS.md is not rendered as a Jekyll page, confirm Markdown renders correctly on GitHub by viewing the PR diff).
- [ ] **AC-8** No persona's existing `**Handoff triggers**:` prose paragraph is removed — the new row supplements, not replaces, the prose.

---

## 6. Files to Change

| File | Change |
|---|---|
| `AGENTS.md` | (a) Insert `**Valid handoff targets:**` row into each of the five persona property tables. (b) Insert new `## Handoff Graph` section after line ~120 (end of roster) with the Mermaid block. |

**Total scope:** 1 file, ≈ 25 line insertions (5 rows + ~20-line Mermaid section).

---

## 7. Commands

```bash
# Validation (run before opening PR)
bundle exec jekyll build              # AC-6
grep -c "Valid handoff targets" AGENTS.md  # AC-2: expect 5
grep -c "## Handoff Graph" AGENTS.md       # expect 1

# Local preview (AC-7)
bundle exec jekyll serve --config _config.yml,_config_dev.yml
# Open http://localhost:4000/ — confirm no build regressions
```

---

## 8. Code Style

- **No prose deletion** from existing persona blocks — the new row supplements the existing `**Handoff triggers**:` paragraph.
- **Match existing table format** — each persona's property table uses `| Property | Value |` headers; add `**Valid handoff targets:**` as a new row with comma-separated linked persona names.
- **Cross-link with anchor refs** where possible — e.g., `[Editorial Chief](#3-editorial-chief)` to make the row navigable.
- **Mermaid code fence** uses ```` ```mermaid ```` (Jekyll's mermaid-jekyll plugin convention).
- **No new variables, no `_config.yml` changes**, no governance surface (`.github/skills/`, `.github/instructions/`, `.github/copilot-instructions.md`) touched.

---

## 9. Testing Strategy

| Layer | Check |
|---|---|
| Static | `grep -c "Valid handoff targets" AGENTS.md` == 5 (AC-2) |
| Static | `grep -c "## Handoff Graph" AGENTS.md` == 1 |
| Build | `bundle exec jekyll build` exits 0 (AC-6) |
| Visual | Local dev server preview confirms Mermaid renders without errors (AC-7) |
| Cross-check | Each edge in the Mermaid graph is reflected by existing `**Handoff triggers**:` prose (AC-4, AC-8) |

No new Playwright spec required — this is a docs-only change with no runtime UI surface. CI will exercise existing build + accessibility + Lighthouse gates on the change.

---

## 10. Boundaries

**Always:**
- Derive the handoff topology from existing prose; don't invent new routing rules.
- Preserve existing `**Handoff triggers**:` prose paragraphs verbatim.
- Run `bundle exec jekyll build` before pushing.

**Ask first about:**
- Adding any new handoff edge not implied by existing prose.
- Changing the General Agent terminal status (currently confirmed terminal).
- Moving the `## Handoff Graph` section to a different location than between `## Agent Roster` and `## Protected Files`.

**Never:**
- Modify the persona roster itself (additions, removals, renames). [Out of scope per #946]
- Modify handoff *triggers* — only document the graph, not the conditions. [Out of scope per #946]
- Touch `.github/skills/`, `.github/instructions/`, or `.github/copilot-instructions.md` — those are governance surfaces under `governance-update` label conventions. [Out of scope per #946]
- Add cross-repo or cross-org A2A protocol integration. [No-op in #902]
- Touch any protected file (`_config.yml`, `.github/CODEOWNERS`, `Gemfile`, `Gemfile.lock`).

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Mermaid plugin not actually loaded → diagram renders as a code block, not a graph | Verify with `bundle exec jekyll serve` locally before pushing; if unsupported, fall back to a plain Markdown table representing the edges (AC-3/AC-4 would need amending). |
| AGENTS.md table format varies across personas (verified in §1 — five tables share `\| Property \| Value \|` header) | Audit each table during BUILD; if any deviates, normalise as part of this PR scope. |
| Reviewer requests `graph TD` instead of `graph LR` | Trivial swap; ack and update. |
| Future persona added without updating the graph | Out of scope for this PR — but the new structured row makes the gap detectable by a future grep-based CI check (potential follow-up). |

---

## 12. Out of Scope

Per issue #946:

- Changing the persona roster (additions, removals, renames)
- Modifying handoff *triggers* (only documenting the graph, not the conditions)
- Touching `.github/skills/`, `.github/instructions/`, or `.github/copilot-instructions.md`
- Cross-repo or cross-org A2A protocol integration (No-op in #902)
- A CI check that lints the handoff graph against the prose (a sensible follow-up, but not in this PR)
