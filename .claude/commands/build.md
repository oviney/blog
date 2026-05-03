---
description: Build incrementally — start the Jekyll dev server and implement one slice at a time
---

Invoke `build` first. This workflow is backed by the upstream-aligned
`incremental-implementation` guide, then add the relevant local blog skill:
`jekyll-development`, `economist-theme`, `editorial`, or `jekyll-qa`.

Follow the incremental implementation pattern:
1. Implement the smallest possible working slice
2. Start the Jekyll dev server when runtime verification is needed: `bundle exec jekyll serve --config _config.yml,_config_dev.yml`
3. Verify the slice before committing
4. Commit with a descriptive message referencing the issue
5. Move to the next slice

Always test at 320px, 768px, and 1024px before marking a visual slice done.
Never commit without a passing `bundle exec jekyll build`.
