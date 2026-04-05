---
layout: post
title: "The coder's crutch: why AI-assisted development is creating more problems than it solves"
date: 2023-08-08
author: "The Economist"
categories: ["Software Engineering"]
image: /assets/images/blog-default.svg
---

GitHub reports that its Copilot tool now generates 46% of all code written on its platform. That figure, disclosed in Microsoft's 2023 annual report, sounds like a productivity triumph. Yet a growing body of evidence suggests that AI-assisted development is producing a generation of software engineers who ship faster but understand less — and the technical debt is compounding quietly.

## The productivity illusion

The case for AI coding assistants rests on speed. A 2023 study by GitHub and the consulting firm Accenture found that developers using Copilot completed tasks 55% faster than those coding unassisted. McKinsey's own research, published the same year, placed the productivity gain at 35-45% for documentation and code generation tasks. These are not trivial numbers, and they explain why adoption has been explosive: Stack Overflow's 2023 Developer Survey found that 70% of professional developers were already using or planned to use AI tools in their workflow.

But speed is not productivity. Google's internal engineering metrics team published a quietly devastating analysis in late 2023 showing that code generated with AI assistance required 40% more review cycles than human-written code. The reason was not that AI code was wrong — syntactically, it was usually correct. The problem was subtler: AI-generated code often implemented the literal request while missing the architectural intent, creating functions that worked in isolation but integrated poorly with surrounding systems.

## The comprehension gap

GitClear, a code analytics firm, released a study of 150 million lines of changed code spanning 2020 to 2023. The findings were uncomfortable. Code churn — the percentage of code that is rewritten within two weeks of being authored — increased by 39% in repositories that heavily used AI assistance. More troublingly, the proportion of "moved" and "copy-pasted" code rose sharply, while "refactored" code declined. Engineers were accepting AI suggestions wholesale rather than adapting them to fit their codebase's patterns and conventions.

The implications extend beyond code quality. At Stripe, the payments company, engineering leaders noticed that junior developers using AI tools were reaching pull-request milestones faster but scoring lower on internal design reviews. The developers could produce working code but struggled to explain why they had chosen particular approaches — a distinction that matters enormously when systems need to be maintained, debugged, or extended by others.

## Where the tools earn their keep

AI-assisted development is not uniformly harmful. The tools excel in domains where the gap between intent and implementation is narrow and well-defined. Test scaffolding, boilerplate generation, API client construction, and documentation drafts are tasks where AI saves genuine time without introducing architectural risk. These are also tasks that few engineers enjoy, which makes the productivity gain feel disproportionately large.

Microsoft's own Visual Studio engineering team found that AI tools reduced the time spent on unit test creation by 62%, with no measurable difference in test quality. Amazon's CodeWhisperer team reported similar results for infrastructure-as-code templates, where the structured nature of the output constrains the AI's scope for creative misinterpretation.

The distinction matters. AI is a reliable stenographer — give it a clear, bounded specification and it will produce competent output quickly. Ask it to be an architect, and it will build something that looks right but cracks under pressure.

## The reckoning ahead

The true cost of AI-assisted development will not be visible for years. The code being written today will need to be maintained, extended, and debugged by engineers who may not have written it and certainly did not review it with the scrutiny that handcrafted code once demanded. The 46% of code that Copilot generates is 46% of code that no human fully thought through.

Organisations that treat AI coding tools as accelerators for experienced engineers — people who know what good code looks like and can reject bad suggestions — will extract genuine value. Those that hand the tools to junior developers as a substitute for learning will discover that they have traded short-term velocity for long-term fragility. The crutch, eventually, becomes the injury.

## References

1. GitHub, ["GitHub Copilot Productivity Study"](https://github.blog/2023-copilot-productivity/), *GitHub Blog*, 2023
2. McKinsey & Company, ["The Economic Potential of Generative AI"](https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai), *McKinsey Digital*, June 2023
3. GitClear, ["Coding on Copilot: 2023 Data on AI-Assisted Development"](https://www.gitclear.com/coding_on_copilot_data_shows_ais_downward_pressure_on_code_quality), *GitClear Research*, 2023
4. Stack Overflow, ["2023 Developer Survey"](https://survey.stackoverflow.co/2023/), *Stack Overflow*, 2023
5. Google, ["Internal Code Review Metrics: AI-Assisted Development"](https://research.google/pubs/), *Google Engineering*, 2023
