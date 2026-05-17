# Follow-ups Ledger — Research Sweep #902 (post-creation)

**Spec:** [../SPEC.md](../SPEC.md) §6, §11 · **Plan:** [plan.md](plan.md) T7, T8
**Pre-creation plan:** [902-followups-plan.md](902-followups-plan.md)
**Status:** All 4 issues spawned and verified. CHECKPOINT-B clean.
**Pinned:** date floor `2026-04-15` (#816) · plan SHA `dafab0e` · synthesis SHA `624007a` · spawn SHA `9544be6`

This file is the **post-creation ledger**, distinct from `902-followups-plan.md` (which is pre-creation truth) per SPEC.md §6.

---

## Spawned issues

| Rec # | Issue | Title | Label | Sequence position | T8 verification |
|---|---|---|---|---|---|
| 4 | [#944](https://github.com/oviney/blog/issues/944) | `chore(deps): refresh pa11y-ci to 4.1.1 via lockfile regen (GHSA-f23m-r3pf-42rh)` | `agent:qa-gatekeeper` | **1st** (security patch, must land before Rec 3) | ✓ label + `Spawned from #902` |
| 1 | [#945](https://github.com/oviney/blog/issues/945) | `feat(agents): add memory: frontmatter to local subagents` | `agent:qa-gatekeeper` | Independent (parallelizable with #946) | ✓ label + `Spawned from #902` |
| 2 | [#946](https://github.com/oviney/blog/issues/946) | `docs(agents): make AGENTS.md handoff targets explicit + Mermaid graph` | `agent:qa-gatekeeper` | Independent (parallelizable with #945) | ✓ label + `Spawned from #902` |
| 3 | [#947](https://github.com/oviney/blog/issues/947) | `feat(tests): bump @playwright/test to ^1.60.0 + adopt page-level ARIA snapshots` | `agent:qa-gatekeeper` | **Blocked by #944** (3rd-or-later) | ✓ label + `Spawned from #902` + `Blocked by #944` |

---

## Parallel-vs-sequential map

```
#944 (pa11y-ci CVE)  ──►  #947 (Playwright bump)
                          (Blocked by #944)

#945 (subagent memory)  ──┐
                          ├── independent, can run any time
#946 (handoff graph)  ────┘
```

- **Sequential chain:** #944 → #947 (lockfile dependency).
- **Parallelizable:** #945 and #946 are independent of each other and of the #944/#947 chain. They can be picked up immediately.
- **Recommended pickup order** (single-developer): #944 (fastest, security) → #945 or #946 (in either order) → #947 once #944 merges.

---

## T8 batch verification (SPEC §11)

Query run at spawn SHA `9544be6`:

```bash
gh issue list --repo oviney/blog --search "Spawned from #902" --state open --json number,labels,body \
  --jq '.[] | select((.labels | map(.name) | any(test("^agent:"))) and (.body | contains("Spawned from #902"))) | .number'
```

**Output:** `944 945 946 947` (matches planned set exactly — no divergence, no remediation needed).

---

## Remediation log (SPEC §11)

_None._ All 4 issues passed verification on first creation. No `gh issue edit` patches, no `superseded by` replacements were necessary.

---

## Closure context (for T9 / #902 closure comment)

- **In-scope sections covered:** Section 1 (AI Agent Orchestration), Section 3 (QE Automation). Section 2 (Copilot) explicitly out of scope per SPEC.md §1 / §10.
- **Findings:** 8 total — 4 Action / 2 Watch / 2 No-op. AC-8 substance floor satisfied (≥1 Action per in-scope section: §1 has 2, §3 has 2).
- **Follow-up issues opened:** 4 (well under the SPEC §9 hard cap of 6) — #944, #945, #946, #947.
- **Parallel-vs-sequential:** #944 → #947 sequential (lockfile dependency); #945 and #946 fully parallel.
