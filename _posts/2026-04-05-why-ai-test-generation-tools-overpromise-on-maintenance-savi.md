---
layout: post
title: "The maintenance myth: what AI test generation costs"
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
image: /assets/images/why-recent-ai-test-generation-tools-are-overpromising-on-mai.png
image_alt: "Bars comparing high promised AI test savings with lower measured results"
image_caption: "Illustration: vendor promises rise higher than the savings teams actually measure"
description: "AI testing vendors promise 80% reductions in maintenance effort. IEEE research across 400 teams finds 62% see no meaningful savings."
---

![AI test generation addresses only locator changes (35% of failures); 65% of maintenance causes remain untouched](/assets/charts/why-ai-test-generation-tools-overpromise-on-maintenance-savi.svg)
*Source: Capgemini World Quality Report, 2025; IEEE Empirical Study on AI Test Generation, 2025 (n=400 teams)*

Functionize, an AI testing platform, claims its tools reduce test maintenance effort by 80%. Applitools advertises "visual AI" that eliminates manual test updates. Mabl promises tests that "adapt automatically" to application changes. In 2025, CB Insights counted 47 testing startups making some variation of this claim, collectively raising $1.2 billion in venture funding. Yet IEEE's latest empirical study, surveying 400 software engineering teams across 15 countries, found that 62% reported no meaningful reduction in maintenance effort after adopting AI test generation tools.

The easiest way to understand the gap is to ask what maintenance actually is. It is not simply editing selectors after a button moves. Most of the cost sits in preserving test intent as the product evolves: a checkout flow now requires an extra fraud check; a premium feature becomes role-gated; a workflow that used to be synchronous is now event-driven. AI can regenerate syntax quickly. It is far less reliable at deciding which assertions should survive a business change, which should be rewritten, and which should be deleted altogether.

## The 35% ceiling

The disconnect has a structural explanation. Capgemini's 2025 Quality Engineering Report decomposed test maintenance into five categories: locator updates (35%), functional logic changes (25%), data dependencies (20%), timing and synchronisation issues (12%), and environmental instability (8%). AI test generation tools address the first category well — automatically adjusting CSS selectors, XPath expressions, and element identifiers when the UI changes. They address the remaining four poorly or not at all.

That creates a hard ceiling on the savings most vendors imply. To deliver a 60-80% maintenance reduction, the tool would need to do more than repair broken selectors. It would need to infer why the test exists, recognise when a product decision has changed the expected behaviour, and preserve the business risk the test was written to cover. Those are semantic judgements. Current tools are much better at detecting patterns in page structure than they are at reasoning about product intent.

This is why AI test generation and [self-healing tests](/2026/01/02/self-healing-tests-the-promise-that-keeps-breaking/) fail in similar ways. Both automate the visible symptom of change at the interface layer. Neither removes the deeper maintenance burden created by changing requirements, unstable environments, or weak test architecture. The marketing copy talks as if maintenance were mostly clerical. In practice it is often analytical.

## Why pilots flatter the tools

Vendor demonstrations and early pilots are usually run on the part of the portfolio where AI looks strongest: stable user journeys, recent code, narrow data combinations, and happy-path assertions that are easy to regenerate. Production estates look nothing like that. They contain role permutations, messy test data, asynchronous dependencies, partial migrations, and flows whose importance comes from business criticality rather than technical neatness.

That difference matters because AI gains are usually measured on the cleanest slice of the work while maintenance costs are paid across the whole suite. Stripe's testing infrastructure team found that after 18 months of adoption, fewer than 40% of AI-generated tests were good enough to keep. The rest were discarded as redundant, trivial, or misaligned with business intent. A pilot can easily count generated tests. It is much harder — and much more important — to count the hours spent reviewing, debugging, and ultimately deleting them.

The result is a denominator problem. If a pilot reports that a team created 200 tests in a week instead of 40, the headline sounds transformational. If six months later the team has retained only 70 of those tests, and half of the maintenance burden still comes from business-rule changes the model cannot interpret, the economics look far less magical. This is the same accounting mistake that distorts many automation programmes: teams celebrate gross output and under-measure the ongoing cost of ownership, a pattern explored elsewhere in [test automation's hidden ledger](/2026/04/04/test-automations-hidden-ledger-costs-nobody-budgets/).

## The noise factory

AI test generation tools create tests at a speed that would be impressive if volume correlated with value. Microsoft Research published 2025 data showing that among AI-generated tests, 31% contained assertions that were "trivially true" — they tested conditions that could never fail. An additional 18% duplicated coverage already provided by existing tests. Together, nearly half of AI-generated output added noise to the test suite without adding signal.

The maintenance implications are severe. A suite bloated with redundant and trivial tests takes longer to run, produces more false positives, and demands more investigation time when failures occur. At Shopify, the engineering team found in 2025 that removing AI-generated tests with a defect detection rate below 0.1% reduced suite execution time by 34% while improving the defect escape rate. Fewer tests caught more bugs because the remaining tests were clearer about what they were supposed to prove.

This is the part of the story vendors rarely emphasise: every accepted test becomes a liability as well as an asset. Somebody has to understand it, trust it, maintain it, and explain it when it fails. When a human engineer authors a test, that ownership is usually obvious. When a model emits dozens at once, the provenance is thinner and the review burden spreads across the team. The suite grows faster than collective understanding grows. That is how productivity tooling turns into maintenance debt, and it is why organisations that care about sustainable quality spend as much time pruning tests as adding them.

## What honest improvement looks like

Stripe's headline number is not 80%. It is 22%: the net reduction in test maintenance hours the company measured after accounting for review, curation, and debugging overhead. That figure is far less marketable than the vendor promise, but it is far more useful because it describes the real operating result. Forrester's 2025 AI Testing Impact Study reached a similar conclusion. Meaningful gains clustered among teams with mature CI/CD pipelines, stable environments, and dedicated test engineering roles — precisely the teams least likely to believe that tooling alone can replace judgement.

The common feature of the successful cases is not blind adoption but aggressive selectivity. AI is used as a draft generator, not an autonomous maintainer. Engineers reject low-value tests, rewrite weak assertions, and treat deletion as a sign of discipline rather than failure. In that operating model, AI can remove some of the clerical work of scaffolding coverage while humans keep hold of the decisions that determine whether the suite is economically worth running.

That is also why the realistic upside settles around 30-35%, not 80%. Forrester projected that by 2027 the strongest organisations would use AI generation for an initial coverage scaffold while relying on humans for assertion quality, business logic validation, and portfolio curation. That is a meaningful gain. It is also a very different proposition from "maintenance disappears". The organisations most likely to benefit are the ones already doing the basics well — the same lesson that appears in [practical test strategy work](/2026/04/05/the-test-strategy-trap-why-quality-plans-fail/) and in broader debates about automation ROI.

## How to buy the tools without buying the myth

A sensible buyer should ask four questions before accepting any maintenance-saving claim. First, what proportion of current maintenance hours comes from locator churn rather than logic, data, timing, or environment issues? Second, are reported gains measured in gross tests generated or net hours saved after review and deletion? Third, what percentage of generated tests remain in the suite after six months? Fourth, what defect yield do those retained tests actually produce?

Those questions sound unglamorous because they are. But they force the conversation away from demo theatre and towards portfolio economics. An AI testing tool may still be worth buying if it cuts low-value toil, improves baseline coverage, or accelerates drafting on predictable flows. It is simply not worth buying on the assumption that it will dissolve the maintenance burden that comes from evolving software. The more honest business case is incremental and operational: modest savings, disciplined curation, and faster authoring for teams that already understand their quality system.

The organisations that acknowledge this gap between expectation and reality will invest wisely in AI testing tools as productivity aids, using them to eliminate tedium while retaining human judgement where it matters most. Those still chasing the 80% promise will discover that the maintenance myth has a stubborn relationship with reality. The dynamics of [self-healing tests](/2026/01/02/self-healing-tests-the-promise-that-keeps-breaking/) follow the same pattern: vendor claims run ahead of independent evidence, and the gap persists long after adoption becomes mainstream. The tools are worth buying. The claims are not worth believing.

## References

1. IEEE, ["Empirical Study of AI Test Generation Maintenance Impact"](https://ieeexplore.ieee.org/), *IEEE Transactions on Software Engineering*, 2025
2. Capgemini, ["Quality Engineering Report 2025"](https://www.capgemini.com/insights/research-library/world-quality-report/), *Capgemini*, 2025
3. Microsoft Research, ["Quality Analysis of AI-Generated Test Assertions"](https://www.microsoft.com/en-us/research/), *Microsoft Research*, 2025
4. Stripe, ["18 Months of AI Test Generation: An Honest Assessment"](https://stripe.com/blog/engineering), *Stripe Engineering Blog*, 2026
5. Forrester, ["AI Testing Impact Study 2025"](https://www.forrester.com/report/ai-testing-impact/), *Forrester Research*, 2025
6. CB Insights, ["The State of AI Testing Startups"](https://www.cbinsights.com/research/), *CB Insights*, 2025
