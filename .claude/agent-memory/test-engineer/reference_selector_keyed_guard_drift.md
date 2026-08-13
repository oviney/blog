---
name: selector-keyed-guard-drift
description: Guards keyed on a wrapper class name silently stop covering a page when a redesign renames that wrapper — the guard stays green because it no longer selects the page at all
metadata:
  type: reference
---

Several of this repo's strongest layout guards are keyed on a **wrapper class**,
not on a URL. The Gap E width-token block in
`tests/playwright-agents/responsive.spec.ts` locates its subject with
`page.locator('.topic-page, .econ-topic-page').first()` and iterates an explicit
list of listing paths.

**The failure mode:** when a redesign renames a page's wrapper, the page drops
out of the guard's selector family and the guard keeps passing — it is now
asserting about a page it no longer reaches, or skipping silently. Nothing goes
red, so nobody notices coverage was lost. The width regression the guard exists
to prevent can then recur on the renamed page, at the *same* measured value the
guard was written to catch.

**Why this is worth remembering:** the same width-ceiling defect class recurs.
The theme caps `.main-content` at 900px and escapes it per page type with
`:has()` (`economist-theme.scss` ~line 214). Any wrapper not named in that
`:has()` list renders inside the reading column. A page whose wrapper is new is
therefore *born* broken and *born* uncovered — the CSS escape and the test guard
are keyed on the same name, and a redesign that misses one usually misses both.

**How to apply:** whenever a change renames or introduces a page wrapper class,
grep the test suite for the *old* class name and for the sibling classes it was
grouped with, then check three things:
1. Is the new wrapper in the theme's `.main-content:has(...)` escape list?
2. Is it in every `locator('.a, .b')` selector family that covered the old one?
3. Is its path in the parameterised page arrays those guards iterate?

Prefer guards keyed on **URL plus a per-page wrapper lookup** over guards keyed
on a shared class, so adding a page forces an explicit decision instead of
failing open.

Related: [[visual-gate-blind-spots]] (what the pixel gate does not cover),
[[local-visual-verification-trap]] (how to build two revisions safely to
measure before/after).
