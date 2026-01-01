# Development Workflow

## Local Development Without `jekyll serve`

Due to SSL certificate issues with Ruby 3.3.6 and remote themes, local `jekyll serve` is not required. The pre-commit hook provides all necessary validation.

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

### Use Local Preview (If Needed)
- Complex theme development
- Rapid iteration on layout
- CSS experimentation

**Note:** For local preview, would require Docker (not available) or fixing Ruby/SSL configuration.

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
