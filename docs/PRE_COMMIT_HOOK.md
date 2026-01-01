# Pre-commit Hook

A Git pre-commit hook that validates the blog before allowing commits.

## What It Checks

1. **Jekyll Build** - Ensures the site builds without errors
2. **Broken Links** - Warns about potential broken internal links
3. **YAML Front Matter** - Validates all posts have required fields (title, date)
4. **Future Dates** - Warns about posts with dates in the future

## Installation

The hook is already installed in `.git/hooks/pre-commit` and made executable.

## Usage

The hook runs automatically on every `git commit`. If validation fails:

```bash
❌ Jekyll build failed! Fix errors before committing.
```

The commit will be blocked until you fix the issue.

## Bypassing the Hook

**Only in emergencies:**
```bash
git commit --no-verify -m "Emergency fix"
```

## Manual Testing

Run the hook manually to test:
```bash
.git/hooks/pre-commit
```

## Required Fields in Posts

All posts must have:
```yaml
---
title: "Your Title"
date: YYYY-MM-DD
---
```

## Sharing With Team

Since `.git/hooks` isn't tracked by Git, copy this to other repos:
```bash
cp .git/hooks/pre-commit /path/to/other/repo/.git/hooks/
chmod +x /path/to/other/repo/.git/hooks/pre-commit
```
