# Ouray's Tech Blog

Software engineering insights on quality, testing, and AI - written in The Economist's signature style.

**Theme:** [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) v4.27.3  
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

## Project Structure

```
blog/
├── _posts/          # Blog articles (markdown)
├── _layouts/        # Jekyll templates  
├── _includes/       # Reusable components
├── assets/          # Images, CSS, charts
├── _config.yml      # Jekyll configuration
└── Gemfile          # Ruby dependencies
```

## Content Generation System

For details on the AI content generation pipeline, see [oviney/economist-agents](https://github.com/oviney/economist-agents).
