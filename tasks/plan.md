# Plan — Puppeteer Chrome-Download Flake Mitigation (#958)

**Spec:** [SPEC.md](../SPEC.md)
**Issue:** [#958](https://github.com/oviney/blog/issues/958)
**Date:** 2026-05-17
**Lifecycle phase:** PLAN
**Plan SHA:** `b965ddb`

**Anchors confirmed at this SHA:**

- **Affected workflow:** `.github/workflows/test-quality.yml` only (`grep -l setup-node .github/workflows/*.yml` confirms 4 other workflows also use it, but they're explicit Out-of-Scope per SPEC §10)
- **7 affected jobs** in `test-quality.yml`, each with a `setup-node@v6` + `npm ci` pair to migrate:
  - `quality-checks` — setup-node line 124, npm ci line 130
  - `security` — setup-node line 188, npm ci line 194
  - `playwright-partial` — setup-node line 220, npm ci line 226
  - `playwright-shard1` — setup-node line 312, npm ci line 318
  - `playwright-shard2` — setup-node line 377, npm ci line 383
  - `playwright-shard3` — setup-node line 442, npm ci line 448
  - `quality-report` — setup-node line 506, npm ci line 512
- **No `.github/actions/` directory exists yet** — this PR creates it
- **No existing `actions/cache` usage anywhere** in workflows — confirmed at SHA `b965ddb`

---

## Context

3 files net: 2 new (`action.yml`, `_retry-test.sh`) + 1 modified (`test-quality.yml`). Well under the 15-file scope-explosion limit; no `bulk-content` label needed on this PR.

The migration is mechanical: every call-site is the same `setup-node@v6` (with `node-version: '20'` and `cache: 'npm'`) immediately followed by `npm ci`. The composite action's defaults match those values exactly, so each migration is a pure 8-line → 2-line substitution.

The retry-loop unit test (`_retry-test.sh`) is the load-bearing local verification. Cache hit/miss behavior is only observable in CI logs post-merge, so the local gate before push is: composite action exists, all 7 call-sites migrated, YAML parses, retry harness passes.

---

## Dependency graph

```
T1 (composite action: action.yml + _retry-test.sh)
  │
  ├──► T2 (RED retry test: mock npm that fails 3x → harness exits 1)
  │       │
  │       ▼
  │     (proves the harness can detect failure modes)
  │
  ▼
T3 (RED→GREEN retry test: mock npm fails 2x, succeeds 3rd → harness exits 0)
  │
  ▼
T4 (migrate 7 call-sites in test-quality.yml)
  │
  ▼
T5 (local verification: YAML parses, no other workflows touched, retry harness still green)
  │
  ▼
CHECKPOINT-A — local gate (composite action works, all 7 sites migrated, AC-8 boundary clean)
  │
  ▼
T6 (/review pass via code-reviewer agent)
  │
  ▼
T7 (apply any /review revisions; commit)
  │
  ▼
T8 (push branch + open PR with retry-test output, baseline counts, AC-8 confirmation)
  │
  ▼
T9 (CI passes — note that THIS PR runs against the OLD workflow + a NEW workflow; the renamed steps may invalidate cached results; tolerate one rerun if Chrome flake hits during transition)
  │
  ▼
T10 (admin-merge after CI green)
  │
  ▼
T11 (post-merge: open a tiny follow-up PR to verify `Cache restored from key:` logs appear for puppeteer — confirms AC-5 in real CI)
```

T1–T3 deliver the composite action with local proof of the retry behavior. T4 activates it. T5 is the local gate. T6 closes the lifecycle's review-phase gap. T11 is the **AC-5 verification** that can only happen post-merge.

---

## Phase 1 — Composite action

### T1 — Write `action.yml` + `_retry-test.sh` scaffolds

**ACs satisfied:** AC-1 (interface), AC-2 (steps shape — verified by inspection), AC-9 (YAML well-formed)
**Touches:** `.github/actions/setup-node-with-puppeteer-cache/action.yml` (new), `.github/actions/setup-node-with-puppeteer-cache/_retry-test.sh` (new)

**Steps:**

1. `mkdir -p .github/actions/setup-node-with-puppeteer-cache`
2. Write `action.yml` per SPEC §6 verbatim — pinned `actions/setup-node@v6`, `actions/cache@v4`, inline shell retry loop with `for attempt in 1 2 3` + 10s `sleep` between attempts, `::warning::` / `::error::` log syntax.
3. Write `_retry-test.sh` as the local harness. It must:
   - Create a temp dir, write a fake `npm` script that reads a counter file, fails N times, then succeeds
   - Extract the retry-loop shell code from `action.yml` (or duplicate it in the harness — see T2/T3 decision below)
   - Assert exit codes and log-line counts for the two scenarios in T2 and T3
4. Decision: **duplicate the retry-loop code** in `_retry-test.sh` rather than extract from YAML. Reason: parsing the inline shell script out of YAML is fragile; duplication keeps the harness honest about what it's testing. The two copies must stay in sync — `_retry-test.sh` header carries a comment naming `action.yml` as the source of truth and instructing future editors to update both.

**Verify (mechanical):** `python3 -c "import yaml; yaml.safe_load(open('.github/actions/setup-node-with-puppeteer-cache/action.yml'))"` exits 0; `bash -n .github/actions/setup-node-with-puppeteer-cache/_retry-test.sh` exits 0.

---

### T2 — RED retry test (mock npm fails 3 times)

**ACs satisfied:** AC-6 (partial — proves the harness can detect failure)
**Touches:** none beyond T1

**Steps:**

1. Run `bash .github/actions/setup-node-with-puppeteer-cache/_retry-test.sh fail-fail-fail`
2. Expect: exit code **1**, stdout contains 3 attempt-failure log lines, ends with `npm ci failed after 3 attempts`
3. **This is the RED proof** — the retry loop genuinely surfaces failures rather than swallowing them.

**Verify:** assert exit 1, count log lines, no false positives.

---

### T3 — GREEN retry test (mock npm fails twice, succeeds on 3rd)

**ACs satisfied:** AC-6 (full)
**Touches:** none beyond T1

**Steps:**

1. Run `bash .github/actions/setup-node-with-puppeteer-cache/_retry-test.sh fail-fail-succeed`
2. Expect: exit code **0**, stdout contains 2 retry-warning lines, ends with `npm ci succeeded on attempt 3`

**Verify:** assert exit 0, 2 retry-warning lines, no `::error::` lines.

---

## Phase 2 — Migrate call-sites

### T4 — Replace 7 `setup-node + npm ci` pairs in `test-quality.yml`

**ACs satisfied:** AC-3 (full)
**Touches:** `.github/workflows/test-quality.yml`

**Migration pattern (per SPEC §7) — every call-site:**

Before:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: '20'
    cache: 'npm'

- name: Install dependencies
  run: npm ci
```

After:
```yaml
- name: Setup Node + cache + install deps
  uses: ./.github/actions/setup-node-with-puppeteer-cache
```

Apply to all 7 jobs listed in "Anchors confirmed" above. The substitution is pure — no input overrides needed because every call-site uses the default values (`node-version: '20'`, `cache: 'npm'`).

**Verify (per-job, after each substitution):**
- The job's step list is shorter by 6 lines (2 steps × 4 / 3 lines minus the new 2-line step)
- The job's YAML still parses

**Verify (after all 7 are done):**
- `grep -c "setup-node@v6" .github/workflows/test-quality.yml` → **0**
- `grep -c "uses: ./.github/actions/setup-node-with-puppeteer-cache" .github/workflows/test-quality.yml` → **7**
- `grep -c "^      - name: Install dependencies$" .github/workflows/test-quality.yml` → drops from 7 to 0
- `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test-quality.yml'))"` exits 0

---

## Phase 3 — Local verification

### T5 — AC-8 boundary check + re-run retry harness

**ACs satisfied:** AC-8 (boundary), AC-6 (re-confirm post-migration)
**Touches:** none (read-only verification)

**Steps:**

1. `git diff --stat .github/workflows/` — expect ONLY `.github/workflows/test-quality.yml` modified.
2. `git diff --stat .github/actions/` — expect TWO new files under `.github/actions/setup-node-with-puppeteer-cache/`.
3. `git diff --stat` (whole repo) — expect 3 files total (2 new + 1 modified). No `_posts/`, `_layouts/`, `_sass/`, `package.json`, `package-lock.json`, etc.
4. Re-run `_retry-test.sh` in both modes (`fail-fail-fail`, `fail-fail-succeed`). Both still pass.

---

### CHECKPOINT-A — Local gate before /review

**Gate criteria (all must be true before T6):**

- [ ] T1 deliverables exist; YAML and bash both parse cleanly
- [ ] T2 RED test produces exit 1 with 3 failure log lines
- [ ] T3 GREEN test produces exit 0 with 2 retry-warning lines + success line
- [ ] T4 substitutions complete (grep counts match: 0 `setup-node@v6`, 7 composite-action references)
- [ ] T5 AC-8 boundary check clean (exactly 3 files modified)
- [ ] `git status --short` shows only the 3 expected files

---

## Phase 4 — REVIEW pass

### T6 — `/review` via code-reviewer agent

**ACs satisfied:** lifecycle requirement, not a specific spec AC
**Touches:** none (read-only review)

**Brief the reviewer on:**
- The composite action's interface and step ordering (cache step **before** npm ci to populate the cache directory before puppeteer reads it)
- `actions/cache@v4` key strategy — `${{ runner.os }}-puppeteer-${{ hashFiles('**/package-lock.json') }}` with restore-key fallback
- The retry loop's exit handling — does the wrapper genuinely fail-fast when npm ci returns non-zero, vs. silently retrying forever?
- AC-3 substitution fidelity — 7 jobs migrated, defaults preserved
- Whether `_retry-test.sh` is a real test or a placeholder

**Expected findings shape:** Major (cache-key correctness, step ordering, retry-exit-handling), Minor (action.yml descriptive prose, _retry-test.sh hygiene), Nit (commit-message hygiene).

### T7 — Apply revisions; commit any post-review changes

**ACs satisfied:** finishes any open AC items raised by /review
**Touches:** depends on review findings

---

## Phase 5 — Ship

### T8 — Push branch + open PR

**ACs satisfied:** DoD bullet 4 (PR description includes test output, counts, AC-8 confirmation)
**Touches:** git remote.

**Commit structure on branch `chore/958-puppeteer-cache-and-retry`:**
- **Commit A** (T1): `chore(ci): add setup-node-with-puppeteer-cache composite action (#958)` — action.yml + _retry-test.sh; no callers yet (no behaviour change to any workflow).
- **Commit B** (T4): `chore(ci): migrate 7 test-quality.yml jobs to use puppeteer-cache composite action (#958)` — pure substitution; closes #958.
- **Commit C** (T7, if any): `chore(ci): apply /review revisions (#958)` — only if revisions were applied.

PR body includes:
- The 7 affected jobs listed by name
- Verbatim output of both `_retry-test.sh` runs (3-fail and 2-fail-succeed)
- `git diff --stat` output showing the AC-8 boundary
- Note that AC-4 / AC-5 (cache miss + cache hit) verification happens post-merge in CI logs

**Labels:** no `agent:*` label (the PR touches `.github/actions/` and `.github/workflows/` — both are QA scope under `agent:qa-gatekeeper`'s `FORBIDDEN_PATTERN` of `^_sass/|^_layouts/|^_posts/|^_config\.yml$`, so `agent:qa-gatekeeper` is **valid** and should be applied). No `governance-update` (workflows aren't in `.github/skills/` or `.github/instructions/`).

### T9 — CI passes

**Note:** This PR's CI run will execute the **new** composite action against itself (the workflow file changes apply to this PR's own run). Two outcomes possible:

- **Best case:** cache is empty on first run → puppeteer downloads → cache populates → next run uses it. Single CI cycle.
- **Same-flake case:** Chrome 146 download flake hits the cold-cache install. Retry loop's job is to absorb it. If the retry loop fails (e.g., 3 attempts × 10s isn't enough for a wide CDN outage), one rerun should fix it just like #957's first run.

Tolerate one rerun if the Chrome flake hits during this transition PR; the cache will be primed for subsequent runs.

### T10 — Admin-merge after green

**ACs satisfied:** AC-3 (final, in `main`)
**Touches:** git remote (merge).

`gh pr merge <N> --admin --squash --delete-branch` once CI green. Sync local `main`. Verify the composite action file and migrated workflow both made it.

---

### T11 — Post-merge AC-5 verification

**ACs satisfied:** AC-5 (cache hit observed in real CI)
**Touches:** open a tiny follow-up PR (e.g., a docs typo fix or whitespace edit) to trigger a fresh CI run.

**Steps:**

1. Open a trivial PR (any small change) on `main` after #958 merges.
2. Inspect the CI logs for one of the 7 affected jobs.
3. Look for `Cache restored from key: <runner-os>-puppeteer-<hash>` near the start of the install step.
4. If found: AC-5 satisfied, close the trivial PR with a comment linking to the cache-hit log.
5. If not found: investigate immediately — cache misses on a known key indicate a key-mismatch bug.

**Justification for the trivial PR:** AC-5 can only be observed in real CI, not local. Without the post-merge check, AC-5 remains unverified. A small follow-up PR is the cheapest way to observe cache-hit behavior without waiting for an unrelated future change.

---

## Risk register

| Risk | Mitigation |
|---|---|
| `actions/cache@v4` is not available or API changed | Pin to `@v4` (current stable major); if unavailable, fall back to `@v3` with a comment. Confirm at runtime via CI logs. |
| Cache key collision between Node versions or OS variants | Key includes `${{ runner.os }}-puppeteer-…`; restore-keys fallback to OS-prefix. Different Node versions on the same OS share the puppeteer dir, which is correct (Chrome binary is OS+arch-dependent, not Node-dependent). |
| Retry loop swallows a genuine, non-transient failure | Loop preserves npm ci's exit code on the third attempt; `::error::` log line on terminal failure makes it visible in the workflow run summary. Reviewer should confirm. |
| Composite action's relative-path reference (`./.github/actions/...`) doesn't resolve when called from a workflow | This is the standard GitHub Actions convention for in-repo composite actions; works as long as `actions/checkout@v6` runs before the composite-action call (verified in all 7 affected jobs at baseline). |
| First post-merge run still hits the Chrome flake before cache populates | Acceptable — the retry loop absorbs it; if even the retry exhausts, one manual rerun (same pattern we paid twice today). Once cache is primed, subsequent runs skip the download. |
| One of the 7 jobs has a subtly different setup-node configuration that the composite action's defaults don't match | Verified at baseline: all 7 use `node-version: '20'` + `cache: 'npm'` verbatim. T4's grep checks would flag any drift mid-migration. |
| The reviewer raises a "use third-party retry action" objection | Documented in SPEC §9 boundaries (chose inline shell loop for fewer deps). Reviewer is free to disagree; absent strong evidence, defer to the SPEC's decision. |
| AC-5 verification PR (T11) doesn't trigger the right jobs (e.g., change-based test selection skips them) | If `select-tests` skips the affected jobs, manually `gh workflow run test-quality.yml` against the branch to force a full run. Documented as a fallback in T11. |
