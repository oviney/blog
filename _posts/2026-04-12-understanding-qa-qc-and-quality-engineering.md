---
layout: post
title: "The quality confusion tax: when QA, QC and QE blur"
date: 2026-04-12
author: "Ouray Viney"
categories: ["quality-engineering"]
tags: [quality-assurance, quality-control, quality-engineering, quality-management]
image: /assets/images/understanding-qa-qc-quality-engineering.png
image_alt: "Crisp infographic diagram showing three distinct quality disciplines — QA, QC and QE — converging into a unified quality strategy, rendered in a clean editorial style with navy, grey and red accents"
description: "Most organisations treat QA, QC and quality engineering as synonyms. The confusion costs real money — and explains why quality maturity stalls."
---

Most organisations use the terms Quality Assurance, Quality Control, and Quality Engineering interchangeably. Ask a product manager what distinguishes the three and the reply is usually a shrug or a vague reference to "testing." The conflation is not merely semantic. When companies cannot articulate the difference between preventing defects, detecting defects, and engineering quality into the development lifecycle, they misallocate budgets, misstaff teams, and misdiagnose failures. The Consortium for Information and Software Quality (CISQ) estimated in its 2022 report that poor software quality cost the United States economy $2.41 trillion annually. A meaningful share of that figure traces back to organisations that invested in the wrong quality discipline — or, more commonly, invested in one discipline while believing they had all three covered.

## Three disciplines, one label

The confusion is understandable. All three functions orbit the same objective: shipping products that work. But they attack the problem from fundamentally different angles, and treating them as substitutes produces the organisational equivalent of hiring a locksmith to design a house.

**Quality Assurance** is preventive. It focuses on process: defining standards, establishing workflows, and creating the conditions under which defects are less likely to arise. The American Society for Quality (ASQ) [defines QA](https://asq.org/quality-resources/quality-assurance) as "a systematic approach to ensuring that processes used to manage and create deliverables meet quality standards." A QA function does not touch the product directly. It shapes the environment in which the product is built. When QA works well, fewer defects are introduced in the first place. When it fails, teams discover too late that nobody documented the deployment checklist, the code review criteria, or the requirements-traceability matrix.

**Quality Control** is reactive. It inspects finished or semi-finished work to identify defects that slipped through. ASQ's [definition of QC](https://asq.org/quality-resources/quality-control) centres on "activities used to verify requirements and ensure standards are met." QC is the checkpoint at the end of the assembly line — the manual test pass, the regression suite, the user-acceptance sign-off. It catches problems. It does not prevent them. Yet in many software organisations, QC is the only quality discipline with meaningful headcount and budget, precisely because its output — bugs found — is the easiest to measure.

**Quality Engineering** is systemic. It embeds quality thinking into every phase of the development lifecycle, from architecture to observability in production. ASQ describes the [quality engineer's role](https://asq.org/quality-resources/quality-engineering) as one that "applies statistical methods and engineering principles to ensure quality." QE practitioners own test infrastructure, define quality metrics, build feedback loops between production telemetry and development priorities, and treat quality as a product attribute rather than a gatekeeping function. Where QA writes the standards and QC enforces them, QE designs the system so that compliance is a byproduct of the architecture rather than an overhead bolted on afterward.

## The cost of conflation

The practical damage emerges when organisations collapse these three functions into one team — typically labelled "QA" — and expect that team to handle everything from process governance to exploratory testing to test-framework architecture. The result is predictable: the team gravitates toward the most visible activity (finding bugs) and neglects the two activities whose value is structural but invisible (preventing bugs and engineering systemic quality).

The OpenText and Capgemini World Quality Report 2025-26, which surveyed 1,800 technology leaders across 33 countries, found that only 19% of organisations believed their quality strategy was effective — a decline from 23% two years earlier. One contributing factor was organisational ambiguity. Companies that had a dedicated quality-engineering function operating alongside (not inside) QA reported higher satisfaction with quality outcomes than those that had merged all quality roles under a single umbrella.

This mirrors a pattern well documented in manufacturing, where the distinction between QA and QC was settled decades ago. Toyota's production system — the template for lean manufacturing — explicitly separates process assurance (QA) from product inspection (QC), and both from the engineering of poka-yoke mechanisms that make defects structurally impossible (QE). Software organisations, despite borrowing heavily from manufacturing's vocabulary, have been slow to adopt its organisational clarity.

DORA's 2025 State of DevOps Report reinforced the point from a performance angle: elite-performing teams deployed 182 times more frequently than low performers while maintaining change failure rates below 5%. These teams did not achieve both speed and stability by testing harder at the end of the pipeline. They achieved it by engineering quality into the pipeline itself — building automated guardrails, monitoring production telemetry in real time, and feeding failure data back into design decisions. That is quality engineering, not quality assurance and not quality control, and it requires a distinct skill set, a distinct mandate, and a distinct budget line.

## Separating the disciplines

Fixing the confusion does not require a reorganisation chart the size of a wall. It requires three things.

First, **name the functions honestly**. If a team is writing and executing test cases, it is doing QC. Call it QC. If a different group is defining standards and reviewing processes, that is QA. If nobody is responsible for test infrastructure, quality metrics, or feedback loops from production to development, then the organisation does not have a QE function — regardless of what the job titles say.

Second, **measure differently**. QC is measured by defects found. QA is measured by defect-introduction rates. QE is measured by systemic outcomes: mean time to feedback, escaped-defect rates, test-maintenance burden as a proportion of development capacity, and the ratio of proactive quality investment to reactive rework cost. Organisations that measure all three functions by the same metric — bugs found — will inevitably over-invest in detection and under-invest in prevention and engineering.

Third, **fund quality engineering as infrastructure**. Test frameworks, CI/CD quality gates, observability pipelines, and production-monitoring integrations are infrastructure investments with multi-year payback periods. They should be funded and governed like infrastructure — with a platform team, a product owner, and a roadmap — not buried as a line item inside individual project budgets where they are the first expenditure cut when deadlines tighten.

## The clarity dividend

The organisations that distinguish clearly between QA, QC, and QE do not merely find fewer bugs. They build systems that produce fewer bugs, catch the remaining ones earlier, and learn from production failures systematically. The discipline is not glamorous. It requires admitting that a team called "QA" might actually be doing "QC" — an admission that bruises egos but clarifies priorities. In an industry where the cost of poor quality is measured in trillions, that clarity is not a luxury. It is a competitive advantage that most companies have not yet claimed.

---

## References

1. CISQ, *The Cost of Poor Software Quality in the US: A 2022 Report*, [it-cisq.org](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/)
2. ASQ, *Quality Assurance Resources*, [asq.org](https://asq.org/quality-resources/quality-assurance)
3. ASQ, *Quality Control Resources*, [asq.org](https://asq.org/quality-resources/quality-control)
4. ASQ, *Quality Engineering Resources*, [asq.org](https://asq.org/quality-resources/quality-engineering)
5. OpenText & Capgemini, *World Quality Report 2025-26*, [opentext.com](https://www.opentext.com/en/media/report/world-quality-report-17th-edition)
6. DORA, *State of DevOps Report 2025*, [dora.dev](https://dora.dev/dora-report-2025/)
