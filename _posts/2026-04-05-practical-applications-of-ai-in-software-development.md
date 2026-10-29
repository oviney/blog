---
layout: post
title: "The coder's crutch: AI-assisted development's hidden costs"
subtitle: "Copilot now drafts 46% of new code on GitHub, and shipping cadence is undeniably faster — but the comprehension gap left behind is an inheritance the next maintainer pays for."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Software Engineering"]
tags: [ai, software-engineering, productivity, code-quality]
image: /assets/images/ai-coders-crutch.png
image_alt: "A developer leaning on a giant crutch shaped like a microchip"
image_caption: "Illustration: AI becomes a crutch when teams stop building their own strength"
description: "AI tools like Copilot now write 46% of code on GitHub. Developers ship faster—but understand less, creating compounding technical debt."
---

The [2025 DORA report](https://dora.dev/research/2025/dora-report/) examines how organisations use AI in software delivery and stresses that outcomes depend on the wider delivery system. Separately, [METR's early-2025 experiment](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) found tasks took 19% longer when 16 experienced open-source developers could use the AI tools studied. That result applies to its particular participants, tasks and tools; METR later cautioned that its newer data was affected by selection bias and did not provide a reliable current estimate.

## The throughput illusion

AI coding tools are used across many development teams, but adoption and generated-code volume do not establish whether the resulting software is safer, more maintainable or faster to deliver. Those outcomes need to be measured in context.

![AI coding tools: the real productivity picture — bar chart comparing code throughput (+25%), task completion time (−19%), code churn (+43%), and failed deployments (+14%)](/assets/charts/practical-applications-of-ai-in-software-development.svg)
*Source: DORA, 2025; METR, 2025; GitClear, 2025*

AI can change how quickly code is produced and where review or integration work accumulates. DORA's research discusses delivery performance at the system level; correlations in survey data should not be treated as proof that AI alone caused a team's defects or recovery time.

## The comprehension debt

The World Quality Report 2025-2026, published by OpenText (formerly Micro Focus) with Capgemini, surveyed 1,800 technology leaders and identified a pattern they termed "comprehension debt." Junior developers using AI tools could produce syntactically correct code at speed but scored 22% lower on architectural reasoning assessments than their counterparts who coded without assistance. The code compiled. The developer had not learned.

Consider a mundane but consequential assignment: add retry logic around a payment-service client. A coding model can generate the wrapper, the backoff policy, and a neat set of unit tests in under a minute. What it cannot infer from a short prompt is which failures are safe to retry, how duplicate events are reconciled in the ledger, what audit trail finance requires, or how the queue behaves when a dependency returns a late success. The code looks finished precisely because the missing context is operational rather than syntactic. A junior developer can therefore ship something that passes review for style and still fails the business the first time a partial outage hits.

That is why AI-heavy code often arrives with hidden review work attached. The first draft is instant; the verification is not. Senior engineers know to interrogate generated code for edge cases, transaction boundaries, and observability gaps. Less experienced engineers are more likely to review for readability alone. The difference is not taste. It is whether the reviewer can see the system that exists outside the snippet. GitClear's churn data suggests many teams discover those omissions only after merge, when supposedly finished code is rewritten in the first fortnight.

## The honest productivity gain

Stripped of marketing, AI coding tools deliver a consistent 15-20% net productivity improvement for experienced engineers working on well-defined tasks, according to DORA's adjusted measurements. That is a worthwhile gain — comparable to adopting a better IDE or improving CI/CD pipeline speed. It is not the 55% transformation that vendor metrics imply.

The organisations extracting genuine value therefore treat AI as a narrow accelerant. Boilerplate generation, test scaffolding, documentation drafts, schema transforms, and routine refactors are favourable use cases because the human can validate the output quickly and the maintenance burden is low. The gains disappear when teams use AI to bypass design. If a prompt has to smuggle in business rules, resilience requirements, security constraints, and organisational context, the cheaper path is usually to write the design first and the code second. This is less glamorous than the autonomous-coder narrative, but it aligns with the broader distinction between inspection and systemic quality explored in [The quality confusion tax: when QA, QC and QE blur](/2026/04/12/understanding-qa-qc-and-quality-engineering/).

The crutch works when the patient knows how to walk without it. For everyone else, it substitutes speed for understanding — a trade that compounds in cost with every deployment. The most consequential question for engineering leadership is not whether to adopt AI tools — that debate is settled — but whether to invest equally in the developer learning that prevents those tools from becoming a substitute for competence.

## The calibration challenge

Organisations that have navigated this tension successfully share a common approach: they treat AI tools as a calibration problem, not a deployment problem. The question is not which tools to enable but for whom, at what stage, and on which task types.

The pattern is visible in the published data. DORA's adjusted gains are strongest on bounded tasks. METR's slowdown appears when work requires deep understanding of an unfamiliar codebase. Stack Overflow's survey suggests developers are using AI partly to avoid slower context-gathering activities such as documentation reading. Put differently: AI helps most when the task is local and hurts most when the task is systemic.

A more transferable version of that logic is to classify work into three bands. Green tasks — data mapping, unit-test scaffolding, repetitive API clients, log-query helpers — can be delegated aggressively because mistakes are cheap and easy to spot. Yellow tasks — business-logic changes in familiar services — merit AI assistance only when the engineer owns the module and can explain the change without the tool. Red tasks — authentication, billing, database migrations, incident fixes, anything with irreversible side effects — should default to human-first design and human-authored code, with AI limited to peripheral help such as draft tests or documentation. Most organisations do not need a policy on "AI coding" in the abstract. They need a task-level risk model.

According to the 2025 Stack Overflow Developer Survey, 62% of developers reported that AI tools had reduced the time they spent reading documentation — a troubling finding, since documentation reading is precisely how engineers build the contextual understanding that separates good AI output from bad. Speed gains that come at the cost of comprehension are not efficiency improvements. They are deferred liabilities, accumulating invisibly in codebases that developers no longer fully understand.

## References

1. DORA, ["State of AI-Assisted Software Development 2025"](https://dora.dev/dora-report-2025/), *DORA/Google Cloud*, September 2025
2. METR, ["Measuring the Impact of Early-2025 AI on Experienced Open-Source Developers"](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), *METR*, July 2025
3. OpenText & Capgemini, ["World Quality Report 2025-2026"](https://www.opentext.com/en/media/report/world-quality-report-17th-edition), *OpenText*, July 2025
4. GitClear, ["AI Code Generation Impact Report 2025"](https://www.gitclear.com/), *GitClear Research*, 2025
5. Stack Overflow, ["2025 Developer Survey"](https://survey.stackoverflow.co/2025/), *Stack Overflow*, 2025
