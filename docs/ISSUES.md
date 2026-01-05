# Jekyll Blog Issues & Enhancements

## 🐛 Active Bugs (2026-01-05)

### BUG-004: Related Articles Not Filtered by Category
**Status:** FIXED ✅
**Reporter:** ouray
**Assigned To:** Creative Director
**Date Reported:** 2026-01-05
**Date Fixed:** 2026-01-05
**Priority:** P1 (High)
**Sprint:** 2026-01 Sprint 1
**Commit:** 9699505

**Description:**
The "More from [category]" section on article pages shows ALL posts instead of filtering by the current post's category. This defeats the purpose of related articles and provides poor UX.

**Steps to Reproduce:**
1. Visit http://127.0.0.1:4000/2026/01/02/self-healing-tests-myth-vs-reality.html
2. Scroll to bottom "More from technology" section
3. Observe: Shows posts from ALL categories, not just "technology"

**Expected Behavior:**
- Show only posts from same category as current post
- If < 6 posts in category, show remaining from other categories
- Current post should be excluded

**Actual Behavior:**
- Shows all posts without category filtering

**Solution Implemented:**
- Added Liquid logic to filter posts by category using `where_exp`
- Separated posts into same-category and other-category arrays
- Concatenated arrays (same category first) and limited to 6
- Current post excluded using `post.url != page.url`
- Falls back gracefully to other categories if insufficient same-category posts

**Impact:**
- Users now see truly related articles from same category
- Improved engagement and navigation quality
- Matches The Economist's UX pattern

**Related Files:**
- `_layouts/post.html` (lines 59-88)

**Acceptance Criteria:**
- [x] Related articles filtered by current post's category
- [x] Current post excluded from related list
- [x] Minimum 3, maximum 6 related posts shown
- [x] Fallback to other categories if < 3 in same category
- [x] Tested on all existing posts

---

## ✅ Completed Issues (2025-12-31)

### BUG-001: Invalid YAML in _config.yml ✅
**Status:** FIXED
**Commit:** d2e1b2f

### BUG-002: Duplicate Index Files ✅
**Status:** FIXED
**Commit:** fb252e8

### BUG-003: Unused/Dead Files ✅
**Status:** FIXED
**Commit:** bdd8a71

### ENHANCEMENT-001: Data-Driven Navigation ✅
**Status:** ALREADY IMPLEMENTED

### ENHANCEMENT-002: Font Loading Optimization ✅
**Status:** FIXED
**Commit:** 47faf8f

### ENHANCEMENT-003: Post Permalinks ✅
**Status:** FIXED
**Commit:** 52513f2

---

## 🎨 UI/UX Enhancements (High Priority)

### ENHANCEMENT-009: Modern Theme Upgrade
**Priority:** P0 (Critical)
**Effort:** Medium (2-3 hours)
**Impact:** HIGH - Transforms entire blog aesthetic

**Problem:** Cayman theme is basic/outdated, looks like default GitHub Pages
**Solution:** Switch to modern Jekyll theme with better UX

**Recommended Themes:**
1. **Minimal Mistakes** - Professional, feature-rich, widely used
2. **Chirpy** - Modern, clean, excellent for technical blogs
3. **al-folio** - Academic/professional, stunning visuals
4. **Just the Docs** - If documentation-style blog desired

**Features Gained:**
- Responsive sidebar navigation
- Dark mode toggle
- Better typography and spacing
- Featured posts section
- Social sharing buttons
- Search functionality built-in
- Author bio with avatar
- Related posts suggestions

### ENHANCEMENT-010: Featured/Hero Post on Homepage
**Priority:** P0 (Critical)
**Effort:** Low (30 min)
**Impact:** HIGH - Drives engagement

**Problem:** Homepage is static text, no content preview
**Solution:** Show latest/featured post prominently with image

**Implementation:**
- Add hero section with latest post
- Include post excerpt and "Read More" CTA
- Optional: Add featured post flag in front matter

### ENHANCEMENT-011: Post Metadata & Visual Hierarchy
**Priority:** P1 (High)
**Effort:** Low (1 hour)
**Impact:** MEDIUM-HIGH

**Problem:** Blog listing is plain text, no visual engagement
**Solution:** Add metadata cards with better styling

**Add:**
- Reading time estimate
- Category badges/tags
- Author info (name + small avatar)
- Post images/thumbnails (optional)
- Better typography hierarchy
- Card-based layout vs plain list

### ENHANCEMENT-012: RSS Feed Link
**Priority:** P1 (High)
**Effort:** Minimal (5 min)
**Impact:** MEDIUM - Enables subscriptions

**Problem:** RSS feed exists but not discoverable
**Solution:** Add RSS icon/link to footer and header

### ENHANCEMENT-013: Social Proof & CTAs
**Priority:** P1 (High)
**Effort:** Low (30 min)
**Impact:** MEDIUM

**Problem:** No calls-to-action, unclear next steps for readers
**Solution:** Add engagement elements

**Add:**
- "Subscribe to newsletter" form (Substack/ConvertKit)
- Social media links (LinkedIn, Twitter)
- "Connect with me" CTA on About page
- Comment system (giscus/utterances - GitHub-based)

### ENHANCEMENT-014: Content Discovery Features
**Priority:** P2 (Medium)
**Effort:** Medium (2 hours)
**Impact:** MEDIUM

**Problem:** With only 4 posts, hard to find related content
**Solution:** Add discovery mechanisms

**Add:**
- "Popular Posts" widget (manual or based on views)
- "You May Also Like" related posts
- Category/tag cloud
- Recent posts sidebar
- Search functionality

### ENHANCEMENT-015: Homepage Redesign
**Priority:** P2 (Medium)
**Effort:** Medium (2-3 hours)
**Impact:** HIGH

**Problem:** Current homepage is text-heavy, not scannable
**Solution:** Restructure for impact

**New Structure:**
1. Hero section with latest post
2. 3-column "Focus Areas" cards with icons
3. Featured posts grid (2-3 posts)
4. Brief bio with headshot
5. Newsletter signup
6. Footer with social links + RSS

### ENHANCEMENT-016: Visual Elements
**Priority:** P2 (Medium)
**Effort:** Medium (ongoing)
**Impact:** HIGH

**Problem:** No images, all text, visually boring
**Solution:** Add visual content

**Add:**
- Author headshot/avatar
- Post header images (Unsplash/custom)
- Syntax highlighting themes (better colors)
- Icon set for categories (FontAwesome)
- Charts/diagrams in technical posts
- Pull quotes for emphasis

### ENHANCEMENT-017: Interactive Elements
**Priority:** P3 (Low)
**Effort:** High (3-4 hours)
**Impact:** MEDIUM

**Solution:** Add engagement features

**Add:**
- Table of contents for long posts (auto-generated)
- Copy code button for code blocks
- "Back to top" button
- Progress bar for reading
- Share buttons per post
- Print stylesheet

---

## 📊 Analytics & Performance

### ENHANCEMENT-018: Enhanced Analytics
**Priority:** P2 (Medium)
**Effort:** Low (1 hour)
**Impact:** MEDIUM

**Add:**
- Google Search Console
- Plausible/Fathom (privacy-friendly alternative)
- Track popular content
- Monitor bounce rates

### ENHANCEMENT-019: Performance Optimization
**Priority:** P3 (Low)
**Effort:** Medium
**Impact:** LOW (already fast)

**Optimizations:**
- Lazy load images
- Minimize CSS
- Add service worker for offline reading
- WebP images

---

## 🚫 Deferred (Not Needed Now)

### ENHANCEMENT-005: Collections Config
**Status:** SKIP - Not needed for single author

### ENHANCEMENT-006: Open Graph Images
**Status:** DEFER - Revisit at 10+ posts

### ENHANCEMENT-007: Pagination
**Status:** DEFER - Revisit at 20+ posts

### ENHANCEMENT-008: Category Archives
**Status:** DEFER - Revisit at 10+ posts

---

## 📋 Recommended Implementation Order

**Phase 1: Quick Wins (Today)**
1. ✅ ENHANCEMENT-012: RSS feed link (5 min)
2. ✅ ENHANCEMENT-010: Featured post on homepage (30 min)
3. ✅ ENHANCEMENT-011: Post metadata cards (1 hour)

**Phase 2: Theme Upgrade (This Week)**
4. 🎯 ENHANCEMENT-009: Modern theme (2-3 hours)
5. 🎯 ENHANCEMENT-013: Social proof & CTAs (30 min)

**Phase 3: Content Discovery (Next Week)**
6. ENHANCEMENT-014: Discovery features (2 hours)
7. ENHANCEMENT-015: Homepage redesign (2-3 hours)

**Phase 4: Polish (Future)**
8. ENHANCEMENT-016: Visual elements (ongoing)
9. ENHANCEMENT-017: Interactive features (as needed)
10. ENHANCEMENT-018: Enhanced analytics (when traffic grows)

---

**Total High-Priority Enhancements:** 7
**Estimated Time for Phase 1-2:** 4-6 hours
**Expected Impact:** Transform blog from "basic GitHub Pages" to "professional tech blog"
