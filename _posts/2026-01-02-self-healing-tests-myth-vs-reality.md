---
layout: post
title: "Self-healing tests: the promise that keeps breaking"
subtitle: "Automatic locator repair may save time, but its value depends on preserving test intent and measuring the work it adds."
date: 2026-01-02
author: "Ouray Viney"
categories: ["Test Automation"]
tags: [self-healing-tests, test-automation, test-maintenance]
image: /assets/images/self-healing-broken-promise.png
image_alt: "A cracked robotic arm trying to bolt itself back together"
image_caption: "Illustration: self-healing tests promise repair while the system keeps breaking"
description: "Self-healing tools can repair some locators. Learn how to assess the savings, review repairs and protect test intent."
---

Self-healing tests promise to reduce the work of keeping automated checks running when an application changes. The promise is attractive: a test that can adapt to a renamed element might avoid a maintenance ticket. But a repaired selector is not the same thing as a repaired test. The question is whether the test still checks the behaviour it was intended to check.

## What can be healed?

A common form of self-healing proposes or applies a replacement locator when the original no longer finds an element. Products differ in how they identify candidates, how they report a change and whether a person must approve it. Evaluate the actual product and configuration rather than assuming that every tool repairs every failure.

A selector problem is only one reason a test can fail. A changed business rule, expired test data, unavailable service or race condition calls for a different investigation. Replacing a locator will not, by itself, decide whether a new checkout step is required or whether a failed payment should have been accepted.

Even a technically successful repair needs scrutiny. If a page contains two similar buttons, a replacement locator may target the wrong one. The test can pass while checking a different path. Review the changed target, the action and the assertion together; a green result alone does not establish that the original intent survived.

## Prevention before repair

Resilient test design can reduce the number of repairs needed. [Playwright's locator guidance](https://playwright.dev/docs/locators) recommends prioritising user-facing attributes and explicit contracts, such as roles and accessible names. A stable test identifier can also be useful when a user-facing locator is not appropriate. These approaches do not remove maintenance, but they make test intent easier to understand and reduce reliance on brittle implementation details.

Isolate test data, make environments reproducible and investigate recurring flaky failures. If a tool repeatedly repairs a test whose underlying design is fragile, the team may be paying to hide the same problem rather than resolving it.

## Measure the whole trade-off

Choose a representative set of tests and record the baseline effort to diagnose and repair failures. Pilot the tool over a defined period. Track proposed repairs, accepted and rejected repairs, time spent reviewing them, manual work that remains, and cases where a repair changes or obscures test intent. Include licensing and integration costs in the comparison.

Review a sample of automatically accepted changes even when the tool reports success. For critical workflows, require explicit approval until the team has evidence that the repair process is reliable for its application. If the review workload exceeds the time saved, adjust the scope or stop the pilot.

Self-healing can be a useful aid for a narrow maintenance task. Its value is an empirical question for each suite, not a universal percentage or a substitute for a reliable test architecture. For the related challenge of generated test assets, see [The maintenance myth](/2026/04/05/why-ai-test-generation-tools-overpromise-on-maintenance-savi/).

## References

1. Microsoft Playwright, [Locators](https://playwright.dev/docs/locators), accessed 2026.
2. Microsoft Playwright, [Best practices](https://playwright.dev/docs/best-practices), accessed 2026.
