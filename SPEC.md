# SPEC — GH-1075: Restore the green `main` Quality Tests gate (Security Audit)

**Stream:** CI / repo health · **Priority:** P0 (broken `main` gate) · **Scope:** XS
**Date:** 2026-06-23 · **Label:** `agent:qa-gatekeeper` · **Issue:** #1075

---

## 1. Objective

The scheduled **Quality Tests (Visual, Accessibility, Performance, Security)**
workflow (`test-quality.yml`) has failed on `main` every day since ~2026-06-16
(#1075, `needs-human-review`). The only failing job is **🔒 Security Audit**,
whose step `npm run test:security` (`npm audit --audit-level=moderate`) now exits
1: **22 advisories (20 moderate, 2 high)**.

Restore a green `main` gate **without weakening the documented policy**
(`SECURITY.md`: "builds fail on moderate or higher") and **without breaking the
Lighthouse CI tooling**.

## 2. Root cause

`"dependencies": {}` is empty — every advisory is in **dev-only CI tooling**, none
ships to the static Jekyll site:

- **2 high** — `undici`, `ws` (transitive dev-deps). Cleared by the lockfile
  update; `ws` pinned via override to `^8.21.0` (patched line).
- **20 moderate** — `js-yaml` (under `@lhci/utils`) and ~17 `@opentelemetry/*` +
  `@sentry/node` advisories, all chaining from `lighthouse → @sentry/node`.
  `@lhci/cli@0.15.1` is already latest and bundles `lighthouse@12.6.1 →
  @sentry/node@7.120.4`; npm's only offered fix is a `--force` **downgrade to
  `@lhci/cli@0.3.5`** (a 12-major regression — rejected).

## 3. Approach — precedent-aligned `overrides`

Follow the existing `package.json` `overrides` pattern (lodash, tmp, basic-ftp,
ws, qs, puppeteer) endorsed by `tasks/lessons.md` L3 for transitive CVEs. Force
the patched lines:

- `js-yaml` → `^4.2.0` (minimal patched bump; our `lighthouserc.json` is JSON, so
  `@lhci/utils`' removed-in-4.x `safeLoad` branch is never executed).
- `@sentry/node` → `^10.54.0` (patches the sentry advisory and cascades the whole
  `@opentelemetry/*` instrumentation cluster to patched versions).
- `ws` → `^8.21.0` (tighten from `^8.20.1`, which permitted the vulnerable
  `8.20.1`, so the high advisory cannot regress on a future install).

No threshold change, no new tooling, no `@lhci/cli` downgrade. Only
`package.json` + `package-lock.json` change.

## 4. Acceptance criteria

- [x] **AC-1** `npm run test:security` (`npm audit --audit-level=moderate`) exits 0
      — `found 0 vulnerabilities`.
- [x] **AC-2** No threshold weakening: `test:security` still runs
      `--audit-level=moderate` (SECURITY.md policy intact).
- [x] **AC-3** Lighthouse CI tooling still loads: `npx lhci --version` and
      `npx lhci healthcheck` pass; `lighthouse` and `@lhci/utils` `require` cleanly.
- [x] **AC-4** Resolved patched versions: `@sentry/node@10.x`, `js-yaml@4.2.0`,
      `ws@8.21.0`.
- [x] **AC-5** No protected file touched (`_config.yml`, `Gemfile`,
      `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`).
- [x] **AC-6** Change is atomic: only `package.json` + `package-lock.json`.

## 5. Commands

```bash
npm install                                   # regenerate lockfile with overrides
npm run test:security                         # AC-1/AC-2 — expect exit 0
npx lhci healthcheck                          # AC-3 — expect "Healthcheck passed!"
npm ls @sentry/node js-yaml ws                # AC-4
```
