---
layout: post
title: "The quality confusion tax: when QA, QC and QE blur"
subtitle: "When QA, QC and quality engineering are treated as synonyms, the budgets, hiring profiles and processes that follow are also interchangeable — and predictably wrong for two of the three."
date: 2026-04-12
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [quality-assurance, quality-control, quality-engineering, quality-management]
image: /assets/images/understanding-qa-qc-quality-engineering-hero.svg
image_alt: "A product box caught in a red knot linking a checklist, magnifying glass, and gear"
image_caption: "Illustration: when quality ownership tangles, the product gets stuck"
description: "Most organisations treat QA, QC and quality engineering as synonyms. The confusion costs real money — and explains why quality maturity stalls."
---


Most organisations say they take quality seriously. Far fewer can explain who is supposed to prevent defects, who is supposed to detect them, and who is supposed to engineer the delivery system so quality improves over time. Ask a product leader to distinguish Quality Assurance, Quality Control, and Quality Engineering and the answer is often a shrug, a job-title anecdote, or the all-purpose phrase "the QA team". The ambiguity is expensive. When organisations cannot articulate the difference between preventing defects, detecting defects, and engineering quality into the development lifecycle, they misallocate budgets, misstaff teams, and misdiagnose failures.

The [CISQ 2022 report](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/) estimated the US cost of poor software quality at at least $2.41 trillion. That aggregate estimate does not identify how much is caused by ambiguity between QA, QC and QE. Teams can instead examine their own rework, incidents and ownership gaps.

A familiar scene follows. A release slips, customers complain, and executives ask "QA" why quality failed. The problem, however, sits upstream: no release criteria were defined, no telemetry fed production failures back into engineering priorities, and no one owned the test infrastructure well enough to keep signal flowing. The diagnosis is wrong before the postmortem begins.

## Three disciplines, one label

The confusion is understandable. All three functions orbit the same objective: shipping products that work. But they attack the problem from fundamentally different angles, and treating them as substitutes produces the organisational equivalent of hiring a locksmith to design a house.

**Quality Assurance** focuses on providing confidence that quality requirements will be fulfilled. [ASQ describes](https://asq.org/quality-resources/quality-assurance-vs-control) planned and systematic activities across the quality system. In software, these can include agreed practices for reviews, validation and learning from failures.

**Quality Control** focuses on fulfilling quality requirements, including inspection and checks of a product or process. An automated regression check and a user-acceptance test are examples of activities that can provide evidence about a product. Finding a defect can also prompt changes that prevent it recurring.

**Quality Engineering** applies engineering methods to improve quality across a system. In software, teams may build test infrastructure, design feedback loops and use production observations to guide improvements. Organisations define the role differently; responsibilities should be explicit rather than inferred from the title.

## The cost of conflation

The practical damage emerges when organisations collapse these three functions into one team — typically labelled "QA" — and expect that team to handle everything from process governance to exploratory testing to test-framework architecture. The result is predictable: the team gravitates toward the most visible activity (finding bugs) and neglects the two activities whose value is structural but less visible (preventing bugs and engineering systemic quality). It is the organisational equivalent of measuring a fire brigade entirely by how many blazes it extinguishes while ignoring the wiring standards that would have prevented the fire in the first place.

The terms QA, QC and QE are used differently across organisations. That variation makes an explicit description of responsibilities more useful than assuming a job title settles who prevents defects, checks behaviour or improves the delivery system.

This mirrors a pattern well documented in manufacturing, where the distinction between QA and QC was settled decades ago. Toyota's production system — the template for lean manufacturing — explicitly separates process assurance (QA) from product inspection (QC), and both from the engineering of poka-yoke mechanisms that make defects structurally impossible (QE). Software organisations, despite borrowing heavily from manufacturing's vocabulary, have been slow to adopt its organisational clarity.

Delivery speed and operational stability both matter. Clear responsibility for prevention, feedback and incident learning helps teams evaluate those outcomes together.

## Separating the disciplines

Fixing the confusion does not require a reorganisation chart the size of a wall. It requires three things.

First, **name the functions honestly**. If a team is writing and executing test cases, it is doing QC. Call it QC. If a different group is defining standards and reviewing processes, that is QA. If nobody is responsible for test infrastructure, quality metrics, or feedback loops from production to development, then the organisation does not have a QE function — regardless of what the job titles say.

Second, **measure differently**. QC is measured by defects found. QA is measured by defect-introduction rates. QE is measured by systemic outcomes: mean time to feedback, escaped-defect rates, test-maintenance burden as a proportion of development capacity, and the ratio of proactive quality investment to reactive rework cost. Organisations that measure all three functions by the same metric — bugs found — will inevitably over-invest in detection and under-invest in prevention and engineering.

Third, **fund quality engineering as infrastructure**. Test frameworks, CI/CD quality gates, observability pipelines, and production-monitoring integrations are infrastructure investments with multi-year payback periods. They should be funded and governed like infrastructure — with a platform team, a product owner, and a roadmap — not buried as a line item inside individual project budgets where they are the first expenditure cut when deadlines tighten.

## The clarity dividend

The organisations that distinguish clearly between QA, QC, and QE do not merely find fewer bugs. They build systems that produce fewer bugs, catch the remaining ones earlier, and learn from production failures systematically. The discipline is not glamorous. It requires admitting that a team called "QA" might actually be doing "QC" — an admission that bruises egos but clarifies priorities. In an industry where the cost of poor quality is measured in trillions, that clarity is not a luxury. It is a competitive advantage that most companies have not yet claimed, and it is one of the cleanest ways to stop quality work from degenerating into [testing theatre](/2026/04/05/the-real-cost-of-testing-theater-when-quality-metr/).

---

## References

1. ASQ, [Quality Assurance vs Quality Control](https://asq.org/quality-resources/quality-assurance-vs-control).
2. ASQ, [Quality Glossary](https://asq.org/quality-resources/quality-glossary).
3. CISQ, [Cost of Poor Software Quality in the US](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/), 2022.
