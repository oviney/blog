# Development Workflow

## Starting the Local Jekyll Server

### Quick Start
```bash
cd /Users/ouray.viney/code/economist-blog-v5
bundle exec jekyll serve
```

The server will start at: **http://127.0.0.1:4000/**

### Expected Warnings (Safe to Ignore)

When starting the server, you'll see these warnings that don't affect functionality:

1. **CSV Warning**: 
   ```
   csv was loaded from the standard library, but will no longer be part of the default gems starting from Ruby 3.4.0.
   ```
   - **Fix (optional)**: Add `gem 'csv'` to Gemfile

2. **Faraday Middleware Warning**:
   ```
   To use retry middleware with Faraday v2.0+, install `faraday-retry` gem
   ```
   - **Fix (optional)**: Run `bundle add faraday-retry`

3. **Sass Deprecation Warning**:
   ```
   Deprecation Warning [import]: Sass @import rules are deprecated
   ```
   - **Future task**: Migrate from @import to @use/@forward syntax
   - **Impact**: None until Dart Sass 3.0.0

### Successful Server Output
```
Configuration file: /Users/ouray.viney/code/economist-blog-v5/_config.yml
            Source: /Users/ouray.viney/code/economist-blog-v5
       Destination: /Users/ouray.viney/code/economist-blog-v5/_site
 Incremental build: disabled. Enable with --incremental
      Generating... 
       Jekyll Feed: Generating feed for posts
                    done in 0.329 seconds.
 Auto-regeneration: enabled for '/Users/ouray.viney/code/economist-blog-v5'
    Server address: http://127.0.0.1:4000/
  Server running... press ctrl-c to stop.
```

### Stopping the Server
Press `Ctrl-C` in the terminal to stop the server.

---

## Local Development Without `jekyll serve`

The local server is now working, but the pre-commit hook workflow is still recommended for most development. The server is useful for rapid iteration on CSS/layout changes.

## Recommended Workflow

### 1. Make Changes
Edit markdown files, layouts, CSS, or configuration.

### 2. Commit Changes
```bash
git add <files>
git commit -m "description"
```

**Pre-commit hook automatically runs:**
- ✅ Jekyll build validation
- ✅ Broken link detection
- ✅ YAML front matter validation
- ✅ Required fields check (title, date)
- ✅ Future date warnings

If any check fails, commit is blocked until fixed.

### 3. Push to GitHub
```bash
git push origin main
```

### 4. GitHub Actions Builds and Deploys
- GitHub Actions workflow triggers on push to main
- Build with Jekyll 4.3.2 and all plugins (~45 seconds)
- Deploy to GitHub Pages (~30 seconds)
- Total deployment time: 1-2 minutes
- View progress: https://github.com/oviney/blog/actions

### 5. Verify on Production
Visit https://www.viney.ca/ to see changes live.

Optionally run Blog QA Agent:
```bash
cd ~/code/economist-agents
python3 scripts/blog_qa_agent.py --blog-dir ~/code/economist-blog-v5
```

## Why This Works

### Pre-commit Validation Prevents Bugs
The `.git/hooks/pre-commit` script catches:
- Syntax errors (Jekyll build fails)
- Configuration issues
- Missing required metadata
- Broken internal links

### GitHub Actions Handles Build & Deployment
- Jekyll 4.3.2 with full plugin support
- Consistent build environment (Ubuntu)
- No local SSL/certificate issues
- Complete build logs for debugging
- Minimal Mistakes theme support

### Blog QA Agent Learns from Issues
- Self-improving validation
- Learns patterns from any missed issues
- Stores knowledge in `skills/blog_qa_skills.json`

## Benefits Over Local Server

| Aspect | Local `jekyll serve` | Pre-commit + GitHub Pages |
|--------|---------------------|---------------------------|
| Setup complexity | High (Ruby versions, SSL certs) | Low (already configured) |
| Build environment | Local (may differ from prod) | Production-identical |
| Validation | Manual (must remember) | Automatic (can't skip) |
| Preview speed | Instant | 1-2 minutes |
| SSL certificate issues | Yes (macOS + Ruby 3.3.6) | No |
| Remote theme fetching | Fails | Works |

## When to Use Each Approach

### Use Pre-commit + GitHub Pages (Recommended)
- ✅ Content changes (blog posts, pages)
- ✅ Configuration tweaks
- ✅ CSS/layout modifications
- ✅ Daily development workflow

### Use Local Jekyll Server
- Complex theme development
- Rapid iteration on layout
- CSS experimentation
- Real-time preview of changes

**Command:** `bundle exec jekyll serve` (see section above for details)

## Emergency: Bypass Pre-commit Hook

**Only in emergencies** (hook is broken, urgent hotfix):

```bash
git commit --no-verify -m "Emergency fix"
```

This skips validation - use with extreme caution.

## Verification Checklist

Before pushing major changes:

1. **Pre-commit passed** ✅ (automatic)
2. **Commit message descriptive** ✅
3. **GitHub Actions status** - Check after push
4. **Production site** - Verify at viney.ca after 2 minutes
5. **Blog QA Agent** - Run for additional validation

## Troubleshooting

### Pre-commit Hook Fails on Jekyll Build

**Symptoms:**
```
📦 Testing Jekyll build...
❌ Jekyll build failed! Fix errors before committing.
```

**Solutions:**
1. Check `_config.yml` for syntax errors
2. Verify all posts have valid YAML front matter
3. Run `bundle install` if dependencies changed
4. Check that all referenced layouts exist

### GitHub Actions Fails

**Check:**
- Visit https://github.com/oviney/blog/actions
- Click latest workflow run
- Review logs for specific error
- Fix and push again

### Pre-commit Hook Not Running

**Fix:**
```bash
chmod +x .git/hooks/pre-commit
```

## Related Documentation

- [Pre-commit Hook](.git/hooks/pre-commit) - Validation script
- [GitHub Actions](.github/workflows/jekyll.yml) - CI/CD pipeline
- [Blog QA Agent](../economist-agents/docs/CHANGELOG.md) - Self-learning validation

---

**Bottom Line:** Your current workflow (pre-commit + GitHub Pages) is production-grade. No local `jekyll serve` needed.
