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

On 19 July 2024, a faulty CrowdStrike content configuration update caused Windows systems to crash. [Microsoft estimated](https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/) that 8.5 million devices were affected. [CrowdStrike's root-cause analysis](https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf) describes how its validation did not detect the input mismatch that triggered the crash. The incident illustrates how a software defect can disrupt organisations far beyond the team that deployed the change.

The [CISQ 2022 report](https://www.it-cisq.org/wp-content/uploads/sites/6/2022/11/CPSQ-Report-Nov-22-2.pdf) estimated the annual cost of poor software quality in the United States at at least $2.41 trillion. It also estimated accumulated technical debt at approximately $1.52 trillion, a distinct measure. These are estimates based on the report's methods and assumptions, not a direct accounting of any one company's costs. CISQ's 2018 and 2020 estimates were $2.8 trillion and $2.08 trillion respectively; they do not support a claim that the estimate rose every year.


## The invisible tax

Most companies have no idea what poor quality costs them because the expenses hide in plain sight. Rework hours are logged against feature sprints. Incident response is charged to operations. Customer churn caused by buggy releases appears in the retention budget. Nobody totals the bill because nobody owns the line item.

Rework and maintenance can consume capacity that might otherwise support new capabilities. Measure the time spent on known reliability problems and distinguish necessary product maintenance from avoidable rework.

A defect that reaches production can cause incident response, customer disruption and remediation costs. The multiplier between detection stages varies by system and defect; it should be estimated from the organisation's own incidents rather than assumed.

*Source: CloudQA, 2025; CISQ, 2022*

## The shift-left arithmetic

Fast delivery and stable operation can reinforce each other when teams use small changes, meaningful checks and rapid feedback. Measure delivery and reliability together rather than treating either as a sufficient measure of quality.

CrowdStrike's Channel File 291 update bypassed the kind of staged rollout and canary testing that Google's Site Reliability Engineering handbook has prescribed since 2016. George Kurtz, CrowdStrike's CEO, acknowledged in testimony before the US House of Representatives that the update had not been subjected to the same validation as a full sensor release. A cybersecurity company was undone by a quality-engineering failure — the irony was bitter and the lesson universal.

## The accountability gap

The deeper problem is structural. In most companies, nobody is accountable for the total cost of quality. Engineering leadership owns development speed. Operations owns uptime. Product owns revenue. Quality falls between these boundaries, claimed by all and owned by none. Organisations can make those costs visible by agreeing on consistent categories and reviewing prevention, appraisal, rework and customer impact together.

The irony is that the data to close this gap already exists. Every company tracks incident costs, rework hours, and customer churn. The missing step is aggregation — summing these scattered line items into a single quality cost figure that sits beside revenue and headcount on the executive dashboard. Google's error budget model does exactly this: it translates reliability targets into a financial framework where every outage minute has a dollar value and every feature freeze has an opportunity cost. The model forces trade-off decisions that most companies make by intuition and politics rather than arithmetic.

Make ownership of quality costs explicit across engineering, operations and product. Incident response, rework and customer disruption should be visible alongside investment in prevention and testing.

---

For a way to evaluate one investment, see [The automation accountant](/2026/01/19/the-surprising-economics-of-test-automation-roi/).

## References

1. Microsoft, [Helping Our Customers Through the CrowdStrike Outage](https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/), 2024.
2. CrowdStrike, [Channel File 291 Incident Root Cause Analysis](https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf), 2024.
3. CISQ, [Cost of Poor Software Quality in the US](https://www.it-cisq.org/wp-content/uploads/sites/6/2022/11/CPSQ-Report-Nov-22-2.pdf), 2022.
4. CISQ, [2018 estimate](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2018-report/) and [2020 estimate](https://www.it-cisq.org/the-cost-of-poor-software-quality-in-the-us-a-2020-report/).
