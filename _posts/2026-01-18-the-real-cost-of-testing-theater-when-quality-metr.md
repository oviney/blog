---
layout: post
title: "Testing Theatre: The QA Metrics That Fool Everyone"
subtitle: "A passing dashboard measures the checks that ran; it does not reveal which customer risks those checks missed."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [testing-theater, quality-metrics, cost-of-quality]
image: /assets/images/testing-theatre-vanity-metrics.png
image_alt: "Actors perform on a stage built from glowing QA dashboards"
image_caption: "Illustration: vanity metrics turn testing into performance instead of assurance"
description: "Pass rates and execution counts need context about test coverage, assertions and customer risk."
---

*Source: PractiTest State of Testing Survey, 2025 (n=2,700 practitioners)*

A dashboard can show a high pass rate while important customer journeys remain untested. The result may accurately describe the checks that ran, yet say little about missing scenarios, weak assertions or risks outside the suite. That is why leaders need to ask what the result covers and what it leaves out.

This is testing theatre — the elaborate performance of quality assurance activity that creates the illusion of rigour while leaving actual software quality unmeasured. It is not a fringe problem. It is the default state of QA measurement in most large enterprises, and it persists because the metrics teams report are designed to reassure rather than inform.

## The Goodhart trap

Charles Goodhart, a Bank of England economist, observed in 1975 that any measure which becomes a target ceases to be a good measure. Software engineering adopted this law with enthusiasm but learned nothing from it. As the Axify engineering metrics blog warns: ignoring Goodhart's law and making broad statements like "every application must deploy multiple times per day by year's end" increases the likelihood that teams will game the metrics rather than improve the underlying capability.

The [2025 DORA report](https://dora.dev/research/2025/dora-report/) examines AI use and software delivery as an organisational system. Teams should interpret delivery and quality measures together and avoid attributing changes to a tool without investigating other factors.

A pass rate describes the tests that ran; it does not reveal omitted scenarios or weak assertions. Pair it with evidence about the risks covered and the outcomes customers experience.

## The self-healing mirage

Self-healing test tools — products that automatically adjust test scripts when application interfaces change — have become the latest theatre prop. Vendors such as Testim, Mabl, and Functionize market these tools as maintenance eliminators. The reality is more complicated. Self-healing excels at keeping scripts green through minor cosmetic shifts — a button renamed, a locator changed — and fails at exactly the moments when tests should break: when genuine application behaviour changes.

When a checkout button moves from the page to a modal and the test heals itself to find it in the new location, the test continues to pass. But nobody has verified that the user flow still works correctly. Healing the locator is not the same as validating the behaviour. The tool reports "test healed" as a quality signal on the dashboard, when it should be reporting "behaviour change unverified" as a risk signal.

The antidote to Goodhart's Law, as multiple engineering metrics practitioners have argued, is to never use a single metric in isolation. Any speed metric must be balanced by a quality metric; any quantitative metric must be balanced by a qualitative one. Balancing speed with stability and system performance with developer satisfaction is the only way to measure productivity without incentivising dysfunction.

## The dashboard industrial complex

Pass rates, execution counts and defect counts each describe part of testing activity. To interpret them, pair the numbers with what was tested, known gaps and the risk associated with failures.

Production observability can reveal failures that pre-release checks miss. It complements, rather than automatically replaces, testing before a change reaches users.

## The path from theatre to evidence

The companies abandoning theatrical metrics share a common approach: they replace activity measurements with outcome measurements. Defects reaching customers, revenue lost to incidents, engineering hours consumed by rework. These metrics are harder to game precisely because they measure what the business actually feels.

AI can make it easier to generate tests that execute code, but the resulting coverage number still does not demonstrate that assertions protect the right behaviour. Review generated checks against independent requirements and customer risks.

---

For more on interpreting coverage, see [Coverage Obsession](/2026/04/05/the-productivity-paradox-of-test-coverage-metrics/).

## References

1. DORA, [State of AI-assisted Software Development](https://dora.dev/research/2025/dora-report/), 2025.
