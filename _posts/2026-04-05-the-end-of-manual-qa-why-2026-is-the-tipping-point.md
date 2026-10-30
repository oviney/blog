---
layout: post
title: "What AI Changes About Manual Testing"
subtitle: "AI can accelerate repeatable testing, but adoption figures do not tell us which human work is safe to remove."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
tags: [test-automation, qa-strategy, ai-testing]
image: /assets/images/the-end-of-manual-qa.png
image_alt: "A lone tester sits at a desk as robotic lines close in from both sides"
image_caption: "Illustration: manual QA is squeezed as industrial automation moves in"
description: "AI is changing testing work. Measure outcomes and retain human exploration and judgement when deciding what to automate."
---

AI is changing how teams prepare and execute tests, but adoption is not evidence that manual testing has become economically obsolete. The useful question is which work a tool can do reliably, which decisions still need human judgement and whether the change improves outcomes for customers.

The [World Quality Report 2025–26](https://www.opentext.com/ca/about/press-releases/world-quality-report-2025-ai-adoption-surges-in-quality-engineering-but-enterprise-level-scaling-remains-elusive), published by OpenText, Capgemini and Sogeti, reported that 89% of responding organisations were piloting or deploying generative AI in quality engineering. Of respondents, 52% were in pilots and 37% in production; 15% had achieved enterprise-scale deployment. Those are survey findings about participating organisations, not a census of every enterprise, and they do not measure how many manual testing jobs can be replaced.

## Separate execution from judgement

Repeated checks of stable, deterministic behaviour are often good automation candidates. A machine can run the same assertion across builds without a person clicking the same path each time. AI may help draft the checks or diagnose failures, but generated tests still need review: a passing test is useful only if its setup, assertions and expected result reflect the behaviour that matters.

Human testing covers more than executing a prewritten script. People explore unexpected workflows, question ambiguous requirements, assess whether an experience makes sense and recognise when a result is technically valid but unacceptable to a customer. Automation can support these activities, yet a generated scenario is not evidence that the scenario was explored well or that its oracle is correct.

The distinction matters when a team redesigns roles. Replacing repetitive execution may free time for risk analysis, automation and exploratory work. It does not follow that the same number of people can automatically be removed without losing coverage or judgement. That depends on the product, the existing test suite and the work performed in practice.

## The economics need measurement

An automation business case should include creation, review, test data, infrastructure, maintenance and failure investigation. Count the work that remains after the first successful run. A self-healing feature, for example, may help when a locator changes; it cannot be assumed to understand every change in business intent. See [Self-healing tests](/2026/01/02/self-healing-tests-myth-vs-reality/) for the distinction.

Before changing staffing or retiring a manual regression activity, select a representative workflow and establish a baseline: how long the work takes, which risks it covers, what defects it finds and how often its results need investigation. Run the proposed automated or AI-assisted approach alongside the existing practice for a defined period. Compare total effort and the meaningful failures found, including failures the new approach missed. Keep exploratory sessions for risks the checks do not address.

A pilot that saves time on one workflow is evidence about that workflow, not a guarantee for a whole organisation. Scale when the team can explain what was saved, what new work appeared and who remains accountable for the risk.

## What to keep human

Teams still need someone to decide what is worth testing, challenge generated assertions, examine confusing behaviour and represent customer consequences. Those responsibilities may sit with developers, dedicated quality specialists, product staff or a combination. The role label matters less than making the work visible and ensuring people have time and skill to do it.

The strongest case for AI in testing is not that machines have won a contest against manual QA. It is that teams can use tools to reduce repetitive work while spending more human attention on the questions and failures that matter most.

## References

1. OpenText, Capgemini and Sogeti, [World Quality Report 2025: AI adoption surges in Quality Engineering](https://www.opentext.com/ca/about/press-releases/world-quality-report-2025-ai-adoption-surges-in-quality-engineering-but-enterprise-level-scaling-remains-elusive), 2025.
2. Perforce BlazeMeter, [2025 State of Continuous Testing Report: key takeaways](https://www.blazemeter.com/blog/2025-state-continuous-testing), 2025.
