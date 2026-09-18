---
layout: review
title: "A Green Build Should Mean the Change Is Safe, Whoever Wrote It"
date: 2026-09-18
slug: green-build-safe
author: "Ouray Viney"
categories: ["Quality Engineering"]
description: "Cost of poor quality is an equation, not a feeling. A green build only means something when the people behind it know how to build software."
image_caption: "The lamp is wired; the check is not"
process: interview
image: /assets/images/green-build-safe-hero.svg
image_alt: "A cut-away of a wall. On the front face a large status lamp glows green. Behind the wall its cable runs down and stops in mid-air, its bare end a short distance from the terminal block it was meant to reach. Nothing connects the lamp to the check."
---

I've pretty much seen this on every project in every company since my very first day in
software, dating back to 2000. Every single project I've worked on over the past eleven
years, and if I go backwards in time, every job prior: a green build that didn't mean the
change was safe. Literally every single project where proper test-driven development and
proper developer and tester engineering for quality was missing.

I don't really know how you would push back on this, given that the one thing everyone's
aiming for is trust in a signal. If a build is green and cannot be trusted, I don't know how
you would argue that.

The cost of poor quality is the cost of a green build that isn't green. Weak checks, poor
code — whether it's code quality, or design and requirements not working correctly, or
integration with other application features — passes. Then it goes downstream and gets
deployed, the post-build verification step is completely wrong, and when a tester or an
automated bot runs a feature test, the feature test fails. For every failure and for every
build, the cycle time increases and the cost of rework increases, and therefore the cost of
poor quality is rising.

That last phrase is not a figure of speech. Cost of quality has been an equation since the
1950s — prevention plus appraisal plus internal failure plus external failure — and cost of
poor quality is the failure half of it. According to Juran's Quality Control Handbook, unplanned quality costs run as high as 20% of
sales. Applied to software by name, research by the Consortium for Information and Software
Quality puts the cost of poor software quality in the United States at at least $2.41
trillion, of which operational failures are $1.56 trillion and finding and fixing defects
$607 billion. According to CISQ's 2018 edition, the hidden costs run 6 to 50 times the
observable ones: observable being outages,
lawsuits and lost revenue; hidden being delays, overtime, fixing bugs, off-track projects and
technical debt.

People often begin to point fingers at people. To me, that is addressing the symptoms of the
problem statement rather than taking a systems thinking approach to the problem and
realising that the system as it is defined is therefore not working. By using causal loop
diagrams you would be able to explain the problem in a way that a person who starts blaming
people realises that that's the wrong approach.

That reflex has a name. Repenning and Sterman, writing in California Management Review in
2001, put it plainly: the attribution of a problem to the characteristics — and character
flaws — of individuals in a system rather than to the system in which they find themselves
is so pervasive that psychologists call it the fundamental attribution error. What makes it
stick is what happens next. Turn up the pressure and output does rise, immediately, which
looks like proof the diagnosis was right. They call that the self-confirming attribution
error: once managers decide the workforce is the source of their difficulties, they take
actions that provide convincing and immediate evidence confirming the erroneous attribution.

It is not the tooling either. I don't think a particular tool matters as much as do the
foundational principles of DevSecOps and CI and CD, and what constitutes a pass and a fail.
Any tool that doesn't align with the principles of software engineering is a problem in and
of itself, but in most cases improper use of a tool is usually the main cause. I wouldn't say
that a particular tool vendor does it right or wrongly. If the tool, and the way that it was
designed, is not used accurately or correctly or as designed, then the outcome is not
guaranteed.

There is a reason it wins by default. According to CISQ's 2022 report, most organisations do
not yet collect and report their cost of poor software quality numbers, and it cites a 2017
study of IT executives in which 35% of those surveyed said they had no idea how much IT
system failures were costing their business.

## Every single release fails for the same reason

On a modernisation programme at a large government organisation, taking them off the
mainframe onto a COTS product, every single release fails for the same reason. Bad planning,
poor dependency management across features and across the solution train, and quality that
is not built in: no shift left, no defect prevention. As the chart shows, set out as a loop
rather than a list it closes on itself.

Teams are under the constant pressure of build-complete dates in order to make contractual
milestone payments. Weak checks pass and the build goes green. It goes downstream and gets
deployed, the post-build verification step is completely wrong, and when a tester or an
automated bot runs a feature test, the feature test fails. By then the product teams have
moved on and started working on new releases, and only put a certain amount of time on bug
fixing, even though the bug fixing should have been happening during the build phase. The
release date gets pushed because of rework and because of late-stage defect injection. For
every failure and for every build, the cycle time increases and the cost of rework
increases, and therefore the cost of poor quality is rising — and the next build-complete
date arrives under more pressure than the last.

In this particular situation we are using SAFe, large solution configuration, but it truly
doesn't matter because we're not using it properly.

Adding continuous improvement items to a tower is a band-aid. I don't call that a solution.
If you don't change the root of the problem statement, you're never gonna get to green
builds. You're never gonna get to trustworthy software. You're just gonna keep repeating the
problem. The other path out is a replanning exercise, working backwards from the MVP: what
parts can we move off the mainframe as fast as possible, and how can all of the rest of the
solution be considered priority two and therefore follow a different path. Planning that
properly means software engineering people, not management consulting people trying to do
the job — somebody who has actually delivered a mainframe modernisation before.

Choosing the band-aid is not a lapse of character either; it is the best-documented move in
systems thinking. Senge named it in The Fifth Discipline in 1990: shifting the burden. The
symptomatic solution relieves the symptom, the capability for the fundamental solution
atrophies, and reliance on the band-aid deepens — the shape, he noted, of almost every
addiction. Repenning and Sterman drew it as two loops and simulated it: Work Harder buys an
immediate gain and costs capability later, Work Smarter costs output now and returns
capability later, and managers unaware of that trade-off choose working harder. The result is
what they call the capability trap. Why it persists is an incentive rather than a failing —
most organisations reward last-minute problem solving over the improvement that would have
prevented the crisis. Nobody ever gets credit for fixing problems that never happened.

The delivery model makes the trap deeper, and DORA measured that too. According to DORA's
2018 Accelerate State of DevOps report, low-performing teams were 3.9 times more likely to
use functional outsourcing than elite performers. The reason given is the shape of the arrangement, not the calibre of the people:
assigning individual functions to external vendors introduces handoffs and friction between
groups, and once contracts have been signed, changes to specifications are difficult to
manage across external silos. Work batches, and the lead times go with it.

None of which is unusual enough to be interesting. According to CISQ, a late-2019 prediction
put 40% of IT budgets by 2025 on simply maintaining technical debt, and it calls this a
primary reason that many modernisation projects fail. The same report puts the average
developer's time on technical debt at a third of the working week.

The old application is still available today, so the new one has not fully taken over — only
certain parts of the user journeys. That is the only reason the public is not feeling this
yet. If it is running in production and we have all these quality issues in release testing,
then there's a high probability that there's going to be an equal number of quality issues
identified in production, given that there's no way that end-to-end testing will cover all of
the gaps left behind.

## The path of least resistance

So what changes when an agent wrote the code? In my mind, nothing changes. The
responsibility around quality remains. The fact that you have an agent producing code means
that you need to have the same rigour that you should have always had if it was a human
writing the code. What changes is the importance of the human. Their skill set is of utmost
importance. If they're not an expert at building software, everything breaks.

Whatever they allow agents to do will follow that same pattern, which is they will follow
the pattern of the human. And if the agent can get away with not producing quality, the
agent will choose not to produce quality. It will take the path of least resistance to build
something.

The 2025 DORA research reaches the same place from the data side: AI's primary role is as an
amplifier, magnifying an organisation's existing strengths and weaknesses. According to DORA, adoption among software
development professionals stands at 90%, and the research finds that higher adoption is
associated with an increase in both software delivery throughput and software delivery
instability.

Research by GitClear shows what the path of least resistance looks like inside a repository.
Its 2026 analysis of 623 million changes finds that refactoring line moves fell from 21% in
2022 to 3.8% so far in 2026, while copy-paste rose from 9.4% to 15.7%, and code block
duplication is up 81% over 2023.

If I think about people who actually know their craft, I don't think anybody would argue
with this. Quality and the attributes of quality come from knowing how to build something
and the craft required to build it. Case in point: if you're going to build a house and you
don't have carpentry skills, you don't have framing skills, you don't have what it requires
to build a foundation using concrete, level, all the considerations, then you're going to
build a house that is not going to last. The buyer's going to know it, and problems are
going to be the first sign of it.

The reason why you can begin to trust it is because you know how it works. So when you don't
know how your build process works, and you're not responsible for it when the signals come
from it, I don't know how we automate that away. That's a human requirement, and the more
you use agents, the more this is important.

Humans have to encode or codify the software engineering and the skills so that agents can
bring that knowledge and rigour. Otherwise agents are going to produce slop.

![Chart](/assets/charts/green-build-safe.png)

## References

- Mustafa Shraim, "A Simple Model for Identifying Costs of Quality", American Society for Engineering Education, 2020 — https://peer.asee.org/a-simple-model-for-identifying-costs-of-quality.pdf
- CISQ, "The Cost of Poor Software Quality in the US: A 2022 Report" — https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/
- CISQ, 2022 report PDF — https://www.it-cisq.org/wp-content/uploads/sites/6/2022/11/CPSQ-Report-Nov-22-2.pdf
- DORA, "Accelerate: State of DevOps 2018" — the outsourcing chapter — https://dora.dev/research/2018/dora-report/
- DORA, "State of AI-assisted Software Development", 2025 — https://dora.dev/dora-report-2025/
- DORA, "Balancing AI tensions" — https://dora.dev/insights/balancing-ai-tensions/
- Google, "How are developers using AI? Inside Google's 2025 DORA report" — https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/
- GitClear, "The Maintainability Gap: 2026 AI Code Quality Research" — https://www.gitclear.com/the_ai_code_quality_maintainability_gap
- Nelson P. Repenning and John D. Sterman, "Nobody Ever Gets Credit for Fixing Problems that Never Happened", California Management Review 43(4), 2001 — https://web.mit.edu/nelsonr/www/Repenning=Sterman_CMR_su01_.pdf
- Peter Senge, "The Fifth Discipline", 1990 — the "Shifting the Burden" archetype — https://blog.iseesystems.com/systems-thinking/shifting-the-burden/

*How this was written: I was interviewed by Claude for about 70 minutes; the draft arranges my answers; I edited it; the facts were checked against sources I opened.*
