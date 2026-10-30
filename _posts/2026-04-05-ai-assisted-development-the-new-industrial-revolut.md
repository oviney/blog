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

AI code generation is not useless. It excels at boilerplate, scaffolding, test stub generation, and language translation — tasks where speed matters and correctness is easily verified. The same logic applies anywhere the schema is explicit and the output is cheaply verified: generating API client code from an OpenAPI specification, where the contract is machine-readable and a compile check confirms correctness; or producing test stubs from existing function signatures, where the structure is given and the developer fills in assertions rather than designs the architecture. In both cases the AI is doing transcription, not design.

AI assistance may be useful for constrained tasks with clear acceptance criteria. Validate the result against those criteria and inspect failures and maintenance costs before scaling the practice.

The mistake is treating these results as evidence of general-purpose productivity transformation. Kent Beck, the creator of extreme programming, summarised the dynamic in a widely shared 2025 essay: "AI makes me mass-produce rough drafts. But programming was never bottlenecked on rough drafts." The companies extracting real value are those that deploy AI where it works, [reckon honestly with its hidden costs](/2026/04/05/practical-applications-of-ai-in-software-development/), and resist the temptation to mistake faster typing for faster shipping. The demo reel will always outperform the daily reality — and the engineers who understand that distinction are the ones whose productivity is genuinely improving.

A good intern accelerates well-scoped work and slows you down on open-ended work because the supervision cost exceeds the contribution. The ROI calculation for AI code generation depends entirely on which category of work you assign — and most organisations are not being honest about the ratio. [Self-healing test tools followed the same arc](/2026/01/02/self-healing-tests-myth-vs-reality/): genuine value in constrained scenarios, oversold as a general solution, disappointing at scale. The tools are not the problem. The problem is organisations treating boilerplate-speed gains as proof of design-quality improvement — a confusion the data, consistently, refuses to support.

---

## References

1. METR, [Early-2025 AI developer productivity experiment](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 2025.
2. METR, [Developer productivity experiment update](https://metr.org/blog/2026-02-24-uplift-update/), 2026.
3. Perry et al., [Do Users Write More Insecure Code with AI Assistants?](https://arxiv.org/abs/2211.03622), 2022.
4. Uplevel, [Does GenAI Improve Software Developer Productivity?](https://uplevelteam.com/blog/genai-developers), 2024.
