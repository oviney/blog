'use strict';

// Content and runtime contracts whose result does not depend on screen size.
// Request-only specs use no browser; DOM/JavaScript checks use one Chrome project.
const contentSpecs = [
  'analytics.spec.ts',
  'category-webp.spec.ts',
  'content-quality.spec.ts',
  'excerpt-source-regression.spec.ts',
  'page-chrome-invariant.spec.ts',
  'search-escaping.spec.ts',
  'seo-jsonld.spec.ts',
  'seo-metadata-dedupe.spec.ts',
  'seo-metadata-uniqueness.spec.ts',
  'sitemap-exclusions.spec.ts',
];

// These specs explicitly set their viewports, including any internal matrix.
const viewportSpecs = [
  'byline-regression.spec.ts',
  'homepage-responsive.spec.ts',
  'responsive.spec.ts',
  'viewport-overflow.spec.ts',
];

// Dedicated jobs already run these against the same built site on every run.
const gateSpecs = [
  'page-contract.spec.ts',
  'service-worker-stale-css.spec.ts',
  'visual-snapshot.spec.ts',
];

module.exports = { contentSpecs, viewportSpecs, gateSpecs };
