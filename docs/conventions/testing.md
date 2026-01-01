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

## Manual Testing Checklist

Before pushing changes:

- [ ] Run `jekyll serve` and verify local build
- [ ] Check homepage loads correctly
- [ ] Navigate to blog listing page
- [ ] Open a blog post and verify layout
- [ ] Test all navigation links
- [ ] Verify footer links work
- [ ] Check mobile responsive design
- [ ] Verify images display correctly
- [ ] Check browser console for errors
- [ ] Run pre-commit hook manually if needed

## Automated Testing Tools

- **Jekyll Build**: Built-in validation
- **HTMLProofer**: Link checking (can be added)
- **Pa11y**: Accessibility testing (can be added)
- **Lighthouse CI**: Performance testing (can be added)

## When Tests Fail

1. **Don't bypass checks** - fix the issue
2. **Don't use --no-verify** on git commits
3. Read error messages carefully
4. Fix root cause, not symptoms
5. Verify fix works before committing
6. Update documentation if needed
