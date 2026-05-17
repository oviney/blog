# Spec: GitHub Copilot Skills and Agents Workflow Redesign

**Status:** Draft - awaiting approval  
**Date:** 2026-05-17  
**Lifecycle phase:** SPECIFY

## Assumptions I'm Making

1. The goal is to improve how this repository defines and uses **GitHub Copilot Skills and Agents**, not to redesign the blog product itself.
2. This redesign should cover both **direct/local agent execution** and **issue-assigned Copilot cloud agent** workflows, while acknowledging they are not identical runtimes.
3. The target outcome is a clearer, lower-drift governance model for skills, agent personas, routing, and validation, not a net-new automation platform.
4. It is acceptable for the redesign to touch governance docs, skill files, and supporting validation scripts/workflows, but not protected files such as `_config.yml`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, `Gemfile`, or `Gemfile.lock`.
5. Success should be measured by **clearer routing, fewer overlapping concepts, and machine-checkable consistency**, not by adding more personas or more prose.

## Objective

Redesign the repository's GitHub Copilot Skills and Agents setup so it is easier for agents and humans to answer four questions consistently:

1. Which skill should be invoked first?
2. Which persona owns the work?
3. Which files and workflows are in scope?
4. How do we verify the governance docs and skills are internally consistent?

The users are maintainers and agents working inside `oviney/blog`. Success means the repo has a single, comprehensible workflow model with explicit contracts between:

- lifecycle skills (`spec`, `plan`, `build`, `test`, `review`, `ship`)
- repo-specific augmentation skills (`jekyll-development`, `jekyll-qa`, `editorial`, `economist-theme`, etc.)
- persona routing (`agent:*` labels and scope boundaries)
- automated checks that catch drift before merge

## Tech Stack

- GitHub Copilot CLI / Copilot cloud agent workflows
- Markdown governance docs
- GitHub issue labels and PR workflow
- Bash automation in `scripts/`
- GitHub Actions workflows in `.github/workflows/`
- Jekyll repo validation via `bundle exec jekyll build`

## Commands

```bash
# Build the site after governance/doc changes
bundle exec jekyll build

# Run scope checks for governance-surface work
PR_LABELS=governance-update bash scripts/check-pr-scope.sh

# Run the documentation audit locally when issue filing is intended
GH_TOKEN="$GH_TOKEN" GITHUB_REPOSITORY=oviney/blog bash scripts/doc-audit.sh

# Manually dispatch the documentation audit workflow
gh workflow run doc-audit.yml --repo oviney/blog

# Inspect current skill inventory
find .github/skills -name SKILL.md | sort
```

## Project Structure

```text
.github/
  skills/                         Skill definitions and lifecycle/reference guidance
    */SKILL.md
  instructions/                   Path-specific editing rules
  workflows/                      CI and governance workflows
AGENTS.md                         Persona roster, ownership, handoffs, conventions
CLAUDE.md                         Local/direct lifecycle backbone
scripts/
  check-pr-scope.sh               Scope/governance guardrail
  doc-audit.sh                    Documentation and skill consistency audit
specs/
  copilot-skills-agents-redesign-spec.md
```

Likely implementation surfaces for this redesign:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/skills/README.md`
- selected `./.github/skills/*/SKILL.md` files
- `scripts/doc-audit.sh`
- `.github/workflows/doc-audit.yml`
- optionally a new machine-readable governance manifest if needed

## Code Style

Prefer short, declarative skill metadata and explicit routing language over narrative duplication.

```yaml
---
name: review
description: Review changes before merge
phase: review
callable: true
domain: lifecycle
allowed_paths:
  - ".github/skills/"
  - "AGENTS.md"
required_checks:
  - "bundle exec jekyll build"
  - "PR_LABELS=governance-update bash scripts/check-pr-scope.sh"
---
```

Conventions this redesign should follow:

- one primary callable skill per lifecycle phase
- augmentation skills describe repo-specific guidance, not duplicate the lifecycle contract
- personas define domain ownership and scope boundaries
- docs summarize and link to the canonical source rather than restating it
- examples should be concrete and executable

## Testing Strategy

This redesign is primarily governance, documentation, and validation work, so testing is structural rather than feature-UI based.

1. **Build validation**
   - `bundle exec jekyll build`
   - Ensures repo docs and pages still build cleanly

2. **Scope validation**
   - `PR_LABELS=governance-update bash scripts/check-pr-scope.sh`
   - Confirms governance-surface changes are deliberate and within repo guardrails

3. **Governance consistency validation**
   - Extend or refine `scripts/doc-audit.sh` and/or related workflow checks so they can detect:
     - mismatched persona labels across docs
     - overlapping or ambiguous callable skill names
     - missing required skill metadata
     - drift in protected-file lists and ownership tables

4. **Review-level verification**
   - Diff review confirms routing is unambiguous:
     - one canonical lifecycle map
     - one canonical persona/scope source
     - reference docs link rather than fork behavior

5. **Change-level verification**
   - Each implementation slice should touch a small number of files and ship with a specific before/after contract, e.g.:
     - "callable vs reference-only skill metadata exists everywhere"
     - "Audience Researcher is either fully routable or explicitly local-only"
     - "Doc audit fails when a skill omits required metadata"

## Boundaries

- **Always do:**
  - Keep lifecycle routing explicit and phase-first
  - Keep persona scope boundaries machine-checkable where possible
  - Update validation logic when governance rules change
  - Validate with `bundle exec jekyll build`
  - Validate governance work with `PR_LABELS=governance-update bash scripts/check-pr-scope.sh`

- **Ask first:**
  - Adding or removing personas
  - Renaming existing public-facing slash commands or lifecycle skill names
  - Introducing a new manifest file or schema for skill metadata
  - Expanding doc-audit behavior to enforce new repo policy in CI
  - Changing label strategy for issue-assigned Copilot cloud agents

- **Never do:**
  - Modify protected files: `_config.yml`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, `Gemfile`, `Gemfile.lock`
  - Assume all runtimes expose the same agent, skill, or MCP integrations
  - Leave duplicate routing rules in multiple docs without a canonical owner
  - Add new dependencies just to manage governance metadata
  - Treat overlapping callable skill names as acceptable ambiguity

## Success Criteria

1. A maintainer can identify the correct first skill for a task in under 30 seconds from one canonical routing source.
2. Each lifecycle phase has exactly one primary callable skill, with any supporting/reference files clearly marked as non-primary.
3. Persona ownership, allowed paths, and handoff expectations are defined in one canonical place and referenced elsewhere without semantic drift.
4. The repo's agent model clearly distinguishes:
   - local/direct execution guidance
   - issue-assigned Copilot cloud agent guidance
   - optional runtime-specific capabilities
5. Audience-research / ancillary personas are either fully integrated into routing or explicitly documented as secondary/local-only.
6. Skill files expose consistent machine-checkable metadata sufficient to validate callable status, lifecycle phase, and scope intent.
7. Automated governance checks can detect at least:
   - missing required skill metadata
   - mismatched agent labels across governing docs
   - duplicate/conflicting routing declarations
   - stale or broken links among skill/governance docs
8. The redesign can be implemented incrementally in reviewable slices rather than a repo-wide rewrite.

## Open Questions

1. Should the canonical routing source be `CLAUDE.md`, `.github/skills/README.md`, or a new dedicated manifest-backed doc?
2. Should `AGENTS.md` remain the canonical persona/scope source, or should scope data move into a machine-readable file consumed by docs and checks?
3. Should `agent:audience-researcher` become part of issue-label routing, or remain a local/direct persona only?
4. Should callable/reference-only metadata live in front matter on each `SKILL.md`, in a central registry, or both?
5. Should this redesign ship as:
   - one governance PR,
   - a spec PR plus follow-up implementation PRs,
   - or a phased sequence (routing first, metadata second, linting third)?
