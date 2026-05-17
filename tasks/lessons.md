# Lessons — operational playbooks captured in flight

Non-obvious findings from real recovery work. Each entry is a pattern that cost time the first time it surfaced; the goal is to avoid paying for it twice.

---

## L1 — Orphan commits with closed issues: verify ship state, not issue state

**Symptom.** A GitHub issue is `CLOSED` with `stateReason: COMPLETED`. Local `git log` shows commits whose messages reference the issue and look like the implementation. It feels done.

**Trap.** "Closed" on GitHub and "shipped to `origin/main`" are independent facts. An issue can be manually closed without a PR ever landing the code. We hit this on 2026-05-12 with #904/#905 — both closed, but the implementation commits (`7e793c8`, `bd91f5f`) were authored locally and never pushed. Recent `gh issue list` reports treated them as resolved; the validator capability was missing from production.

**How to detect early.**

```bash
# Are there local commits referencing the issue that aren't on origin?
git log origin/main..HEAD --oneline | grep -E "#(904|905)"

# Did the issue close with no PR attached?
gh issue view <N> --repo <repo> --json closedByPullRequestsReferences,stateReason
# closedByPullRequestsReferences: []  AND  stateReason: COMPLETED  →  manual close, suspect
```

**Recovery.** Don't treat the closure as authoritative. Verify the actual code on `origin/main` matches what the issue described (`git diff origin/main HEAD -- <expected paths>`). If the code is missing, ship it on a fresh branch. Leave the issue closed; use `Closes #N` on the PR to re-associate cleanly. Comment on the closed issue with the PR link so other agents have the trail.

---

## L2 — Cherry-pick is not integration: re-verify against current `main`

**Symptom.** Orphan commits cherry-pick cleanly with no merge conflicts. Tree, lockfile, even tests "look fine."

**Trap.** A clean cherry-pick proves textual non-conflict, not behavioral correctness. Between the orphan's author date and today, other PRs may have changed the *shape* of what the orphan integrates with — return types, scoring bands, function signatures, JSON schemas. The cherry-pick won't fail; the system will just quietly mis-behave.

**Concrete case from 2026-05-13.** Orphan `7e793c8` added §7 "broken internal-link detection" returning a 10-pt score band. Three weeks later, PR #907 (`f68962a`) added §8 "tag scoring" — also 10 pts. A naive cherry-pick of `7e793c8` would have summed correctly only because `scorePost()` already had `Math.min(score, 100)` at the return (sections sum to 110, capped to 100 by design — see `scripts/content-review.js` header comment). Without verifying this, the integration could just as easily have double-counted into 110/100 scores leaking into automation that assumes 0–100.

**Required pre-PR check.**

```bash
# 1. Run the relevant script end-to-end on local main, capture output
node scripts/content-review.js --dry-run --json
cp content-review-results.json /tmp/baseline.json

# 2. Cherry-pick onto a trial branch, re-run, diff
git checkout -b trial origin/main && git cherry-pick <orphan-shas>
node scripts/content-review.js --dry-run --json
diff <(jq -S '.results[] | {filename, score, ...}' /tmp/baseline.json) \
     <(jq -S '.results[] | {filename, score, ...}' content-review-results.json)
```

**Heuristic.** Any cherry-pick more than ~1 week old that touches scoring, schema, or a return shape: re-run end-to-end before opening the PR. The fact that `git cherry-pick` returned 0 is not the gate.

---

## L3 — Research-sweep "CVE in transitive dep" findings must check `package.json` overrides

**Symptom.** A research sweep identifies a CVE in a transitive dependency (e.g., pa11y-ci → lodash GHSA-X) and recommends bumping the parent package to the version that "patches" the transitive dep. The issue is framed as urgent security work and an Action follow-up gets spawned.

**Trap.** The CVE may already be mitigated by an existing `package.json` `overrides` block. `npm audit` will report **0 vulnerabilities** even though the parent dep is at the older version, because the override is forcing the transitive dep up to the patched line. We hit this on 2026-05-16 with #944 — the sweep claimed pa11y-ci 4.1.0 was vulnerable via lodash and recommended bumping to 4.1.1. In reality, the repo already had `"overrides": { "lodash": "^4.18.1" }` (added by an earlier hygiene cycle), and lodash was already at 4.18.1 in the lockfile. The bump would have been a hygiene win at best, not a CVE response, but the issue body framed it as security-urgent.

**How to detect early — before accepting any "bump X to clear CVE Y" sweep finding:**

```bash
# Does an override already cover the transitive dep the CVE is in?
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.overrides||{}, null, 2));"

# Does npm audit actually flag the vuln on the current lockfile?
npm audit --omit=dev
```

If `npm audit` is clean **and** an override touches the same transitive dep as the CVE: the CVE is already mitigated. The Action recommendation is mis-framed.

**Recovery.**

- *For the spawned issue:* either close as "already fixed by existing override" (with a link to the override block) or reframe as hygiene-only (remove the security/urgency language, keep the dep-alignment benefit if material). Don't merge the bump under a security framing.
- *For the methodology gap:* update the research-sweep subagent prompt template to require checking `package.json` `overrides` (and `npm audit` clean state) before classifying any dep-bump recommendation as Action. Failing that check, the finding is at best a **No-op** with the override as the repo-state justification, or a **Watch** for the day the override can be removed.

**Heuristic for the next sweep's SPEC.** The §6 "Subagent prompt requirements" clause should add: *"Any Action recommending a dep version bump for CVE/security reasons must include the exact `node -e ... overrides` and `npm audit` output as part of the citation. Without that evidence, the finding is incomplete."*

---

## Adding new lessons

Lessons here should be:

- **Operational, not architectural.** Architecture goes in `.github/skills/*/SKILL.md` and `AGENTS.md`.
- **Patterns, not one-off fixes.** A specific bug fix lives in its commit/PR; the *recognition pattern* that lets future-you spot it earlier lives here.
- **Bounded — each lesson is ≤ ~200 lines and has a Symptom / Trap / Detection / Recovery (or analog) structure.** If it's longer than that, it probably wants its own document.
