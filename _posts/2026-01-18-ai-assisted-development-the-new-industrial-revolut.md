---
layout: post
title: "Code Generators: The Brilliant Interns Nobody Supervises"
date: 2026-04-05
author: "Ouray Viney"
categories: ["Software Engineering"]
image: /assets/images/ai-assisted-code-generation.png
image_alt: "Office robots write code at keyboards with no human supervision"
image_caption: "Illustration: code generators move fast when nobody is reviewing them"
description: "AI code generators boost typing speed but degrade code quality — METR found developers are 19% slower on tasks, while GitClear shows 41% higher code churn."
---

![AI coding tools: productivity gains in throughput offset by code churn and slower experienced developers](/assets/charts/ai-assisted-development-the-new-industrial-revolut.svg)
*Source: DORA State of AI-Assisted Software Development, 2025; METR, 2025; GitClear, 2025*

METR, a non-profit AI safety research lab, tracked 16 experienced open-source developers as they completed 246 real-world coding tasks on mature repositories averaging over one million lines of code. The developers using AI tools took 19% longer than those working without them. Before the study, participants had predicted AI would make them 24% faster. Even after experiencing the slowdown, they estimated AI had improved their productivity by 20%. The gap between perception and measurement is the defining feature of the AI coding revolution: developers believe the tools help, the data says otherwise, and nobody wants to hear it.

The core problem is that AI code generators optimise for plausibility, not correctness. They produce code that looks right, compiles cleanly, and passes superficial review. But the evidence — from controlled studies, production telemetry, and security research — shows that the code they generate carries higher defect density, weaker security, and more churn than human-written equivalents. The productivity gains are real but narrow, and the costs are systematically undermeasured.

## The churn problem

GitClear's 2025 analysis of 211 million lines of changed code found that repositories with heavy AI assistance showed a 41% increase in code churn — code written and then rewritten within two weeks. Refactoring, the practice of improving code structure without changing behaviour, dropped from 25% of changed lines in 2021 to under 10% by 2024. AI-generated code showed four times more cloning — copy-pasted blocks — than human-written code. The tools accelerate initial production while degrading the codebase's long-term health.

GitHub Copilot, the most widely deployed AI coding assistant with over 1.8 million paying subscribers, reports an average suggestion acceptance rate of roughly 30%. A ZoomInfo case study published on arXiv in January 2025 found a 33% acceptance rate for suggestions and 20% for complete lines, with a developer satisfaction score of 72%. These are respectable numbers for an autocomplete tool. They are not evidence of a productivity revolution.

## The security debt

Researchers at Stanford, led by cryptographer Dan Boneh, published a controlled study demonstrating that developers using AI code assistants produced significantly less secure code than those coding without assistance — and were more likely to believe their code was secure. Developers with the least secure output rated their trust in the AI at 4.0 out of 5.0; those with the most secure code rated trust at 1.5. The study examined 47 participants across five security-related tasks in Python, JavaScript, and C. The most common vulnerabilities were injection flaws, improper input validation, and hardcoded credentials — elementary mistakes that the models reproduce from training data with confident fluency.

The Uplevel Data Labs study confirmed the pattern at industry scale: developers with Copilot access saw a significantly higher bug rate while their issue throughput remained consistent. More code, same output, more bugs — the precise opposite of the value proposition.

## The benchmark-reality gap

SWE-bench, the most cited benchmark for AI coding agents, illustrates the measurement problem perfectly. When OpenAI introduced SWE-bench Verified in August 2024, the top model solved 33% of issues. By early 2026, leading models consistently score above 70%. These results generate breathless headlines. But they measure performance on curated issues with clear reproduction steps, explicit expected behaviour, and well-factored codebases — a controlled environment that bears little resemblance to daily engineering work.

Cursor, the AI-native code editor that reached a $29.3 billion valuation in late 2025 with over one million daily active users, represents the frontier of agentic coding. Today 95% of Cursor users are agent users, running multi-file edits orchestrated by AI. Yet even in benchmarks, the highest combined score belongs to Cursor with Claude Opus 4.6 at 0.751 — meaning roughly one in four tasks still fails. In production, where requirements are ambiguous and codebases are messy, failure rates climb higher.

## The narrow value corridor

AI code generation is not useless. It excels at boilerplate, scaffolding, test stub generation, and language translation — tasks where speed matters and correctness is easily verified. The same logic applies anywhere the schema is explicit and the output is cheaply verified: generating API client code from an OpenAPI specification, where the contract is machine-readable and a compile check confirms correctness; or producing test stubs from existing function signatures, where the structure is given and the developer fills in assertions rather than designs the architecture. In both cases the AI is doing transcription, not design. GitHub's own research shows code written with Copilot had a 53.2% greater likelihood of passing all unit tests — precisely the category of well-defined, verifiable tasks. For constrained work with explicit schemas, the tools deliver genuine value, which is why [adoption in AI-augmented QA workflows](/2026/04/05/ai-quality-testing-automation/) has progressed furthest in exactly these domains.

The mistake is treating these results as evidence of general-purpose productivity transformation. Kent Beck, the creator of extreme programming, summarised the dynamic in a widely shared 2025 essay: "AI makes me mass-produce rough drafts. But programming was never bottlenecked on rough drafts." The companies extracting real value are those that deploy AI where it works, [measure its actual impact](/2026/04/05/practical-applications-of-ai-in-software-development/), and resist the temptation to mistake faster typing for faster shipping. The demo reel will always outperform the daily reality — and the engineers who understand that distinction are the ones whose productivity is genuinely improving.

A good intern accelerates well-scoped work and slows you down on open-ended work because the supervision cost exceeds the contribution. The ROI calculation for AI code generation depends entirely on which category of work you assign — and most organisations are not being honest about the ratio. [Self-healing test tools followed the same arc](/2026/01/02/self-healing-tests-myth-vs-reality/): genuine value in constrained scenarios, oversold as a general solution, disappointing at scale. The tools are not the problem. The problem is organisations treating boilerplate-speed gains as proof of design-quality improvement — a confusion the data, consistently, refuses to support.

---

## References

1. METR, "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity," July 2025, [metr.org](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
2. GitClear, "AI's Impact on Software Development: Analysis of 211M Lines," 2025, [gitclear.com](https://www.gitclear.com/coding_on_copilot_data_shows_ais_impact_on_software_development)
3. Perry, N. et al., "Do Users Write More Insecure Code with AI Assistants?," Stanford University, [arxiv.org](https://arxiv.org/html/2211.03622v3)
4. Yehudai, A. et al., "Experience with GitHub Copilot for Developer Productivity at ZoomInfo," January 2025, [arxiv.org](https://arxiv.org/html/2501.13282v1)
5. GitHub Blog, "Does GitHub Copilot Improve Code Quality?," 2024, [github.blog](https://github.blog/news-insights/research/does-github-copilot-improve-code-quality-heres-what-the-data-says/)
