---
layout: review
title: "A Green Build Should Mean the Change Is Safe, Whoever Wrote It"
date: 2026-09-18
slug: green-build-safe
rubric: "Trust in a signal"
subtitle: "Trust in a signal is what everyone is aiming for. The more you use agents, the more that matters."
author: "Ouray Viney"
categories: ["Quality Engineering"]
description: "Cost of poor quality is an equation, not a feeling. A green build only means something when the people behind it know how to build software."
image_caption: "The lamp is wired; the check is not"
process: interview
image: /assets/images/green-build-safe-hero.svg
image_alt: "A cut-away of a wall. On the front face a large status lamp glows green. Behind the wall its cable runs down and stops in mid-air, its bare end a short distance from the terminal block it was meant to reach. Nothing connects the lamp to the check."
---

Every project I have worked on since 2000 has had the same problem: a green build that did not mean the change was safe. In each case, proper test-driven development and proper engineering for quality, by developers and testers alike, was missing.

The cost of poor quality is the cost of a green build that isn't green. Weak checks and poor code pass, whether the fault is in code quality, in design and requirements, or in integration with other features.

The cost of poor quality is not a figure of speech. Cost of quality has been an equation since the 1950s: prevention plus appraisal plus internal failure plus external failure. Cost of poor quality is the failure half of it. Juran estimated that unplanned quality costs could run as high as 20% of sales, as Shraim (2020) summarises. Applied to software by name, research by the Consortium for Information and Software Quality (CISQ) puts the cost of poor software quality in the United States at at least $2.41 trillion in 2022. In its 2020 edition, when the total was about $2.08 trillion, operational software failures alone accounted for $1.56 trillion. CISQ's iceberg model separates the costs everyone sees, such as outages, lawsuits and service calls, from the ones nobody books: finding and fixing defects, troubled projects, unaccounted overtime and technical debt.

People often begin to point fingers at people. To me, that is addressing the symptoms of the problem rather than taking a systems thinking approach and realising that the system, as it is defined, is not working. A causal loop diagram can show someone who starts blaming people why that is the wrong approach.

That reflex has a name. Repenning and Sterman, writing in California Management Review in 2001, point out that blaming individuals rather than the system they work in is common enough that psychologists call it the fundamental attribution error. What makes it stick is what happens next. Turn up the pressure and output does rise, immediately, which looks like proof the diagnosis was right. Managers who blame the workforce, they found, take actions that seem to confirm the blame. They call this the self-confirming attribution error.

It is not the tooling either. A particular tool matters less than the foundations of DevSecOps, CI and CD, and an agreed definition of what constitutes a pass and a fail. A tool that does not align with sound engineering principles is a problem in itself, but in most cases the cause is improper use. I wouldn't say any particular vendor does it right or wrong. If a tool is not used as it was designed to be used, the outcome is not guaranteed.

There is a reason the problem wins by default. CISQ's 2018 report found that most IT and software organisations do not collect cost-of-quality data at all. What is not measured cannot compete with a milestone date.

## One programme, the same three failures

On one public-sector modernisation I have worked on, moving services off a mainframe onto a packaged product, releases kept failing for the same three reasons: weak planning, poor dependency management across teams, and quality that was tested in late instead of built in. The defect tracker made the last one plain. When I pulled the defect data for one release, 78% or more of defects were being found in release testing, not in the sprint where the code was written. Across two consecutive releases, the product teams had added no regression automation at all. That is one programme at one point in time, not a survey, but it is the same pattern I described at the start. Set out as a loop rather than a list, it closes on itself, as the chart below shows.

![Causal loop: build-date pressure lets weak checks pass, defects surface late, rework pushes the release, pressure rises again.](/assets/charts/green-build-safe.png)

Teams work under constant pressure to hit build-complete dates. Weak checks pass and the build goes green. It goes downstream and gets deployed, the post-build verification is wrong, and when a tester or an automated bot runs a feature test, the test fails. By then the product teams have moved on to the next release and give bug fixing only part of their time, even though that fixing should have happened during the build. The release date slips because of rework and late-stage defects. Each failed build adds cycle time and rework, the cost of poor quality rises, and the next build-complete date arrives under more pressure than the last.

The delivery framework does not matter much here. Any framework fails when it is not used properly.

Adding continuous improvement items to the backlog is a band-aid. I don't call that a solution. If you don't change the root of the problem, you will never get to green builds you can trust. You will keep repeating the problem. The other path out is a replanning exercise that works backwards from the minimum viable product: which parts can move off the mainframe first, and which can be treated as second priority on a different path. Planning that properly needs software engineers who have delivered a mainframe modernisation before, not management consultants.

Choosing the band-aid is not a lapse of character either; it is the best-documented move in systems thinking. Senge named it in The Fifth Discipline in 1990: shifting the burden. The symptomatic solution relieves the symptom, the capability for the fundamental solution atrophies, and reliance on the band-aid deepens. Senge noted that this is the structure of most addictions. Repenning and Sterman drew it as two loops and simulated it. Working harder buys an immediate gain and costs capability later. Working smarter costs output now and returns capability later. Managers unaware of that trade-off choose working harder, and the result is what the authors call a capability trap. It persists because of incentives, not failings: most organisations reward last-minute problem solving over the improvement that would have prevented the crisis. As the title of their paper puts it, nobody ever gets credit for fixing problems that never happened.

The delivery model makes the trap deeper, and DORA measured that too. According to DORA's 2018 Accelerate State of DevOps report, low-performing teams were 3.9 times more likely to use functional outsourcing than elite performers. The reason given is the shape of the arrangement, not the calibre of the people. Handing individual functions to external vendors adds handoffs and friction between groups, and once contracts are signed, changes to specifications are hard to manage across external silos. Work gets batched, and lead times grow with it.

None of this is unusual. CISQ's 2022 report cites a late-2019 prediction that by 2025, 40% of IT budgets would go to simply maintaining technical debt, and calls this a primary reason that many modernisation projects fail. The same report puts the average developer's time on technical debt at 13.5 of 41.1 hours a week, about a third.

## The path of least resistance

So what changes when an agent wrote the code? The standard does not. The load on it does. An agent produces in an hour what a team used to review in a week, so every weak gate fails more often and sooner. The responsibility for quality stays where it was, and you need the same rigour you should always have had with human authors. What rises is the importance of the human. Their skill matters more than ever. If they are not expert at building software, everything breaks.

Agents follow the pattern the humans around them set. If an agent can get away with not producing quality, it will. It will take the path of least resistance to build something.

The 2025 DORA research reaches the same place from the data side: AI's primary role is as an amplifier, magnifying an organisation's existing strengths and weaknesses. According to DORA, 90% of technology professionals now use AI at work, and higher AI adoption is associated with an increase in both software delivery throughput and software delivery instability.

GitClear's data shows what the path of least resistance looks like inside a repository. Its 2026 analysis of 623 million changes finds that moved (refactored) lines fell from 21% of changes in 2022 to 3.8% so far in 2026, while copy-pasted lines rose from 9.4% to 15.7%. Duplicated code blocks are up 81% since 2023. GitClear does not claim AI caused this; the trend tracks the rise of AI-authored commits, which is correlation.

Here is what would prove me wrong: teams that let agents ship under weaker gates and see no rise in their change failure rate. DORA's 2025 data points the other way, but it is a pattern across organisations, not a controlled test. And there is a limit I should own. As Dijkstra wrote in 1970, testing can show the presence of bugs but never their absence. No green build can promise a change is safe. What it can promise is that every risk you know about has a check, and that the check would have failed. That is what "safe" in the title means, and it is a higher bar than most green builds clear today.

People who know their craft won't argue with this. Quality comes from knowing how to build something and having the craft to do it. If you build a house without carpentry, framing or foundation skills, it will not last. The buyer will know it, and the problems will be the first sign.

You can trust a signal because you know how it works. When you don't know how your build process works, and you are not responsible for what its signals tell you, I don't see how you automate that away. That is a human requirement, and the more you use agents, the more it matters.

## What to do about it

Diagnosis is the easy half. These are the moves I made on the programme above, plus two for anyone starting fresh.

**Measure where defects are found.** Tag each defect with the stage that found it, and report the share found in the sprint against the share found in release testing, team by team. That ratio is where the 78% came from. Until it sits on a dashboard, nobody owns it.

**Put accountability where the authority is.** The teams that write the code own its quality in the sprint. Routing upstream defects to the test team to absorb is how the loop keeps running.

**Make automation part of done.** A story is not done until its regression checks exist and run in the pipeline. An optional check is the first thing cut under build-date pressure.

**Start with the worst teams, not all of them.** Pick the few teams producing the most late defects, embed automation engineers with them to build the first checks, then hand over. A central team should enable the work, not absorb it.

**Give agents the standard in writing.** Agents follow the context they are given. Codify your engineering standard as context files and skills the agent reads on each task: what a test must cover, what blocks a merge, what done means. Otherwise agents will produce slop.

**Run the ten-build check.** Take the last ten green builds that later produced a defect in release testing. For each one, name the check that should have failed. A defect without a named check is a hole in your signal. Count them again in a month.

**If you buy delivery, contract for it.** Require each release report to show two numbers side by side: build status, and the count of defects found after the build went green. A vendor whose green builds keep producing late defects is showing you the size of the hole in their signal.

## References

- Mustafa Shraim, "A Simple Model for Identifying Costs of Quality", American Society for Engineering Education, 2020, https://peer.asee.org/a-simple-model-for-identifying-costs-of-quality.pdf
- CISQ, "The Cost of Poor Quality Software in the US: A 2018 Report", https://www.it-cisq.org/wp-content/uploads/sites/6/2023/09/The-Cost-of-Poor-Quality-Software-in-the-US-2018-Report.pdf
- CISQ, "The Cost of Poor Software Quality in the US: A 2020 Report", press release, https://www.it-cisq.org/cost-of-poor-software-quality/
- CISQ, "The Cost of Poor Software Quality in the US: A 2022 Report", https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/
- CISQ, 2022 report PDF, https://www.it-cisq.org/wp-content/uploads/sites/6/2022/11/CPSQ-Report-Nov-22-2.pdf
- DORA, "Accelerate: State of DevOps 2018", outsourcing chapter, https://dora.dev/research/2018/dora-report/
- DORA, "State of AI-assisted Software Development", 2025, https://dora.dev/dora-report-2025/
- DORA, "Balancing AI tensions", https://dora.dev/insights/balancing-ai-tensions/
- GitClear, "The Maintainability Gap: 2026 AI Code Quality Research", https://www.gitclear.com/the_ai_code_quality_maintainability_gap
- Nelson P. Repenning and John D. Sterman, "Nobody Ever Gets Credit for Fixing Problems that Never Happened", California Management Review 43(4), 2001, https://web.mit.edu/nelsonr/www/Repenning=Sterman_CMR_su01_.pdf
- Peter Senge, "The Fifth Discipline", 1990, the "Shifting the Burden" archetype, https://blog.iseesystems.com/systems-thinking/shifting-the-burden/
- Edsger W. Dijkstra, "Notes on Structured Programming" (EWD249), 1970, https://www.cs.utexas.edu/~EWD/ewd02xx/EWD249.PDF

*How this was written: I was interviewed by Claude for about 70 minutes; the draft arranges my answers; I edited it; the facts were checked against sources I opened.*
