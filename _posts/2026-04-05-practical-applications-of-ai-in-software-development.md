---
layout: post
title: "The coder's crutch: AI-assisted development's hidden costs"
subtitle: "AI can accelerate code generation, while review, comprehension and maintenance remain essential."
date: 2026-04-05
author: "Ouray Viney"
categories: ["Software Engineering"]
tags: [ai, software-engineering, productivity, code-quality]
image: /assets/images/ai-coders-crutch.png
image_alt: "A developer leaning on a giant crutch shaped like a microchip"
image_caption: "Illustration: AI becomes a crutch when teams stop building their own strength"
description: "AI-assisted development changes the work of coding, reviewing and maintaining software."
---

The [2025 DORA report](https://dora.dev/research/2025/dora-report/) examines how organisations use AI in software delivery and stresses that outcomes depend on the wider delivery system. Separately, [METR's early-2025 experiment](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) found tasks took 19% longer when 16 experienced open-source developers could use the AI tools studied. That result applies to its particular participants, tasks and tools; METR later cautioned that its newer data was affected by selection bias and did not provide a reliable current estimate.

## The throughput illusion

AI coding tools are used across many development teams, but adoption and generated-code volume do not establish whether the resulting software is safer, more maintainable or faster to deliver. Those outcomes need to be measured in context.


AI can change how quickly code is produced and where review or integration work accumulates. DORA's research discusses delivery performance at the system level; correlations in survey data should not be treated as proof that AI alone caused a team's defects or recovery time.

## The comprehension debt

A useful concern is whether developers can explain and maintain code generated with AI assistance. Teams can test that concern through review, debugging and knowledge-sharing exercises rather than assuming every generated change is understood.

Consider a mundane but consequential assignment: add retry logic around a payment-service client. A coding model can generate the wrapper, the backoff policy, and a neat set of unit tests in under a minute. What it cannot infer from a short prompt is which failures are safe to retry, how duplicate events are reconciled in the ledger, what audit trail finance requires, or how the queue behaves when a dependency returns a late success. The code looks finished precisely because the missing context is operational rather than syntactic. A junior developer can therefore ship something that passes review for style and still fails the business the first time a partial outage hits.

That is why AI-heavy code often arrives with hidden review work attached. The first draft is instant; the verification is not. Senior engineers know to interrogate generated code for edge cases, transaction boundaries, and observability gaps. Review must account for the system outside the snippet, including its interactions and operational behaviour.

## The honest productivity gain

Productivity gains vary by task, tool and developer. Measure completed work and the effort spent reviewing, debugging and maintaining it before using a general percentage in a business case.

The organisations extracting genuine value therefore treat AI as a narrow accelerant. Boilerplate generation, test scaffolding, documentation drafts, schema transforms, and routine refactors are favourable use cases because the human can validate the output quickly and the maintenance burden is low. The gains disappear when teams use AI to bypass design. If a prompt has to smuggle in business rules, resilience requirements, security constraints, and organisational context, the cheaper path is usually to write the design first and the code second. This is less glamorous than the autonomous-coder narrative, but it aligns with the broader distinction between inspection and systemic quality explored in [The quality confusion tax: when QA, QC and QE blur](/2026/04/12/understanding-qa-qc-and-quality-engineering/).

The crutch works when the patient knows how to walk without it. For everyone else, it substitutes speed for understanding — a trade that compounds in cost with every deployment. The most consequential question for engineering leadership is not whether to adopt AI tools — that debate is settled — but whether to invest equally in the developer learning that prevents those tools from becoming a substitute for competence.

## The calibration challenge

Organisations that have navigated this tension successfully share a common approach: they treat AI tools as a calibration problem, not a deployment problem. The question is not which tools to enable but for whom, at what stage, and on which task types.

Results vary with the task, the developer's experience and the tools available. Compare complete workflows and inspect where review or debugging work moves before concluding that a tool improves productivity.

A more transferable version of that logic is to classify work into three bands. Green tasks — data mapping, unit-test scaffolding, repetitive API clients, log-query helpers — can be delegated aggressively because mistakes are cheap and easy to spot. Yellow tasks — business-logic changes in familiar services — merit AI assistance only when the engineer owns the module and can explain the change without the tool. Red tasks — authentication, billing, database migrations, incident fixes, anything with irreversible side effects — should default to human-first design and human-authored code, with AI limited to peripheral help such as draft tests or documentation. Most organisations do not need a policy on "AI coding" in the abstract. They need a task-level risk model.

Documentation remains important when assessing an assistant's output. Verify APIs, constraints and examples against current sources, especially when generated code interacts with external services.

## References

1. DORA, [State of AI-assisted Software Development](https://dora.dev/research/2025/dora-report/), 2025.
2. METR, [Early-2025 developer productivity study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) and [2026 update](https://metr.org/blog/2026-02-24-uplift-update/).
