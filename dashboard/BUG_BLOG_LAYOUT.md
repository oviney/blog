# Bug: Blog Layout Doesn't Match Economist Design

## Issue Description

The `/blog` page layout does not match the professional styling of The Economist's topic pages. The current implementation needs refinement to match the exact layout, column widths, margins, fonts, and spacing.

**Reference:** https://www.economist.com/topics/artificial-intelligence

## Current Problems

1. **Layout & Spacing:** Content width, margins, and padding don't match Economist's centered, professional layout
2. **Typography:** Font sizes, weights, and hierarchy need adjustment to match Economist's elegant style
3. **Card Design:** Article cards need tighter spacing and cleaner visual hierarchy
4. **Image Sizing:** Images should use aspect ratio instead of fixed heights
5. **Vertical Rhythm:** Spacing between elements needs to match Economist's generous white space

## Expected Design (from Economist)

### Layout Specifications
- **Max content width:** ~1040px centered
- **Page padding:** Consistent left/right margins
- **Card spacing:** Generous vertical gaps (~48-64px) between articles
- **Bottom borders:** 1px solid between cards, none on last card

### Typography Hierarchy
- **Page title:** Large serif font (~44px), regular weight, tight line-height
- **Page description:** Serif, ~18px, lighter color
- **Category label:** Small sans-serif, uppercase, medium gray, tight letter-spacing
- **Article title:** Serif, ~28px, bold, tight line-height, hover → red
- **Article excerpt:** Serif, ~17px, gray, comfortable line-height
- **Metadata:** Small sans-serif (~13px), light gray

### Visual Details
- Images use 16:9 aspect ratio, no fixed heights
- Category labels above titles, not red but gray
- Clean borders separating articles
- Subtle hover effects
- Professional color palette with Economist red accents

## How to Start Jekyll Server

### Environment Setup (rbenv + zsh)

**IMPORTANT:** The commands work with rbenv and zsh. The system will automatically use the correct Ruby version and bundler through rbenv.

```bash
# Navigate to project directory
cd /Users/ouray.viney/code/economist-blog-v5

# Update bundler if needed
bundle update --bundler

# Install dependencies
bundle install

# Start Jekyll server with dev config and live reload
bundle exec jekyll serve --config _config_dev.yml --livereload
```

Note: If you get a bundler version error, just run the commands in order above - rbenv will handle the Ruby/gem environment automatically.

### IMPORTANT: Config Changes Require Server Restart

**Jekyll does NOT auto-reload config file changes.** If you modify `_config_dev.yml` or `_config.yml`:

1. Stop the server (Ctrl+C)
2. Restart with: `bundle exec jekyll serve --config _config_dev.yml --livereload`

CSS/SCSS changes and content changes will auto-reload, but config changes won't.

### Configuration Note

The `_config_dev.yml` file overrides settings from `_config.yml` for local development. Key fields that should be in `_config_dev.yml`:

```yaml
title: Ouray Viney's blog
url: "http://127.0.0.1:4000/"
google_analytics:  # Empty to disable in dev
```

If `title` is missing from dev config, the site title won't render in templates.

# If bundler version mismatch occurs, update it
bundle update --bundler

# Install/update dependencies
bundle install

# Start Jekyll server with dev config and live reload
bundle exec jekyll serve --config _config_dev.yml --livereload
```

### Server Details
- **Local URL:** http://localhost:4000
- **Blog page:** http://localhost:4000/blog/
- **Live reload:** Enabled (auto-refresh on file changes)
- **Config:** Uses `_config_dev.yml` for development

### Troubleshooting

**Problem:** `Could not find 'bundler' (X.X.X) required by Gemfile.lock`
```bash
bundle update --bundler
# or
gem install bundler:X.X.X
```

**Problem:** Port 4000 already in use
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

# Then restart server
bundle exec jekyll serve --config _config_dev.yml --livereload
```

**Problem:** Jekyll not found
```bash
# Reinstall gems
bundle install
```

## Files to Modify

- **Layout:** `blog.html` - Main blog archive template
- **Styles:** `_sass/economist-theme.scss` - Topic page styles (lines ~1014-1205)
- **Config:** `_config_dev.yml` - Development configuration

## Testing Checklist

- [ ] Layout width matches (~1040px centered)
- [ ] Font sizes match Economist hierarchy
- [ ] Spacing between cards matches (~48-64px)
- [ ] Image aspect ratios are 16:9
- [ ] Category labels are gray, not red
- [ ] Borders appear correctly between cards
- [ ] Hover effects work smoothly
- [ ] Responsive design works on mobile
- [ ] Typography weights and colors match
- [ ] White space feels professional and generous

## Development Workflow

1. Make CSS changes in `_sass/economist-theme.scss`
2. Save file (live reload will rebuild)
3. Check http://localhost:4000/blog/ in browser
4. Compare side-by-side with https://www.economist.com/topics/artificial-intelligence
5. Iterate until pixel-perfect match achieved
6. Test responsive behavior (resize browser)
7. Commit changes when satisfied
