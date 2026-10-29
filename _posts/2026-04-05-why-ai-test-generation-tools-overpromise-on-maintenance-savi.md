---
layout: post
title: "The maintenance myth: what AI test generation costs"
subtitle: "Generated tests may reduce drafting work while adding review, data and maintenance work that must also be measured."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [ai-testing, test-maintenance, test-automation]
image: /assets/images/why-recent-ai-test-generation-tools-are-overpromising-on-mai.png
image_alt: "Bars comparing high promised AI test savings with lower measured results"
image_caption: "Illustration: vendor promises rise higher than the savings teams actually measure"
description: "Evaluate AI-generated tests by their assertions, maintenance costs and usefulness, not their volume."
---

AI can draft tests quickly. The cost that matters is the work required to turn those drafts into checks a team can trust and keep useful as the product changes. Generating a test is not the same as validating its expected result.

## Creation is only the beginning

An assistant may suggest boundary cases, arrange test data or write repetitive setup. It may also invent a dependency, assert the implementation's current behaviour rather than the intended behaviour, or duplicate an existing check. A reviewer needs an independent source of expected behaviour, such as a contract or agreed example, to decide whether the output is correct.

Maintenance includes preserving that intent. A new permission rule or an asynchronous workflow can change what a valid result looks like. Regenerating syntax does not establish whether the business expectation has changed.

## Generation and repair are different

Some tools propose new tests; others attempt to repair a broken locator. A product may offer both, but the capabilities should be evaluated separately. A locator repair can target the wrong element while allowing a test to pass. Review the selected element and the assertion, particularly in critical workflows. [Playwright's locator guidance](https://playwright.dev/docs/locators) recommends user-facing attributes and explicit contracts to make selectors more resilient.

## Run an honest comparison

Choose a representative set of changes and compare the existing workflow with an AI-assisted one. Record time to prepare context, draft and review tests, set up data, investigate failures and maintain the resulting checks. Track rejected suggestions, duplicated tests and meaningful gaps found. Include licence and infrastructure costs.

The purpose is not to reach a predetermined saving. A team may find that generation helps with setup while complex assertions remain slower to review. Another may find that its existing test architecture makes the assistant more effective. Report the conditions and sample alongside the result.

## Retain judgement

Keep tests that protect important behaviour and provide reliable feedback; simplify or delete checks that do not. Measure customer-relevant outcomes over time, while recognising that a small trial cannot prove a change in production defect rates. The [self-healing discussion](/2026/01/02/self-healing-tests-myth-vs-reality/) explains why an automatically repaired selector still needs to preserve test intent.

## References

1. Microsoft Playwright, [Locators](https://playwright.dev/docs/locators), accessed 2026.
