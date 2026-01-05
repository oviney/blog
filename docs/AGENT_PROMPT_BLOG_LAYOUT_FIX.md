# Agent Prompt: Fix Blog Layout to Match Economist Design

## Task

Fix the `/blog` page layout to exactly match The Economist's topic page design. The current implementation doesn't match the professional styling, spacing, typography, or layout structure.

**Reference URL:** https://www.economist.com/topics/artificial-intelligence

**Objective:** Make `/blog` look identical to the Economist's topic pages with the same columns, width, margins, fonts, spacing, and visual hierarchy.

## Before You Start

### Start the Jekyll Server (rbenv + zsh)

```bash
cd /Users/ouray.viney/code/economist-blog-v5
bundle update --bundler  # Fix any bundler version issues
bundle install
bundle exec jekyll serve --config _config_dev.yml --livereload
```

- Local URL: http://localhost:4000/blog/
- Live reload is enabled - CSS changes auto-refresh

**CRITICAL:** Config file changes (`_config_dev.yml` or `_config.yml`) require a full server restart. Stop the server (Ctrl+C) and restart it. CSS/content changes auto-reload, but config changes don't.

### Required Dev Config

Ensure `_config_dev.yml` includes:

```yaml
title: Ouray Viney's blog  # Required for site title to render
url: "http://127.0.0.1:4000/"
google_analytics:  # Empty to disable in dev
```

### If Port 4000 is Busy

```bash
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
```

## Design Specifications (From Economist Reference)

Compare your work against: https://www.economist.com/topics/artificial-intelligence

### Layout Structure

- **Container width:** ~1040px max-width, centered with auto margins
- **Page padding:** Moderate horizontal padding (24-32px), generous vertical (48px)
- **Card layout:** Single column, full-width cards
- **Card spacing:** Large gaps between articles (48-64px)
- **Card separators:** 1px solid border between cards, NO border on last card
- **Bottom padding:** Each card has ~48px bottom padding

### Typography Hierarchy (Critical to Match)

1. **Page Title**
   - Font: Serif (Merriweather/Georgia)
   - Size: ~44px (2.75rem)
   - Weight: 400 (normal)
   - Line height: 1.15
   - Color: Primary black
   - Letter spacing: -0.02em (tight)

2. **Page Description**
   - Font: Serif
   - Size: ~18px (1.125rem)
   - Weight: 400
   - Color: Secondary gray
   - Line height: 1.5

3. **Category Label** (above title)
   - Font: Sans-serif (Inter)
   - Size: ~11px (0.6875rem)
   - Weight: 600
   - Color: Secondary gray (NOT red)
   - Text transform: uppercase
   - Letter spacing: 0.08em

4. **Article Title**
   - Font: Serif
   - Size: ~28px (1.75rem)
   - Weight: 700 (bold)
   - Color: Black
   - Line height: 1.25
   - Letter spacing: -0.01em
   - Hover: Changes to Economist red
   - NO underline

5. **Article Excerpt**
   - Font: Serif
   - Size: ~17px (1.0625rem)
   - Weight: 400
   - Color: Secondary gray
   - Line height: 1.6

6. **Metadata** (reading time)
   - Font: Sans-serif
   - Size: ~13px (0.8125rem)
   - Color: Tertiary gray
   - Bullet separator between items

### Image Treatment

- **Aspect ratio:** 16:9 (not fixed height!)
- **Width:** 100% of container
- **Margin bottom:** ~24px (1.5rem)
- **Border radius:** 0 (sharp corners)
- **Hover effect:** Subtle scale (1.02x)
- **Object fit:** cover

### Visual Details

- Clean white background
- 1px solid light gray borders between cards (#E1E4E8)
- Generous white space (don't cramp content)
- Subtle hover states (opacity or color change)
- Professional, editorial feel

### Color Palette

- Economist red: #E3120B
- Primary text: #1a1a1a
- Secondary text: #4d4d4d
- Tertiary text: #767676
- Border: #E1E4E8
- Background: #ffffff

## Files to Modify

### Primary File: `_sass/economist-theme.scss`

Look for the "TOPIC PAGE (BLOG INDEX)" section (around line 1014-1205). Update these classes:

- `.topic-page` - Container and padding
- `.topic-header` - Page header styling
- `.topic-title` - Main page title
- `.topic-description` - Subtitle
- `.topic-grid` - Article grid layout
- `.topic-card` - Individual article cards
- `.topic-card-image` - Image containers
- `.topic-card-content` - Content padding
- `.topic-category` - Category labels
- `.topic-card-title` - Article titles
- `.topic-card-excerpt` - Excerpt text
- `.topic-card-meta` - Reading time/metadata

### Secondary File: `blog.html`

The HTML structure is already correct. Only modify if you need to change the markup to achieve the design.

## Step-by-Step Workflow

1. **Open reference in browser:** https://www.economist.com/topics/artificial-intelligence
2. **Open your blog:** http://localhost:4000/blog/
3. **Compare side-by-side** (use browser inspector to measure)
4. **Update CSS** in `_sass/economist-theme.scss`
5. **Save and auto-refresh** (live reload)
6. **Iterate** until pixel-perfect
7. **Test responsive** (resize browser to mobile)
8. **Validate** against checklist below

## Success Criteria

Check these requirements are met:

- [ ] Container width is ~1040px and centered
- [ ] Page title is ~44px serif, weight 400, tight letter-spacing
- [ ] Category labels are GRAY (not red), small sans-serif, uppercase
- [ ] Article titles are ~28px serif, bold, hover to red, no underline
- [ ] Excerpts are ~17px serif, gray color, readable line-height
- [ ] Images use 16:9 aspect ratio (not fixed px height)
- [ ] Spacing between cards is generous (~48-64px)
- [ ] 1px borders between cards, NO border on last card
- [ ] Metadata uses small sans-serif with bullet separators
- [ ] Overall spacing matches Economist's generous white space
- [ ] Typography hierarchy feels professional and editorial
- [ ] Hover effects are subtle and smooth
- [ ] Responsive design works on mobile (test at 768px and below)
- [ ] No visual regressions on other pages

## Key Points to Remember

1. **Don't use fixed heights** for images - use aspect-ratio or padding-bottom hack
2. **Category labels should be gray**, not red - subtle, not attention-grabbing
3. **Generous white space** is key - don't cramp the content
4. **Font weights matter** - Title is 400, article titles are 700
5. **Letter spacing** - Tighten on large headings, expand on small caps
6. **The last card** should NOT have a bottom border
7. **Compare frequently** - Keep the Economist page open for reference

## Testing

After making changes:

```bash
# View your blog
open http://localhost:4000/blog/

# View reference side-by-side
open https://www.economist.com/topics/artificial-intelligence
```

Use browser dev tools to:
- Measure exact spacing
- Check font sizes
- Verify colors match
- Test responsive breakpoints

## Expected Output

When complete, the `/blog` page should look professional and editorial, matching The Economist's visual language precisely. The layout should feel spacious, elegant, and easy to scan with clear visual hierarchy.

## Questions or Issues?

If you encounter problems:
1. Check terminal for Jekyll build errors
2. Clear browser cache if styles don't update
3. Verify you're editing the correct SCSS file
4. Use browser inspector to debug CSS specificity issues
5. Test in multiple browsers if something looks off
