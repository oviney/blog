---
layout: post
title: "Software's Trillion-Dollar Tax: The Cost Nobody Itemises"
subtitle: "CISQ estimated $2.41 trillion in US software quality costs in 2022; incident costs show why organisations should measure their own exposure."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [cost-of-quality, quality-engineering, software-engineering]
image: /assets/images/copq-software-engineering.png
image_alt: "A newspaper front page announcing a trillion-dollar software quality bill"
image_caption: "Illustration: poor quality lands as a bill large enough to make headlines"
description: "CISQ estimated the US cost of poor software quality in 2022. The CrowdStrike outage illustrates the risks behind aggregate estimates."
---

On 19 July 2024, a faulty content update pushed by CrowdStrike's Falcon sensor crashed 8.5 million Windows machines worldwide. Delta Air Lines cancelled 7,000 flights over five days, disrupting 1.3 million customers. Delta's CEO Ed Bastian put the cost at $500 million, encompassing lost revenue, tens of millions per day in customer compensation, and hotel costs. Delta has since sued CrowdStrike, seeking damages exceeding that figure. The root cause was not a sophisticated cyberattack. It was a defective configuration file that bypassed validation — a quality engineering lapse so elementary that it would fail a university exam.

The [CISQ 2022 report](https://www.it-cisq.org/wp-content/uploads/sites/6/2022/11/CPSQ-Report-Nov-22-2.pdf) estimated the annual cost of poor software quality in the United States at at least $2.41 trillion. It also estimated accumulated technical debt at approximately $1.52 trillion, a distinct measure. These are estimates based on the report's methods and assumptions, not a direct accounting of any one company's costs. CISQ's 2018 and 2020 estimates were $2.8 trillion and $2.08 trillion respectively; they do not support a claim that the estimate rose every year.


## The invisible tax

Most companies have no idea what poor quality costs them because the expenses hide in plain sight. Rework hours are logged against feature sprints. Incident response is charged to operations. Customer churn caused by buggy releases appears in the retention budget. Nobody totals the bill because nobody owns the line item.

Stripe's developer coefficient survey found that engineers at the average company spend 42% of their time — approximately 17.3 hours per week — on maintenance and technical debt. At a company with 200 engineers averaging $160,000 in total compensation, that translates to $13.4 million annually in engineering capacity consumed by the consequences of past quality decisions. Globally, the lost developer productivity amounts to nearly $300 billion per year. The figure does not include infrastructure costs, customer support overhead, or the opportunity cost of features not built.

The CloudQA 2025 cost of software bugs report confirmed that defect economics follow a brutal exponential curve. A defect found in production costs 30 to 100 times more to fix than one caught during design or unit testing. Yet most teams still allocate the bulk of their quality spend to the end of the pipeline, where the cost multiplier is highest. The economics are perverse: the industry systematically over-invests in the most expensive place to find bugs and under-invests in the cheapest.

*Source: CloudQA, 2025; CISQ, 2022*

## The shift-left arithmetic

The DORA State of DevOps 2025 report found that elite-performing teams deploy 182 times more frequently than low performers while maintaining change failure rates below 5%. Speed and quality are not trade-offs — they are the same discipline viewed from different angles. The primary barrier to shift-left testing is not technical but organisational: testing is still treated as a phase rather than a practice, owned by a separate QA function rather than embedded in development workflows.

CrowdStrike's Channel File 291 update bypassed the kind of staged rollout and canary testing that Google's Site Reliability Engineering handbook has prescribed since 2016. George Kurtz, CrowdStrike's CEO, acknowledged in testimony before the US House of Representatives that the update had not been subjected to the same validation as a full sensor release. A cybersecurity company was undone by a quality-engineering failure — the irony was bitter and the lesson universal.

## The accountability gap

The deeper problem is structural. In most companies, nobody is accountable for the total cost of quality. Engineering leadership owns development speed. Operations owns uptime. Product owns revenue. Quality falls between these boundaries, claimed by all and owned by none. Organisations can make those costs visible by agreeing on consistent categories and reviewing prevention, appraisal, rework and customer impact together.

The irony is that the data to close this gap already exists. Every company tracks incident costs, rework hours, and customer churn. The missing step is aggregation — summing these scattered line items into a single quality cost figure that sits beside revenue and headcount on the executive dashboard. Google's error budget model does exactly this: it translates reliability targets into a financial framework where every outage minute has a dollar value and every feature freeze has an opportunity cost. The model forces trade-off decisions that most companies make by intuition and politics rather than arithmetic.

Until companies appoint a quality economics function with visibility across the entire software lifecycle, the trillion-dollar tax will continue to compound. CrowdStrike's $500 million day was the bill arriving all at once. For most companies, the same amount leaks out slowly — in engineer hours wasted on rework, in customers lost to buggy releases, in features delayed by fragile infrastructure. The difference is only visibility. The cost is identical.

---

## References

1. CISQ, *The Cost of Poor Software Quality in the US: A 2022 Report*, [it-cisq.org](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/)
2. NPR, "Delta's CEO says the CrowdStrike outage cost the airline $500 million," July 2024, [npr.org](https://www.npr.org/2024/07/31/nx-s1-5058652/delta-crowdstrike-outage-500-million-dollars)
3. CloudQA, "How Much Do Software Bugs Cost? 2025 Report," [cloudqa.io](https://cloudqa.io/how-much-do-software-bugs-cost-2025-report/)
4. Stripe, *The Developer Coefficient*, [stripe.com](https://stripe.com/files/reports/the-developer-coefficient.pdf)
5. DORA Team, Google Cloud, *Accelerate State of DevOps Report 2025*, [dora.dev](https://dora.dev/)
