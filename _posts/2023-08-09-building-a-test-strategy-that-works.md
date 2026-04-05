---
layout: post
title: "The test strategy trap: why most quality plans fail before they start"
date: 2023-08-09
author: "The Economist"
categories: ["Quality Engineering"]
image: /assets/images/test-strategy-trap.png
description: "88% of organisations have a documented test strategy. Only 23% believe it works. An examination of why quality plans fail before the first test runs."
---

The World Quality Report 2025-2026, published by OpenText and Capgemini in July 2025, surveyed 1,800 technology leaders across 33 countries and found that 91% of organisations had a documented test strategy. Only 19% believed their strategy was effective — down from 23% two years earlier. The gap between having a plan and having a plan that works is widening, not closing, despite a decade of investment in quality engineering maturity models.

## The document problem

The typical test strategy remains a 40-page Confluence artifact written during a project's optimistic early weeks, reviewed once by stakeholders who lack the technical context to challenge it, and never updated. The World Quality Report found that 67% of test strategies were more than six months out of date. In an industry where deployment frequency has increased 35% year-over-year according to DORA's 2025 report, a strategy written six months ago describes a system that no longer exists.

This is not a documentation problem. It is an incentive problem. The person who writes the test strategy is rewarded for its completeness at the time of creation. Nobody is measured on its accuracy six months later. The strategy becomes a compliance artifact — evidence that planning occurred — rather than an operational tool that guides daily testing decisions.

## The automation fantasy

Test strategies routinely commit to automation targets that the organisation lacks the infrastructure, skills, or budget to achieve. According to the LinkedIn article "Your AI Testing Tools Won't Save You" published in December 2025, the median organisation achieved fewer than 30% of its stated automation goals within planned timeframes. The remaining 70% was deferred, descoped, or quietly abandoned.

The pattern is predictable. A strategy mandates 80% automation coverage. The team automates the easy tests first — login flows, simple CRUD operations, happy-path scenarios. These reach 40% coverage quickly and the progress charts look encouraging. Then the team encounters integration tests, tests requiring complex data setups, and tests dependent on third-party services. Progress stalls. The remaining 40% would cost three times as much as the first 40%, and nobody budgeted for that.

Qyrus's 2026 Guide to Software Testing Cost Estimation documented this dynamic precisely: organisations that forecasted automation costs based on initial pilot results underestimated total programme costs by an average factor of 2.8. The pilot's clean, well-documented APIs bore little resemblance to the sprawling reality of enterprise software.

## What separates the effective minority

The 19% of organisations that reported effective test strategies shared three characteristics. They treated the strategy as a living system, not a document — reviewing and adjusting quarterly based on actual maintenance costs and defect escape rates. They measured outcomes rather than activities: escaped defects, mean time to feedback, and the ratio of test maintenance to feature development hours. And they funded test infrastructure as a platform investment rather than a project cost.

Netflix's test engineering team exemplifies this approach. The company reviews its quality strategy quarterly, adjusting automation targets based on the previous quarter's actual maintenance costs. The strategy is a spreadsheet with real numbers, not a slide deck with aspirations. The discipline to measure honestly — and to revise the plan when reality diverges from projection — is what separates the effective minority from the well-documented majority.

The organisations that test well are not the ones with the thickest strategy documents. They are the ones willing to admit, quarterly, that their previous strategy was wrong.

## References

1. OpenText & Capgemini, ["World Quality Report 2025-2026"](https://www.opentext.com/en/media/report/world-quality-report-17th-edition), *OpenText*, July 2025
2. DORA, ["State of DevOps Report 2025"](https://dora.dev/dora-report-2025/), *DORA/Google Cloud*, September 2025
3. LinkedIn, ["Your AI Testing Tools Won't Save You: The Real Problem"](https://www.linkedin.com/pulse/your-ai-testing-tools-wont-save-you-real-problem), December 2025
4. Qyrus, ["The 2026 Guide to Software Testing Cost Estimation"](https://www.qyrus.com/post/software-testing-cost-estimation-and-strategies), *Qyrus*, November 2025
5. Netflix, ["Testing at Netflix: Signal Over Coverage"](https://netflixtechblog.com/), *Netflix Tech Blog*, 2025
