---
layout: post
title: "AI's Coding Demo: Dazzling on Stage, Mediocre at the Desk"
date: 2026-04-05
author: "The Economist"
categories: ["Quality Engineering", "AI Testing", "Software Engineering"]
image: /assets/images/ai-software-development-reality.png
summary: "AI coding tools make experienced developers 19% slower according to METR, while Cursor's $29 billion valuation suggests the market has priced in a revolution that the evidence hasn't delivered."
---

METR, a non-profit AI safety research lab, tracked 16 experienced open-source developers completing 246 real-world coding tasks on mature repositories averaging over one million lines of code. Developers using AI tools took 19% longer than those working without them. Before the study, participants predicted AI would make them 24% faster. Even after experiencing the actual slowdown, they estimated AI had improved their productivity by 20%. The perception gap is so wide that METR noted a significant increase in developers declining to participate because they refused to work without AI — a tool they measurably cannot use productively on complex codebases, but believe they cannot work without.

The thesis is uncomfortable for an industry that has bet billions on AI-assisted development: these tools deliver genuine but narrow productivity gains on routine tasks while introducing new categories of cost — subtle bugs, maintainability debt, security vulnerabilities — that nobody is measuring carefully enough.

## The benchmark-reality gap

SWE-bench, the most cited benchmark for AI coding agents, measures whether models can resolve real GitHub issues. When OpenAI introduced SWE-bench Verified in August 2024, the top model solved 33% of issues. By early 2026, leading models consistently score above 70% on the curated Lite subset. MIT Technology Review noted in December 2025 that these results generated breathless coverage, but the benchmarks test performance on curated issues with clear reproduction steps and well-factored codebases — an environment that bears little resemblance to daily engineering.

Cursor, the AI-native code editor valued at $29.3 billion after a $2.3 billion Series D in November 2025, represents the frontier. The company surpassed $1 billion in annualised revenue, claims over one million daily active users, and reports that 95% of its users are "agent users" running multi-file edits orchestrated by AI. Cursor 2.0, launched in October 2025, introduced a custom model enabling developers to run up to eight agents in parallel on a single prompt. Yet even in formal benchmarks, the highest combined score belongs to Cursor with Claude Opus 4.6 at 0.751 — meaning roughly one in four tasks still fails under ideal conditions.

The gap between demo and desk is structural, not temporary. Fortune reported in March 2026 that Cursor faces "a very uncertain future" precisely because the commoditisation of AI models threatens its core differentiation. The tool's value depends on models improving faster than competitors can integrate them — a bet, not a certainty.

## The quality tax

GitClear's 2025 analysis of 211 million lines of changed code quantified the downstream cost. Code churn — lines rewritten within two weeks of being added — rose 41% in repositories using AI assistants. Refactoring dropped from 25% of changed lines in 2021 to under 10% by 2024. AI-generated code showed four times more cloning than human-written code. The tools encourage developers to accept generated snippets rather than restructure existing code, producing codebases that grow horizontally rather than improving vertically.

Stanford's Dan Boneh led a study demonstrating that developers using AI assistants produced significantly less secure code — and were more likely to believe it was secure. Developers with the least secure output rated their trust in AI at 4.0 out of 5.0; those with the most secure code rated trust at 1.5. The Uplevel Data Labs study confirmed the pattern at scale: developers with Copilot access saw a significantly higher bug rate while their issue throughput remained consistent.

GitHub Copilot, with over 1.8 million paying subscribers, reports an average suggestion acceptance rate of roughly 30% — a figure that has barely moved since 2022 despite multiple model upgrades. GitHub's own research claims positive quality effects: a 53.2% greater likelihood of passing unit tests and 13.6% more lines before encountering readability errors. The contradiction between GitHub's findings and independent research is itself revealing — vendor-funded studies consistently show benefits that third-party studies struggle to replicate.

## The narrow value corridor

AI coding tools excel at boilerplate generation, test stub creation, documentation writing, and language translation — tasks where speed matters and correctness is easily verified. A ZoomInfo case study published on arXiv in January 2025 found a 33% suggestion acceptance rate with 72% developer satisfaction — a tepid endorsement that tracks with the "somewhat useful for routine tasks" modal response in the Stack Overflow 2024 Developer Survey, where 76% of developers used AI tools but only 43% trusted the output's accuracy.

The most honest assessment came from Satya Nadella in a January 2025 earnings call: "Copilot is most valuable when it removes the drudgery, not when it replaces the thinking." This is a defensible claim and a useful product category. It is also a considerable retreat from the "AI will write all the code" narrative that dominated 2023 conference circuits.

The companies extracting genuine value are those that deploy AI where it works, measure its actual impact with the same rigour they apply to any engineering investment, and resist the temptation to mistake faster typing for faster shipping. By 2027, the most productive engineering teams will not be those with the most AI tooling. They will be those that learned, earliest, which suggestions to refuse.

---

## References

1. METR, "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity," July 2025, [metr.org](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
2. GitClear, "AI's Impact on Software Development: Analysis of 211M Lines," 2025, [gitclear.com](https://www.gitclear.com/coding_on_copilot_data_shows_ais_impact_on_software_development)
3. Fortune, "Cursor's crossroads: The rapid rise, and very uncertain future, of a $30 billion AI startup," March 2026, [fortune.com](https://fortune.com/2026/03/21/cursor-ceo-michael-truell-ai-coding-claude-anthropic-venture-capital/)
4. Perry, N. et al., "Do Users Write More Insecure Code with AI Assistants?," Stanford University, [arxiv.org](https://arxiv.org/html/2211.03622v3)
5. MIT Technology Review, "AI coding is now everywhere. But not everyone is convinced," December 2025, [technologyreview.com](https://www.technologyreview.com/2025/12/15/1128352/rise-of-ai-coding-developers-2026/)
