---
description: Build incrementally — start the Jekyll dev server and implement one slice at a time
---

Invoke the jekyll-development skill, then the relevant domain skill (economist-theme, editorial, or jekyll-qa).

Follow the incremental implementation pattern:
1. Start the Jekyll dev server: `bundle exec jekyll serve --config _config_dev.yml`
2. Implement the smallest possible working slice
3. Verify visually at http://localhost:4000 before committing
4. Commit with a descriptive message referencing the issue
5. Move to the next slice

Always test at 320px, 768px, and 1024px before marking a visual slice done.
Never commit without a passing `bundle exec jekyll build`.
