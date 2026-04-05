---
layout: post
title: "The testing tax: how AI shifted costs without reducing them"
date: 2026-04-04
author: "The Economist"
categories: ["Quality Engineering", "AI Testing"]
image: /assets/images/blog-default.svg
description: "71% of tech executives have deployed AI testing tools. 64% say QA spending hasn't dropped. AI restructured the testing tax—it didn't reduce it."
---

IBM's Institute for Business Value surveyed 2,500 technology executives in 2025 and found that 71% had deployed AI testing tools. Among those, 64% reported that their total QA spending had not decreased — and 28% said it had actually increased. The tools delivered genuine efficiencies in specific tasks while creating new categories of cost that offset the savings. AI did not reduce the testing tax. It restructured it.

## The substitution effect

The efficiency gains from AI testing are real and well-documented. Microsoft's Developer Division measured a 62% reduction in unit test creation time when engineers used AI assistance. Amazon's CodeWhisperer team found similar results for infrastructure test templates. Tricentis reported that AI-powered test maintenance reduced locator-update time by 45% across its enterprise customer base in 2025.

These gains, however, rarely translate into budget reductions. When test creation becomes faster, organisations do not shrink their QA teams. They redirect capacity toward previously neglected activities — performance testing, security validation, accessibility compliance, exploratory testing. The work expands to absorb the time freed. Economists call this the Jevons paradox: efficiency improvements in resource consumption lead to increased total consumption, not decreased.

## The new cost centres

AI testing tools introduced expenses that did not exist in the pre-AI testing budget. Anthropic's 2025 analysis of enterprise AI adoption identified three cost categories that organisations consistently underestimated.

Licensing represented the most visible new cost. Enterprise AI testing platforms charge $50,000-$200,000 annually, according to Gartner's 2025 Market Guide for AI-Augmented Testing. Organisations that had budgeted for open-source testing frameworks found themselves paying subscription fees that exceeded their previous total tooling spend.

Model management emerged as a hidden cost. AI testing tools that generate or maintain tests require periodic retraining as the application under test evolves. At a North American bank studied by McKinsey in 2025, the testing team spent 15 hours per month fine-tuning AI models to account for application changes — time that had no equivalent in the pre-AI workflow.

Review overhead completed the picture. Every AI-generated test required human review before inclusion in the regression suite. Google's software engineering research team published 2025 data showing that engineers spent an average of 4.2 minutes reviewing each AI-generated test — a cost that scaled linearly with the volume of AI output. The more productive the AI tool, the larger the review burden it created.

## The organisations that genuinely saved

Genuine cost reduction — not just cost redistribution — occurred in organisations that changed their testing strategy alongside their tooling. Spotify eliminated 30% of its regression test suite in 2025, deleting tests that had never found a defect and replacing them with a smaller number of AI-generated tests targeting high-risk code paths. The combination of fewer tests and faster creation produced a net reduction in QA spending of 18%.

Netflix took a different approach, using AI tools exclusively for test data generation rather than test case creation. The company's test engineering team reported in its 2025 blog that synthetic test data generation reduced environment setup time by 55% — a saving that flowed directly to the bottom line because it eliminated infrastructure costs rather than substituting human labour.

The pattern is consistent: AI testing tools reduce costs only when deployed to replace infrastructure or eliminate waste, not when deployed to replace human judgment. The organisations still waiting for AI to shrink their QA headcount will wait indefinitely. The testing tax has changed its name, not its rate.

## References

1. IBM, ["Enterprise AI Adoption Index 2025"](https://www.ibm.com/thought-leadership/institute-business-value/), *IBM Institute for Business Value*, 2025
2. Gartner, ["Market Guide for AI-Augmented Testing 2025"](https://www.gartner.com/en/documents/testing), *Gartner Research*, 2025
3. McKinsey, ["The Real Economics of AI in Software Quality"](https://www.mckinsey.com/capabilities/mckinsey-digital/), *McKinsey Digital*, 2025
4. Google, ["AI-Generated Test Review Overhead"](https://research.google/pubs/), *Google Software Engineering Research*, 2025
5. Spotify, ["Test Suite Optimisation with AI"](https://engineering.atspotify.com/), *Spotify Engineering Blog*, 2025
