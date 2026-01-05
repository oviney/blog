---
name: QA Gatekeeper - Testing & CI/CD Pipeline
description: Quality assurance workflow for PR reviews, CI pipeline monitoring, and production verification
version: 1.0.0
triggers:
  - PR created for bug fix or feature
  - Need to review code changes
  - Monitor GitHub Actions pipeline
  - Verify deployment to production
  - Close verified issues
---

## Context

The QA Gatekeeper is responsible for maintaining quality standards across the blog. This includes:
- Code review of Pull Requests
- Monitoring CI/CD pipeline (GitHub Actions)
- Testing deployments on production
- Verifying bug fixes and features
- Ensuring all changes follow skill guidelines

**GitHub Actions URL**: https://github.com/oviney/blog/actions
**Production URL**: https://www.viney.ca
**Jekyll Build Time**: ~30-60 seconds
**Deployment Time**: ~2 minutes after merge

## Step-by-Step Instructions

### 1. PR Review Process

When a PR is created (e.g., PR #35), QA Gatekeeper should:

#### 1a. Review PR Description
```bash
# View PR details
gh pr view 35 --repo oviney/blog
```

**Check:**
- [ ] References issue number (e.g., "Closes #33")
- [ ] Lists all changes made
- [ ] Includes testing checklist
- [ ] Has before/after screenshots (if visual)
- [ ] Meets acceptance criteria from issue

#### 1b. Code Review Checklist
- [ ] **Follows SKILL.md**: Check relevant skill file was followed
  - Creative Director: `docs/skills/economist-theme/SKILL.md`
  - Jekyll Dev: `docs/skills/jekyll-development/SKILL.md`
  - Git Ops: `docs/skills/git-operations/SKILL.md`
- [ ] **No hardcoded values**: Uses SCSS variables, not magic numbers
- [ ] **Proper commit format**: `fix(GH-XX): description\n\nCloses #XX`
- [ ] **Tests included**: If applicable
- [ ] **Security**: No exposed credentials, safe dependencies
- [ ] **Responsive**: Changes work at 320px, 768px, 1024px

#### 1c. Local Testing
```bash
# Fetch PR branch
gh pr checkout 35

# Or manually:
git fetch origin
git checkout bugfix/GH-33-blog-layout

# Test build
bundle exec jekyll build

# Visual testing
bundle exec jekyll serve --config _config_dev.yml --livereload
# Open http://localhost:4000
```

**Test at breakpoints:**
- 320px (mobile)
- 768px (tablet)
- 1024px (desktop)
- 1920px (large desktop)

**Check for regressions:**
- Other pages still work
- Navigation intact
- No console errors
- Images load properly
- Fonts render correctly

#### 1d. Provide Review Feedback

**If approved:**
```markdown
✅ **LGTM** (Looks Good To Me)

**Verified:**
- [x] Fix resolves issue #33
- [x] No visual regressions
- [x] Jekyll build passes
- [x] Tested at 320px, 768px, 1024px
- [x] Follows economist-theme SKILL.md
- [x] SCSS variables used (no hardcoded values)

**Approved for merge to main.**
```

**If changes needed:**
```markdown
🔄 **Changes Requested**

**Issues found:**
1. **Typography**: Title font-size should use variable, not hardcoded 1.75rem
   - Location: `_sass/economist-theme.scss:1120`
   - Fix: Use `$font-size-title` variable

2. **Responsive**: Layout breaks at 768px
   - Issue: Image width doesn't adjust
   - Expected: Should stack vertically at < 768px

**Please address and re-request review.**
```

### 2. Monitor CI/CD Pipeline

After PR is merged to `main`:

#### 2a. Watch GitHub Actions
```bash
# View recent workflow runs
gh run list --repo oviney/blog --limit 5

# Watch specific run (get ID from list)
gh run watch <run-id> --repo oviney/blog

# Or open in browser
open https://github.com/oviney/blog/actions
```

**Monitor these jobs:**
- ✅ **Build**: Jekyll site builds successfully
- ✅ **Test**: All tests pass (if applicable)
- ✅ **Deploy**: GitHub Pages deployment succeeds

**Expected timeline:**
- Build: ~30-60 seconds
- Deploy: ~1-2 minutes
- Total: ~2-3 minutes

#### 2b. Handle Pipeline Failures

**If build fails:**
```bash
# View logs
gh run view <run-id> --log --repo oviney/blog

# Common issues:
# - SCSS syntax error
# - Missing file reference
# - Liquid template error
# - Image file not found
```

**Action:**
1. Create new issue for pipeline failure
2. Label: `bug`, `ci/cd`, `P1:high`
3. Assign to agent who made changes
4. Include full error log

**If deploy fails:**
```bash
# Check GitHub Pages status
gh api repos/oviney/blog/pages

# Common issues:
# - GitHub Pages disabled
# - CNAME conflict
# - Build size > 1GB
```

### 3. Verify Production Deployment

After successful deployment:

#### 3a. Test on Production
```bash
# Open production site
open https://www.viney.ca/blog/

# Or use curl to check
curl -I https://www.viney.ca/blog/
```

**Verification checklist:**
- [ ] Page loads without errors
- [ ] Fix is visible (e.g., blog layout changed)
- [ ] Images load correctly
- [ ] CSS applied properly
- [ ] No 404 errors
- [ ] Mobile responsive works
- [ ] Links function correctly

#### 3b. Cross-browser Testing

**Desktop:**
- Chrome (latest)
- Safari (latest)
- Firefox (latest)

**Mobile (if layout change):**
- iOS Safari
- Chrome Mobile
- Firefox Mobile

**Tools:**
- BrowserStack (if available)
- Browser DevTools device emulation
- Real devices (preferred for final check)

#### 3c. Performance Check

```bash
# Run Lighthouse (if configured)
npm run lighthouse

# Check page load time
curl -w "@curl-format.txt" -o /dev/null -s https://www.viney.ca/blog/
```

**Thresholds:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### 4. Issue Verification & Closure

After production verification:

#### 4a. Add Verification Comment
```bash
gh issue comment 33 --repo oviney/blog --body "✅ **Verified on Production**

**Deployment**: https://www.viney.ca/blog/
**PR**: #35
**Commit**: 17cfa30

**Tested:**
- [x] Blog layout matches Economist design
- [x] Single-column layout with 1040px max-width
- [x] Date format: \"Jan 2nd 2026|X min read\"
- [x] Horizontal cards with 280px images
- [x] Borders between cards
- [x] Responsive at 320px, 768px, 1024px
- [x] Default gray image fallback works

**Browsers tested:**
- Chrome 120 ✅
- Safari 17 ✅
- Firefox 121 ✅
- iOS Safari ✅

All acceptance criteria met. Closing issue."
```

#### 4b. Close Issue
```bash
# Close with comment
gh issue close 33 --repo oviney/blog --comment "Fixed in PR #35, deployed to production, verified working."
```

**Or close via PR:**
- If commit message included `Closes #33`, GitHub auto-closes
- Verify issue shows "Closed" status

### 5. Update Skill Files (Self-Learning)

If new patterns or lessons learned:

#### 5a. Identify Learning Opportunity
- New edge case discovered
- Better approach found
- Common mistake to document
- Process improvement

#### 5b. Update Relevant SKILL.md
```bash
# Open skill file
code docs/skills/jekyll-qa/SKILL.md

# Add new section or update existing
# Increment version number
# Document date of change
```

**Version bump rules:**
- Patch (1.0.0 → 1.0.1): Minor clarification, typo fix
- Minor (1.0.0 → 1.1.0): New section, significant addition
- Major (1.0.0 → 2.0.0): Breaking change in process

#### 5c. Commit Skill Update
```bash
git add docs/skills/jekyll-qa/SKILL.md
git commit -m "docs: update jekyll-qa SKILL to v1.1.0

Added section on handling X scenario based on PR #35 learnings"
git push origin main
```

## Common Pitfalls

### Pitfall 1: Approving Without Local Testing
**Problem**: PR looks good in code review but breaks locally or on mobile
**Solution**: Always checkout branch and test locally, especially visual changes
**Example**: CSS looks fine but causes horizontal scroll on mobile

### Pitfall 2: Not Checking Related Pages
**Problem**: Fix works on target page but breaks other pages
**Solution**: Test at least 3 other pages (home, about, another article)
**Prevention**: Add regression test checklist to PR template

### Pitfall 3: Missing CI Pipeline Failure
**Problem**: Merge PR, don't watch pipeline, deployment fails silently
**Solution**: Always monitor GitHub Actions after merge until deploy succeeds
**Timeline**: Set 5-minute timer to check pipeline status

### Pitfall 4: Closing Issue Before Production Verification
**Problem**: Issue closed after PR merge, but deployment fails or bug still exists
**Solution**: Only close issues after verifying fix on production (viney.ca)
**Process**: Merge → Wait 2-3 min → Test production → Verify → Close

### Pitfall 5: Not Testing at All Breakpoints
**Problem**: Layout perfect on desktop, broken on mobile
**Solution**: Test every breakpoint in acceptance criteria (320px, 768px, 1024px)
**Tool**: Browser DevTools → Device Mode → Set specific widths

## Code Snippets/Patterns

### Quick PR Review Script
```bash
#!/bin/bash
# save as: scripts/review-pr.sh
PR_NUM=$1

echo "📋 Fetching PR #${PR_NUM}..."
gh pr view $PR_NUM --repo oviney/blog

echo "\n🔀 Checking out branch..."
gh pr checkout $PR_NUM

echo "\n🏗️  Building site..."
bundle exec jekyll build

if [ $? -eq 0 ]; then
  echo "\n✅ Build successful!"
  echo "\n🚀 Starting local server..."
  bundle exec jekyll serve --config _config_dev.yml --livereload
else
  echo "\n❌ Build failed!"
  exit 1
fi
```

**Usage**: `./scripts/review-pr.sh 35`

### Production Verification Checklist
```bash
# Quick production check
PROD_URL="https://www.viney.ca"
PAGE="/blog/"

# Check status
STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_URL}${PAGE})
echo "HTTP Status: ${STATUS}"

# Check response time
TIME=$(curl -s -o /dev/null -w "%{time_total}" ${PROD_URL}${PAGE})
echo "Response Time: ${TIME}s"

# Check for common errors
curl -s ${PROD_URL}${PAGE} | grep -i "error\|404\|500" || echo "✅ No errors found"
```

### CI Pipeline Status Check
```bash
# Get latest workflow run
LATEST_RUN=$(gh run list --repo oviney/blog --limit 1 --json databaseId,status,conclusion --jq '.[0]')

STATUS=$(echo $LATEST_RUN | jq -r '.status')
CONCLUSION=$(echo $LATEST_RUN | jq -r '.conclusion')

echo "Pipeline Status: ${STATUS}"
echo "Conclusion: ${CONCLUSION}"

if [[ "$CONCLUSION" == "success" ]]; then
  echo "✅ Pipeline passed!"
else
  echo "❌ Pipeline failed or in progress"
fi
```

## Related Files

- [`docs/skills/github-issues-workflow/SKILL.md`](../github-issues-workflow/SKILL.md) - Full bug workflow
- [`docs/skills/jekyll-development/SKILL.md`](../jekyll-development/SKILL.md) - Jekyll server operations
- [`docs/skills/economist-theme/SKILL.md`](../economist-theme/SKILL.md) - Design system guidelines
- [`.github/workflows/`](../../../.github/workflows/) - CI/CD configuration
- [`package.json`](../../../package.json) - Test scripts

## Success Criteria

**PR Review:**
- [ ] Code follows relevant SKILL.md guidelines
- [ ] No hardcoded values (uses variables)
- [ ] Tested locally at all breakpoints
- [ ] No regressions on other pages
- [ ] Proper commit message format
- [ ] Approval or change request provided

**Pipeline Monitoring:**
- [ ] Watched GitHub Actions until completion
- [ ] Build passed successfully
- [ ] Deployment succeeded
- [ ] No pipeline errors or warnings

**Production Verification:**
- [ ] Tested on production URL (viney.ca)
- [ ] Fix visible and working
- [ ] No visual regressions
- [ ] Mobile responsive works
- [ ] Cross-browser tested (3+ browsers)

**Issue Closure:**
- [ ] Verification comment added to issue
- [ ] All acceptance criteria met
- [ ] Production testing documented
- [ ] Issue closed with reference to PR

## Version History

- **1.0.0** (2026-01-05): Initial skill creation - QA Gatekeeper workflow for PR review, CI monitoring, and production verification
