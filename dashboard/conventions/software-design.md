# Software Design Conventions

## Principles

### Code Quality Standards
- **Code quality is of highest importance**. Rushing or taking shortcuts is never acceptable.
- Always prioritize readability and maintainability over cleverness
- Write code that is easy to understand and modify
- Follow the principle of least surprise

### Naming Conventions
- **No generic names**: Avoid `helper`, `utils`, `common`, `shared`, `core`
- Use domain-specific, descriptive names that reveal intent
- File and folder names should clearly indicate their purpose
- Variables and functions should be self-documenting

### File Organization
- Maximum file size: 300 lines (excluding comments and blank lines)
- Related functionality should be grouped together
- Each file should have a single, clear responsibility
- Keep directory structures flat and intuitive

### Code Complexity
- Maximum cyclomatic complexity per function: 10
- Maximum nesting depth: 3 levels
- Break down complex functions into smaller, focused functions
- Use early returns to reduce nesting

### Liquid Templates (Jekyll)
- Keep template logic simple and readable
- Extract complex logic into includes or plugins
- Use meaningful variable names in loops and conditionals
- Comment non-obvious template behavior

### SCSS/CSS
- Use variables for colors, spacing, and typography
- Follow BEM or similar naming convention for classes
- Keep selectors specific but not overly nested (max 3 levels)
- Group related styles together
- Use meaningful class names that describe content, not presentation

### Markdown Content
- Use consistent heading hierarchy
- Include alt text for all images
- Use relative URLs for internal links
- Keep paragraphs focused and scannable
- Front matter should be complete and accurate

## Standard Patterns

### Jekyll Layouts
```liquid
---
layout: parent-layout
---

<!-- Clear sections with semantic HTML -->
<article class="content-type">
  <header>
    <!-- Header content -->
  </header>
  
  <div class="main-content">
    {{ content }}
  </div>
  
  <footer>
    <!-- Footer content -->
  </footer>
</article>
```

### SCSS Structure
```scss
// 1. Variables and configuration
$variable-name: value;

// 2. Mixins and functions
@mixin mixin-name() { }

// 3. Base styles
.component-name {
  // Layout
  // Visual
  // Typography
  // Behavior
}

// 4. Responsive overrides
@media (min-width: breakpoint) { }
```

### Configuration Files
- Keep configuration files minimal and well-documented
- Use comments to explain non-obvious settings
- Group related settings together
- Validate configuration in pre-commit hooks

## Anti-Patterns to Avoid

### Naming Anti-Patterns
- ❌ `helper.scss`, `utils.scss`, `common.scss`
- ❌ Generic variable names like `$temp`, `$data`, `$value`
- ❌ Abbreviated names that aren't obvious: `$btn`, `$txt`, `$img`

### Structure Anti-Patterns
- ❌ Deeply nested directories (>4 levels)
- ❌ Files over 300 lines
- ❌ Mixing concerns in a single file
- ❌ Duplicate code instead of reusable includes

### CSS Anti-Patterns
- ❌ Overly specific selectors: `.page .section .container .item .link`
- ❌ !important flags (except for utilities)
- ❌ Magic numbers without explanation
- ❌ Inline styles in HTML

### Liquid Anti-Patterns
- ❌ Complex logic in templates (move to includes/plugins)
- ❌ Deeply nested conditionals (>2 levels)
- ❌ Hardcoded values (use site variables)
- ❌ Repeated template code (create includes)

## Review Checklist

Before considering code complete:

- [ ] All code follows naming conventions
- [ ] No generic folder/file names used
- [ ] File sizes are under 300 lines
- [ ] Complexity is under limits (nesting ≤3, complexity ≤10)
- [ ] SCSS variables used for all magic numbers
- [ ] All images have alt text
- [ ] No hardcoded URLs or paths
- [ ] Front matter is complete and accurate
- [ ] Pre-commit hooks pass
- [ ] Jekyll builds without warnings
