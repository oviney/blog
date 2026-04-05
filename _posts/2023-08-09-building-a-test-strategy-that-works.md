---
layout: post
title: "The test strategy trap: why most quality plans fail before they start"
description: "88% of organisations have a documented test strategy. Only 23% believe it works. Why most quality engineering plans fail before they start."
date: 2023-08-09
author: "The Economist"
categories: ["Quality Engineering"]
image: /assets/images/test-strategy-trap.png
---

Capgemini's World Quality Report surveyed 1,750 technology leaders across 32 countries in 2023 and found that 88% of organisations had a documented test strategy. It also found that only 23% believed their strategy was effective. The gap between having a plan and having a plan that works is where most quality engineering efforts go to die.

## The document problem

The typical test strategy is a 40-page Confluence artifact written during a project's optimistic early weeks, reviewed once, and never updated. It describes an idealised testing process that bears little resemblance to how the team actually works under deadline pressure. Gartner's 2023 research on enterprise quality practices found that 61% of test strategies were more than six months out of date, with test automation coverage targets that had been copy-pasted from the previous project without adjustment.

This is not a documentation problem. It is an incentive problem. The person who writes the test strategy — typically a QA lead or test manager — is rewarded for its completeness and thoroughness at the time of review. Nobody is rewarded for its accuracy six months later. The strategy becomes a compliance artifact rather than an operational tool, and the team reverts to whatever testing habits its engineers brought from their previous jobs.

## The automation fantasy

Test strategies routinely commit to automation targets that the organisation lacks the infrastructure, skills, or budget to achieve. Forrester's 2023 analysis of enterprise test automation programmes found that the average organisation achieved 34% of its stated automation goals within the planned timeframe. The remaining 66% was either deferred, descoped, or quietly abandoned.

The pattern is predictable. A strategy mandates 80% automation coverage. The team automates the easy tests first — login flows, simple CRUD operations, happy-path scenarios. These reach 40% coverage quickly and the progress charts look encouraging. Then the team hits the integration tests, the tests that depend on third-party services, the tests that require complex data setups. Progress stalls. The remaining 40% would cost three times as much as the first 40%, and nobody budgeted for that.

Thoughtworks, the software consultancy, published a blunt assessment in its 2023 Technology Radar: "Most test automation strategies fail because they are written by people who have never maintained a test suite at scale." The observation stings because it is precise. Writing a strategy that says "automate regression tests" costs nothing. Living with the flaky, brittle, constantly-breaking suite that results costs everything.

## What separates the effective minority

The 23% of organisations that reported effective test strategies shared three characteristics that the majority lacked, according to Capgemini's research.

They treated the strategy as a living system, not a document. At Spotify, the engineering team reviews its quality approach quarterly, adjusting automation targets based on actual maintenance costs from the previous quarter. The strategy is a spreadsheet with real numbers, not a slide deck with aspirations.

They measured outcomes, not activities. Instead of tracking test case counts or automation percentages, effective organisations tracked escaped defects, mean time to feedback, and the ratio of test maintenance hours to feature development hours. These metrics reveal whether testing is actually reducing risk or merely consuming effort.

They funded test infrastructure as a platform investment. At Netflix, the test engineering team operates as a platform team that provides testing tools, environments, and frameworks to product teams. Individual product teams do not build their own test infrastructure, which eliminates the duplicated effort and inconsistent tooling that plague most enterprise testing programmes. The platform approach, documented in Netflix's 2023 engineering blog, reduced the company's overall test maintenance burden by 40%.

## The uncomfortable question

Most organisations would benefit more from deleting their test strategy and starting with a single question: what is the costliest quality failure we experienced in the last year, and would our current testing have prevented it? If the answer is no — and it usually is — then the strategy is an exercise in institutional self-deception.

The organisations that test well are not the ones with the thickest strategy documents. They are the ones that have been embarrassed by a production incident severe enough to force genuine change, and disciplined enough to sustain that change after the embarrassment fades.

## References

1. Capgemini, ["World Quality Report 2023-24"](https://www.capgemini.com/insights/research-library/world-quality-report/), *Capgemini Research*, 2023
2. Gartner, ["Enterprise Quality Engineering Practices"](https://www.gartner.com/en/documents/quality-engineering), *Gartner Research*, 2023
3. Forrester, ["The State of Test Automation 2023"](https://www.forrester.com/report/test-automation), *Forrester Research*, 2023
4. Thoughtworks, ["Technology Radar Vol. 29"](https://www.thoughtworks.com/radar), *Thoughtworks*, 2023
5. Netflix, ["Testing at Scale: Platform Engineering for Quality"](https://netflixtechblog.com/), *Netflix Tech Blog*, 2023
