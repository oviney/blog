# setup-node-with-puppeteer-cache

Composite action for `.github/workflows/test-quality.yml` jobs. See [#958](https://github.com/oviney/blog/issues/958) for the flake history that motivated this action and `action.yml` for the inputs/steps.

## Files

- `action.yml` — the composite action (called as `uses: ./.github/actions/setup-node-with-puppeteer-cache`)
- `_retry-test.sh` — local unit harness for the retry loop. Run with `fail-fail-fail` (RED) or `fail-fail-succeed` (GREEN).

## When updating the retry loop

The retry shape is duplicated between `action.yml` and `_retry-test.sh`. Keep them in sync — see the comments in both files for the rationale (control flow differs intentionally; the shape must match).
