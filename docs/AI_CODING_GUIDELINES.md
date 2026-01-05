# AI Coding Assistant Guidelines

This file provides guidance for AI coding assistants (like GitHub Copilot, Claude, etc.) working on this codebase.

## 🧠 AI Skills & Memory

**IMPORTANT**: Before starting any task, check [`docs/skills/`](skills/) for relevant `SKILL.md` files. These contain learned patterns, known solutions, and best practices specific to this codebase.

**Knowledge Persistence Rule**:
- If you learn a new pattern or fix a recurring bug, you MUST create or update a skill file to persist that knowledge.
- Use the template at [`docs/skills/_template/SKILL.md`](skills/_template/SKILL.md).
- Skills are version-controlled and shared across sessions.

**Existing Skills**:
- [`jekyll-development/SKILL.md`](skills/jekyll-development/SKILL.md) - Complete Jekyll development workflow
- [`economist-theme/SKILL.md`](skills/economist-theme/SKILL.md) - Economist theme design system guidelines

## Core Principles

**Code quality is of highest importance. Rushing or taking shortcuts is never acceptable.**

When writing, editing, refactoring, or reviewing code:
- Always follow `docs/conventions/software-design.md`
- Look for standard implementation patterns in `docs/conventions/standard-patterns.md`
- Avoid patterns listed in `docs/conventions/anti-patterns.md`
- Respect the codebase structure defined in `docs/conventions/codebase-structure.md`
- Follow testing conventions in `docs/conventions/testing.md`

## Project Context

This is a Jekyll-based blog with an Economist-inspired design theme. The site generates static HTML from Markdown content and SCSS styles.

**Key technologies:**
- Jekyll 4.3.2
- Liquid templating
- SCSS/CSS
- Markdown
- GitHub Actions for CI/CD
- GitHub Pages for hosting

## Before Making Changes

1. **Understand the context**: Read relevant documentation
2. **Check existing patterns**: Look for similar implementations
3. **Verify requirements**: Ensure you understand what's needed
4. **Plan the approach**: Think through the solution before coding

## Coding Standards

### Naming
- ❌ **NEVER use**: `helper`, `utils`, `common`, `shared`, `core`, `misc`, `temp`
- ✅ **DO use**: Domain-specific, descriptive names

### File Size Limits
- **Maximum 300 lines** per file (excluding comments/blank lines)
- If exceeded, split into focused modules

### Complexity Limits
- **Maximum nesting depth**: 3 levels
- **Maximum cyclomatic complexity**: 10 per function
- Break complex logic into smaller functions

### SCSS Guidelines
- Use variables from `_sass/variables.scss`
- Follow the pattern in `_sass/economist-theme.scss`
- No magic numbers - use variables
- Max selector nesting: 3 levels
- Group related styles together

### Liquid Templates
- Keep logic simple and readable
- Extract complex logic to includes
- Use meaningful variable names
- Comment non-obvious behavior

## When Writing Code

### DO:
- ✅ Use descriptive, domain-specific names
- ✅ Keep functions small and focused
- ✅ Write self-documenting code
- ✅ Add comments for complex logic
- ✅ Follow existing patterns
- ✅ Test your changes locally
- ✅ Run pre-commit hooks

### DON'T:
- ❌ Bypass git hooks with `--no-verify`
- ❌ Use generic names
- ❌ Create deeply nested code
- ❌ Write files over 300 lines
- ❌ Hardcode values (use variables)
- ❌ Skip testing
- ❌ Rush the implementation

## Testing

Before committing:
1. Run `jekyll serve` and verify the site builds
2. Check the output in browser
3. Verify responsive design
4. Check browser console for errors
5. Run pre-commit hooks
6. Verify all checks pass

**Never bypass failing checks.** Fix the underlying issue.

## Common Tasks

### Adding a new blog post
1. Create file in `_posts/` with format `YYYY-MM-DD-title.md`
2. Add required front matter (see existing posts)
3. Write content in Markdown
4. Add featured image to `assets/images/`
5. Reference image in front matter
6. Test locally before committing

### Modifying styles
1. Locate the relevant SCSS file in `_sass/`
2. Use existing variables when possible
3. Follow BEM-like naming for new classes
4. Keep selectors specific but not over-nested
5. Test responsive behavior
6. Verify no broken styles

### Creating a new layout
1. Add to `_layouts/` directory
2. Extend existing layout with front matter
3. Use semantic HTML5 elements
4. Keep Liquid logic minimal
5. Extract reusable parts to includes
6. Test with actual content

### Adding a feature
1. Check if similar functionality exists
2. Plan the implementation approach
3. Follow existing architectural patterns
4. Keep changes focused and atomic
5. Update documentation if needed
6. Test thoroughly before committing

## Git Workflow

1. **Make changes** following conventions
2. **Test locally** - verify everything works
3. **Stage changes** - review what you're committing
4. **Run pre-commit** - hooks will automatically run
5. **Fix any issues** - don't bypass checks
6. **Commit** - with clear, descriptive message
7. **Push** - GitHub Actions will deploy

## Error Handling

When encountering errors:
1. Read the error message carefully
2. Check the file and line number indicated
3. Review recent changes that might have caused it
4. Fix the root cause, not just the symptom
5. Verify the fix resolves the issue
6. Don't use workarounds that bypass checks

## Documentation

When making significant changes:
- Update `docs/CURRENT_STATE.md`
- Update `CHANGELOG.md`
- Add/update relevant convention docs
- Include examples in documentation
- Keep docs in sync with code

## Questions to Ask Yourself

Before committing:
- [ ] Does this follow naming conventions?
- [ ] Is the code under complexity limits?
- [ ] Are there any generic names?
- [ ] Is the file under 300 lines?
- [ ] Did I use variables instead of magic numbers?
- [ ] Is the code well-organized?
- [ ] Did I test this locally?
- [ ] Do all checks pass?
- [ ] Is the code self-documenting?
- [ ] Did I update documentation if needed?

## Remember

- **Quality over speed** - take time to do it right
- **Follow patterns** - maintain consistency
- **Test thoroughly** - don't skip verification
- **Document clearly** - help future maintainers
- **Respect conventions** - they exist for good reasons

## Getting Help

If unsure about something:
1. Check existing code for examples
2. Review documentation in `docs/`
3. Look at recent commits for context
4. Read Jekyll documentation
5. Ask for clarification before proceeding
