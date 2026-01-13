# Testing Conventions

## Testing Philosophy

**Quality is non-negotiable.** Every piece of functionality must be tested and verified before deployment.

## Jekyll Site Testing

### Build Verification
- Jekyll must build without errors or warnings
- All internal links must be valid
- All images must exist and be accessible
- Front matter must be valid YAML

### Content Quality Checks
- [ ] All posts have required front matter (title, date, categories)
- [ ] All posts have excerpts defined
- [ ] Featured images exist for all posts
- [ ] No broken internal links
- [ ] No broken external links (optional but recommended)
- [ ] Dates are not in the future (unless explicitly draft)
- [ ] All markdown is valid

### Visual Testing
- [ ] All pages render correctly in development
- [ ] Responsive design works at all breakpoints (mobile, tablet, desktop)
- [ ] Images load and display correctly
- [ ] Typography is readable and consistent
- [ ] Colors match design system

### Performance Testing
- [ ] Page load times are acceptable (<3s)
- [ ] Images are optimized
- [ ] No console errors in browser
- [ ] CSS is minified in production
- [ ] Google Lighthouse score >90

## Pre-commit Validation

The pre-commit hook must validate:

1. **YAML Front Matter**
   - Valid YAML syntax
   - Required fields present
   - Date format correct

2. **Jekyll Build**
   - Site builds successfully
   - No warnings or errors
   - Generated HTML is valid

3. **Link Checking**
   - Internal links are valid
   - Images exist
   - No orphaned pages

4. **Code Quality**
   - SCSS compiles without errors
   - No syntax errors in Liquid templates
   - File sizes under limits

## Continuous Integration

GitHub Actions must:

1. **Build Test**
   - Jekyll builds successfully
   - All dependencies resolve
   - No deprecation warnings

2. **Deployment Test**
   - Pages deploy without errors
   - Site is accessible after deployment
   - No broken links in production

## Testing New Features

When adding new functionality:

1. Test in development environment first
2. Verify responsive design
3. Check browser console for errors
4. Test with actual content (not just Lorem Ipsum)
5. Verify accessibility (keyboard navigation, screen readers)
6. Test in multiple browsers
7. Commit only after all checks pass

## Required Tests for Each Change

### For Layout/Design Changes
1. **Visual Regression**: Take before/after screenshots
2. **Responsive Testing**: Test at 320px, 768px, 1024px, 1920px
3. **Browser Testing**: Chrome, Safari, Firefox
4. **Print Styles**: Check print preview if applicable

### For Content Changes
1. **Build Verification**: Jekyll builds successfully
2. **Link Validation**: All internal/external links work
3. **Image Validation**: All images load and have alt text
4. **Front Matter**: Required fields present and valid

### For SCSS/CSS Changes
1. **No Deprecation Warnings**: Build must be clean
2. **File Size Check**: CSS under reasonable size (<300KB)
3. **Selector Nesting**: Max 3 levels deep
4. **Visual Verification**: Affected pages render correctly

### For Template/Layout Changes
1. **All Post Types**: Test with actual post content
2. **Edge Cases**: Empty fields, long titles, no images
3. **Accessibility**: Keyboard navigation, semantic HTML
4. **Console Errors**: Browser console clean

## Manual Testing Checklist

Before pushing changes:

- [ ] Run `jekyll serve` and verify local build
- [ ] Check homepage loads correctly
- [ ] Navigate to blog listing page
- [ ] Open a blog post and verify layout
- [ ] Test all navigation links
- [ ] Verify footer links work
- [ ] Test at mobile (375px), tablet (768px), desktop (1920px)
- [ ] Verify images display correctly
- [ ] Check browser console for errors (0 errors required)
- [ ] Take screenshots for documentation
- [ ] Run pre-commit hook manually if needed
- [ ] Verify in at least 2 browsers

## Automated Testing Tools

### Currently Implemented
- **Jekyll Build**: Built-in validation
- **Pre-commit Hook**: YAML, build, links, front matter
- **GitHub Actions**: CI/CD deployment pipeline

### Available for Enhancement
- **HTMLProofer**: Comprehensive link checking
- **Pa11y**: Accessibility testing (WCAG compliance)
- **Lighthouse CI**: Performance metrics tracking
- **Percy/Chromatic**: Visual regression testing
- **axe-core**: Automated accessibility testing

### Testing Priority

## Testing Workflow Summary

```
Before Commit:
├── Make changes
├── Test locally (jekyll serve)
├── Visual verification
├── Responsive testing (mobile, tablet, desktop)
├── Browser console check (0 errors)
├── Stage changes (git add)
└── Commit (pre-commit hook runs automatically)

After Push:
├── GitHub Actions runs
├── Jekyll builds on CI
├── Deploys to GitHub Pages
└── Verify production site

For Major Changes:
├── Create branch
├── Make changes + test
├── Take screenshots
├── Create PR
├── Review + merge
└── Verify production
```

## Documentation Requirements

When publishing changes, document:
- What was changed and why
- Screenshots (before/after for visual changes)
- Test results (which devices/browsers tested)
- Any known issues or limitations
- Link to GitHub issue/PR
1. **Must Have** (Current): Build validation, link checking
2. **Should Have** (Recommended): Visual regression, responsive testing
3. **Nice to Have**: Performance monitoring, accessibility audits

## When Tests Fail

1. **Don't bypass checks** - fix the issue
2. **Don't use --no-verify** on git commits
3. Read error messages carefully
4. Fix root cause, not symptoms
5. Verify fix works before committing
6. Update documentation if needed
