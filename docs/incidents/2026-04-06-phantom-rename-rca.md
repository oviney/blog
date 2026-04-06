# RCA: Phantom Skills-Rename Commits in Agent PRs

**Date:** 2026-04-06  
**Severity:** Medium — no production impact; three open PRs carry ~10 out-of-scope files  
**Status:** Analysis complete; fix tracked in sibling issue

---

## 1. Timeline

| Timestamp (UTC) | Event |
|---|---|
| 2026-04-05T11:37:43Z | PR #561 (`copilot/set-up-google-search-console`) opened; branch forked from main @ `f5329a0d` |
| 2026-04-05T12:21:45Z | PR #576 (`copilot/mobile-layout-match-economist`) opened; branch forked from main @ `18b15f69` |
| 2026-04-05T22:28:45Z | PR #578 (`copilot/add-codeowners-file`) opened; branch forked from main @ `5701e0e7` |
| **2026-04-05T23:39:19Z** | **PR #580 merged to main as commit `2d3b0c8` — `docs/skills/` → `.github/skills/` rename, plus `description:` fields and `scripts/agent-status.sh`** |
| 2026-04-06T01:51:00Z | Three follow-on commits land on main (`010e993c`, `fcadfede`, `f32863d8`) |
| 2026-04-06T02:38:49Z | Cherry-pick of `2d3b0c8` applied to PR #561 branch → `8fb0e1eb` |
| 2026-04-06T02:41:18Z | Cherry-pick of `2d3b0c8` applied to PR #578 branch → `eb358497` |
| 2026-04-06T02:42:56Z | Cherry-pick of `2d3b0c8` applied to PR #576 branch → `136fc856` |

All three cherry-picks landed within a **4-minute window** and carry the same author date (`2026-04-05T23:39:19Z`) as the original merge commit, confirming they are derived from `2d3b0c8`.

---

## 2. Evidence

### Overlapping out-of-scope files (present in all three PRs)

| File | Type |
|---|---|
| `.github/skills/README.md` + 6 `SKILL.md` files | Renamed from `docs/skills/` |
| `.github/instructions/*.instructions.md` (×3) | `description:` field added |
| `scripts/agent-status.sh` | New file |
| `.github/copilot-instructions.md` | Protected file modified |
| `AGENTS.md`, `ARCHITECTURE.md`, `docs/AI_CODING_GUIDELINES.md` | Reference path updates |

### Commit fingerprint

`git cat-file -p` reveals the mechanism:

```
# 2d3b0c8 — real merge commit on main
tree  4141dcf4   parent 5701e0e7
author 1775432359   committer 1775432359

# eb358497 — phantom on PR #578 (cherry-pick of 2d3b0c8)
tree  4141dcf4   parent b7520360  ← PR's own "Initial plan" commit
author 1775432359   committer 1775443278  ← committed ~3 h later
```

The author epoch (`1775432359`) is identical; the committer timestamps differ by ~3 hours. PRs #576 and #561 have the same pattern with different branch tips and therefore different resulting trees.

---

## 3. Root Cause Hypotheses (ranked by evidence)

### (a) ★★★★★ Copilot's auto-update cherry-picked `2d3b0c8` onto stale branches

All three PR branches forked from `main` **before** PR #580 merged. Roughly three hours after the merge, a Copilot platform process applied main's new commits to each open branch via `git cherry-pick` rather than `git merge`. Because cherry-pick preserves the original author date, the phantom commits carry `2d3b0c8`'s timestamp but receive fresh SHAs. The four-minute application window and identical author epochs on all three branches make this the only mechanism consistent with the evidence.

### (b) ★★☆☆☆ Stale `docs/skills/` paths in agent instruction context

`copilot-instructions.md` and the PR template still referenced `docs/skills/*/SKILL.md` at the time the agent sessions were started. An agent reading those files might independently re-apply the rename. This could be a **contributing** factor (it would explain why agents also modified `copilot-instructions.md`), but it cannot explain the identical author timestamps or the presence of commits unrelated to skills (e.g., `scripts/agent-status.sh`, Playwright fixes) that also mirror main commits exactly.

### (c) ★☆☆☆☆ Shared branch template

No evidence found. Each branch shows a distinct "Initial plan" commit authored by `copilot-swe-agent[bot]` with different parent SHAs.

---

## 4. Contributing Factors

- **No `required up-to-date` branch protection** — PRs are not required to be current with `main` before merging, so stale bases are never surfaced.
- **No CI scope check** — nothing in the workflow validates that a PR's changed-file set is consistent with its stated issue scope.
- **Cherry-pick update strategy** — the auto-update mechanism uses cherry-pick, which inserts commits into branch history rather than a clearly labelled merge commit, making the foreign commits harder to spot in review.
- **Protected file lacks write guard** — `.github/copilot-instructions.md` has no CODEOWNERS rule requiring human approval, so agent updates silently pass review.
- **Eval harness not yet required by CI** — the scope_adherence check (PR #584) runs post-hoc rather than as a required status check.

---

## 5. Recommendations

- **Add `required up-to-date` branch protection** so each PR must merge from the current `main` HEAD before it can be reviewed; this eliminates stale bases and forces conflicts to surface early.
- **Require scope_adherence as a blocking status check** — the eval harness from PR #584 should run on every PR and block merge if out-of-scope files are detected.
- **Add a CODEOWNERS rule for `.github/copilot-instructions.md`** so any modification triggers a required human review.
- **Update PR template and all instruction files** to remove remaining `docs/skills/` references so agents no longer receive stale path context.
- **Configure the auto-update strategy to use `merge` instead of `cherry-pick`** — a merge commit is clearly attributable and easier to identify in history than cherry-picked commits that impersonate original authors.
