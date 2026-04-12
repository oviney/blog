---
published: false
layout: post
title: "Quality's Second Act: What Software Can Steal from Factories"
date: 2026-04-05
author: "The Economist"
categories: ["Quality Engineering"]
image: /assets/images/copq-cross-industry.png
image_alt: "Split-panel editorial illustration contrasting a precise factory assembly line on the left with a chaotic software deployment pipeline on the right, risograph print texture"
summary: "Manufacturing spent decades learning that quality is cheaper than inspection — Boeing's $31 billion lesson and CrowdStrike's $500 million afternoon prove software hasn't learned yet."
---
published: false

Boeing has accumulated more than $22 billion in deferred production costs on the 737 programme alone, according to Leeham News analysis of Boeing's SEC filings through December 2024. Total financial impact from the MAX crisis — spanning compensation payments, production halts, regulatory fines, and a January 2024 door-plug blowout that grounded fleets again — exceeds $31 billion since the original 2019 grounding. The company reported an $11.83 billion net loss for 2024, its worst since the pandemic. That sum represents the most expensive proof in industrial history of a principle that W. Edwards Deming articulated in the 1950s: quality cannot be inspected into a product. It must be built into the process.

Software engineering inherited its quality models from manufacturing but implemented them backwards. The American Society for Quality estimates that the cost of poor quality (COPQ) consumes 15-20% of sales revenue in American manufacturing, with some organisations reaching 40% of total operations. The CISQ pegged the software equivalent at $2.41 trillion in the United States alone. Whether the defect is a misaligned fuselage panel or a race condition in a payments API, the arithmetic of prevention versus failure follows identical curves.

## The manufacturing precedent

Toyota's production system, the archetype of modern quality management, is built on a deceptively simple insight: stopping the line to fix a defect costs less than shipping it to the customer. Toyota's andon cord — which any worker can pull to halt production — embodies the principle that prevention is cheaper than detection. Toyota's COPQ runs at approximately 2-3% of revenue. Companies without mature quality systems operate at 15-25%.

Yet even Toyota stumbled at the software boundary. In October 2023, the company halted production across all fourteen of its Japanese assembly plants after discovering a database error in its supplier-ordering system. A software defect, not a manufacturing one, shut down the world's largest automaker for two days. Philip Crosby's dictum that "quality is free" — meaning the investment in prevention pays for itself through avoided failure costs — holds as firmly for microservices as for machined parts.

The CPA Journal's 2025 analysis of Boeing's corporate culture failure traced the 737 MAX crisis to a systematic deprioritisation of engineering quality in favour of financial targets — a pattern Deming warned against in his fourteenth point: "put everybody in the company to work to accomplish the transformation." Boeing did the opposite, and the $31 billion bill is still growing.

## Software's inverted pyramid

Software development adopted quality assurance terminology from manufacturing but inverted the cost structure. In manufacturing, prevention dominates quality spending. In software, detection and failure costs dominate. CISQ's data shows that US software companies spend 3.4 times more on finding and fixing defects than on preventing them — a ratio that manufacturing abandoned in the 1980s.

The CrowdStrike outage of July 2024 illustrated the consequences. A configuration file that bypassed validation testing crashed 8.5 million machines because the deployment pipeline lacked the software equivalent of Toyota's andon cord — a mechanism to halt the process when quality checks fail. CrowdStrike had testing. It had monitoring. What it lacked was the cultural authority for quality to stop the release.

The shift-left movement, continuous testing, and the DevOps mantra of "quality is everyone's responsibility" are all restatements of principles that manufacturing formalised decades ago. Software is not inventing new quality theory. It is belatedly importing old quality theory and discovering, with expensive surprise, that it works.

## The digital twin bridge

The most productive cross-pollination between manufacturing and software quality is happening through digital twins. IBM integrated TQM principles with Agile development practices and comprehensive quality assurance processes, resulting in a 30% reduction in bug reports and improved delivery timelines. Siemens's digital twin platform enables exhaustive scenario testing for automotive embedded software that would be prohibitively expensive on physical hardware.

Tesla's approach to vehicle software updates offers another hybrid model. The company tests changes against fleet-wide simulation before deploying over-the-air updates to millions of vehicles. Tesla's software defect rate per release runs significantly below the industry average for connected vehicles, attributable primarily to its simulation-first methodology. The digital twin is the software equivalent of a manufacturing test rig — a controlled environment where defects can be caught at prevention-stage costs.

## The cultural import

The technical tools are available. What most software companies lack is the cultural infrastructure that makes them effective. Manufacturing's quality revolution required executive sponsorship, worker empowerment, and decades of institutional learning. Google's Site Reliability Engineering team adopted a similar defect-budget approach — teams that exhaust their error budget must freeze feature releases until stability is restored. The result is not slower delivery but more predictable delivery.

Boeing's $31 billion lesson, Toyota's decades of compounding advantage, and CrowdStrike's $500 million afternoon all point to the same conclusion: the cost of quality is always paid. The only choice is whether to pay it in prevention, which compounds into competitive advantage, or in failure, which compounds into existential risk.

---
published: false

## References

1. Leeham News, "Boeing Deferred Production Costs: $39bn since 2019 MAX grounding, $22bn for 737," February 2025, [leehamnews.com](https://leehamnews.com/2025/02/04/boeing-deferred-production-costs-39bn-since-2019-max-grounding-22bn-for-737/)
2. The CPA Journal, "The Story of Boeing's Failed Corporate Culture," August 2025, [cpajournal.com](https://www.cpajournal.com/2025/08/12/the-story-of-boeings-failed-corporate-culture-3/)
3. CISQ, *The Cost of Poor Software Quality in the US: A 2022 Report*, [it-cisq.org](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/)
4. ASQ, "Cost of Poor Quality (COPQ)," [asq.org](https://asq.org/quality-resources/quality-glossary)
5. CrowdStrike, "Preliminary Post Incident Review," July 2024, [crowdstrike.com](https://www.crowdstrike.com/blog/falcon-update-for-windows-hosts-technical-details/)
