# Ouray's Tech Blog

Software engineering insights on quality, testing, and AI - written in The Economist's signature style.

**Theme:** Custom Economist-inspired design system  
**Typography:** Merriweather (serif) + Inter (sans-serif)  
**Build:** Jekyll 4.3.2 via GitHub Actions  
**Deployment:** GitHub Pages

## About

Professional commentary on software quality engineering, test automation, and emerging technologies. 

**Content Generation**: Articles are produced using [economist-agents](https://github.com/oviney/economist-agents), a multi-agent AI system that generates publication-quality content with The Economist's voice.

## Local Development

```bash
# Install Jekyll
bundle install

# Run locally
bundle exec jekyll serve

# Visit http://localhost:4000
```

## Publishing

Content is published via Git:

```bash
git add _posts/new-article.md
git commit -m "Publish: Article title"  
git push origin main
```

GitHub Actions automatically builds and deploys changes to GitHub Pages.

**Build & Deployment:**
- Triggers on push to `main` branch
- Uses Jekyll 4.3.2 with Minimal Mistakes theme
- Deployment time: 1-2 minutes
- Monitor progress: https://github.com/oviney/blog/actions

## Custom Theme

The site features a bespoke design system inspired by The Economist:

- **Typography**: Merriweather serif for body text, Inter for UI elements
- **Colors**: The Economist red (#E3120B) for accents, clean blacks and grays
- **Layout**: Red header banner, horizontal navigation, article cards, dark footer
- **Components**: Category breadcrumbs, read time indicators, featured images, related posts
- **Responsive**: Mobile-first design with breakpoints at 768px and 1024px

Theme source: `_sass/economist-theme.scss` (600+ lines)

## Project Structure

```
blog/
├── _posts/          # Blog articles (markdown)
├── _layouts/        # Custom theme layouts (default.html, post.html)
├── _sass/           # Custom Economist theme SCSS  
├── _includes/       # Reusable components
├── assets/          # Images, CSS, charts
├── _config.yml      # Jekyll configuration
└── Gemfile          # Ruby dependencies
```

## Content Generation System

For details on the AI content generation pipeline, see [oviney/economist-agents](https://github.com/oviney/economist-agents).
