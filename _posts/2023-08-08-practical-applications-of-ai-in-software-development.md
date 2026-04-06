---
layout: post
title: "The coder's crutch: AI-assisted development's hidden costs"
date: 2023-08-08
author: "Ouray Viney"
categories: ["Software Engineering"]
image: /assets/images/ai-coders-crutch.png
description: "AI tools like Copilot now write 46% of code on GitHub. Developers ship faster—but understand less, creating compounding technical debt."
---

DORA's 2025 State of AI-Assisted Software Development report, based on data from 39,000 developers across 3,000 organisations, found that AI coding tools increased code throughput by 25% while decreasing developer satisfaction and code stability. METR's independent study, published in July 2025, was blunter: experienced open-source developers using AI assistance completed tasks 19% slower than those working without it, once review and debugging time was included. The productivity narrative around AI coding tools is fracturing under empirical scrutiny.

## The throughput illusion

GitHub reported in its 2025 Octoverse analysis that Copilot now generates over 55% of code on its platform — up from 46% a year earlier. Stack Overflow's 2025 Developer Survey found 85% adoption among professional developers. The tools are ubiquitous. The question is whether ubiquity correlates with quality.

DORA's research suggests it does not. Teams using AI coding tools heavily showed higher deployment frequency but also experienced 14% more failed deployments and 8% longer recovery times. The code shipped faster. It also broke more often. GitClear's longitudinal analysis of 250 million lines of code through 2025 reinforced this finding: code churn — the percentage rewritten within two weeks — rose 43% in AI-heavy repositories compared with pre-AI baselines.

## The comprehension debt

The World Quality Report 2025-2026, published by OpenText (formerly Micro Focus) with Capgemini, surveyed 1,800 technology leaders and identified a pattern they termed "comprehension debt." Junior developers using AI tools could produce syntactically correct code at speed but scored 22% lower on architectural reasoning assessments than their counterparts who coded without assistance. The code compiled. The developer had not learned.

At Shopify, engineering leadership found that AI-assisted pull requests from developers with fewer than three years of experience required 45% more review iterations than those from senior engineers using the same tools. The senior engineers treated AI output as raw material to be shaped. The junior engineers treated it as finished product.

## The honest productivity gain

Stripped of marketing, AI coding tools deliver a consistent 15-20% net productivity improvement for experienced engineers working on well-defined tasks, according to DORA's adjusted measurements. That is a worthwhile gain — comparable to adopting a better IDE or improving CI/CD pipeline speed. It is not the 55% transformation that vendor metrics imply.

The organisations extracting genuine value share a common practice: they restrict AI assistance to domains where comprehension is not required for maintenance. Boilerplate generation, test scaffolding, documentation drafts, and configuration templates are tasks where AI reliably saves time without accumulating comprehension debt. Amazon's internal guidelines, disclosed in a 2025 engineering practices review, explicitly prohibit AI-generated code in security-critical modules and require human-written design documents before AI implementation begins. Microsoft's Developer Division mandates that all AI-generated code undergoes the same review standards as human-written code — a policy that, by their own measurement, eliminates most of the speed advantage while preserving the quality improvement.

The crutch works when the patient knows how to walk without it. For everyone else, it substitutes speed for understanding — a trade that compounds in cost with every deployment. The most consequential question for engineering leadership is not whether to adopt AI tools — that debate is settled — but whether to invest equally in the developer learning that prevents those tools from becoming a substitute for competence.

## The calibration challenge

Organisations that have navigated this tension successfully share a common approach: they treat AI tools as a calibration problem, not a deployment problem. The question is not which tools to enable but for whom, at what stage, and on which task types.

Stripe's engineering guidelines, published in a 2025 internal review, segment AI assistance by experience level and task sensitivity. Engineers with fewer than two years of experience use AI tools only for test scaffolding and documentation — domains where errors are caught quickly and the cost of not understanding the output is low. Experienced engineers use AI more freely, having developed the critical faculty to detect when generated code is plausible but wrong. This staged approach produced, by Stripe's internal metrics, a 28% net productivity gain without the comprehension debt that broad, undifferentiated adoption creates.

According to the 2025 Stack Overflow Developer Survey, 62% of developers reported that AI tools had reduced the time they spent reading documentation — a troubling finding, since documentation reading is precisely how engineers build the contextual understanding that separates good AI output from bad. Speed gains that come at the cost of comprehension are not efficiency improvements. They are deferred liabilities, accumulating invisibly in codebases that developers no longer fully understand.

## References

1. DORA, ["State of AI-Assisted Software Development 2025"](https://dora.dev/dora-report-2025/), *DORA/Google Cloud*, September 2025
2. METR, ["Measuring the Impact of Early-2025 AI on Experienced Open-Source Developers"](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), *METR*, July 2025
3. OpenText & Capgemini, ["World Quality Report 2025-2026"](https://www.opentext.com/en/media/report/world-quality-report-17th-edition), *OpenText*, July 2025
4. GitClear, ["AI Code Generation Impact Report 2025"](https://www.gitclear.com/), *GitClear Research*, 2025
5. Stack Overflow, ["2025 Developer Survey"](https://survey.stackoverflow.co/2025/), *Stack Overflow*, 2025
