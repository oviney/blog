# Codebase Structure

## Directory Organization

```
economist-blog-v5/
├── _config.yml              # Jekyll configuration
├── _config_dev.yml          # Development overrides
├── Gemfile                  # Ruby dependencies
├── README.md                # Project overview
├── CHANGELOG.md             # Version history
│
├── _layouts/                # Page templates
│   ├── default.html         # Base layout
│   └── post.html            # Article layout
│
├── _sass/                   # SCSS source files
│   ├── economist-theme.scss # Main theme styles
│   ├── variables.scss       # Design tokens
│   └── normalize.scss       # CSS reset
│
├── assets/
│   ├── css/
│   │   └── styles.scss      # Main stylesheet
│   ├── charts/              # Data visualizations
│   └── images/              # Static images
│
├── _posts/                  # Blog posts
│   └── YYYY-MM-DD-title.md
│
├── _drafts/                 # Unpublished posts
│
├── _data/                   # Site data
│   └── navigation.yml       # Menu structure
│
├── _authors/                # Author profiles
│
├── docs/                    # Documentation
│   ├── conventions/         # Code standards
│   ├── CURRENT_STATE.md     # Project status
│   ├── DEVELOPMENT_WORKFLOW.md
│   └── MIGRATION_LOG.md
│
├── .github/
│   └── workflows/           # CI/CD pipelines
│       └── jekyll.yml
│
├── .git/
│   └── hooks/               # Git hooks
│       └── pre-commit       # Pre-commit validation
│
└── _site/                   # Generated output (ignored)
```

## File Naming Conventions

### Posts
- Format: `YYYY-MM-DD-title-with-hyphens.md`
- Use lowercase
- Use hyphens, not underscores
- Keep titles concise but descriptive

### SCSS Files
- Use lowercase with hyphens
- Descriptive names: `article-layout.scss`, not `al.scss`
- Partial files start with underscore: `_variables.scss`

### Images
- Use lowercase with hyphens
- Include context in name: `testing-times-chart.png`
- Not: `img1.png`, `chart.png`

## Module Boundaries

### Layouts (_layouts/)
**Purpose**: HTML structure and page templates

**Rules**:
- Layouts should extend other layouts via front matter
- Keep Liquid logic minimal
- Extract reusable components to includes
- No business logic in templates

### Styles (_sass/)
**Purpose**: Visual styling and design system

**Rules**:
- One component per file when appropriate
- Variables in separate `_variables.scss`
- No hardcoded values (use variables)
- No overly specific selectors

### Content (_posts/, _drafts/)
**Purpose**: Blog articles and content

**Rules**:
- All posts must have valid front matter
- Use categories consistently
- Include excerpts
- Reference images from assets/

### Documentation (docs/)
**Purpose**: Project documentation and conventions

**Rules**:
- Keep docs up-to-date
- Document all major decisions
- Include examples in conventions
- Reference docs in README

## Dependency Rules

### Allowed Dependencies
- Layouts → Includes
- SCSS files → Variables
- Posts → Assets
- Any → Documentation

### Forbidden Dependencies
- Posts ❌→ Layouts (handled by Jekyll)
- Layouts ❌→ Posts (use site.posts)
- SCSS ❌→ Posts
- Documentation ❌→ Implementation (docs describe, not use)

## Adding New Files

### Before adding a new file, ask:
1. Does this belong in an existing file?
2. Is the name descriptive and domain-specific?
3. Does it follow naming conventions?
4. Is it in the correct directory?
5. Does it maintain clear boundaries?

### When creating new directories:
1. Only create if >3 related files
2. Use domain-specific names
3. Document purpose in README or comments
4. Avoid generic names (utils, helpers, common)

## Cohesion Guidelines

### High cohesion (good):
- All styles for article layout in one file
- All posts in _posts/
- All documentation in docs/
- Related variables grouped together

### Low cohesion (bad):
- Random SCSS scattered across files
- Posts in multiple directories
- Configuration in multiple locations
- Styles mixed with templates

## Code Location Decision Tree

```
Where should this code go?

Is it a blog post?
├─ YES → _posts/ or _drafts/
└─ NO ↓

Is it styling?
├─ YES → _sass/
└─ NO ↓

Is it HTML structure?
├─ YES → _layouts/ or _includes/
└─ NO ↓

Is it site configuration?
├─ YES → _config.yml or _data/
└─ NO ↓

Is it documentation?
├─ YES → docs/
└─ NO ↓

Is it static content?
└─ YES → assets/
```

## Refactoring Guidelines

When you notice:
- Files growing >300 lines → Split into focused modules
- Duplicate code → Extract to include or mixin
- Generic names → Rename to domain-specific
- Mixed concerns → Separate into appropriate directories
- Deep nesting → Flatten structure

## Review Questions

For every new or modified file:
- [ ] Is it in the correct directory?
- [ ] Does the name clearly indicate its purpose?
- [ ] Does it respect module boundaries?
- [ ] Is it cohesive (single responsibility)?
- [ ] Does it follow naming conventions?
- [ ] Is it properly documented?
