---
layout: post
title: "The Hallucination Debt in AI-Generated Tests"
date: 2026-08-11
author: Ouray Viney
categories: ["Quality Engineering", "Software Engineering", "Test Automation", "Security"]
description: "AI-generated tests can reference nonexistent packages or stale APIs. What the evidence says, and does not say, about the causes."
subtitle: "What a green test suite conceals, and why the obvious explanation for it turns out to be wrong"
slug: "hallucination-debt-ai-test-generation"
tags: [quality-engineering, software-engineering, test-automation, security]
image: /assets/images/hallucination-debt-ai-test-generation-hero.svg
image_alt: "A robot stands between crumbling document pages and a test panel where every check passes green."
image_caption: "A robot archivist catalogues crumbling web pages while passing test assertions run oblivious to the dissolving reference base behind them."
---

Pew Research Center's [2024 study](https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/) found that 25% of its sampled pages from 2013 through 2023 were inaccessible in October 2023. That measures web decay in the sample, not the rate at which training data disappears or the cause of errors in generated code. A model can suggest outdated APIs or nonexistent packages, but the proposed link between web decay and those errors needs separate evidence.

## A Library Eating Its Own Citations

Pew also sampled pages from news sites, US government sites and English-language Wikipedia. It reported that 54% of sampled Wikipedia pages had a broken reference link, and 11% of their reference links were inaccessible. In its sample, 23% of news pages and 21% of government pages had at least one broken link. These are measurements of the sites sampled, not the contents of any particular model's training set. An assistant with search or other tools may consult current sources; developers should still verify package names, versions and APIs.

## Phantom Packages, Baked-In Biases

[Spracklen and colleagues](https://arxiv.org/abs/2406.10279) analysed 576,000 generated Python and JavaScript samples using 16 models. In that experimental dataset, 19.7% of recommended package instances were classified as hallucinations; the overall GPT-4 Turbo rate was 3.59%. A [2026 replication](https://arxiv.org/abs/2605.17062) of five newer models measured rates from 4.62% to 6.10% under its test conditions. Those figures describe the prompts, registries and models studied, not the rate for every development workflow. The later study found 127 names shared across its five models; after disclosure and registry defences, it reported 53 still registrable.

In the original Spracklen study, researchers repeated 500 prompts that had previously produced hallucinated packages. They reported that 43% of those names recurred in all ten repetitions, while 39% did not recur in any repetition. Repeatability matters because a predictable invented name may be a target for package squatting; it does not imply that every such name is available for registration.

Spracklen and colleagues compared their results with 12,871 packages removed from PyPI after being available between 2020 and 2022. They found 133 of those names in their generated results. This did not support their expectation that removed packages would explain a large share of hallucinations. It is evidence about the package dataset and models studied, not proof about every stale API error.

A developer who runs the generated test, watches it fail at the import line, and manually resolves the dependency has paid a tax that appears nowhere on any productivity dashboard. Multiply that correction across every team, every sprint, every CI pipeline running test generation at scale, and the phrase "hallucination debt" stops sounding metaphorical. It becomes a line item nobody has yet budgeted for, accruing silently beneath a layer of green status badges.

What would settle this. If hallucinated package names correlated with packages removed from PyPI or npm after a model's training cutoff, the link-rot mechanism would have direct support. That test has been run and came back negative. A sharper test is still open: hold model and prompt constant and compare hallucination rates on API surfaces with heavy documentation churn against surfaces with stable, widely mirrored documentation. Until someone runs it, treat the argument here as a hypothesis about a mechanism rather than a measured finding. My confidence that link rot materially drives package hallucination specifically is about 25%. My confidence that it drives stale API and version errors, which is a different failure mode with a different evidence base, is about 60%.

## Speed Without Correctness

Teams evaluating generated tests should distinguish survey perceptions from measured defects and should not infer causation from differences in adoption or pull-request volume. A generated test may use an invented dependency or the wrong expected behaviour; review dependencies, contracts and assertions against trusted sources.

## Security as the Bill Coming Due

Security testing is a separate concern from whether a package name exists. Validate dependencies and their provenance, review the generated code and run checks appropriate to the application's trust boundaries. Neither a valid import nor a passing test establishes that code is secure.

The risk is real, while the evidence does not establish that disappearing webpages are its cause. Treat package provenance, API freshness and test assertions as separate checks, and measure whether those checks find problems in the team's own workflow.


## What to Do on Monday

Four controls, each with a way to tell whether it worked.

**Gate on resolution, before you gate on tests.** Run dependency resolution as a discrete CI step ahead of the suite, so an invented import fails at the pipeline rather than on someone's laptop at 16:40. Measure the count of build failures attributed to unresolvable packages per week. Expect it to spike, then decline. If it never spikes, the gate is not wired in.

**Pin, hash, and scan the lockfile rather than the manifest.** A hallucinated name that has been squatted resolves cleanly and installs cleanly. Hash pinning is what distinguishes the package you reviewed from the package you received. Measure the percentage of repositories with hash-pinned lockfiles and SCA running against them.

**Mark AI-authored change at the pull request.** You cannot measure the defect rate of AI-generated tests without a field that says which tests are AI-generated. This is a policy choice, not an engineering problem. Measure the percentage of PRs carrying authorship metadata, then segment escaped-defect rate by that field after one quarter. If the two segments look the same, this article was wrong and you will have the data to say so.

**Check dependency provenance.** Compare suggested package names with approved registries and trusted project documentation. The replication identified 127 shared hallucinated names, of which 53 remained registrable after the registry protections described in the paper. Registry status can change, so a static list is only supplementary to ongoing dependency verification.

For the review of generated tests, see [The maintenance myth](/2026/04/05/why-ai-test-generation-tools-overpromise-on-maintenance-savi/).

## References

1. Pew Research Center (2024). *When Online Content Disappears*. https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/
2. Yu, S., Liu, Z., and Xiong, C. (2025). *Craw4LLM: Efficient Web Crawling for LLM Pretraining*. arXiv:2502.13347. https://arxiv.org/abs/2502.13347
3. Spracklen, J., Wijewickrama, R., Sakib, A. H. M. N., Maiti, A., Viswanath, B., and Jadliwala, M. (2025). *We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs*. USENIX Security Symposium 2025. arXiv:2406.10279. https://arxiv.org/abs/2406.10279
4. Churilov, A. (2026). *The Range Shrinks, the Threat Remains: Re-evaluating LLM Package Hallucinations on the 2026 Frontier-Model Cohort*. arXiv:2605.17062. https://arxiv.org/abs/2605.17062
5. DevIQA (2026). *State of AI-Generated Code 2026: The QA and Testing Gap* (citing LinearB 2026, Veracode GenAI Security Report 2025, GitClear 2026). https://www.deviqa.com/blog/state-of-ai-generated-code-2026-the-qa-and-testing-gap/
