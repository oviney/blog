# Blog Growth and Design Backlog

Audit date: 2026-06-13
Site reviewed: https://www.viney.ca/

## Relationship to the Repository Backlog

This document is the portfolio backlog for reader growth, customer conversion,
design, and public-site quality. The shorter [`BACKLOG.md`](BACKLOG.md) remains
the priority queue for local implementation sessions.

Before implementation, mirror the selected item to a GitHub issue and assign the
repository's appropriate agent and priority labels. Product ideas that conflict
with the current [`ROADMAP.md`](../ROADMAP.md) scope require an explicit owner
decision before implementation.

## Objective

Improve the blog's ability to:

- Attract relevant engineering readers through search and sharing.
- Convert readers into email subscribers and repeat visitors.
- Establish Ouray Viney as a credible quality engineering consultant.
- Generate qualified consulting and speaking enquiries.
- Provide a fast, accessible reading experience across desktop and mobile.

## Success Metrics

Establish a baseline before implementation, then review monthly:

- Homepage primary CTA click-through rate.
- Visitor-to-email-subscriber conversion rate.
- Visitor-to-contact conversion rate.
- Article-to-article click-through rate.
- Returning visitor rate.
- Organic search impressions and clicks.
- Social referral traffic and social preview engagement.
- Core Web Vitals and accessibility audit results.

## Priority Definitions

- **P0:** Technical defect or misleading user experience. Address first.
- **P1:** High expected impact on audience growth, trust, or conversion.
- **P2:** Valuable optimization after the core customer journey works.
- **P3:** Optional enhancement or experiment.

---

## Phase 1: Repair Discovery and Subscription Foundations

### BLOG-001: Fix the production sitemap URL in `robots.txt`

**Priority:** P0
**Area:** Technical SEO
**Estimated scope:** XS

The production `robots.txt` currently points crawlers to
`http://localhost:4000/sitemap.xml`.

**Acceptance criteria:**

- [ ] The sitemap directive uses `https://www.viney.ca/sitemap.xml`.
- [ ] No production crawler directives reference localhost.
- [ ] The sitemap URL returns HTTP 200.

**Verification:**

- [ ] Open https://www.viney.ca/robots.txt in production.
- [ ] Validate the file in Google Search Console.

**Dependencies:** None

### BLOG-002: Remove internal utility pages from search indexing

**Priority:** P0
**Area:** Technical SEO / Information exposure
**Estimated scope:** S

The public sitemap currently includes dashboard and agent utility URLs,
including the dashboard pages and public agent-profile pages.

**Acceptance criteria:**

- [ ] Utility and internal pages are excluded from the XML sitemap.
- [ ] Non-editorial utility pages use `noindex` or are blocked from public
      deployment when appropriate.
- [ ] Editorial pages remain crawlable.
- [ ] Search Console is asked to recrawl the corrected sitemap.

**Verification:**

- [ ] Inspect the generated sitemap.
- [ ] Confirm excluded pages do not emit indexable metadata.
- [ ] Confirm no intended article or topic page was removed.

**Dependencies:** BLOG-001

### BLOG-003: Remove duplicate SEO metadata

**Priority:** P0
**Area:** Technical SEO
**Estimated scope:** S

Reviewed pages emit duplicate `<title>`, description, and canonical elements,
apparently from both custom layout markup and `jekyll-seo-tag`.

**Acceptance criteria:**

- [ ] Every page emits exactly one `<title>`.
- [ ] Every indexable page emits exactly one meta description.
- [ ] Every indexable page emits exactly one canonical URL.
- [ ] Open Graph and Twitter metadata remain valid.

**Verification:**

- [ ] Inspect generated HTML for the homepage, About, Blog, Search, one topic
      page, and one article.
- [ ] Run an SEO crawler or automated metadata test against the built site.

**Dependencies:** None

### BLOG-004: Add unique descriptions and titles to core pages

**Priority:** P1
**Area:** SEO / Positioning
**Estimated scope:** S

About, Blog, and Search currently reuse the generic site description.

**Acceptance criteria:**

- [ ] Homepage metadata clearly communicates the audience and value offered.
- [ ] About metadata describes Ouray's consulting expertise.
- [ ] Blog and topic pages describe their specific editorial coverage.
- [ ] Search is either given useful metadata or marked `noindex`.
- [ ] Titles and descriptions are concise and unique.

**Verification:**

- [ ] Compare all generated titles and descriptions for duplication.
- [ ] Validate representative pages with a search preview tool.

**Dependencies:** BLOG-003

### BLOG-005: Replace the newsletter placeholder with a real email signup

**Priority:** P0
**Area:** Audience growth / Conversion
**Estimated scope:** M

The site promises articles "delivered to your inbox," but the only action is an
RSS link. This is misleading and prevents email-list growth. Email subscription
is currently listed as out of scope in `ROADMAP.md`, so the owner must approve a
roadmap change before this item proceeds.

**Acceptance criteria:**

- [ ] A real email signup form appears on the homepage and article pages.
- [ ] The form explains frequency and content expectations.
- [ ] Submission has accessible loading, success, validation, and error states.
- [ ] Consent and privacy language meet the requirements of the chosen service.
- [ ] RSS remains available as a secondary option.
- [ ] Successful subscriptions are tracked without exposing personal data.

**Verification:**

- [ ] Complete a subscription from desktop and mobile.
- [ ] Confirm double opt-in and welcome email delivery, if configured.
- [ ] Test keyboard navigation and screen-reader labels.
- [ ] Confirm analytics records a successful signup event.

**Dependencies:** Owner roadmap decision; select an email provider and
mailing-list policy.

### Phase 1 Checkpoint

- [ ] Production crawler configuration is correct.
- [ ] Internal utility pages are not indexable.
- [ ] Core pages have one valid metadata set.
- [ ] A user can successfully subscribe by email.
- [ ] The site builds and representative pages pass smoke tests.

---

## Phase 2: Create a Customer Conversion Journey

### BLOG-006: Rewrite the homepage hero around customer outcomes

**Priority:** P1
**Area:** Positioning / Homepage
**Estimated scope:** M

The current homepage introduction describes editorial subjects but does not
clearly explain the consulting value or give prospective customers a next step.

Suggested positioning direction:

> Quality engineering that reduces delivery risk.
>
> I help engineering leaders build test strategy, automation, and performance
> practices that scale.

**Acceptance criteria:**

- [ ] The hero names the target audience.
- [ ] The headline communicates an outcome rather than a list of topics.
- [ ] A primary CTA leads to an enquiry or engagement page.
- [ ] A secondary CTA leads to featured editorial content.
- [ ] Both CTA clicks are tracked.
- [ ] The latest article remains visible without dominating the value
      proposition.

**Verification:**

- [ ] Review at 1440 px, 768 px, and 390 px viewport widths.
- [ ] Confirm the primary CTA is visible without scrolling on common devices.
- [ ] Confirm the proposition can be understood without reading body copy.

**Dependencies:** BLOG-007

### BLOG-007: Add a consulting services page

**Priority:** P1
**Area:** Lead generation
**Estimated scope:** M

Create a clear destination for prospective customers instead of relying on a
footer email link.

**Acceptance criteria:**

- [ ] The page describes three or fewer clearly scoped offers.
- [ ] Each offer states the customer problem, engagement outcome, typical
      deliverables, and suitable audience.
- [ ] Suggested initial offers cover test strategy, automation architecture,
      and quality/performance engineering leadership.
- [ ] The page includes a prominent contact action.
- [ ] Navigation includes a visible `Services` or `Work with me` link.
- [ ] The page has unique metadata and appropriate structured data.

**Verification:**

- [ ] A visitor can move from homepage to services to contact without using the
      footer.
- [ ] Test all links and enquiry actions.

**Dependencies:** Confirm services, availability, and preferred enquiry method.

### BLOG-008: Add a dedicated contact or engagement flow

**Priority:** P1
**Area:** Lead generation
**Estimated scope:** M

Email is currently only exposed in the footer and About page.

**Acceptance criteria:**

- [ ] A dedicated contact destination is linked from the header, hero, services
      page, and article CTA.
- [ ] The page explains what information is useful in an enquiry.
- [ ] The contact mechanism has spam protection and accessible validation.
- [ ] A successful enquiry has a clear confirmation state.
- [ ] Contact conversions are measured.

**Verification:**

- [ ] Submit test enquiries on desktop and mobile.
- [ ] Confirm delivery, validation, failure handling, and analytics.

**Dependencies:** BLOG-007

### BLOG-009: Add professional credibility and customer proof

**Priority:** P1
**Area:** Trust / Personal brand
**Estimated scope:** M

The current proof is largely limited to "20+ years experience."

**Acceptance criteria:**

- [ ] Add a professional portrait with descriptive alternative text.
- [ ] Add two or more approved testimonials, where available.
- [ ] Identify relevant industries, roles, or organizations without violating
      confidentiality.
- [ ] Add speaking, publication, open-source, or community credentials where
      applicable.
- [ ] Claims are specific, verifiable, and not inflated.

**Verification:**

- [ ] Obtain approval for every client name, logo, and testimonial.
- [ ] Confirm all images are optimized and responsive.

**Dependencies:** Approved biography, portrait, and proof assets.

### BLOG-010: Publish an outcome-focused case study

**Priority:** P1
**Area:** Trust / Lead generation
**Estimated scope:** M

Create at least one case study showing how expertise translated into a business
or engineering outcome.

**Acceptance criteria:**

- [ ] The case study explains context, constraints, approach, and outcome.
- [ ] Results use approved evidence or clearly state when details are
      anonymized.
- [ ] The page links to a relevant consulting offer and contact action.
- [ ] The homepage and services page link to the case study.

**Verification:**

- [ ] Review confidentiality and factual accuracy.
- [ ] Test metadata, structured data, links, and responsive layout.

**Dependencies:** BLOG-007 and an approved engagement story.

### BLOG-011: Reorder the homepage around trust and conversion

**Priority:** P1
**Area:** Homepage information architecture
**Estimated scope:** M

Recommended order:

1. Outcome-focused hero and primary CTA.
2. Credibility or proof strip.
3. Featured article.
4. Consulting capabilities.
5. Selected articles grouped by reader problem.
6. Testimonial or case study.
7. Email signup.
8. Short author biography.

**Acceptance criteria:**

- [ ] The page follows a clear path from proposition to proof to action.
- [ ] Repeated archive links and low-value metadata are reduced.
- [ ] Topic cards use reader problems or outcomes, not only taxonomy labels.
- [ ] The design remains editorial rather than becoming a generic sales page.
- [ ] Homepage sections are reusable and maintainable in the existing Jekyll
      structure.

**Verification:**

- [ ] Conduct a five-second comprehension test with representative users.
- [ ] Review visual hierarchy at desktop, tablet, and mobile widths.
- [ ] Compare CTA and subscription performance against the baseline.

**Dependencies:** BLOG-005, BLOG-006, BLOG-007, BLOG-009

### Phase 2 Checkpoint

- [ ] A prospective customer can understand the offer in one screen.
- [ ] Services, proof, and contact paths are visible without relying on the
      footer.
- [ ] Primary conversion events are tracked.
- [ ] Homepage usability has been reviewed on desktop and mobile.

---

## Phase 3: Improve Reading, Retention, and Mobile UX

### BLOG-012: Simplify the article-end conversion sequence

**Priority:** P1
**Area:** Article UX / Conversion
**Estimated scope:** M

Article pages contain several long and repetitive discovery sections before the
newsletter and comments.

Recommended order:

1. Author credibility.
2. Contextual consulting CTA.
3. Email signup.
4. Three related articles.
5. Comments, only if they provide meaningful engagement.

**Acceptance criteria:**

- [ ] Repetitive related-content modules are consolidated.
- [ ] No more than three primary related articles are shown before comments.
- [ ] The consulting CTA relates to the article's subject.
- [ ] Email signup is visible before low-engagement content.
- [ ] Article-to-article and CTA clicks are tracked.

**Verification:**

- [ ] Review a short article and a long article on desktop and mobile.
- [ ] Confirm comments still load correctly if retained.
- [ ] Compare scroll depth and related-content clicks after release.

**Dependencies:** BLOG-005, BLOG-007, BLOG-008

### BLOG-013: Rework the fixed mobile bottom navigation

**Priority:** P1
**Area:** Mobile UX
**Estimated scope:** S

The fixed Home/Blog/Search navigation duplicates the hamburger menu, reduces
reading space, and competes with conversion actions.

**Acceptance criteria:**

- [ ] Remove the fixed bottom navigation or replace it with one clearly valuable
      action such as `Subscribe`.
- [ ] Article text is never obscured by fixed controls.
- [ ] Navigation remains easy to find and keyboard accessible.
- [ ] Safe-area insets are handled on supported mobile devices.

**Verification:**

- [ ] Test at 320 px, 390 px, and 430 px widths.
- [ ] Test portrait and landscape orientation.
- [ ] Confirm focus states and touch targets meet accessibility requirements.

**Dependencies:** BLOG-005 if the replacement action is Subscribe.

### BLOG-014: Improve mobile typography and spacing

**Priority:** P1
**Area:** Mobile UX / Accessibility
**Estimated scope:** S

Mobile pages are functional but visually compressed, especially metadata,
article cards, and long article layouts.

**Acceptance criteria:**

- [ ] Body copy remains comfortably readable at mobile widths.
- [ ] Metadata and utility text are not excessively small.
- [ ] Headings retain clear hierarchy without awkward line breaks.
- [ ] Cards and article sections have consistent vertical spacing.
- [ ] Interactive controls meet a 44-by-44 CSS pixel target where applicable.

**Verification:**

- [ ] Test browser zoom at 200%.
- [ ] Review representative pages at 320 px and 390 px widths.
- [ ] Run an automated accessibility audit and perform keyboard checks.

**Dependencies:** BLOG-013

### BLOG-015: Develop a more distinctive personal visual identity

**Priority:** P2
**Area:** Brand design
**Estimated scope:** M

The current red badge and editorial typography are coherent but closely evoke
an established publication style. The site needs a more ownable personal brand.

**Acceptance criteria:**

- [ ] Create a distinctive wordmark or typographic signature.
- [ ] Add a restrained secondary color and documented design tokens.
- [ ] Define a consistent illustration or chart style.
- [ ] Incorporate the professional portrait without reducing editorial quality.
- [ ] Maintain WCAG AA contrast for text and interactive controls.
- [ ] Document reusable typography, color, spacing, and component rules.

**Verification:**

- [ ] Compare new designs across homepage, article, topic, About, and Services.
- [ ] Run contrast checks.
- [ ] Confirm the design remains recognizable without the site name visible.

**Dependencies:** BLOG-009

### BLOG-016: Group article discovery around reader problems

**Priority:** P2
**Area:** Content discovery
**Estimated scope:** M

Topic labels are useful for classification but do not always express why a
reader should click.

**Acceptance criteria:**

- [ ] Homepage and topic-page entry points use problem or outcome language.
- [ ] Examples include reducing flaky automation, measuring automation ROI,
      managing security debt, and governing AI-assisted delivery.
- [ ] Existing taxonomy and archive URLs remain available.
- [ ] Each curated collection has an introduction and useful article order.

**Verification:**

- [ ] Test collection links and empty states.
- [ ] Measure click-through rate against existing generic topic cards.

**Dependencies:** BLOG-011

### Phase 3 Checkpoint

- [ ] Article endings provide one clear retention and conversion path.
- [ ] Mobile reading is not obstructed by persistent navigation.
- [ ] Typography and controls pass responsive and accessibility checks.
- [ ] Brand and discovery patterns are consistent across core templates.

---

## Phase 4: Performance, Sharing, and Maintainability

### BLOG-017: Add intrinsic dimensions and responsive sizing to images

**Priority:** P1
**Area:** Performance / Layout stability
**Estimated scope:** M

All 18 images inspected across representative pages lacked intrinsic `width`
and `height` attributes.

**Acceptance criteria:**

- [ ] Generated image markup includes intrinsic width and height.
- [ ] Responsive images use suitable `srcset` and `sizes` where beneficial.
- [ ] Below-the-fold images remain lazy-loaded.
- [ ] The likely largest-contentful image is loaded with appropriate priority.
- [ ] Image aspect ratios do not cause layout shift.

**Verification:**

- [ ] Inspect homepage, topic, article, and related-content images.
- [ ] Run Lighthouse or equivalent checks for CLS and image optimization.

**Dependencies:** None

### BLOG-018: Optimize large raster assets

**Priority:** P1
**Area:** Performance
**Estimated scope:** S

At least one homepage WebP asset was approximately 228 KB. Audit all raster
assets for appropriate dimensions and compression.

**Acceptance criteria:**

- [ ] Card images are generated near their rendered dimensions.
- [ ] Modern formats are used where browser support is appropriate.
- [ ] Image quality remains acceptable at 1x and 2x density.
- [ ] A documented size budget is added for hero and card images.

**Verification:**

- [ ] Compare visual quality before and after optimization.
- [ ] Record homepage image transfer size before and after.

**Dependencies:** BLOG-017

### BLOG-019: Replace Google Fonts CSS `@import`

**Priority:** P2
**Area:** Performance / Privacy
**Estimated scope:** S

Fonts are currently discovered through a CSS `@import`, which delays loading.

**Acceptance criteria:**

- [ ] Remove the font `@import` from the compiled stylesheet.
- [ ] Self-host fonts or load them through optimized document-level links.
- [ ] Use `font-display` behavior that preserves readable text.
- [ ] Preload only fonts proven to be critical.
- [ ] Retain appropriate fallback font stacks.

**Verification:**

- [ ] Confirm fonts render after a cold-cache load.
- [ ] Inspect the network waterfall for earlier font discovery.
- [ ] Confirm no flash leaves text unreadable.

**Dependencies:** BLOG-015 if typography families will change.

### BLOG-020: Improve static asset caching

**Priority:** P2
**Area:** Performance / Hosting
**Estimated scope:** M

Reviewed HTML, CSS, and image responses use a ten-minute cache lifetime.

**Acceptance criteria:**

- [ ] Fingerprinted CSS, JavaScript, font, and image assets receive long-lived,
      immutable caching where hosting permits.
- [ ] HTML retains a shorter cache lifetime suitable for publishing.
- [ ] Deployments invalidate or change references to modified assets.
- [ ] Service-worker behavior does not serve stale content indefinitely.

**Verification:**

- [ ] Inspect production `Cache-Control` headers.
- [ ] Deploy an asset change and confirm clients receive the new version.

**Dependencies:** May require a hosting or build-pipeline decision.

### BLOG-021: Rationalize analytics and define conversion events

**Priority:** P1
**Area:** Analytics / Privacy / Performance
**Estimated scope:** M

Both Google Analytics and Plausible load on every page. Keep both only when they
serve distinct, documented needs.

**Acceptance criteria:**

- [ ] Select the primary analytics source of truth.
- [ ] Remove redundant analytics scripts unless a documented requirement
      justifies them.
- [ ] Track newsletter signup, primary CTA, contact conversion, service-page
      visits, and article-to-article clicks.
- [ ] Exclude personal information from event payloads.
- [ ] Document metric definitions and reporting cadence.

**Verification:**

- [ ] Trigger every conversion event in production or a test property.
- [ ] Confirm events appear once and contain no email addresses or message text.
- [ ] Confirm analytics failures do not affect page functionality.

**Dependencies:** BLOG-005, BLOG-006, BLOG-008, BLOG-012

### BLOG-022: Generate reliable social preview images

**Priority:** P2
**Area:** Social acquisition
**Estimated scope:** M

Some article metadata uses SVG images for Open Graph and Twitter previews,
which are not handled consistently by every sharing platform.

**Acceptance criteria:**

- [ ] Articles use 1200-by-630 raster social preview images.
- [ ] Previews include a readable title and consistent blog branding.
- [ ] Image metadata includes dimensions and descriptive alternative text where
      supported.
- [ ] A reusable build process or template generates previews.

**Verification:**

- [ ] Test representative URLs in LinkedIn, Facebook, and other relevant preview
      debuggers.
- [ ] Confirm titles remain readable on small preview cards.

**Dependencies:** BLOG-015

### BLOG-023: Improve person and professional structured data

**Priority:** P2
**Area:** SEO / Authority
**Estimated scope:** S

The About page currently uses generic website schema rather than a detailed
professional Person profile.

**Acceptance criteria:**

- [ ] Add valid `Person` structured data to the About page.
- [ ] Include approved `jobTitle`, `sameAs`, areas of expertise, and profile
      image fields.
- [ ] Article author schema references the same person entity.
- [ ] Avoid duplicate or conflicting Article/BlogPosting schema.

**Verification:**

- [ ] Validate representative pages with Google's Rich Results Test and
      Schema.org validator.

**Dependencies:** BLOG-003, BLOG-009

### BLOG-024: Establish a durable URL slug policy

**Priority:** P2
**Area:** SEO / Content operations
**Estimated scope:** S

Some article URLs contain awkward or truncated slugs. Existing indexed URLs
should remain stable, while future URLs should be concise and intentional.

**Acceptance criteria:**

- [ ] Document a maximum practical slug length and naming convention.
- [ ] New posts use concise, complete, keyword-relevant slugs.
- [ ] Existing URLs are not changed without permanent redirects.
- [ ] The publishing workflow detects accidental truncation.

**Verification:**

- [ ] Add build-time validation or a documented editorial check.
- [ ] Test redirects for any deliberately migrated URLs.

**Dependencies:** None

### BLOG-025: Add automated quality gates for public pages

**Priority:** P2
**Area:** Quality engineering
**Estimated scope:** M

Prevent regressions in metadata, accessibility, links, and rendering.

**Acceptance criteria:**

- [ ] CI builds the Jekyll site.
- [ ] CI checks for broken internal links.
- [ ] CI verifies one title, description, and canonical per indexable page.
- [ ] CI verifies production `robots.txt` does not reference localhost.
- [ ] CI runs accessibility checks on representative templates.
- [ ] CI captures responsive screenshots or visual regressions for core pages.

**Verification:**

- [ ] Introduce a controlled failure for each gate and confirm CI blocks it.
- [ ] Document how to update intentional visual baselines.

**Dependencies:** BLOG-001 through BLOG-004 should define expected behavior.

### Phase 4 Checkpoint

- [ ] Images reserve layout space and meet size budgets.
- [ ] Font and asset delivery have been optimized.
- [ ] Analytics events are documented and verified.
- [ ] Social previews work on target platforms.
- [ ] CI catches SEO, accessibility, link, and visual regressions.

---

## Phase 5: Experiments

### BLOG-026: Test homepage CTA and positioning variants

**Priority:** P3
**Area:** Conversion optimization
**Estimated scope:** S per experiment

Run controlled experiments only after reliable conversion tracking exists.

**Candidate experiments:**

- [ ] `Discuss an engagement` versus `Work with me`.
- [ ] Consulting-first versus article-first hero composition.
- [ ] Case-study proof versus testimonial proof near the hero.
- [ ] Newsletter frequency and benefit language.

**Acceptance criteria:**

- [ ] Each experiment has one hypothesis and one primary metric.
- [ ] Variants do not compromise accessibility or performance.
- [ ] Results are documented before the next experiment starts.

**Verification:**

- [ ] Confirm consistent event tracking across variants.
- [ ] Retain the winning variant or record an inconclusive result.

**Dependencies:** BLOG-021 and sufficient traffic.

### BLOG-027: Review the value of article comments

**Priority:** P3
**Area:** Community / Performance
**Estimated scope:** XS

Comments add a third-party script and substantial empty space when engagement is
low. Comments are currently listed as out of scope in `ROADMAP.md`, despite the
live Giscus integration, so this item must begin by reconciling that policy with
current production behavior.

**Acceptance criteria:**

- [ ] Measure comment use over a representative period.
- [ ] Retain, defer-load, relocate, or remove comments based on evidence.
- [ ] If retained, comments load after higher-value conversion content.

**Verification:**

- [ ] Compare script activity, page weight, and engagement before and after.

**Dependencies:** Owner roadmap decision; BLOG-012, BLOG-021

---

## Recommended Implementation Order

1. BLOG-001 through BLOG-005: repair discovery and subscription defects.
2. BLOG-007 and BLOG-008: establish service and contact destinations.
3. BLOG-006, BLOG-009, BLOG-010, and BLOG-011: rebuild homepage positioning
   and trust.
4. BLOG-012 through BLOG-016: improve reading, mobile UX, brand, and discovery.
5. BLOG-017 through BLOG-025: improve performance, sharing, analytics, SEO, and
   automated quality controls.
6. BLOG-026 and BLOG-027: run evidence-based experiments.

## Parallelization

After the Phase 1 metadata expectations are settled:

- BLOG-005 can run in parallel with BLOG-007 and BLOG-008.
- BLOG-009 and BLOG-010 can run in parallel with technical SEO work.
- BLOG-017 through BLOG-020 can run in parallel with content and brand work.
- BLOG-022 can begin once the visual identity direction is approved.
- BLOG-025 should be completed after the corrected behavior is established.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Redesign becomes cosmetic without improving conversion | High | Require a measurable CTA and success metric for every major homepage change. |
| Consulting language weakens editorial credibility | Medium | Keep article quality central and use restrained, contextual commercial CTAs. |
| Claims or testimonials breach confidentiality | High | Obtain written approval and anonymize case studies where necessary. |
| Adding email and contact vendors creates privacy obligations | High | Document data handling, collect minimal data, and publish appropriate policy text. |
| Changing existing URLs loses search equity | High | Preserve existing URLs or add tested permanent redirects. |
| Multiple scripts reduce performance | Medium | Set a script budget and remove tools that do not support a defined metric. |
| Low traffic makes A/B tests inconclusive | Medium | Prefer sequential tests and qualitative research until traffic is sufficient. |

## Audit Evidence

The backlog is based on a live review of:

- https://www.viney.ca/
- https://www.viney.ca/about/
- https://www.viney.ca/blog/
- https://www.viney.ca/search/
- https://www.viney.ca/security/
- https://www.viney.ca/software-engineering/
- https://www.viney.ca/test-automation/
- https://www.viney.ca/2026/04/27/the-ai-testing-paradox-when-silicon-valley-s-saviour-become/
- https://www.viney.ca/robots.txt
- https://www.viney.ca/sitemap.xml
- https://www.viney.ca/assets/css/styles.css

The audit included desktop and 390 px mobile rendering, generated HTML and CSS
inspection, metadata inspection, sitemap and crawler review, response-header
inspection, and a representative homepage network trace.
