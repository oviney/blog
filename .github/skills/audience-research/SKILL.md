---
name: audience-research
description: 'Audience and UX research for viney.ca. Use when evaluating reader journey, navigation, scanability, usability, or audience fit before handing implementation to design, editorial, or QA.'
version: 1.0.0
triggers:
  - Need reader-journey or audience-fit research
  - Investigating navigation, scanability, or usability friction
  - Research sweep finds UX or content-discovery questions
  - Need evidence-backed recommendations before design or content changes
---

## Context

This skill exists because UX, usability, and audience-fit work should not be
left as an informal overlap between design, editorial, and QA. The Audience
Researcher evaluates how the blog serves readers, captures evidence, and turns
ambiguous "make it more appealing" requests into concrete follow-up work for the
right implementation agent.

**Production URL**: https://www.viney.ca

**Primary research surfaces**:
- `/` - first impression, positioning, and content discovery
- `/blog/` - topic scanning, card hierarchy, and archive usability
- representative post pages - readability, structure, and trust signals
- `/search/` - findability and query refinement
- mobile navigation - tap targets, hierarchy, and reading comfort

## Step-by-Step Instructions

1. **Define the audience question**
   - State the audience segment or usability concern being investigated.
   - Write the current hypothesis in one sentence.
   - Example: "Readers interested in QE strategy can find the topic, but the path
     from homepage to deeper articles is harder than it should be."

2. **Review the reader journey end-to-end**
   - Inspect homepage, blog index, search, and at least one representative post.
   - Check mobile and desktop behaviour.
   - Focus on information scent, scanability, navigation clarity, reading rhythm,
     trust cues, and next-step discovery.

3. **Collect evidence instead of taste-based opinions**
   - Reuse repo standards where possible:
     - `references/accessibility-checklist.md`
     - Playwright navigation/responsive checks
     - existing SEO/content conventions
   - Record what the reader sees, where friction appears, and why it matters.
   - Distinguish evidence from preference.

4. **Write findings in a reusable format**
   - Capture each finding with:
     - the affected surface
     - the reader problem
     - the likely impact
     - the recommended owner
   - Use this template:

   ```markdown
   ## Finding: [short title]
   - **Surface:** homepage | blog index | post page | search | mobile nav
   - **Reader problem:** what feels unclear, slow, noisy, or unconvincing
   - **Evidence:** concrete observation or test signal
   - **Impact:** discovery | comprehension | trust | conversion | return visits
   - **Route to:** `agent:creative-director` | `agent:editorial-chief` | `agent:qa-gatekeeper`
   - **Recommended change:** concise, testable next step
   ```

5. **Route implementation to the correct agent**
   - Visual hierarchy, layout, spacing, component behaviour → Creative Director
   - Clarity, tone, headlines, summaries, internal linking, SEO → Editorial Chief
   - Accessibility, interaction regressions, test coverage, measurable quality gates → QA Gatekeeper
   - If the work is still exploratory and not yet implementation-ready, keep it as
     an Audience Researcher issue until the findings are clear.

## Common Pitfalls

### Pitfall 1: Turning research into unscoped redesign
**Problem**: "Improve appeal" becomes broad design churn with no evidence.
**Solution**: Start with a specific reader journey or usability question and
route implementation in small, testable follow-up issues.

### Pitfall 2: Confusing taste with evidence
**Problem**: Recommendations reflect personal preference rather than reader
friction.
**Solution**: Tie every finding to a concrete observation, checklist item, or
behavioural risk.

### Pitfall 3: Implementing fixes inside the research issue
**Problem**: Research findings and implementation changes get mixed together.
**Solution**: Keep research synthesis separate. Open follow-up issues for design,
editorial, or QA execution.

## Related Files

- `AGENTS.md` - persona boundaries and handoffs
- `CLAUDE.md` - local/direct lifecycle and label guidance
- `.github/workflows/research-sweep.yml` - recurring research intake
- `references/accessibility-checklist.md` - baseline usability/a11y heuristics
- `tests/playwright-agents/interactive-elements.spec.ts` - interaction and target-size checks
- `tests/playwright-agents/responsive.spec.ts` - responsive navigation behaviour checks
- `.github/skills/economist-theme/SKILL.md` - design follow-up destination
- `.github/skills/editorial/SKILL.md` - content follow-up destination
- `.github/skills/jekyll-qa/SKILL.md` - QA follow-up destination

## Success Criteria

- [ ] Research scope is framed as a reader problem, not a vague redesign request
- [ ] Findings cite concrete evidence from the live site or repo standards
- [ ] Every recommendation names the implementation owner explicitly
- [ ] Research issues end with actionable follow-up work instead of open-ended commentary

## Version History

- **1.0.0** (2026-04-26): Initial audience and UX research skill
