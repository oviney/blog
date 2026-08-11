# SPEC — The two CI rows the PR-gate epic left behind

**Stream:** `docs/BACKLOG.md` P3 ×2 · **Priority:** P3 · **Scope:** S · **Dependencies:** none (the P1 epic closed in #1201)
**Date:** 2026-08-02 · **Label:** `agent:qa-gatekeeper` · **Issue:** none — local backlog items
**Status:** not started — **read §2 first, it recommends closing one row without writing code**

---

## 1. Objective

The PR-gate restructure (#1194, #1195, #1197, #1200) closed as a four-stream epic
and left two P3 rows open. This spec exists so the next session does not
re-derive them, and to record that **one of the two should probably be closed as
done rather than built**.

Neither row blocks anything. Both are cheap to get wrong in the direction of
over-engineering, which is the specific failure this repo has already paid for.

---

## 2. Row 1 — De-duplicate Jekyll builds. RECOMMENDATION: close as done.

**The row's premise is stale.** It says a PR builds the site "~4 times across
`test-build`, `content-validation` and `test-quality` jobs". Measured on
post-#1197 `main`, a PR builds it **twice**:

| Workflow | Job | Builds? | Why |
|----------|-----|---------|-----|
| `test-build.yml` | `build` | **yes** | htmlproofer runs against `_site/`, so the job needs a build regardless |
| `test-quality.yml` | `build-site` | **yes** | uploads `site-build-quality` for the contract and pixel jobs |
| `test-build.yml` | `validate-editorial` | no | `validate-posts.sh` reads `_posts/`, not `_site/` |
| `test-build.yml` | `check-agent-scope` | no | operates on the diff |
| `content-validation.yml` | `validate-posts` | no | never built; also only fires on `_posts/**` |

#1197 already took the count from 4 to 2. The row's remaining scope is "make it 1".

**The remaining duplicate costs ~25s.** The `build` job runs 24-30s *in total*
across five sampled PR runs, and that includes Ruby setup, htmlproofer and
front-matter validation — the build itself is a fraction. Because GitHub bills
per job-minute, removing the duplicate build saves **zero billable minutes**: the
job still has to exist for htmlproofer.

**Why the obvious fix is not worth it.** The two builds live in *different
workflows*, and GitHub cannot share an artifact between workflows running
concurrently — `workflow_run` fires after completion, not during. Removing the
duplicate therefore means merging `test-build.yml`'s `build` job into
`test-quality.yml`, which:

- moves or renames the `build` required status check, requiring another
  branch-protection change — the operation that deadlocks the repo if mistimed
  (see #1197);
- collapses two workflows with different trigger sets into one;
- saves ~25s on a job that runs in parallel with slower ones, so the PR's
  critical path does not move at all.

That is three workflows' worth of risk to save one script's worth of time. The
repo's own standing principle — *one script beats three workflows, match
complexity to scale* — says no.

**Recommendation: close the row**, recording that #1197 did the part that paid
(4 → 2 builds, 13.3 → 7 job-min) and that the last duplicate is load-bearing for
htmlproofer. If it is ever revisited, do it as a deliberate
consolidate-the-workflows change with its own spec, not as a performance tweak.

If the owner disagrees and wants it built anyway, the acceptance criteria are
in §4.

---

## 3. Row 2 — Decide the fate of cross-browser coverage

`playwright.config.ts:98-115` declares Desktop Firefox and Desktop Safari behind
`PLAYWRIGHT_ALL_BROWSERS=1`. They are opt-in because CI installs chromium only,
so **376 of the suite's 940 test executions had never run once** while
`continue-on-error: true` on the shards swallowed the "Executable doesn't exist"
failures. The suite advertised cross-browser coverage it never had.

This is a **decision**, not an implementation. Two honest options:

**Option A — enable on the nightly path only.** Add
`npx playwright install firefox webkit --with-deps` and
`PLAYWRIGHT_ALL_BROWSERS=1` to `🌙 Nightly Full Suite` in `test-quality.yml`.
Non-blocking by construction, and the repo is public so Actions minutes are free.

- *Real cost:* these tests have **never executed**, so the first run will almost
  certainly produce a burst of failures — engine-specific rendering, focus
  behaviour, `boundingBox` rounding. That burst becomes triage work, arriving as
  one auto-filed issue at 02:00 UTC.
- *Real benefit:* the site is static Jekyll with little JavaScript, so the
  plausible cross-browser defects are CSS-layout ones — exactly what the existing
  overflow and design-token assertions would catch in another engine.

**Option B — delete the projects.** Remove the `PLAYWRIGHT_ALL_BROWSERS` block
and its comment. Honest, zero maintenance, and stops the config implying coverage
that does not exist.

**Recommendation: Option A with a tripwire.** Enable on nightly, then triage the
first run *once*. If the failures are engine noise rather than real defects,
delete the projects (Option B) and record why. If any real defect surfaces, keep
them. Decide within one nightly cycle — do not leave a red nightly standing,
because a permanently-failing non-blocking job is how this repo got here in the
first place.

The tripwire matters more than the choice. Either outcome is fine; drifting
without deciding is not.

---

## 4. Acceptance criteria

**Row 1 — only if built against the §2 recommendation**

- [ ] A PR builds the site exactly once, proven by counting `jekyll build` steps
      in one PR's runs, not by reading the YAML.
- [ ] `build` still reports under that exact name, or branch protection is
      updated in the same window as the merge.
- [ ] htmlproofer still runs against a real `_site/`.
- [ ] Billable job-minutes measured before and after, stated in the PR body.
      **If the delta is zero, close the row instead of merging.**

**Row 2**

- [ ] A written decision — A or B — recorded in `docs/BACKLOG.md` with its reason.
- [ ] If A: `🌙 Nightly Full Suite` installs firefox and webkit and sets
      `PLAYWRIGHT_ALL_BROWSERS=1`; the first nightly is triaged within one cycle
      and the outcome recorded.
- [ ] If B: the projects and their comment are gone from `playwright.config.ts`,
      and `docs/TEST_TRACEABILITY.md` states the suite is chromium-only.
- [ ] Either way, no config remains that implies coverage the suite does not have.

---

## 5. Commands

```bash
bundle exec jekyll build                              # validate before any PR
npm run test:contract                                 # the blocking gate, ~20s
npx playwright install firefox webkit --with-deps     # Option A only
PLAYWRIGHT_ALL_BROWSERS=1 npx playwright test         # Option A, run locally first

# Count real builds in a PR's runs — do not infer this from the YAML.
gh run view <run-id> --json jobs --jq '.jobs[].name'
```

---

## 6. Testing strategy

Both rows are CI changes, so the pipeline is the test:

- Verify against a **measured run**, not a diff. State billable job-minutes and
  wall-clock in the PR body against the post-#1197 baseline of **7 job-min /
  2m26s / 1 Jekyll build in `test-quality.yml`**.
- For Row 2 Option A, run the two new engines **locally first**. Do not discover
  376 first-time failures inside a scheduled job.
- Any new or rewritten assertion must be mutation-tested — break the thing it
  guards, watch it go red with the offender named, restore, watch it go green.
  See `.github/instructions/tests.instructions.md` §"Every test must be able to
  fail".

---

## 7. Boundaries

**Always** — measure before claiming an improvement; keep each PR atomic; update
`docs/TEST_TRACEABILITY.md` in the same PR that changes what runs.

**Ask first** — any change to branch-protection required contexts; any change
that renames or moves the `build` or `🎭 Page Contract` checks.

**Never** — modify `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`,
`.github/copilot-instructions.md`; push directly to `main`; weaken an assertion
to make a test pass; leave a permanently-red non-blocking job standing.

---

## 8. Out of scope

The other two open P3 rows have their own owners and are already described in
`docs/BACKLOG.md`: removing the legacy homepage CSS orphaned by #1193
(`agent:creative-director` — 35 dead rule openers, keep `.home-intro-links`), and
the custom-agents-vs-label-routing ADR (`governance-update`, #1110).

---

## Appendix — what the PR-gate epic established

Carried here so a cold session does not re-derive it.

| | Before | After (#1197) |
|---|---|---|
| Billable job-min per PR | 13.3 | **7** |
| Wall-clock | ~5 min | **2m26s** |
| Jekyll builds in `test-quality.yml` | 4 | **1** |

The ≤5 job-min target was **missed**. Actual compute is ~5 min; the rest is
GitHub's per-job minute rounding across five short jobs. Recorded as missed
rather than quietly rescoped.

**Required status checks are now** `build`, `🔒 Security Audit`,
`🖼️ Visual Regression`, `🎭 Page Contract`. The three `🎭 Playwright Shard N/3`
contexts were retired. **Changing what a workflow emits requires updating branch
protection in the same window, or every later PR deadlocks on a check that never
reports.** Verified once via throwaway PR #1199.

**A correction worth keeping.** The original review characterised the
`redesign/home-2026` failures as "5:0 rot" — all stale tests, no real bugs. That
was wrong: it was 1 stale test plus 3 real defects (theme drop-cap leak,
furniture contrast), fixed in `50001e9`. *"Red gate ⇒ stale tests"* is not a safe
inference from test names alone.

**The generator is fixed, and that is the durable part.**
`.github/instructions/tests.instructions.md` used to instruct every agent
touching `tests/**` to wrap interactions in `try/catch` and log skips "rather
than throwing". It now carries an "Every test must be able to fail" rule. A
suite-wide sweep after #1200 returns **0** files with `nuclear` /
`ultra-permissive`, **0** with `toBeGreaterThanOrEqual(0)`, and **0** with
conditional `test.skip(true, …)`. Keep it that way.
