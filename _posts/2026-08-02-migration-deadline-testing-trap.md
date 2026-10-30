---
layout: post
title: "Migration Fever: The Tests You Skip Are the Delays You Buy"
date: 2026-08-02
author: Ouray Viney
categories: ["Quality Engineering", "Software Engineering"]
description: "How to assess customer risk when migration deadlines put pressure on testing."
subtitle: "A cutover decision should make untested risks and the evidence available to decision-makers explicit."
slug: migration-deadline-testing-trap
tags: [quality-engineering, software-engineering]
image: /assets/images/migration-deadline-testing-trap-hero.png
image_alt: "Navy scissors cutting a straight red ribbon; past the cut the ribbon becomes a dense tangled knot"
image_caption: "Cut here, untangle later"
---

A fixed migration deadline can create pressure to compress testing. Doing so changes the evidence available at cutover and can leave customer-critical risks unresolved. The decision should identify which checks are being removed, what alternative evidence exists and who accepts the remaining risk.

## A Deadline Won Is a Crisis Postponed

A compressed test window can leave important risks undiscovered before cutover, although the size of that effect depends on the project and cannot be inferred from a schedule alone. [An empirical study of eight open-source projects](https://arxiv.org/abs/2505.04027) examined associations between deadlines, issue activity and technical debt. Those observations are a warning to investigate, not proof that skipped migration tests caused the reported patterns. Before removing a test cycle, identify the scenarios it covers, the evidence available from other checks and the consequences if a defect reaches customers. Record the residual risk and who accepts it.

## The Defect Tax Nobody Has Measured

A commonly repeated claim assigns a fixed multiplier to the cost of a production defect. Such multipliers are not a reliable substitute for an organisation's own incident and remediation data.

The cost of a defect depends on its impact, the time to detect and repair it, and the users affected. Test plans should focus on plausible consequences rather than an assumed universal multiplier.

## Managing Migration Debt

Technical debt can increase the effort needed to make changes and recover from failures. Identify the debt that affects the migration and decide how it will be addressed or monitored.

For a way to make these choices explicit, see [The test strategy trap](/2026/04/05/building-a-test-strategy-that-works/).

## References

1. Edbert, Codabux and Verdecchia, [Racing Against the Clock: Exploring the Impact of Scheduled Deadlines on Technical Debt](https://arxiv.org/abs/2505.04027), 2025.
