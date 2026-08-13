# Plan — Dependabot exemption for the scope guard

**Spec:** [spec.md](spec.md) · **Issue:** [#1253](https://github.com/oviney/blog/issues/1253)
**Branch:** `chore/1253-dependabot-scope-exemption` · **Date:** 2026-08-11

## Shape

One PR. Small and test-first — the guard has a real fixture harness
(`tests/scope-guard.sh`, cases A–K), so the new behaviour gets pinned on both
the allow and the deny side before the production script changes.

**Label:** `governance-update` is **not** required — Rule 3 covers
`.github/skills/` and `.github/instructions/` only, and this PR touches neither.
`scripts/` and `.github/workflows/` are outside that rule. No protected file is
modified either, so no `protected-file-update`. **This PR should pass the guard
with no label at all** — which is itself a small proof the rules are scoped right.

## File manifest (8 files — well inside the 15-file cap)

| # | File | Change |
|---|------|--------|
| 1 | `tests/scope-guard.sh` | `run_case` gains an optional 6th arg `pr_author`; add cases **L–P** |
| 2 | `scripts/check-pr-scope.sh` | `DEPENDABOT_ALLOWED_FILES`, `is_dependabot_bump()`, Rule 1 hook, header docs |
| 3 | `.github/workflows/test-build.yml` | pass `PR_AUTHOR` to the guard step |
| 4 | `README.md` | document the exemption in the scope-guard section |
| 5 | `docs/BACKLOG.md` | move the P2 row to **Recently shipped** |
| 6–8 | `SPEC.md`, `tasks/plan.md`, `tasks/todo.md` | lifecycle artifacts |

## Order — tests first

1. **Extend the harness.** `run_case` currently takes 5 positional args and only
   exports `PR_LABELS`. Add `local pr_author="${6:-}"` and export `PR_AUTHOR`.
   Defaulting to empty keeps A–K working untouched — verify by running the suite
   before changing the production script.
2. **Add cases L–P and watch them fail** for the right reason (exit 1 where the
   spec wants exit 0). A new test that passes before the fix is not a test.
3. **Implement** in `check-pr-scope.sh`.
4. **Re-run** — expect all of A–P green.

## Implementation sketch

```bash
DEPENDABOT_ALLOWED_FILES=( "Gemfile" "Gemfile.lock" )

# Both gates must hold: exact author match AND no path escape.
is_dependabot_bump() {
  [ "${PR_AUTHOR:-}" = "dependabot[bot]" ] || return 1
  local f
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    printf '%s\n' "${DEPENDABOT_ALLOWED_FILES[@]}" | grep -qx "$f" || return 1
  done <<EOF
$CHANGED_FILES
EOF
  return 0
}
```

Evaluate **once** into `DEPENDABOT_BUMP` before the Rule 1 loop rather than
per-iteration. Exact `=` compare, not `grep`, so `dependabot[bot]-x` cannot
qualify — `[` and `]` are glob metacharacters, which is one more reason not to
reach for a pattern match here.

## Test cases

| Case | Author | Files | Expect |
|------|--------|-------|--------|
| L | `dependabot[bot]` | `Gemfile.lock` | exit 0 |
| M | `dependabot[bot]` | `Gemfile`, `Gemfile.lock` | exit 0 |
| N | `dependabot[bot]` | `Gemfile.lock`, `_config.yml` | exit 1, path escape |
| O | *(unset)* | `Gemfile.lock` | exit 1, author gate |
| P | `not-dependabot[bot]-x` | `Gemfile.lock` | exit 1, substring superset |

Case P mirrors the D/E/F/K anchoring discipline the suite already enforces for
labels, now applied to the author.

## Verification

- `bash tests/scope-guard.sh` → A–P all pass
- `bash -n` on both scripts
- Guard run against this very branch with no label → exit 0
- Post-merge: rebase **#1242** and confirm `check-agent-scope` goes green with
  no `--admin`. That is the real-world proof, and #1242 is conveniently still open.

## Risks

| Risk | Mitigation |
|------|------------|
| `PR_AUTHOR` unset in some trigger context silently disables the gate | Absence means *no* exemption — fails closed, which is today's behaviour |
| Someone later switches the workflow to `pull_request_target`, making the author spoofable | Constraint recorded in the script header next to the check |
| Widening beyond `Gemfile*` by future edit | `DEPENDABOT_ALLOWED_FILES` is a named list; case N pins the escape |
| Harness change breaks A–K | Run the suite after step 1, before any production change |
