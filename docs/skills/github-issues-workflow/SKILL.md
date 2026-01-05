---
name: GitHub Issues Bug Workflow
description: Standard Agile process for bug reporting, triage, assignment, and resolution using GitHub Issues
version: 1.2.0
triggers:
  - User reports a bug
  - QA finds a defect
  - Production incident
  - Test failure
  - Need to track defect
  - User asks "what should I work on next?"
  - Need to query open issues
---

## Context

This blog uses **GitHub Issues** (not docs/ISSUES.md) as the single source of truth for bug tracking. All defects must follow the Agile workflow: Report → Triage → Branch → Fix → PR → Review → Merge → Verify → Close.

**Critical Rule**: NEVER commit bug fixes directly to `main`. Always use feature branches and Pull Requests.

**GitHub Issues URL**: https://github.com/oviney/blog/issues

## Step-by-Step Instructions

### 0. Invoking Agent from Existing GitHub Issue

**When you return to dev environment and want to action a GitHub Issue:**

#### Option 1: Tell Agent to Process Issue
```
User: "Process GitHub Issue #123"
User: "Fix bug #123"
User: "Work on issue #123"
```

**Agent automatically:**
1. Fetches issue from https://github.com/oviney/blog/issues/123
2. Reads title, description, labels, priority
3. Activates correct agent persona based on labels
4. Starts workflow at Step 2 (Triage) or Step 3 (Create Branch)

#### Option 2: Direct Agent Assignment
```
User: "Creative Director, fix GitHub Issue #123"
User: "QA Gatekeeper, triage issue #123"
```

**Agent:**
1. Adopts specified persona
2. Fetches issue details
3. Continues from appropriate workflow step

#### Option 3: Check All Open Issues
```
User: "What bugs are open?"
User: "Show me P1 issues"
User: "List all agent:creative-director issues"
User: "What should we work on next?"
```

**Agent (Sprint Orchestrator activates):**
1. Queries GitHub Issues API
2. Filters by label/priority/assignee
3. Lists issues with quick summary
4. Asks which to work on

**Example:**
```bash
gh issue list --repo oviney/blog --state open --label P1
gh issue list --repo oviney/blog --label "agent:creative-director"
```

**See also:** [Sprint Orchestrator Agent](../../agents/sprint-orchestrator.md) for backlog management and planning.

### 1. User Reports Bug (GitHub Issue)

**When user asks to log/report a bug, ALWAYS provide the bug template first.**

**Trigger phrases:**
- "I found a bug"
- "There's a problem with..."
- "How do I report a bug?"
- "What's the bug template?"
- "I want to log a bug"

**Agent response:**
```
Here's the bug template from .github/ISSUE_TEMPLATE/bug_report.yml:

Required fields:
- Priority: P0-P3 (Critical/High/Medium/Low)
- Component: Layout/Design, Blog Posts, Navigation, Performance, SEO, Other
- Bug Description: What's wrong? What did you expect?

Optional fields:
- Steps to Reproduce
- Reference/Screenshots
- Affected URL

Go ahead and describe the bug - I'll help triage and create a GitHub issue.
```

**User creates new issue** at https://github.com/oviney/blog/issues/new (or Agent creates it)

**Full Template Reference:**
```markdown
**Bug Description:**
[Clear description of what's broken]

**URL/Location:**
[Where the bug occurs - URL or component]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What's actually happening]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Observe issue

**Environment:**
- Browser: Chrome/Safari/Firefox
- Device: Desktop/Mobile/Tablet
- Screen size: [if layout issue]

**Priority Suggestion:**
P0-Critical / P1-High / P2-Medium / P3-Low

**Screenshots:**
[Attach if available]
```

**Labels to add:**
- `bug` (required)
- `P0`, `P1`, `P2`, or `P3` (priority)

### 2. QA Gatekeeper Triages Issue (< 1 hour)

**QA Gatekeeper persona activates** and:

#### 2a. Reproduce Bug
```bash
# Start local server
cd /Users/ouray.viney/code/economist-blog-v5
bundle exec jekyll serve --livereload

# Navigate to reported URL
open http://localhost:4000/path/to/bug
```

#### 2b. Validate & Confirm
- ✅ Bug is reproducible
- ✅ Bug is a defect (not feature request)
- ✅ Bug is not duplicate of existing issue

**Add comment to issue:**
```markdown
✅ **Confirmed** - Reproduced locally

**Root Cause:** [Brief analysis]
**Impact:** [How many users affected / severity]
**Estimated Effort:** S (< 1hr) / M (1-4hr) / L (> 4hr)
```

#### 2c. Assign Priority
Update GitHub labels:
- `P0` - Production down, data loss, security issue
- `P1` - Major feature broken, affects many users
- `P2` - Minor issue, workaround exists
- `P3` - Cosmetic, low impact

#### 2d. Assign to Agent
Add label based on domain:

| Bug Domain | Agent | Label | Skill File |
|------------|-------|-------|------------|
| Layout/CSS/Visual | Creative Director | `agent:creative-director` | `economist-theme/SKILL.md` |
| Tests/CI/Performance | QA Gatekeeper | `agent:qa-gatekeeper` | `jekyll-development/SKILL.md` |
| Content/Posts/SEO | Editorial Manager | `agent:editorial-manager` | `editorial/SKILL.md` |

**Add comment:**
```markdown
🤖 **Assigned to:** Creative Director
📚 **Reference:** docs/skills/economist-theme/SKILL.md
🎯 **Sprint:** 2026-01 Sprint 1
```

#### 2e. Define Acceptance Criteria
Add to issue description:
```markdown
**Acceptance Criteria:**
- [ ] [Specific testable criterion 1]
- [ ] [Specific testable criterion 2]
- [ ] No visual regressions on other pages
- [ ] All tests pass
- [ ] Works on mobile/tablet/desktop
```

### 3. Assigned Agent Asks Clarifying Questions (BEFORE Creating Branch)

**CRITICAL STEP**: Before writing any code, agent must ask clarifying questions to avoid rework.

#### 3a. Review Issue & Specifications
```bash
# Read issue details
gh issue view 123 --repo oviney/blog

# If spec file exists, read it
cat docs/BUG_*.md  # e.g., docs/BUG_BLOG_LAYOUT.md
```

#### 3b. Identify Ambiguities
**Ask about:**
- **Design Details**: Exact sizes, colors, fonts (if not fully specified)
- **User Preferences**: Options or variations not clarified
- **Edge Cases**: Behavior for missing data, empty states
- **Dependencies**: External resources needed (images, APIs)
- **Responsive Behavior**: Mobile/tablet handling if unclear

**Example questions (from issue #33):**
```markdown
**Clarifying Questions Before Implementation:**

1. **Date Display Format**
   - Spec mentions metadata but not date format
   - Should we use "Jan 5, 2026" or "January 5, 2026" or "Jan 5th 2026"?
   - Reference URL: [Economist article]

2. **Category Colors**
   - Should all categories use same gray color?
   - Or different colors per category like Economist does?

3. **Image Fallback**
   - For posts without images, should we:
     a) Use default gray gradient image?
     b) Hide image container entirely?
     c) Show placeholder icon?
```

#### 3c. Wait for User Response
**Do not proceed until:**
- [ ] User answers all clarifying questions
- [ ] Design decisions are confirmed
- [ ] Implementation approach is approved

**Benefit**: Avoids wasted tokens on iterations and rework

### 4. Assigned Agent Creates Branch

**Agent checks out feature branch:**
```bash
# Get issue number from GitHub (e.g., #123)
git checkout main
git pull origin main
git checkout -b bugfix/GH-123-short-description

# Example:
git checkout -b bugfix/GH-123-related-articles-filter
```

**Branch naming convention:**
- `bugfix/GH-<issue#>-<short-kebab-description>`
- Max 50 characters
- Use GitHub issue number (GH-123)

**Add comment to issue:**
```markdown
🔧 **Started work** on branch `bugfix/GH-123-related-articles-filter`
```

### 4. Agent Implements Fix

#### 4a. Read Relevant Skill File
```bash
# Creative Director reads:
cat docs/skills/economist-theme/SKILL.md

# QA Gatekeeper reads:
cat docs/skills/jekyll-qa/SKILL.md
```

#### 4b. Implement Fix
- Follow SKILL.md guidelines
- Use SCSS variables (no magic numbers)
- Test at all breakpoints (320px, 768px, 1024px)
- Run local server to verify

#### 4c. Test Fix
```bash
# Build test
bundle exec jekyll build

# Visual test
bundle exec jekyll serve --livereload
# Open http://localhost:4000 and verify fix

# Run all tests (if applicable)
npm test
```

#### 4d. Commit to Branch
```bash
git add <files>
git commit -m "fix(GH-123): brief description

- Detail 1
- Detail 2
- Detail 3

Closes #123"

# Push to GitHub
git push origin bugfix/GH-123-related-articles-filter
```

**Commit message format:**
- `fix(GH-123): <description>` - Bug fix
- Must include `Closes #123` to auto-close issue
- Sign with `[Agent Name]` at end

### 5. Agent Creates Pull Request

**Create PR on GitHub:**
```markdown
## Description
Fixes #123 - Related articles not filtered by category

## Changes
- Added Liquid filter to prioritize same-category posts
- Excluded current post from related list
- Falls back to other categories if < 6 available

## Testing
- [x] Tested locally on all article pages
- [x] Verified at 320px, 768px, 1024px
- [x] Jekyll build passes
- [x] No console errors

## Acceptance Criteria
- [x] Related articles filtered by category
- [x] Current post excluded
- [x] Max 6 posts shown
- [x] Fallback to other categories
- [x] Tested on existing posts

## Screenshots
[Attach before/after if visual change]
```

**PR Labels:**
- `bug`
- `agent:creative-director`
- Priority label from issue

**Request review from:** `@oviney` (or QA Gatekeeper if different agent)

### 6. QA Gatekeeper Reviews PR

**QA Gatekeeper persona activates** and:

#### 6a. Code Review
- ✅ Follows SKILL.md guidelines
- ✅ No hardcoded values (uses variables)
- ✅ Proper commit message format
- ✅ Tests pass
- ✅ No security issues

#### 6b. Test on PR Branch
```bash
# Checkout PR branch
git fetch origin
git checkout bugfix/GH-123-related-articles-filter

# Test locally
bundle exec jekyll serve --livereload
# Verify fix works
# Check for regressions
```

#### 6c. Approve or Request Changes
**If approved:**
```markdown
✅ **LGTM** (Looks Good To Me)

Verified:
- [x] Fix resolves issue
- [x] No visual regressions
- [x] Tests pass
- [x] Follows design system

Approved for merge to main.
```

**If changes needed:**
```markdown
🔄 **Changes Requested**

Issues found:
- [ ] Issue 1 description
- [ ] Issue 2 description

Please address and re-request review.
```

### 7. Merge to Main (After Approval)

**QA Gatekeeper or repo owner:**
```bash
# On GitHub: Click "Merge Pull Request"
# Or via CLI:
git checkout main
git merge --no-ff bugfix/GH-123-related-articles-filter
git push origin main

# Delete branch
git branch -d bugfix/GH-123-related-articles-filter
git push origin --delete bugfix/GH-123-related-articles-filter
```

**GitHub Actions automatically:**
- Runs full test suite
- Builds Jekyll site
- Deploys to GitHub Pages (~2 minutes)

### 8. Verify on Production

**QA Gatekeeper verifies:**
```bash
# Wait for deployment (~2 minutes)
# Monitor: https://github.com/oviney/blog/actions

# Verify on production
open https://www.viney.ca/path/to/fixed-page

# Test at multiple breakpoints
# Check browser console (0 errors)
```

**Add comment to issue:**
```markdown
✅ **Verified on Production**

- Deployment: https://github.com/oviney/blog/actions/runs/XXXXX
- Tested on: https://www.viney.ca/...
- All acceptance criteria met
- No regressions detected

Closing issue. Thanks for the report!
```

### 9. Close Issue

Issue **auto-closes** when PR with `Closes #123` merges to main.

**If manual close needed:**
- Add final verification comment
- Close as "Completed"
- Add milestone if applicable

## Common Pitfalls

### Pitfall 1: Committing Directly to Main
**Problem**: Bypassing branch → PR → review workflow  
**Solution**: ALWAYS create feature branch, even for "quick fixes"  
**Why**: No code review, no rollback strategy, breaks production

### Pitfall 2: Not Linking Issue in Commit
**Problem**: Commit message missing `Closes #123`  
**Solution**: Always include `Closes #XXX` in commit body  
**Why**: Issue doesn't auto-close, tracking breaks

### Pitfall 3: Self-Approving PRs
**Problem**: Same agent reviews own code  
**Solution**: QA Gatekeeper reviews all PRs, even QA's own fixes  
**Why**: Catches mistakes, enforces quality standards

### Pitfall 4: Using docs/ISSUES.md Instead
**Problem**: Logging bugs in markdown file, not GitHub Issues  
**Solution**: ONLY use GitHub Issues for bug tracking  
**Why**: GitHub Issues has automation, labels, assignments, history

### Pitfall 5: Skipping Acceptance Criteria
**Problem**: Issue has no clear "done" definition  
**Solution**: QA Gatekeeper adds testable acceptance criteria during triage  
**Why**: Prevents scope creep, ensures complete fix

### Pitfall 6: No Production Verification
**Problem**: Marking done after merge, not verifying on live site  
**Solution**: QA Gatekeeper MUST verify on production before closing  
**Why**: Deployment can fail, fix might not work in prod environment

### Pitfall 7: Merged PR Without Tests Passing
**Problem**: Merging when GitHub Actions shows red X  
**Solution**: Wait for green checkmark, fix failing tests first  
**Why**: Broken builds reach production

## Code Snippets/Patterns

### Fetch GitHub Issue Details

```bash
# Get issue details via GitHub CLI
gh issue view 123

# Get issue details via API
curl -s https://api.github.com/repos/oviney/blog/issues/123 | jq '.title, .body, .labels[].name'

# List open issues with specific label
gh issue list --label "agent:creative-director" --state open
```

### Agent Invocation Commands

**User says** → **Agent action**:
- "Process issue #123" → Fetch issue, determine agent, start workflow
- "Show open P1 bugs" → Query GitHub, list P1 issues
- "Creative Director fix #123" → Adopt Creative Director persona, start Step 3
- "What bugs need QA Gatekeeper?" → List issues with agent:qa-gatekeeper label

### Quick Branch Creation

```bash
# From GitHub issue #123
ISSUE=123
DESC="related-articles-filter"
git checkout main && git pull && git checkout -b bugfix/GH-${ISSUE}-${DESC}
```

### Commit Template

```bash
git commit -m "fix(GH-123): filter related articles by category

- Added Liquid where_exp filter for category matching
- Excluded current post from results
- Falls back to other categories if < 6 available
- Tested on all article pages

Closes #123

[Creative Director]"
```

### PR Creation (via GitHub CLI)

```bash
gh pr create \
  --title "fix(GH-123): filter related articles by category" \
  --body "Fixes #123 - See commit message for details" \
  --label "bug,agent:creative-director,P1:high" \
  --reviewer oviney
```

### Quick Production Check

```bash
# After deployment completes
curl -s https://www.viney.ca/ | grep -i "error" && echo "❌ ERRORS FOUND" || echo "✅ NO ERRORS"
```

## GitHub Labels Setup

**PREREQUISITE**: GitHub repository must have these labels configured before workflow can function.

### Required Labels

**Priority Labels:**
```bash
gh label create "P1:high" --repo oviney/blog --color "d73a4a" --description "High priority - impacts core functionality or brand"
gh label create "P2:medium" --repo oviney/blog --color "fbca04" --description "Medium priority - important but not urgent"
gh label create "P3:low" --repo oviney/blog --color "0e8a16" --description "Low priority - nice to have improvements"
```

**Agent Labels:**
```bash
gh label create "agent:creative-director" --repo oviney/blog --color "5319e7" --description "Assigned to Creative Director (CSS/Layout/Design)"
gh label create "agent:qa-gatekeeper" --repo oviney/blog --color "1d76db" --description "Assigned to QA Gatekeeper (Testing/Quality/CI)"
gh label create "agent:editorial-manager" --repo oviney/blog --color "c5def5" --description "Assigned to Editorial Manager (Content/Writing/SEO)"
```

**Type Labels** (GitHub defaults):
- `bug` - Red
- `enhancement` - Feature request
- `documentation` - Doc updates
- `question` - Need clarification

### Verifying Labels
```bash
# List all labels
gh label list --repo oviney/blog

# Check if specific label exists
gh label list --repo oviney/blog | grep "P1:high"
```

**If labels are missing during triage:**
1. Agent should notify user
2. User/agent creates labels using commands above
3. Continue workflow

## Related Files

- [`docs/skills/economist-theme/SKILL.md`](../economist-theme/SKILL.md) - Creative Director skill
- [`docs/skills/jekyll-qa/SKILL.md`](../jekyll-qa/SKILL.md) - QA Gatekeeper skill  
- [`docs/skills/git-operations/SKILL.md`](../git-operations/SKILL.md) - Git workflow
- [`.github/workflows/jekyll.yml`](../../.github/workflows/jekyll.yml) - CI/CD pipeline
- [`docs/DEVELOPMENT_WORKFLOW.md`](../DEVELOPMENT_WORKFLOW.md) - Overall workflow

## Success Criteria

- [ ] Bug reported via GitHub Issue (not markdown file)
- [ ] QA Gatekeeper triaged within 1 hour
- [ ] Feature branch created (bugfix/GH-XXX)
- [ ] Fix implemented on branch (not main)
- [ ] All tests pass locally
- [ ] PR created with proper description
- [ ] Code review completed
- [ ] PR approved by QA Gatekeeper
- [ ] Merged to main after approval
- [ ] GitHub Actions deployment succeeded
- [ ] Verified on production (https://www.viney.ca/)
- [ ] Issue auto-closed or manually closed
- [ ] No rollbacks or hotfixes needed

## Example Workflow (End-to-End)

### Scenario: User logs bug, returns next day to fix it

**Day 1 (Evening):**
```
User browses blog → Notices related articles showing wrong posts
User goes to: https://github.com/oviney/blog/issues/new
User creates Issue #123:
  Title: "Related articles not filtered by category"
  Labels: bug, P1:high
  Description: [Full details]
User closes laptop
```

**Day 2 (Morning):**
```
User: "What P1 bugs are open?"

Agent (QA Gatekeeper activates):
  → Queries GitHub Issues
  → Lists: "#123 - Related articles not filtered by category (P1, bug, no agent assigned)"

User: "Process issue #123"

Agent (QA Gatekeeper):
  → Fetches issue details
  → Reproduces bug locally
  → Confirms it's a layout issue
  → Adds label: agent:creative-director
  → Comments on issue: "Confirmed. Assigning to Creative Director"

Agent (switches to Creative Director):
  → Reads docs/skills/economist-theme/SKILL.md
  → Creates branch: bugfix/GH-123-related-articles-filter
  → Implements fix in _layouts/post.html
  → Tests at all breakpoints
  → Commits with "Closes #123"
  → Pushes branch
  → Creates PR

Agent: "PR created: https://github.com/oviney/blog/pull/124. Ready for review."

User: Reviews PR → Approves

Agent (QA Gatekeeper):
  → Merges PR to main
  → Waits for GitHub Actions
  → Ve2.0** (2026-01-05): Added Sprint Orchestrator integration for backlog management, added planning triggers
- **1.rifies on production
  → Comments: "✅ Verified on production"
  → Issue auto-closes

DONE. Total time: ~15 minutes.
```

## Version History

- **1.1.0** (2026-01-05): Added clarifying questions step (Step 3), GitHub labels setup section, updated QA skill reference to jekyll-qa
- **1.0.0** (2026-01-05): Initial creation - Established GitHub Issues as single source of truth for bug tracking
