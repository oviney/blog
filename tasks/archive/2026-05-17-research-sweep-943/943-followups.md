# Follow-ups Ledger — Research Sweep #943 (post-creation)

**Spec:** [../SPEC.md](../SPEC.md) §6, §13 · **Plan:** [plan.md](plan.md) T7, T8
**Pre-creation plan:** [943-followups-plan.md](943-followups-plan.md)
**Status:** All 4 issues spawned and verified. CHECKPOINT-B clean.
**Pinned:** §1/§3 floor `2026-05-01` · §4 floor `2026-02-15` · plan SHA `bfe8f5c` · synthesis SHA `530a728` · spawn SHA `d3bcd33`

This is the **post-creation ledger**, distinct from `943-followups-plan.md` (pre-creation truth) per SPEC.md §6.

---

## Spawned issues

| Rec # | Issue | Title | Labels | T8 verification |
|---|---|---|---|---|
| 3 | [#951](https://github.com/oviney/blog/issues/951) | `chore(posts): backfill subtitle: front-matter on all 24 posts and add validator check` | `agent:editorial-chief` | ✓ label + `Spawned from #943` |
| 1 | [#952](https://github.com/oviney/blog/issues/952) | `docs(skills): reference Claude Code /goal + claude agents in using-agent-skills and jekyll-qa SKILLs` | `agent:qa-gatekeeper`, `governance-update` | ✓ label + `Spawned from #943` |
| 4 | [#953](https://github.com/oviney/blog/issues/953) | `feat(mobile): add thumb-zone bottom navigation on mobile viewports` | `agent:creative-director` | ✓ label + `Spawned from #943` |
| 2 | [#954](https://github.com/oviney/blog/issues/954) | `feat(cards): standardise excerpt length and add author byline across discovery surfaces` (merged §4 F1 + §4 F3 at collision pass) | `agent:creative-director` | ✓ label + `Spawned from #943` |

Spawned in order: #951 → #952 → #953 → #954.

---

## Tracked-in references (no spawns; recorded in #943 body)

| Finding | Existing issue | Note |
|---|---|---|
| §1 F3 — A2A Linux Foundation standardisation | **#946** | Reinforces #946's "Handoff" primitive direction. PR author may absorb a one-line note about the A2A vocabulary alignment. |
| §3 F2 — Playwright 1.60.0 page-level ARIA snapshots, `test.abort()`, HAR tracing | **#947** | Exact AC + Files-to-change overlap. New research adds: 1.61.0-alpha exists on npm but does not change #947's scope (still target stable 1.60). |

---

## Parallel-vs-sequential map

```
#951 (subtitle backfill)        ┐
#952 (skill docs)               │   all independent — no Blocked-by chains
#953 (mobile bottom-nav)        │   any pickup order works
#954 (cards consistency)        ┘
```

- **No collisions remaining** after the §4 F1 + §4 F3 merge at T4-collision.
- **All 4 are fully parallelizable.** Recommended single-developer pickup order (smallest blast radius first): #951 (content-only, posts + script) → #952 (governance, 2 skill files) → #953 (mobile-nav, 3 files + test) → #954 (cards, 7 files).

---

## T8 batch verification (SPEC §13)

Query run at spawn SHA `d3bcd33`:

```bash
gh issue list --repo oviney/blog --search "Spawned from #943" --state open --json number,labels,body \
  --jq '.[] | select((.labels | map(.name) | any(test("^agent:"))) and (.body | contains("Spawned from #943"))) | .number'
```

**Output:** `951 952 953 954` (matches planned spawn set exactly — no divergence, no remediation needed).

---

## Remediation log (SPEC §13)

_None._ All 4 issues passed verification on first creation. No `gh issue edit` patches, no `superseded by` replacements were necessary.

---

## Closure context (for T9 / #943 closure comment)

- **In-scope sections covered:** §1 (AI Agent Orchestration), §3 (QE Automation), §4 (Audience Experience). §2 (Copilot) out of scope per SPEC.md §10 / #902 precedent.
- **Findings:** 10 total — **5 Action / 2 Watch / 1 No-op / 2 Tracked-in**. After T4-collision merge of §4 F1 + §4 F3: **4 spawnable Actions**.
- **AC-8 substance floor:** satisfied per section. §1 has 1 Action. §3 has recorded "no substantive change identified" justification (Playwright already #947; Lighthouse blocked by LHCI+Node; GHA actions already current; pa11y / WCAG nothing new). §4 has 4 Actions (3 post-merge).
- **Spawned:** 4 (#951 #952 #953 #954) — exactly at the SPEC §10 hard cap of 4; no override needed.
- **Tracked-in:** 2 (#946 reinforced by A2A; #947 reinforced by Playwright 1.60).
