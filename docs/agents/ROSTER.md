# Agent Roster

This file lists all available agent personas in this workspace and how to activate them.

## Available Agents

### 1. Creative Director
**Domain:** Design / CSS / UI / Visual  
**Skill File:** [`docs/skills/economist-theme/SKILL.md`](../skills/economist-theme/SKILL.md)  
**GitHub Label:** `agent:creative-director`  
**Activation:**
```
Creative Director, fix issue #33
```

### 2. QA Gatekeeper
**Domain:** Testing / CI / Quality / Bugs  
**Skill File:** [`docs/skills/jekyll-qa/SKILL.md`](../skills/jekyll-qa/SKILL.md)  
**GitHub Label:** `agent:qa-gatekeeper`  
**Activation:**
```
QA Gatekeeper, review PR #35
```

### 3. Editorial Chief
**Domain:** Content / Writing / SEO / Posts  
**Skill File:** [`docs/skills/editorial/SKILL.md`](../skills/editorial/SKILL.md)  
**GitHub Label:** `agent:editorial-chief`  
**Activation:**
```
Editorial Chief, write a post about testing
```

### 4. Sprint Orchestrator
**Domain:** Project Management / GitHub Issues / Status / Planning  
**Skill File:** [`docs/agents/sprint-orchestrator.md`](sprint-orchestrator.md)  
**Activation:**
```
Sprint Orchestrator, what's next?
What should we work on?
Check GitHub Issues for P1 items
```

## Quick Commands

| User Says | Agent Activates |
|-----------|-----------------|
| "What should I work on next?" | Sprint Orchestrator |
| "Fix this CSS issue..." | Creative Director |
| "Review this PR..." | QA Gatekeeper |
| "Write a blog post about..." | Editorial Chief |
| "What's blocking the sprint?" | Sprint Orchestrator |
| "Update the theme..." | Creative Director |
| "Run the tests..." | QA Gatekeeper |

## GitHub Issues Integration

All agents work with **GitHub Issues** at: https://github.com/oviney/blog/issues

**Issue Routing via Labels:**
- `agent:creative-director` → Creative Director
- `agent:qa-gatekeeper` → QA Gatekeeper
- `agent:editorial-chief` → Editorial Chief

**Priority Labels:**
- `P0` - Critical (production down)
- `P1` - High (major feature)
- `P2` - Medium (minor issue)
- `P3` - Low (cosmetic)

**Type Labels:**
- `bug` - Defect/broken functionality
- `enhancement` - New feature
- `documentation` - Docs update

## Agent Collaboration

Agents hand off work to each other via GitHub Issue comments:

**Sprint Orchestrator** → delegates to:
- Creative Director (for design tasks)
- QA Gatekeeper (for verification)
- Editorial Chief (for content)

**Creative Director** → hands off to:
- QA Gatekeeper (for PR review)

**QA Gatekeeper** → reports back to:
- Sprint Orchestrator (issue verification)

**Editorial Chief** → coordinates with:
- Creative Director (visual content)
- QA Gatekeeper (publish verification)

## Multi-Agent Collaboration Patterns

Common sequential workflows for complex tasks:

### Pattern 1: Design Implementation & QA
**Flow:** Creative Director → QA Gatekeeper → Sprint Orchestrator

1. **Creative Director** implements design changes
   - Creates PR with visual changes
   - Posts before/after screenshots
   - Tags QA Gatekeeper for review

2. **QA Gatekeeper** diagnoses CI failures
   - Distinguishes expected vs unexpected failures
   - Verifies accessibility with external tools if needed
   - Identifies need for design validation

3. **Creative Director** (second pass) reviews visual regression
   - Downloads CI artifacts
   - Compares screenshots against issue acceptance criteria
   - Approves or requests design adjustments

4. **Sprint Orchestrator** handles PR merge
   - Ensures all approvals complete
   - Manages merge conflicts if any
   - Closes related issues
   - Updates sprint documentation

### Pattern 2: Content Creation & Publishing
**Flow:** Editorial Chief → Creative Director → QA Gatekeeper

1. **Editorial Chief** writes content
2. **Creative Director** adds visual elements
3. **QA Gatekeeper** verifies published correctly

### Pattern 3: Bug Fix Verification
**Flow:** (Any Agent) → QA Gatekeeper → Sprint Orchestrator

1. Agent fixes bug and creates PR
2. **QA Gatekeeper** verifies fix in CI and production
3. **Sprint Orchestrator** closes issue with verification notes

**Key Principle:** Each agent focuses on their domain expertise, passing work forward when specialized knowledge is needed.

## File Structure

```
docs/
├── agents/
│   ├── ROSTER.md                    # This file
│   └── sprint-orchestrator.md       # Planning agent
│
└── skills/
    ├── economist-theme/
    │   └── SKILL.md                 # Design system
    ├── jekyll-qa/
    │   └── SKILL.md                 # Testing workflow
    ├── editorial/
    │   └── SKILL.md                 # Content guidelines
    └── github-issues-workflow/
        └── SKILL.md                 # Issue management (source of truth)
```

## Version History

- **2.1.0** (2026-01-05): Added Multi-Agent Collaboration Patterns section documenting sequential workflows
- **2.0.0** (2026-01-05): Updated Sprint Orchestrator to use GitHub Issues API (not local files)
- **1.1.0** (2026-01-05): Added Sprint Orchestrator agent for project management
- **1.0.0** (2026-01-05): Initial roster with Creative Director, QA Gatekeeper, Editorial Chief
