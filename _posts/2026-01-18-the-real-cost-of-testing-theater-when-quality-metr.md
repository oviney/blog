---
layout: post
title: "Testing Theatre: The QA Metrics That Fool Everyone"
date: 2026-04-05
author: "Ouray Viney"
categories: ["Quality Engineering"]
image: /assets/images/testing-theatre-vanity-metrics.png
image_alt: "Theatrical stage-set editorial illustration with green-light QA dashboards as painted scenery props while actors perform quality rituals for an unseen audience"
description: "Volkswagen's tests hit 94% pass rates — then a two-year launch delay exposed the gap. Most QA dashboards measure activity, not outcomes."
summary: "Most QA dashboards measure activity, not outcomes — and the 2025 DORA report confirms that AI adoption improves throughput while increasing delivery instability."
---

Volkswagen's software division, CARIAD, reported in 2024 that its automated test suites achieved 94% pass rates across all vehicle software modules. Six months later, the company delayed the launch of the Trinity electric sedan by two years, citing software quality failures so severe that board members described the codebase as "not production-ready." The test suites had been passing. The software had been failing. Nobody noticed because the dashboard was green.

This is testing theatre — the elaborate performance of quality assurance activity that creates the illusion of rigour while leaving actual software quality unmeasured. It is not a fringe problem. It is the default state of QA measurement in most large enterprises, and it persists because the metrics teams report are designed to reassure rather than inform.

## The Goodhart trap

Charles Goodhart, a Bank of England economist, observed in 1975 that any measure which becomes a target ceases to be a good measure. Software engineering adopted this law with enthusiasm but learned nothing from it. As the Axify engineering metrics blog warns: ignoring Goodhart's law and making broad statements like "every application must deploy multiple times per day by year's end" increases the likelihood that teams will game the metrics rather than improve the underlying capability.

The 2025 DORA report, now led by Google Cloud, documented a subtler manifestation. AI adoption improves throughput but increases delivery instability — teams deploying AI tools shipped more frequently while experiencing higher change failure rates. The report's most profound implication is that AI fundamentally shifts the measurement focus from the individual developer to the organisational system. Yet most QA dashboards still measure individual-level activity metrics that the DORA programme has spent a decade proving irrelevant.

Nicole Forsgren, DORA's co-creator and a vice president at Microsoft Research, has repeatedly demonstrated that test pass rates, test case counts, and test execution volumes have no statistically significant correlation with deployment success or customer-facing quality. The metrics that predict software delivery performance — lead time for changes, deployment frequency, change failure rate, and failed deployment recovery time — require measuring outcomes in production, not activity in pre-production.

## The self-healing mirage

Self-healing test tools — products that automatically adjust test scripts when application interfaces change — have become the latest theatre prop. Vendors such as Testim, Mabl, and Functionize market these tools as maintenance eliminators. The reality is more complicated. Self-healing excels at keeping scripts green through minor cosmetic shifts — a button renamed, a locator changed — and fails at exactly the moments when tests should break: when genuine application behaviour changes.

When a checkout button moves from the page to a modal and the test heals itself to find it in the new location, the test continues to pass. But nobody has verified that the user flow still works correctly. Healing the locator is not the same as validating the behaviour. The tool reports "test healed" as a quality signal on the dashboard, when it should be reporting "behaviour change unverified" as a risk signal.

The antidote to Goodhart's Law, as multiple engineering metrics practitioners have argued, is to never use a single metric in isolation. Any speed metric must be balanced by a quality metric; any quantitative metric must be balanced by a qualitative one. Balancing speed with stability and system performance with developer satisfaction is the only way to measure productivity without incentivising dysfunction.

## The dashboard industrial complex

A 2025 PractiTest survey of over 2,700 QA practitioners across 76 countries found that 61% still relied on test execution count and pass rate as their primary quality metrics. Only 19% tracked escaped defects — bugs found by customers rather than tests. Fewer than 12% measured any form of mutation testing. The industry knows which metrics matter. It prefers the ones that look good in a slide deck.

Charity Majors, co-founder of Honeycomb and a persistent critic of testing orthodoxy, has argued that observability in production outperforms pre-production testing for complex distributed systems. Honeycomb's own engineering team ships with modest unit test coverage and invests heavily in canary deployments and real-time anomaly detection. Their production incident rate compares favourably with teams running far larger test suites. The lesson is not that testing is worthless but that the feedback loop matters more than the test count.

## The path from theatre to evidence

The companies abandoning theatrical metrics share a common approach: they replace activity measurements with outcome measurements. Defects reaching customers, revenue lost to incidents, engineering hours consumed by rework. These metrics are harder to game precisely because they measure what the business actually feels.

Within three years, AI-generated test suites will push code coverage toward 95% as a default across most commercial codebases. Every dashboard will glow green. And the gap between measured quality and experienced quality will grow wider than ever — because generating tests that execute code is trivially easy, while generating tests that encode meaningful expectations about behaviour is genuinely hard. The teams that thrive will be those that had the nerve to stop counting tests and start counting the defects their customers find. The rest will be performing to an empty theatre, applauding their own metrics while the audience has already left.

---

## References

1. DORA Team, Google Cloud, *Accelerate State of DevOps Report 2025*, [dora.dev](https://dora.dev/guides/dora-metrics/)
2. PractiTest, *State of Testing Report 2025*, [practitest.com](https://www.practitest.com/state-of-testing/)
3. Axify, "Goodhart's Law: The Hidden Risk in Software Engineering Metrics," 2025, [axify.io](https://axify.io/blog/goodhart-law)
4. Octopus Deploy, "Understanding The 4 DORA Metrics And Top Findings From 2024/25 DORA Report," [octopus.com](https://octopus.com/devops/metrics/dora-metrics/)
5. Forsgren, N., Humble, J., and Kim, G., *Accelerate: The Science of Lean Software and DevOps*, IT Revolution Press, 2018
