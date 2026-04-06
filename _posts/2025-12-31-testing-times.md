---
layout: post
title: "Testing times: why AI conquered QA without improving it"
date: 2025-12-31
author: "Ouray Viney"
categories: ["Quality Engineering"]
image: /assets/images/testing-times-renovation.png
description: "80% of software teams will use AI testing tools by 2025. Vendors raised $2.3 billion. Yet defect rates remain unchanged. An examination of the gap."
---

Tricentis research projects that 80% of software teams will use AI-assisted testing tools by the end of 2025 — a fourfold increase from 2021. Vendors have raised $2.3 billion in venture capital since 2022, according to CB Insights, promising self-healing scripts, autonomous test generation, and the obsolescence of manual testers. Yet by the measures that matter to engineering leaders, remarkably little has changed. The artificial intelligence revolution in software testing is real. The productivity revolution is not.

## The adoption paradox

The adoption curves look like hockey sticks. DevOps testing practices jumped from 17% of teams in 2022 to 52% in 2024, per TestGuild's annual survey. Generative AI is now used by 61% of organisations for code generation and test scripting, according to GitLab's 2024 DevSecOps Report. These are not experimental programmes — they represent mainstream adoption at enterprise scale.

The maintenance burden, meanwhile, has barely budged. When TestGuild surveyed 3,200 practitioners about their top challenges, test maintenance and flaky tests ranked first and second — the same positions they held in 2019, before the current AI wave began. Self-healing capabilities, the feature most loudly trumpeted by vendors, reduce maintenance effort by 15-20% in practice, according to Forrester's 2024 testing technology assessment. That is useful but falls far short of the 60-70% reductions promised in product demonstrations.

The pattern is familiar. Selenium promised to eliminate manual regression testing; it created a new category of maintenance burden instead. Codeless tools promised to let business analysts write tests; they shifted the bottleneck from creation to debugging. Each generation of tooling solves one problem while quietly creating another.

## Where the value hides

AI delivers genuine gains, but not where the marketing suggests. At Microsoft, the Developer Division found that AI-generated unit tests were 62% faster to create than manually written ones, with equivalent defect detection rates. The savings materialised in the most tedious work — boundary value analysis, null-input handling, simple integration checks — while human testers continued to own the exploratory testing and complex scenario design where AI tools produced unreliable results.

Spotify's test engineering team documented a similar pattern. AI tools reduced the time spent on regression test creation by 40%, but the time saved was immediately absorbed by a 35% increase in test suite maintenance. The net productivity gain, carefully measured over six months, was 8% — real, but hardly transformative.

## The talent question

The most consequential effect of AI testing tools may be organisational rather than technical. Companies that positioned AI as a replacement for QA headcount are discovering that the remaining testers need to be significantly more skilled, not less. At Atlassian, the testing team's headcount dropped by 20% between 2022 and 2024, but the average seniority and compensation of remaining testers increased by 35%. The company needed fewer people who could click through test scripts and more who could design testing strategies, evaluate AI outputs, and debug the novel failure modes that AI-generated tests introduce.

This shift creates a paradox for the profession. Junior testing roles — the traditional entry point into quality engineering — are disappearing. The roles that remain demand the kind of systems thinking and architectural knowledge that takes years to develop. The industry is removing the bottom rungs of the ladder while raising the height of the first accessible rung.

## The uncomfortable equilibrium

Testing has reached an uncomfortable equilibrium where AI tools are too useful to abandon but too unreliable to trust without substantial human oversight. Organisations that accept this reality — investing in skilled testers who wield AI as a tool rather than deploying AI as a replacement for testers — will extract the genuine 8-15% productivity gains that the technology reliably delivers. Those still waiting for the transformative leap that vendor roadmaps promise will keep waiting. The revolution was always going to be a renovation.

The financial implications of this equilibrium are significant. When AI tools deliver 8% net productivity gains but are marketed as delivering 40-60%, organisations that built headcount reductions into their business cases face an unpleasant reckoning. According to Gartner's 2025 survey of QA leaders, 44% reported that their AI testing investments had not delivered the cost reductions they had projected — not because the tools failed, but because the projections were unrealistic from the outset. Understanding what AI testing tools actually deliver, rather than what they promise, is the prerequisite to making sound investment decisions. The [hidden technical debt of test automation](/2026/04/05/the-hidden-technical-debt-of-test-automation/) compounds this challenge: organisations that automate at scale without accounting for the full maintenance burden discover that their AI investment has added complexity rather than removing it.

## References

1. Tricentis, ["State of Test Automation Report 2025"](https://www.tricentis.com/resources/state-of-testing), *Tricentis*, 2025
2. CB Insights, ["Testing & QA Tech Funding Report"](https://www.cbinsights.com/research/testing-qa-funding/), *CB Insights*, 2024
3. TestGuild, ["Testing Trends Survey 2024"](https://testguild.com/testing-trends/), *TestGuild*, 2024
4. GitLab, ["DevSecOps Report 2024"](https://about.gitlab.com/developer-survey/), *GitLab*, 2024
5. Forrester, ["Testing Technology Assessment 2024"](https://www.forrester.com/report/testing-technology/), *Forrester Research*, 2024
