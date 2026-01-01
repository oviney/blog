# Jekyll Blog Issues & Enhancements

## Critical Bugs (Fix Immediately)

### BUG-001: Invalid YAML in _config.yml
**Severity:** Critical
**Description:** Multiple YAML document separators (`---`) in _config.yml causing parsing issues
**Location:** _config.yml lines 40-42
**Impact:** May cause Jekyll build failures or unexpected behavior
**Fix:** Remove extra `---` separators, consolidate into single YAML document

### BUG-002: Duplicate Index Files
**Severity:** High
**Description:** Both index.html and index.md exist in root
**Location:** Root directory
**Impact:** Unclear which file Jekyll uses, potential content conflicts
**Fix:** Determine which is active, delete the unused one

## Medium Priority Issues

### BUG-003: Unused/Dead Files
**Severity:** Medium
**Description:** Multiple orphaned files cluttering repository
**Files:**
- staff.html (no authors collection enabled)
- collections.yml (wrong location, should be in _data/)
- home-automation.md (orphaned page, not in navigation)
- index.html (if index.md is primary)
**Impact:** Repository clutter, confusion for maintainers
**Fix:** Remove unused files or activate their features

### ENHANCEMENT-001: Non-Data-Driven Navigation
**Severity:** Medium
**Description:** Navigation is hardcoded in include, not using Jekyll data files
**Location:** _includes/navigation.html
**Impact:** Hard to maintain, not following Jekyll best practices
**Fix:** Create _data/navigation.yml and update include to use data

### ENHANCEMENT-002: Inefficient Font Loading
**Severity:** Medium
**Description:** Font preconnect hints not optimally configured
**Location:** _layouts/default.html
**Impact:** Slower page load times
**Fix:** Add proper preconnect with crossorigin attribute

## Low Priority Enhancements

### ENHANCEMENT-003: Missing Post Permalinks
**Severity:** Low
**Description:** No permalink pattern defined in config
**Impact:** Default URLs not SEO-friendly
**Fix:** Add `permalink: /:year/:month/:day/:title/` to _config.yml

### ENHANCEMENT-004: No RSS Feed Link
**Severity:** Low
**Description:** jekyll-feed plugin enabled but no link in footer
**Impact:** Users can't easily subscribe
**Fix:** Add RSS icon/link to footer

### ENHANCEMENT-005: Missing Collections Configuration
**Severity:** Low
**Description:** author.html layout exists but collections not enabled
**Impact:** Unused code, unclear intent
**Fix:** Either enable authors collection or remove author.html

### ENHANCEMENT-006: No Open Graph Images
**Severity:** Low
**Description:** Missing og:image tags for social sharing
**Impact:** Poor social media preview cards
**Fix:** Add default og:image and per-post override capability

### ENHANCEMENT-007: No Pagination
**Severity:** Low
**Description:** Blog listing shows all posts, no pagination
**Impact:** Page will slow down as post count grows
**Fix:** Add jekyll-paginate plugin and pagination logic

### ENHANCEMENT-008: No Category/Tag Archives
**Severity:** Low
**Description:** Posts have categories/tags but no archive pages
**Impact:** Limited content discoverability
**Fix:** Create category and tag archive pages

---

## Fix Order

1. BUG-001: Fix YAML config (critical)
2. BUG-002: Remove duplicate index (high)
3. BUG-003: Clean up dead files (medium)
4. ENHANCEMENT-001: Data-driven navigation (medium)
5. ENHANCEMENT-002: Font loading optimization (medium)
6. ENHANCEMENT-003: Post permalinks (low)
7. ENHANCEMENT-004: RSS feed link (low)
8. ENHANCEMENT-005: Collections config (low)
9. ENHANCEMENT-006-008: Defer to future work

---

**Total Issues:** 11 (3 bugs, 8 enhancements)
**Estimated Time:** 45-60 minutes for priorities 1-5
