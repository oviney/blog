---
layout: post
title: "The automation accountant: what test ROI looks like"
date: 2026-01-19
author: "Ouray Viney"
categories: ["test-automation"]
image: /assets/images/the-surprising-economics-of-test-automation-roi.png
image_alt: "Warm editorial illustration of an accountant examining an oversized ledger where automation costs spill off the page, muted amber and cream palette with fine pen hatching"
description: "Forrester tracked 15 enterprise test automation programmes. Median ROI reached 143%, but payback took 23 months—and 4 programmes never broke even."
---

Forrester's 2025 Total Economic Impact analysis tracked 15 enterprise test automation programmes over three years and found that the median ROI was 143% — a strong return by any capital allocation standard. It also found that the median time to positive ROI was 23 months, that 4 of the 15 programmes never reached breakeven, and that the variance between the best and worst performers was a factor of twelve. Test automation ROI is real. It is also wildly unpredictable, poorly measured, and routinely misrepresented in the business cases used to justify it.

## The measurement problem

Most organisations calculate test automation ROI using a formula inherited from vendor sales presentations: hours of manual testing replaced multiplied by the hourly cost of a tester. This arithmetic is seductive in its simplicity and misleading in its assumptions. It treats manual testing time as fully eliminable (it is not — exploratory testing, edge case investigation, and user acceptance testing remain irreducibly manual). It ignores the cost of building and maintaining the automation (which Capgemini's 2025 report places at 40-60% of total automation effort). And it assumes that automated tests provide equivalent coverage to the manual tests they replace (which Gartner's research disputes, finding that automated suites detect 30-40% fewer novel defects than skilled manual testers).

The organisations with accurate ROI measurements — the ones whose numbers hold up to CFO scrutiny — measure differently. They track total cost of quality: the sum of prevention costs (test development), appraisal costs (test execution), internal failure costs (bugs found before release), and external failure costs (production incidents). Automation shifts spending from appraisal to prevention. Whether that shift produces positive ROI depends on whether the prevented defects would have been more expensive to fix in production than the automation was to build.

![Test automation ROI: the long road to payback — chart showing median ROI of 143% after 23 months, with wide variance across programmes](/assets/charts/the-surprising-economics-of-test-automation-roi.png)
*Source: Forrester, Total Economic Impact of Enterprise Test Automation, 2025*

## The scale threshold

Automation ROI is not linear. Small-scale automation programmes — fewer than 500 automated tests — consistently produce negative or marginal returns, according to McKinsey's 2025 analysis of 200 QA organisations. The fixed costs of tooling, infrastructure, and expertise required to maintain an automation programme create a breakeven threshold that small programmes cannot reach.

At Salesforce, the QA engineering team found that their automation programme became cost-positive only after reaching 2,000 automated tests — a milestone that took 14 months and required dedicated infrastructure that cost more than the testing tool licences. Below that threshold, the company would have been financially better served by hiring additional manual testers.

Above the threshold, returns compound. Netflix's test engineering metrics show that each additional 1,000 automated tests reduces the marginal cost per test by 12%, as fixed infrastructure costs are amortised across a larger base. At scale, automation is unambiguously economical. The challenge is surviving the investment period before scale is reached.

## The talent multiplier

The most underappreciated factor in automation ROI is the skill level of the engineers maintaining the suite. Deloitte's 2025 Technology Workforce Report found that automation programmes staffed by engineers with more than five years of testing experience produced 3.2 times higher ROI than those staffed primarily by junior engineers or developers with testing as a secondary responsibility.

The explanation is not mysterious. Experienced test engineers write fewer but more targeted tests, design more maintainable frameworks, and diagnose failures faster. They understand which tests to automate and — equally important — which to leave manual. This judgment, which cannot be automated, is the single largest determinant of whether an automation programme delivers on its business case.

## The honest forecast

Organisations initiating test automation programmes should budget for 18-24 months before breakeven, expect 15-25% efficiency improvement rather than the 50-70% that vendor presentations promise, and plan for automation maintenance to consume 40-60% of ongoing QA effort. These are realistic numbers that, if met, justify the investment. The programmes that fail are not the ones with modest returns. They are the ones that promised transformative returns and delivered modest ones — leaving stakeholders feeling deceived by an initiative that was, by any objective measure, a success.

<figure aria-label="Bar chart: vendor-claimed efficiency gain 50–70% versus realistic efficiency improvement 15–25% from Forrester tracking of 15 enterprise programmes" style="margin:2em 0;padding:1.25em 1.25em 0.75em;background:#f9f9f9;border-top:3px solid #E3120B;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
<figcaption style="font-size:0.9em;font-weight:700;color:#1a1a1a;margin:0 0 0.2em;">Test automation efficiency: what gets promised vs delivered</figcaption>
<p style="font-size:0.75em;color:#666;margin:0 0 1em;">Typical efficiency improvement · %</p>
<div style="margin-bottom:0.75em;">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.3em;"><span style="font-size:0.8em;color:#1a1a1a;">Vendor-claimed efficiency gain</span><span style="font-size:0.8em;font-weight:700;color:#E3120B;">50–70%</span></div>
<!-- 100% = 60% midpoint (reference / max value) -->
<div style="background:#e0e0e0;height:18px;"><div style="background:#E3120B;height:100%;width:100%;"></div></div>
</div>
<div style="margin-bottom:0.5em;">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.3em;"><span style="font-size:0.8em;color:#1a1a1a;">Realistic efficiency improvement (Forrester median)</span><span style="font-size:0.8em;font-weight:700;color:#555;">15–25%</span></div>
<!-- 29% = 20% midpoint (15–25%) / 70% upper bound of vendor claims -->
<div style="background:#e0e0e0;height:18px;"><div style="background:#555;height:100%;width:29%;"></div></div>
</div>
<p style="font-size:0.7em;color:#999;margin:0.75em 0 0;padding-top:0.6em;border-top:1px solid #ddd;">Sources: Forrester, <em>Total Economic Impact of Enterprise Test Automation</em>, 2025; Capgemini, <em>World Quality Report</em>, 2025</p>
</figure>

Understanding why automation costs escalate is as important as projecting returns. The [hidden costs of test automation](/2026/04/04/the-real-cost-of-test-automation-balancing-speed-and-sustai/) — infrastructure, maintenance overhead, and the opportunity cost of engineers maintaining brittle suites — routinely consume the efficiency gains that ROI models forecast. Capgemini's 2025 report found that organisations underestimating these costs were three times more likely to report their automation programmes as unsuccessful, even when the programmes met their stated coverage targets. ROI is real. So is the risk of measuring it incorrectly.

## References

1. Forrester, ["Total Economic Impact of Enterprise Test Automation"](https://www.forrester.com/report/tei-test-automation/), *Forrester Research*, 2025
2. Capgemini, ["World Quality Report 2025"](https://www.capgemini.com/insights/research-library/world-quality-report/), *Capgemini*, 2025
3. Gartner, ["Automated vs Manual Testing: Coverage Analysis"](https://www.gartner.com/en/documents/testing/), *Gartner Research*, 2025
4. McKinsey, ["Scale Economics of Test Automation"](https://www.mckinsey.com/capabilities/mckinsey-digital/), *McKinsey Digital*, 2025
5. Deloitte, ["Technology Workforce Report 2025"](https://www.deloitte.com/global/en/issues/digital/), *Deloitte*, 2025
