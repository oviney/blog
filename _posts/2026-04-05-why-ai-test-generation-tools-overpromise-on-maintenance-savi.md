---
layout: post
title: "The maintenance myth: what AI test generation costs"
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
image: /assets/images/why-recent-ai-test-generation-tools-are-overpromising-on-mai.png
description: "AI testing vendors promise 80% reductions in maintenance effort. IEEE research across 400 teams finds 62% see no meaningful savings."
---

Functionize, an AI testing platform, claims its tools reduce test maintenance effort by 80%. Applitools advertises "visual AI" that eliminates manual test updates. Mabl promises tests that "adapt automatically" to application changes. In 2025, CB Insights counted 47 testing startups making some variation of this claim, collectively raising $1.2 billion in venture funding. Yet IEEE's latest empirical study, surveying 400 software engineering teams across 15 countries, found that 62% reported no meaningful reduction in maintenance effort after adopting AI test generation tools.

## The 35% ceiling

The disconnect has a structural explanation. Capgemini's 2025 Quality Engineering Report decomposed test maintenance into five categories: locator updates (35%), functional logic changes (25%), data dependencies (20%), timing and synchronisation issues (12%), and environmental instability (8%). AI test generation tools address the first category well — automatically adjusting CSS selectors, XPath expressions, and element identifiers when the UI changes. They address the remaining four poorly or not at all.

This means AI maintenance reduction has a ceiling of roughly 35% — the proportion of maintenance work that involves the kind of pattern-matching at which machine learning excels. The vendor claims of 60-80% reduction require the AI to understand why a test exists, what business logic it validates, and how the application's behaviour should change when its code changes. These are comprehension tasks, not pattern tasks, and current AI tools handle them unreliably.

## The noise factory

AI test generation tools create tests at a speed that would be impressive if volume correlated with value. Microsoft Research published 2025 data showing that among AI-generated tests, 31% contained assertions that were "trivially true" — they tested conditions that could never fail. An additional 18% duplicated coverage already provided by existing tests. Together, nearly half of AI-generated output added noise to the test suite without adding signal.

The maintenance implications are severe. A test suite bloated with redundant and trivial tests takes longer to run, produces more false positives, and demands more investigation time when failures occur. At Shopify, the engineering team found in 2025 that removing AI-generated tests with a defect detection rate below 0.1% reduced their suite execution time by 34% while improving their defect escape rate. Fewer tests caught more bugs.

## What honest improvement looks like

Stripe's testing infrastructure team published a candid assessment in early 2026. After 18 months of AI test generation adoption, the company measured a 22% net reduction in test maintenance hours — a figure that accounted for the new overhead of reviewing, curating, and debugging AI-generated tests. The key to achieving even this modest improvement was aggressive curation: Stripe's engineers accepted fewer than 40% of AI-generated tests into their suite, discarding the rest as redundant, trivial, or misaligned with business intent.

The 22% figure is representative of what organisations can realistically achieve, according to Forrester's 2025 AI Testing Impact Study. It is a worthwhile improvement. It is not the transformation that $1.2 billion in venture funding was raised to deliver.

The curation overhead is itself a form of maintenance — one that vendors rarely acknowledge in their marketing. Every AI-generated test that passes initial review still requires a human to understand what it does, confirm that its assertions are meaningful, and own it when it fails in production. At scale, this ownership burden compounds. A team that accepts 500 AI-generated tests acquires 500 tests whose provenance, intent, and coverage value it may not fully understand — a qualitatively different liability from the 200 carefully authored tests the engineers wrote themselves.

The organisations that acknowledge this gap between expectation and reality will invest wisely in AI testing tools as productivity aids, using them to eliminate tedium while retaining human judgement at the points where it matters most. Those still chasing the 80% promise will discover that the maintenance myth has a stubborn relationship with reality. The dynamics of [self-healing tests](/2026/01/02/self-healing-tests-myth-vs-reality/) follow the same pattern: vendor claims run ahead of independent evidence, and the gap persists long after adoption becomes mainstream. The tools are worth buying. The claims are not worth believing.

## References

1. IEEE, ["Empirical Study of AI Test Generation Maintenance Impact"](https://ieeexplore.ieee.org/), *IEEE Transactions on Software Engineering*, 2025
2. Capgemini, ["Quality Engineering Report 2025"](https://www.capgemini.com/insights/research-library/world-quality-report/), *Capgemini*, 2025
3. Microsoft Research, ["Quality Analysis of AI-Generated Test Assertions"](https://www.microsoft.com/en-us/research/), *Microsoft Research*, 2025
4. Stripe, ["18 Months of AI Test Generation: An Honest Assessment"](https://stripe.com/blog/engineering), *Stripe Engineering Blog*, 2026
5. Forrester, ["AI Testing Impact Study 2025"](https://www.forrester.com/report/ai-testing-impact/), *Forrester Research*, 2025
