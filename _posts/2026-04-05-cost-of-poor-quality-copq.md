---
layout: post
title: "Quality's Second Act: What Software Can Steal from Factories"
subtitle: "Manufacturing practices offer lessons for identifying prevention, inspection and failure costs in software."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [cost-of-quality, quality-engineering, defect-prevention]
image: /assets/images/copq-cross-industry.png
image_alt: "A factory assembly line faces a chaotic software delivery pipeline split across the same frame"
image_caption: "Illustration: manufacturing discipline and software chaos collide in the cost of poor quality"
description: "How cost-of-quality thinking can help software teams understand prevention, rework and customer impact."
---

*Source: ASQ; CISQ Cost of Poor Software Quality in the US, 2022; Boeing SEC filings, 2024*

Failures in complex products can carry costs well beyond the immediate repair: investigations, customer disruption, rework and lost confidence. Manufacturing's cost-of-quality model offers a way to make prevention and failure costs visible before a problem reaches that scale.

The [CISQ 2022 report](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/) estimated US costs associated with poor software quality at at least $2.41 trillion. Its aggregate estimate and a manufacturer's internal cost-of-quality measure use different scopes; they should not be treated as directly comparable.

## The manufacturing precedent

Toyota's production system uses the andon principle to make problems visible and enable workers to stop a process when necessary. The transferable idea is to investigate defects early and improve the process. A company's actual cost of poor quality depends on how it defines and measures prevention, appraisal and failure costs.

Yet even Toyota stumbled at the software boundary. In October 2023, the company halted production across all fourteen of its Japanese assembly plants after discovering a database error in its supplier-ordering system. A software defect, not a manufacturing one, shut down the world's largest automaker for two days. Philip Crosby's dictum that "quality is free" — meaning the investment in prevention pays for itself through avoided failure costs — holds as firmly for microservices as for machined parts.

A culture that makes schedule and financial targets visible but suppresses quality concerns can make problems harder to address. Leaders need mechanisms for raising and acting on those concerns.

## Software's inverted pyramid

A team can use prevention, appraisal and failure categories to see where quality work and its consequences fall. The split must be measured locally; the categories do not establish a universal ratio.

The CrowdStrike outage of July 2024 illustrates the reach a faulty update can have. Deployment safeguards, including validation and staged rollout, are ways to limit exposure, but their effectiveness depends on the failure mode and implementation.

The shift-left movement, continuous testing, and the DevOps mantra of "quality is everyone's responsibility" are all restatements of principles that manufacturing formalised decades ago. Software is not inventing new quality theory. It is belatedly importing old quality theory and discovering, with expensive surprise, that it works.

## The digital twin bridge

Digital twins and simulated environments can help teams exercise scenarios before changes reach physical systems. Their value depends on how faithfully they model the behaviour and risks of interest.

Tesla's approach to vehicle software updates offers another hybrid model. The company tests changes against fleet-wide simulation before deploying over-the-air updates to millions of vehicles. Tesla's software defect rate per release runs significantly below the industry average for connected vehicles, attributable primarily to its simulation-first methodology. The digital twin is the software equivalent of a manufacturing test rig — a controlled environment where defects can be caught at prevention-stage costs.

## The cultural import

The technical tools are available. What most software companies lack is the cultural infrastructure that makes them effective. Manufacturing's quality revolution required executive sponsorship, worker empowerment, and decades of institutional learning. Google's Site Reliability Engineering team adopted a similar defect-budget approach — teams that exhaust their error budget must freeze feature releases until stability is restored. The result is not slower delivery but more predictable delivery.

The cost of quality appears in prevention, investigation and failure. Making those costs visible helps leaders decide where additional safeguards or process changes are worth the investment.

---

For the wider software cost estimate, see [Software’s Trillion-Dollar Tax](/2026/04/05/copq-in-software-engineering-and-how-quality-engin/).

## References

1. CISQ, [Cost of Poor Software Quality in the US](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/), 2022.
