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
description: "How quality assurance, quality control and quality engineering can clarify responsibilities across delivery."
---


Quality work includes preventing defects, detecting problems and improving the delivery system. Teams benefit from making those responsibilities explicit, whatever titles they use.

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

Manufacturing offers useful examples of process improvement, inspection and mistake-proofing. The QA, QC and QE labels used here are a way to discuss responsibilities in software, not a claim about Toyota's own taxonomy.

Delivery speed and operational stability both matter. Clear responsibility for prevention, feedback and incident learning helps teams evaluate those outcomes together.

## Separating the disciplines

Fixing the confusion does not require a reorganisation chart the size of a wall. It requires three things.

First, **name the functions honestly**. If a team is writing and executing test cases, it is doing QC. Call it QC. If a different group is defining standards and reviewing processes, that is QA. If nobody is responsible for test infrastructure, quality metrics, or feedback loops from production to development, then the organisation does not have a QE function — regardless of what the job titles say.

Second, **measure differently**. QC is measured by defects found. QA is measured by defect-introduction rates. QE is measured by systemic outcomes: mean time to feedback, escaped-defect rates, test-maintenance burden as a proportion of development capacity, and the ratio of proactive quality investment to reactive rework cost. Organisations that measure all three functions by the same metric — bugs found — will inevitably over-invest in detection and under-invest in prevention and engineering.

Third, **fund quality engineering as infrastructure**. Test frameworks, CI/CD quality gates, observability pipelines, and production-monitoring integrations are infrastructure investments with multi-year payback periods. They should be funded and governed like infrastructure — with a platform team, a product owner, and a roadmap — not buried as a line item inside individual project budgets where they are the first expenditure cut when deadlines tighten.

## The clarity dividend

Clear responsibilities can help teams discuss prevention, detection and improvement without assuming a job title tells the whole story. Revisit ownership when gaps appear, and examine outcomes rather than treating labels as proof of quality.

---

## References

1. ASQ, [Quality Assurance vs Quality Control](https://asq.org/quality-resources/quality-assurance-vs-control).
2. ASQ, [Quality Glossary](https://asq.org/quality-resources/quality-glossary).
3. CISQ, [Cost of Poor Software Quality in the US](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/), 2022.
