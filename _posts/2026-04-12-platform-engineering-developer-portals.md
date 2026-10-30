---
layout: post
title: "The Golden Path: Platform Engineering's Quiet Revolution"
subtitle: "Internal developer portals can make approved workflows easier to find and use, but their value depends on the needs of developers."
date: 2026-04-12
author: "Ouray Viney"
categories: ["Software Engineering"]
tags: [platform-engineering, developer-portals, backstage, developer-experience, internal-developer-platform]
image: /assets/images/platform-engineering-developer-portals.png
image_alt: "Developer tools linked together through a single platform portal"
image_caption: "Illustration: a developer portal turns scattered tools into one path through the platform"
description: "How internal developer portals can support onboarding and reduce friction, and what teams should measure."
---


Platform engineering builds internal toolchains and self-service infrastructure for development teams. [Gartner forecasts](https://www.gartner.com/en/infrastructure-and-it-operations-leaders/topics/platform-engineering) that by 2027, 80% of large organisations will embrace platform engineering to scale DevOps in hybrid cloud environments, up from less than 30% in 2023. This is a forecast about a defined population and use case, not a measurement of today's adoption.

## The problem with infinite choice

Cloud infrastructure gives teams powerful tools, but operating many services and configurations also introduces decisions and support work. A platform can make common tasks easier when it addresses its users' actual needs.

Developer teams often need to navigate multiple tools, infrastructure services and organisational processes. A platform can reduce that cognitive load if its workflows address real developer needs; the size of the problem should be measured in the organisation using it.

This is the environment that platform engineering addresses. Rather than expecting every team to assemble its own deployment pipeline, database provisioning workflow, and monitoring stack, platform teams build opinionated, self-service "golden paths" — pre-approved, well-documented routes from code commit to production deployment. The developer retains autonomy to deviate when necessary. The default, however, is paved.

## The internal developer portal

At the centre of most platform engineering strategies sits an internal developer portal (IDP): a single interface through which developers discover services, provision infrastructure, trigger deployments, and consult documentation. The portal transforms scattered tribal knowledge into searchable, standardised, and governed information.

[Backstage](https://backstage.io/docs/overview/what-is-backstage/) is an open-source framework for building developer portals. Its catalogue, templates and plugins are possible building blocks; teams still need to assess how those components fit their own workflows.

Commercial and open-source developer portals offer different integration and operating models. Evaluate them against the workflows, maintenance capacity and security requirements of the organisation.

## Measuring what matters

A platform team can measure impact through outcomes such as time to create a service, deployment success and developer feedback. Compare the same tasks before and after adoption where possible.

DORA's research emphasises looking at delivery performance as a system. A platform may help a team deliver more reliably, but adoption alone does not establish the cause of a change in performance.

Estimate the cost of recurring developer tasks and the platform work required to improve them. Time saved is useful capacity only if teams can use it for work that matters.

## The golden path is not a golden cage

Critics argue that platform engineering risks recreating the centralised IT bureaucracies that DevOps sought to dismantle. The concern is legitimate. A platform that mandates tooling choices without feedback loops, that prioritises governance over developer ergonomics, or that lacks clear escape hatches for teams with genuinely exceptional requirements will breed resentment and shadow infrastructure.

Platform teams can treat developers as internal customers: gather feedback, observe where workflows stall and improve the service rather than relying on usage counts alone.

A platform needs clear ownership and capacity. Whether that sits in a dedicated team or an existing infrastructure group, the team must be able to support users and maintain the service.

## Implications for engineering leadership

For organisations evaluating platform engineering, the pattern is now clear enough to act on. First, start with developer pain points rather than technology selection. The portal is a means, not an end. Second, staff the platform team as a product team: a product manager, dedicated engineers, and a clear mandate to serve internal customers. Third, instrument adoption. If developers are not using the golden path voluntarily, the path needs repaving. As explored in [a previous analysis of AI-assisted development's hidden costs](/2026/04/05/practical-applications-of-ai-in-software-development/), tooling that promises productivity gains without accounting for developer behaviour and cognitive load often fails to deliver lasting results.

The organisations that will benefit most are those already feeling the strain of scale — teams tripping over inconsistent deployment practices, security reviews bottlenecked by bespoke configurations, and new hires taking months to become productive. For them, platform engineering is not a trend to watch. It is infrastructure to build.

## References

1. Gartner, [Platform engineering](https://www.gartner.com/en/infrastructure-and-it-operations-leaders/topics/platform-engineering).
2. Backstage, [What is Backstage?](https://backstage.io/docs/overview/what-is-backstage/).
3. DORA, [State of AI-assisted Software Development](https://dora.dev/research/2025/dora-report/), 2025.
