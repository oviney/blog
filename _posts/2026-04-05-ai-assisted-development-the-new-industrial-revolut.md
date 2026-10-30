---
layout: post
title: "Code Generators: The Brilliant Interns Nobody Supervises"
subtitle: "A small METR trial found slower task completion with early-2025 AI tools, raising questions about how teams measure productivity."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Software Engineering"]
tags: [ai, software-engineering, code-quality, productivity]
image: /assets/images/ai-assisted-code-generation.png
image_alt: "Office robots write code at keyboards with no human supervision"
image_caption: "Illustration: code generators move fast when nobody is reviewing them"
description: "AI coding tools raise questions about productivity and maintainability. A closer look at a METR trial and the limits of productivity measures."
---


METR, a non-profit AI safety research lab, tracked 16 experienced open-source developers as they completed 246 real-world coding tasks on mature repositories averaging over one million lines of code. In this early-2025 experiment, tasks took 19% longer when developers were allowed to use AI tools. Before the study, participants had predicted AI would make them 24% faster; afterwards, they estimated an improvement of 20%. This gap between perception and measurement is a reason to measure outcomes, not a universal verdict on AI coding. In a [February 2026 update](https://metr.org/blog/2026-02-24-uplift-update/), METR said selection effects made its newer experiment an unreliable measure and judged that newer tools likely sped developers up more than in early 2025.

AI code generators can produce plausible output that still needs testing and review. Syntax and a passing build do not establish that code meets requirements or is secure.

## The churn problem

Code churn and duplication can help teams investigate maintainability, but they do not by themselves establish that AI caused a change in code quality. Compare trends within the same codebase and inspect the changes behind the numbers.

Suggestion acceptance measures whether developers accept an output, not whether the output is correct or whether the team finished useful work faster. Measure the full task, including review and debugging.

## The security debt

In a [controlled study](https://arxiv.org/abs/2211.03622), researchers found that participants using an AI assistant produced less secure solutions on the security tasks studied and were more likely to believe their code was secure. The result is evidence about those tasks and the assistant tested, not a universal rate for current tools.

[Uplevel’s observational analysis](https://uplevelteam.com/blog/genai-developers) reported a higher bug rate after Copilot access in its sample, without an increase in issue throughput. Such a comparison can identify a question for further study; it does not isolate the tool as the cause.

## The benchmark-reality gap

Coding benchmarks can help compare tools on defined tasks, but a benchmark result does not establish how an agent performs on a team's own repository, integration requirements or review process.

Agentic coding tools can make changes across files and run commands, increasing both their potential reach and the importance of review. Teams should verify proposed changes and the tests used to assess them.

## The narrow value corridor

AI assistance may help draft boilerplate, test stubs or API clients when inputs and acceptance criteria are clear. A generated client may compile yet still violate the API contract or fail at runtime. Check it against the specification and exercise representative requests and error cases.

AI assistance may be useful for constrained tasks with clear acceptance criteria. Validate the result against those criteria and inspect failures and maintenance costs before scaling the practice.

Faster drafts are not enough to establish a productivity gain. Include review, debugging and maintenance in the comparison, and measure the outcome against the team's existing workflow. [Self-healing test tools](/2026/01/02/self-healing-tests-myth-vs-reality/) raise a related question: whether time saved on a narrow task exceeds the cost of verifying the result.

---

## References

1. METR, [Early-2025 AI developer productivity experiment](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 2025.
2. METR, [Developer productivity experiment update](https://metr.org/blog/2026-02-24-uplift-update/), 2026.
3. Perry et al., [Do Users Write More Insecure Code with AI Assistants?](https://arxiv.org/abs/2211.03622), 2022.
4. Uplevel, [Does GenAI Improve Software Developer Productivity?](https://uplevelteam.com/blog/genai-developers), 2024.
