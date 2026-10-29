---
layout: post
title: "Testing times: measuring AI’s value in QA"
subtitle: "Faster test creation is useful, but it does not establish that fewer defects reach customers."
date: 2025-12-31
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [ai-testing, test-automation, quality-engineering]
image: /assets/images/testing-times-renovation.png
image_alt: "Robots present QA dashboards while human testers watch from the edge of the room"
image_caption: "Illustration: automation takes centre stage while quality outcomes barely move"
description: "AI can help teams create tests faster. Measure review, maintenance and customer outcomes before claiming a quality improvement."
---

AI can produce test ideas and draft scripts quickly. Whether it improves quality is a separate question: a team must still decide what to test, verify the expected results and learn what reaches customers. Counting generated tests or tool licences cannot answer it.

The [World Quality Report 2025–26](https://www.opentext.com/ca/about/press-releases/world-quality-report-2025-ai-adoption-surges-in-quality-engineering-but-enterprise-level-scaling-remains-elusive), from OpenText, Capgemini and Sogeti, reported that 89% of responding organisations were piloting or deploying generative AI in quality engineering. The report distinguished pilots, production use and enterprise-scale deployment. Its adoption figures do not, by themselves, show whether escaped defects fell or whether a particular investment paid for itself.

## Faster drafts, accountable decisions

A generated test can make a useful first draft: it can suggest boundary conditions, create repetitive setup or turn a clear example into executable code. It can also invent a requirement, choose an invalid expected result or create assertions that merely repeat the implementation. A reviewer must check the scenario and its oracle against an independent source of expected behaviour.

Consider a payment API. Generating cases for missing fields is helpful, but the team still needs to establish what a rejected payment should return, whether a duplicate request can charge twice and how downstream systems learn the outcome. A test that runs successfully with the wrong expectation offers false confidence.

## Measure the full cost

Creation time is only one part of the economics. A comparison should include the effort to describe the problem, review the output, prepare data, execute tests, investigate failures and maintain checks as the product changes. Tools may move work between these activities rather than remove it.

A useful pilot selects a few comparable changes and records elapsed and active effort for the whole workflow. Track meaningful defects or test gaps found, rejected suggestions, flaky checks and maintenance time. For customer risk, examine escaped defects and incident patterns over a longer period; a small pilot will rarely support a precise claim about production quality. Avoid comparing teams without considering differences in their systems and work.

## Keep the customer in view

Exploration, accessibility, usability and assessment of ambiguous requirements demand attention even when a team automates regression checks. Developers can own quality while drawing on product and quality expertise. The goal is not to preserve every manual step or automate every one; it is to cover the important risks and understand the costs of doing so.

The [self-healing discussion](/2026/01/02/self-healing-tests-myth-vs-reality/) offers a related example. A tool that repairs a locator may save effort, but its repair still needs to preserve the behaviour under test. The same principle applies to generated tests: speed is valuable only when someone can trust what the test means.

## References

1. OpenText, Capgemini and Sogeti, [World Quality Report 2025: AI adoption surges in Quality Engineering](https://www.opentext.com/ca/about/press-releases/world-quality-report-2025-ai-adoption-surges-in-quality-engineering-but-enterprise-level-scaling-remains-elusive), 2025.
2. Perforce BlazeMeter, [2025 State of Continuous Testing Report: key takeaways](https://www.blazemeter.com/blog/2025-state-continuous-testing), 2025.
