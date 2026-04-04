---
applyTo: "_sass/**/*.scss,assets/css/**/*.scss"
---

# SCSS Conventions — Economist Design System

## Single Source of Truth

All styles live in `_sass/economist-theme.scss` (600+ lines).  
Read that file before adding new rules to understand existing selectors and patterns.

## Variables — Never Hardcode

Always use variables. Never write raw hex colors, pixel sizes, or font names.

```scss
// Colors
$economist-red: #E3120B;   // Accent only — header banner, links, CTAs
$text-black:    #1a1a1a;   // Primary text
$text-gray:     #666;      // Metadata, secondary text
$border-gray:   #ddd;      // Subtle borders
$bg-light:      #f9f9f9;   // Subtle backgrounds

// Spacing (use multiples of $spacing-unit)
$spacing-unit: 16px;
// 0.5× = 8px  |  1× = 16px  |  1.5× = 24px  |  2× = 32px  |  4× = 64px

// Typography
// Serif → body content: 'Merriweather', Georgia, serif
// Sans  → UI elements:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif
```

## Typography Rules

- **Body / article content** → Merriweather (serif)
- **Navigation, metadata, labels, UI** → Inter (sans-serif)
- Never introduce a third font family

## Color Rules

- `$economist-red` is for **accents only** (header banner, key links, CTAs)
- Category labels use `$text-gray`, not red
- Do not make red the dominant color on any page

## Standard Component Structure

```scss
.component-name {
  // 1. Layout
  display: block;
  max-width: 1040px;
  margin: 0 auto;
  padding: $spacing-unit * 2;

  // 2. Typography
  font-family: 'Merriweather', serif;
  font-size: 18px;
  line-height: 1.8;
  color: $text-black;

  // 3. Visual styling
  background: $bg-light;
  border-top: 1px solid $border-gray;

  // 4. Responsive overrides (inside the block)
  @media (min-width: 768px) {
    padding: $spacing-unit * 3;
  }
}
```

## Responsive Breakpoints (Mobile-First)

```scss
.component {
  // Base — 320px+ (mobile)
  padding: $spacing-unit;

  @media (min-width: 768px) {
    // Tablet
    padding: $spacing-unit * 1.5;
  }

  @media (min-width: 1024px) {
    // Desktop
    padding: $spacing-unit * 2;
  }
}
```

Always validate changes at **320 px, 768 px, 1024 px, and 1920 px**.

## Selector Nesting

Maximum **3 levels** of nesting. Flatten deep selectors into named classes.

```scss
// Good
.article-card { }
.article-card__title { }

// Bad — 5 levels deep
.page .section .container .item .link { }
```

## Hover & Transition

```scss
.card {
  transition: background-color 0.2s ease;

  &:hover {
    background: $bg-light;  // Subtle highlight only
  }
}
```

## Common Patterns

### Article card
```scss
.article-card {
  border-top: 1px solid $border-gray;
  padding: $spacing-unit * 2 0;

  &:hover {
    background: $bg-light;
  }
}
```

### Category label
```scss
.category {
  color: $text-gray;          // NOT red
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### Site header (red banner)
```scss
.site-header {
  background: $economist-red;
  color: white;
  padding: $spacing-unit 0;
}
```

## Checklist Before Committing

- [ ] No hardcoded colors, spacing, or font names — variables only
- [ ] Max 3 levels of selector nesting
- [ ] Tested at 320 px, 768 px, 1024 px, 1920 px
- [ ] Red used sparingly (accents only)
- [ ] Serif for body, sans-serif for UI — no third font
- [ ] No visual regressions on other pages
- [ ] Browser console shows 0 errors
