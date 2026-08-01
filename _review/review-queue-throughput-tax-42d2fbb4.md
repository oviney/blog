---
layout: review
title: "Merge Pending: Code Review Queues Are Engineering's Most Expensive Line Item"
subtitle: "What velocity dashboards conceal: the senior-engineer hours silently consumed by review queues that faster code generation only deepens"
date: 2026-07-29
author: Ouray Viney
categories: ["Software Engineering", "Quality Engineering"]
description: "AI tools have doubled per-capita code output while review queues have swelled to absorb the surplus. The constraint on delivery speed was never the keyboard."
slug: review-queue-throughput-tax
image_caption: "Queue grows; sprints drain"
tags: [software-engineering, quality-engineering]
image: /assets/images/review-queue-throughput-tax-hero.svg
image_alt: "A developer types furiously at a desk while a towering pile of unreviewed pull-request cards looms from floor to ceiling, dwarfing an empty sprint board as a ticking clock counts down."
---

Every engineering director's post-mortem eventually arrives at the same embarrassing truth. The bottleneck was not the engineers. A median pull request requiring a review takes 14 hours to merge, according to Graphite Research, against nine hours for one merged without review: a 55 per cent penalty for the privilege of a second opinion. PR size, author seniority, and lines changed all trail behind review presence as predictors of cycle time. Keyboards are not the constraint. Queues are. That finding would be uncomfortable enough on its own. AI coding assistants have made it explosive. According to LinearB's 2026 Software Engineering Benchmarks Report, which analysed 8.1 million pull requests across more than 4,800 organisations, AI-assisted PRs wait 4.6 times longer for a reviewer to pick them up than manually written code. Agentic AI PRs, produced autonomously without a human at the keyboard, sit idle for 1,055 minutes before anyone opens them, against 201 minutes for unassisted work. Engineers are writing code at twice the historical rate and waiting five times as long for anyone to read it. The queue, not the commit, has become the principal unit of delay.

## The Doubling Output That Doubled the Queue


A longitudinal study published on arXiv tracked 802 developers and 196,212 pull requests from January 2024 to April 2026, covering a company-wide mandate to adopt AI coding tools. Per-capita code output, according to that study, eventually reached 2.09 times the pre-mandate baseline. Per-reviewer load roughly doubled in lockstep, and automated review overtook human review in raw volume. The authors drew a blunt conclusion: the review pipeline, not code-writing speed, is the operative constraint on delivery. Engineers generated substantially more code; the queue absorbed the surplus and returned nothing measurable at the organisational level. Faros AI's telemetry across 10,000-plus developers on 1,255 teams tells the same structural story from a different vantage point. High-AI-adoption squads merge 98 per cent more pull requests and complete 21 per cent more tasks, numbers any CTO would present to a board with pride. The chart below makes clear, however, that those same squads absorbed a 91 per cent increase in PR review time and a 154 per cent surge in average PR size, with no measurable improvement in the DORA metrics of deployment frequency, lead time, or change failure rate at the organisational level. Individual output inflated spectacularly. Organisational delivery flatlined entirely. The velocity dashboard told one story; the delivery pipeline told a rather different one.

## Automation as a False Escape Route


The obvious rescue is to replace human reviewers with automated code-review agents. That rescue fails. An arXiv study of 3,109 pull requests and 19,450 review comments found that PRs assessed solely by automated agents merged at a 45.2 per cent rate, against 68.4 per cent for human-reviewed PRs. Abandonment ran at 34.9 per cent for bot-reviewed code versus 21.6 per cent for human-reviewed equivalents. Most damaging of all, 92.3 per cent of the 13 agents the researchers tested fell below a 60 per cent signal-quality threshold. Bots add queue delay while emitting predominantly noisy feedback; the throughput bottleneck survives them structurally intact. Google's 2024 DORA State of DevOps report, analysed by RedMonk's Rachel Stephens, sharpens the indictment further. A 25-percentage-point rise in AI tool adoption correlates with an estimated 1.5 per cent decrease in software delivery throughput and a 7.2 per cent decrease in stability. Accelerating code generation without expanding review capacity does not produce faster delivery. It produces a larger queue, which produces slower delivery and a less stable product. The law of diminishing returns has, in engineering organisations that adopted AI tools indiscriminately, acquired a negative sign.

## Reviewing the Reviewer Problem


The throughput tax is structural rather than cultural, and the arithmetic is unforgiving. Review capacity is a function of senior engineering time, the scarcest resource any organisation carries, while code-generation capacity is now functionally unbounded. LinearB's data show that only 32.7 per cent of AI-generated PRs ultimately merge successfully, against 84.4 per cent for manually written code. More than two in three AI PRs are abandoned or require rework severe enough to restart the queue clock, consuming reviewer attention a second time on a PR that again faces worse-than-even odds of shipping. The unit economics of this arrangement are stark. A reviewer who spends the better part of an hour evaluating a PR that never merges, routine at the 34.9 per cent abandonment rate the arXiv study reports, has not merely wasted that session. That reviewer is, in most engineering organisations, a principal or staff engineer whose hour costs an employer fifty pounds or more on any conservative reckoning, and carries an opportunity cost many times that figure. Multiply across a fifty-person organisation and the review backlog is not a scheduling nuisance. It is a recurring, unbudgeted labour charge extracted from the people whose attention compounds most, silently subsidising an AI productivity narrative that the DORA data refuse to validate. Organisations that treat review capacity as fixed overhead while deploying AI coding tools at scale are not accelerating their pipelines — they are financing an ever-deeper queue. Engineering throughput has always been bounded not by how fast code is written but by how fast qualified humans can judge whether it should exist. Flood the intake without widening the throat, and the pipe does not flow faster. It backs up, pressurises, and eventually bursts — usually during a sprint the CTO has already promised to the board. 
![Chart](/assets/charts/review-queue-throughput-tax.png)

## References


1. Graphite Research. "The Median Developer's PRs Take 14 Hours to Merge." https://graphite.com/research/median-time-to-merge-prs

2. LinearB. *2026 Software Engineering Benchmarks Report.* https://linearb.io/resources/software-engineering-benchmarks-report

3. arXiv. "AI Writes Faster Than Humans Can Review: A Longitudinal Study of an Enterprise 2× Mandate." https://arxiv.org/abs/2607.01904

4. Faros AI. "The AI Productivity Paradox." https://www.faros.ai/ai-productivity-paradox

5. Stephens, Rachel. RedMonk analysis of DORA 2024. https://redmonk.com/rstephens/2024/11/26/dora2024/

6. arXiv. "From Industry Claims to Empirical Reality: An Empirical Study of Code Review Agents in Pull Requests." https://arxiv.org/html/2604.03196v1
