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


Failures in complex products can carry costs well beyond the immediate repair: investigations, customer disruption, rework and lost confidence. Manufacturing's cost-of-quality model offers a way to make prevention and failure costs visible before a problem reaches that scale.

The [CISQ 2022 report](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/) estimated US costs associated with poor software quality at at least $2.41 trillion. Its aggregate estimate and a manufacturer's internal cost-of-quality measure use different scopes; they should not be treated as directly comparable.

## The manufacturing precedent

Toyota's production system uses the andon principle to make problems visible and enable workers to stop a process when necessary. The transferable idea is to investigate defects early and improve the process. A company's actual cost of poor quality depends on how it defines and measures prevention, appraisal and failure costs.

In August 2023, Toyota halted operations at its Japanese plants after a database maintenance issue. [Toyota's account](https://global.toyota/en/newsroom/corporate/39732568.html) identifies insufficient disk space during maintenance and a failed backup system. The incident illustrates how operational dependencies can interrupt production, even when the problem does not originate on the factory floor.

A culture that makes schedule and financial targets visible but suppresses quality concerns can make problems harder to address. Leaders need mechanisms for raising and acting on those concerns.

## Software's inverted pyramid

A team can use prevention, appraisal and failure categories to see where quality work and its consequences fall. The split must be measured locally; the categories do not establish a universal ratio.

The CrowdStrike outage of July 2024 illustrates the reach a faulty update can have. Deployment safeguards, including validation and staged rollout, are ways to limit exposure, but their effectiveness depends on the failure mode and implementation.

The shift-left movement, continuous testing, and the DevOps mantra of "quality is everyone's responsibility" are all restatements of principles that manufacturing formalised decades ago. Software is not inventing new quality theory. It is belatedly importing old quality theory and discovering, with expensive surprise, that it works.

## The digital twin bridge

Digital twins and simulated environments can help teams exercise scenarios before changes reach physical systems. Their value depends on how faithfully they model the behaviour and risks of interest.

Simulation can help teams investigate software behaviour in a controlled environment. Its value depends on how well the model represents real conditions and what additional testing is needed.

## The cultural import

The technical tools are available. What most software companies lack is the cultural infrastructure that makes them effective. Manufacturing's quality revolution required executive sponsorship, worker empowerment, and decades of institutional learning. [Google's Site Reliability Engineering guidance](https://sre.google/sre-book/embracing-risk/) describes error budgets as an explicit way to balance reliability and the pace of change. Teams can agree in advance how to respond when reliability falls below its objective.

The cost of quality appears in prevention, investigation and failure. Making those costs visible helps leaders decide where additional safeguards or process changes are worth the investment.

---

For the wider software cost estimate, see [Software’s Trillion-Dollar Tax](/2026/04/05/copq-in-software-engineering-and-how-quality-engin/).

## References

1. CISQ, [Cost of Poor Software Quality in the US](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/), 2022.
