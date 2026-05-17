# SPEC — Puppeteer Chrome-Download Flake Mitigation (#958)

**Status:** Draft — awaiting approval
**Issue:** [#958](https://github.com/oviney/blog/issues/958)
**Labels:** `agent:qa-gatekeeper`
**Date:** 2026-05-17
**Lifecycle phase:** DEFINE
**Spawned from:** observed twice in one day (#944 first run, #957 first run) — Chrome 146.0.7680.153 download flakes from puppeteer's CDN providers.

---

## 1. Situation

`actions/setup-node@v6` is already configured with `cache: 'npm'` in `.github/workflows/test-quality.yml`, so npm packages themselves are cached. **The flake is in puppeteer's post-install script** (`node install.mjs`, run during `npm ci`), which downloads Chrome from a separate CDN into `~/.cache/puppeteer/`. That directory is **not** covered by setup-node's npm cache.

Observed flake stack: `Error: ERROR: Failed to set up chrome v146.0.7680.153! ... All providers failed for chrome 146.0.7680.153: DefaultProvider: ENOENT: no such file or directory ...puppeteer/chrome/146.0.7680.153-chrome-linux64.zip`.

`test-quality.yml` defines 7 jobs that pair `setup-node@v6` + `npm ci`: `quality-checks`, `security`, `playwright-partial`, `playwright-shard1`, `playwright-shard2`, `playwright-shard3`, `quality-report`. Each is an independent flake surface. We've taken ~10 minutes of human time today (2 reruns × 5 min) plus a noticeable interruption to two PR merges (#955 indirectly, #957 directly).

---

## 2. Objective

Eliminate the puppeteer Chrome-download flake from `.github/workflows/test-quality.yml` by:

1. **Caching `~/.cache/puppeteer/`** keyed on `package-lock.json` so warm runs skip the Chrome download entirely.
2. **Retrying `npm ci` up to 3 times with 10s backoff** so cold-cache runs (lockfile change, cache eviction) tolerate transient CDN failures.

Both mechanisms live in a **composite action** at `.github/actions/setup-node-with-puppeteer-cache/` so the 7 jobs share a single source of truth. Other workflows (`healing-monitor.yml`, `copilot-setup-steps.yml`) are **out of scope** — migrate later if the pattern proves out.

---

## 3. Acceptance Criteria

- [ ] **AC-1** New composite action at `.github/actions/setup-node-with-puppeteer-cache/action.yml` exists with documented inputs (`node-version` default `'20'`, plus optionally `npm-cache` default `'npm'`).
- [ ] **AC-2** The composite action's steps are: (a) `actions/setup-node@v6` with `cache: '${{ inputs.npm-cache }}'`, (b) `actions/cache@vN` for `~/.cache/puppeteer/` keyed on `${{ runner.os }}-puppeteer-${{ hashFiles('**/package-lock.json') }}` with a restore-key fallback to `${{ runner.os }}-puppeteer-`, (c) `npm ci` wrapped in a 3-attempt retry shell loop with 10s backoff between attempts.
- [ ] **AC-3** Every job in `.github/workflows/test-quality.yml` that currently uses the `setup-node@v6` + `npm ci` pair now uses the composite action instead. Count baseline: 7 jobs (confirmed at SHA `b965ddb`). No `npm ci` invocation in `test-quality.yml` ships outside the composite action.
- [ ] **AC-4** First post-merge run populates the cache: at least one of the 7 jobs reports `Cache not found for input keys` followed by a successful Chrome download and cache save (`Cache saved with key: <runner-os>-puppeteer-<hash>`).
- [ ] **AC-5** Second post-merge run (or a sibling job in the first run) reports `Cache restored from key: <runner-os>-puppeteer-<hash>` and completes `npm ci` significantly faster than the cold run (target: ≥ 20s saved on the install step).
- [ ] **AC-6** The retry loop fires on a deliberately-mocked failure — locally verifiable with a shell harness that overrides `npm` to fail twice then succeed; assert exit 0 with 2 retry log lines.
- [ ] **AC-7** All other test-quality.yml jobs (Jekyll build, content validation, security audit, etc.) still pass green on this PR.
- [ ] **AC-8** Zero changes to `.github/workflows/healing-monitor.yml`, `.github/workflows/copilot-setup-steps.yml`, `.github/workflows/research-sweep.yml`, `.github/workflows/auto-regression.yml`, `.github/workflows/agent-eval.yml`. AC-8 boundary check: `git diff --stat .github/workflows/` shows only `test-quality.yml` modified.
- [ ] **AC-9** `action.yml` parses as valid composite action YAML (verified by GitHub Actions during workflow run; locally verifiable via a schema linter if available).

---

## 4. Commands

```bash
# Inspect baseline
grep -nE "actions/setup-node|npm ci" .github/workflows/test-quality.yml
grep -lE "actions/cache" .github/workflows/

# After implementation
ls .github/actions/setup-node-with-puppeteer-cache/
grep -c "setup-node-with-puppeteer-cache" .github/workflows/test-quality.yml   # expect ≥ 5
grep -c "setup-node@v6" .github/workflows/test-quality.yml                      # expect 0

# Local retry-loop test harness
PATH=/tmp/mock-npm:$PATH bash .github/actions/setup-node-with-puppeteer-cache/_retry-test.sh
```

---

## 5. Project Structure

```
.github/
  actions/                                          # NEW directory
    setup-node-with-puppeteer-cache/
      action.yml                                    # Composite action definition
  workflows/
    test-quality.yml                                # Modified: 7 jobs use the composite action
SPEC.md, tasks/plan.md, tasks/todo.md              # Lifecycle artifacts
```

Total files touched: **2 net new + 1 modified** = 3 files. Well under the 15-file scope-explosion limit; no `bulk-content` label needed.

---

## 6. Composite action interface

```yaml
# .github/actions/setup-node-with-puppeteer-cache/action.yml
name: 'Setup Node with Puppeteer Cache'
description: 'Sets up Node via actions/setup-node@v6, caches the puppeteer Chrome download, and runs npm ci with retry to tolerate transient CDN failures.'
inputs:
  node-version:
    description: 'Node.js version (default 20)'
    required: false
    default: '20'
  npm-cache:
    description: 'setup-node cache strategy (default npm)'
    required: false
    default: 'npm'
runs:
  using: 'composite'
  steps:
    # 1. Standard Node setup with npm cache (unchanged behaviour)
    - uses: actions/setup-node@v6
      with:
        node-version: ${{ inputs.node-version }}
        cache: ${{ inputs.npm-cache }}

    # 2. Cache puppeteer's Chrome download (the actual flake fix)
    - uses: actions/cache@v4
      with:
        path: ~/.cache/puppeteer
        key: ${{ runner.os }}-puppeteer-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-puppeteer-

    # 3. Install deps with retry on transient failure
    - name: Install dependencies (with retry)
      shell: bash
      run: |
        for attempt in 1 2 3; do
          if npm ci; then
            echo "npm ci succeeded on attempt $attempt"
            exit 0
          fi
          if [ $attempt -lt 3 ]; then
            echo "::warning::npm ci attempt $attempt failed; retrying in 10s..."
            sleep 10
          fi
        done
        echo "::error::npm ci failed after 3 attempts"
        exit 1
```

Pin `actions/cache@v4` (current stable major). Pin `actions/setup-node@v6` to match the rest of the repo's pins.

---

## 7. Call-site migration pattern

For each affected job in `test-quality.yml`, the replacement is mechanical:

**Before:**

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: '20'
    cache: 'npm'

- name: Install dependencies
  run: npm ci
```

**After:**

```yaml
- name: Setup Node + cache + install deps
  uses: ./.github/actions/setup-node-with-puppeteer-cache
```

Defaults match the prior behaviour (`node-version: '20'`, `cache: 'npm'`). No job currently uses different values — confirmed at baseline SHA.

---

## 8. Retry test harness

Local verification of the retry loop without round-tripping CI. Implementation lives in the same composite-action directory:

```
.github/actions/setup-node-with-puppeteer-cache/
  action.yml
  _retry-test.sh          # Local mock; not a CI dependency
```

`_retry-test.sh` script overrides `npm` via `PATH` manipulation to fail-fail-succeed, asserts the retry loop produces exit 0 with two warning log lines. This is the unit-style coverage for the retry behaviour. Cheap, reliable, doesn't require the GitHub Actions runner.

---

## 9. Boundaries

| Always | Ask first | Never |
|---|---|---|
| Pin every action to a specific major (`@v4`, `@v6`) | Whether to migrate `healing-monitor.yml` in the same PR (recommended: no — separate cycle) | Upgrade `pa11y`, `puppeteer`, or `@playwright/test` versions in this PR (handled separately under #947 and the lockfile work) |
| Verify `git diff --stat .github/workflows/` shows only `test-quality.yml` after the migration | Whether to introduce a third-party retry action (`nick-fields/retry`) vs. inline shell loop (recommend inline; one fewer dep) | Change the retry count or backoff timing without ACs to back it up (3 attempts × 10s is the documented default; deviating requires updating SPEC) |
| Run the local `_retry-test.sh` harness before pushing | Whether to gate the composite action behind a `PUPPETEER_SKIP_DOWNLOAD=1` env var | Touch `package.json`, `package-lock.json`, or any dep |
| Confirm cache key works as expected by reading workflow run logs post-merge | — | Mask flakes for tests that aren't actually the puppeteer Chrome-download flake (retry should not paper over real test failures) |

---

## 10. Out of Scope

- Migrating `healing-monitor.yml`, `copilot-setup-steps.yml`, or other workflows — separate cycle if and when needed.
- Upgrading `pa11y`, `puppeteer`, `@playwright/test`, or any other dep — orthogonal concern.
- Replacing puppeteer with Playwright's bundled browser in pa11y's chain — architectural change.
- Setting `PUPPETEER_SKIP_DOWNLOAD=1` — pa11y needs Chrome to render pages; the dependency is real.
- Reducing the Playwright shard count to lower flake surface — fixes symptom, not cause.
- Adding cache for `~/.cache/ms-playwright/` (Playwright's own browser binaries) — Playwright Shard 1/2/3 use `@playwright/test` which has its own caching story; separate evaluation.
- Modifying the retry shape (count, backoff) — change requires SPEC amendment.

---

## 11. Definition of Done

- All 9 ACs checked.
- `_retry-test.sh` exits 0 locally before push.
- PR description includes:
  - Baseline job count (5) and post-migration call-site count (5)
  - The retry-test output (mock npm fails twice, succeeds on 3rd attempt)
  - A note that cache hit/miss behaviour will be verifiable in CI logs once merged
  - AC-8 boundary check confirmation (`git diff --stat` output)
- PR merged via standard flow; admin-merge acceptable per repo convention.
- Post-merge: open a new PR (any small change) and verify the cache-hit path logs `Cache restored from key:` for puppeteer. If it doesn't, that's a regression to investigate immediately, not a problem to defer.
