#!/usr/bin/env node
/**
 * content-remediation.js — Translate content-review scores into specific,
 * machine-readable improvement action plans for the Editorial Chief agent.
 *
 * Pipeline position:
 *   content-review.js  →  content-remediation.js  →  GitHub issues (agent:editorial-chief)
 *   (scores + flags)      (structured action plans)   (implements fixes → PR)
 *
 * Input:  content-review-results.json  (produced by content-review.js)
 * Output: content-remediation-queue.json  (committed to repo root)
 *         GitHub issues per post below threshold (labelled agent:editorial-chief)
 *
 * Usage:
 *   node scripts/content-remediation.js [--dry-run] [--no-issues] [--threshold N]
 *
 *   --dry-run     Print queue JSON; do not write file or create issues.
 *   --no-issues   Write queue file but skip GitHub issue creation.
 *   --threshold N Score below which a post enters the queue (default: 85).
 *
 * Dependencies: Node.js built-ins only.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Configuration ─────────────────────────────────────────────────────────────

const REPO_ROOT      = path.resolve(__dirname, '..');
const REVIEW_FILE    = path.join(REPO_ROOT, 'content-review-results.json');
const QUEUE_FILE     = path.join(REPO_ROOT, 'content-remediation-queue.json');
const POSTS_DIR      = path.join(REPO_ROOT, '_posts');
const REPO_SLUG      = 'oviney/blog';

const ARGS      = process.argv.slice(2);
const DRY_RUN   = ARGS.includes('--dry-run');
const NO_ISSUES = ARGS.includes('--no-issues');
const THRESHOLD = (() => {
  const idx = ARGS.indexOf('--threshold');
  return idx !== -1 ? parseInt(ARGS[idx + 1], 10) : 85;
})();

const VALID_CATEGORIES = [
  'Quality Engineering',
  'Software Engineering',
  'Test Automation',
  'Security',
];

// Category → data sources useful for citations
const CATEGORY_DATA_SOURCES = {
  'Quality Engineering':   'DORA State of DevOps, ISTQB reports, Gartner Magic Quadrant for Software Testing',
  'Software Engineering':  'DORA State of DevOps, Stack Overflow Developer Survey, GitHub Octoverse',
  'Test Automation':       'ISTQB Global Testing Survey, Capgemini World Quality Report, Tricentis/Mabl vendor studies',
  'Security':              'NIST CVE database, IBM X-Force Threat Intelligence Index, Verizon DBIR',
};

// Stopwords for keyword extraction
const STOPWORDS = new Set([
  'the','and','for','that','this','with','from','have','been','they',
  'their','what','when','which','will','more','also','into','than',
  'then','some','such','even','over','only','after','about','these',
  'those','other','should','would','could','there','where','while',
  'most','each','both','well','just','very','been','through',
]);

const PROMPT_ALT_TERMS = [
  'editorial illustration',
  'editorial photomontage',
  'photorealistic',
  'technical diagram',
  'infographic',
  'blueprint',
  'cartoon',
  'risograph',
  'duotone',
  'monochrome',
  'palette',
  'lighting',
  'texture',
  'crosshatching',
  'newspaper engraving',
  'block-print',
  'rendered',
  'style',
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function keywords(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !STOPWORDS.has(w))
  );
}

function jaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function slugifyTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function permalinkFromPost(filename, fm = {}) {
  // Jekyll config uses /:year/:month/:day/:title/, with optional slug override.
  const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
  if (!m) return null;
  const routeSlug = fm.slug || slugifyTitle(fm.title) || m[4];
  return `/${m[1]}/${m[2]}/${m[3]}/${routeSlug}/`;
}

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateDesc(desc, max = 157) {
  if (!desc || desc.length <= max) return desc;
  return desc.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function closestValidCategory(badCat) {
  // Simple: pick the valid category with the most shared words
  const badWords = new Set(badCat.toLowerCase().split(/\s+/));
  let best = VALID_CATEGORIES[0], bestScore = 0;
  for (const cat of VALID_CATEGORIES) {
    const shared = cat.toLowerCase().split(/\s+/).filter(w => badWords.has(w)).length;
    if (shared > bestScore) { bestScore = shared; best = cat; }
  }
  return best;
}

function readPostBody(filename) {
  try {
    const content = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
    const match   = content.match(/^---[\s\S]*?---\r?\n([\s\S]*)$/);
    return match ? match[1] : content;
  } catch { return ''; }
}

function imageFilePath(imagePath) {
  return path.join(REPO_ROOT, String(imagePath || '').replace(/^\/+/, ''));
}

function promptLikeAltTerms(text) {
  const lower = String(text || '').toLowerCase();
  return PROMPT_ALT_TERMS.filter(term => lower.includes(term));
}

function svgHasEmbeddedText(imagePath) {
  if (path.extname(String(imagePath || '')).toLowerCase() !== '.svg') return false;
  const filePath = imageFilePath(imagePath);
  if (!fs.existsSync(filePath)) return false;
  return /<text(?:\s|>)/i.test(fs.readFileSync(filePath, 'utf8'));
}

function sectionWordCounts(body) {
  const paras = body.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  if (paras.length === 0) return { intro: 0, body: 0, conclusion: 0 };
  const wordCount = p => p.replace(/[#*`_]/g, '').split(/\s+/).filter(Boolean).length;
  const intro      = wordCount(paras[0]);
  const conclusion = paras.length > 1 ? wordCount(paras[paras.length - 1]) : 0;
  const body_wc    = paras.slice(1, -1).reduce((s, p) => s + wordCount(p), 0);
  return { intro, body: body_wc, conclusion };
}

function checkExistingIssue(postTitle) {
  try {
    const out = execSync(
      `gh issue list --repo ${REPO_SLUG} --state open --label "editorial-improvement" --search "${postTitle.slice(0, 40).replace(/"/g, '')}" --json number,title --limit 5`,
      { encoding: 'utf8', cwd: REPO_ROOT }
    );
    const issues = JSON.parse(out);
    return issues.find(i => i.title.includes(postTitle.slice(0, 30)));
  } catch { return null; }
}

// ── Action plan builders ───────────────────────────────────────────────────────

function buildActions(result, allResults) {
  const actions = [];
  const { fm, body, filename } = result;
  const postBody   = readPostBody(filename);
  const postKws    = keywords(postBody);
  const sections   = sectionWordCounts(postBody);

  // Pre-compute link candidates (other posts by keyword similarity)
  const linkCandidates = allResults
    .filter(r => r.filename !== filename)
    .map(r => {
      const otherBody = readPostBody(r.filename);
      const sim       = jaccard(postKws, keywords(otherBody));
       const url       = permalinkFromPost(r.filename, r.fm);
      return { url, title: r.fm?.title || r.filename, sim: Math.round(sim * 100) };
    })
    .filter(c => c.sim > 10 && c.url)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3);

  // ── Front matter ────────────────────────────────────────────────────────────
  const REQUIRED = ['title', 'date', 'author', 'categories', 'image', 'image_alt', 'image_caption', 'description'];
  for (const field of REQUIRED) {
    const val = fm[field];
    const missing = !val || (Array.isArray(val) ? val.length === 0 : String(val).trim() === '');
    if (missing) {
      actions.push({
        dimension:          'front_matter',
        priority:           1,
        deficit:            `Missing \`${field}\` field`,
        instruction:        `Add \`${field}: \` to the front matter. ${field === 'description' ? 'Write a 120–160 character summary of the post\'s key insight.' : ''}`,
        estimatedScoreDelta: 3,
      });
    }
  }

  // ── Category compliance ──────────────────────────────────────────────────────
  const cats = Array.isArray(fm.categories) ? fm.categories : [fm.categories].filter(Boolean);
  const invalidCats = cats.filter(c => !VALID_CATEGORIES.includes(c));
  for (const bad of invalidCats) {
    const suggested = closestValidCategory(bad);
    actions.push({
      dimension:          'category',
      priority:           1,
      deficit:            `Non-standard category: \`${bad}\``,
      instruction:        `Replace \`${bad}\` with \`${suggested}\` in the \`categories\` front matter field. Valid values: ${VALID_CATEGORIES.join(', ')}.`,
      estimatedScoreDelta: 10,
    });
  }

  // ── SEO: title length ────────────────────────────────────────────────────────
  const title = String(fm.title || '');
  if (title.length > 60) {
    actions.push({
      dimension:          'seo_title',
      priority:           2,
      deficit:            `Title is ${title.length} chars (target ≤ 60)`,
      instruction:        `Shorten the title to ≤ 60 characters. Current: "${title}". Consider: "${title.slice(0, 57)}…" or rephrase to be more concise.`,
      estimatedScoreDelta: 3,
    });
  }

  // ── SEO: description length ──────────────────────────────────────────────────
  const desc = String(fm.description || fm.summary || '');
  if (desc.length > 160) {
    const suggested = truncateDesc(desc);
    actions.push({
      dimension:          'seo_description',
      priority:           2,
      deficit:            `Description is ${desc.length} chars (target ≤ 160)`,
      instruction:        `Trim the \`description\` field to ≤ 160 characters. Suggested: "${suggested}"`,
      estimatedScoreDelta: 3,
    });
  }

  // ── Image validation ─────────────────────────────────────────────────────────
  const imgPath = String(fm.image || '');
  if (imgPath && path.basename(imgPath) !== 'blog-default.svg') {
    const altText = String(fm.image_alt || '').trim();
    const imageCaption = String(fm.image_caption || '').trim();
    const imgExt = path.extname(imgPath).toLowerCase();
    const base    = path.basename(imgPath).replace(/\.[^.]+$/, '');
    const pngPath = path.join(REPO_ROOT, 'assets', 'images', `${base}.png`);
    const webpPath= path.join(REPO_ROOT, 'assets', 'images', `${base}.webp`);
    const sourcePath = imageFilePath(imgPath);

    if (!altText) {
      actions.push({
        dimension:          'image_alt',
        priority:           1,
        deficit:            'Missing `image_alt` field',
        instruction:        'Add concise alt text that describes the visible scene in reader-facing language. Do not paste image-generation prompt text, style notes, or rendering instructions into `image_alt`.',
        estimatedScoreDelta: 7,
      });
    } else {
      const promptTerms = promptLikeAltTerms(altText);
      if (promptTerms.length) {
        actions.push({
          dimension:          'image_alt_quality',
          priority:           1,
          deficit:            `\`image_alt\` contains prompt/style terms: ${promptTerms.join(', ')}`,
          instruction:        'Rewrite `image_alt` as a concise scene description. Keep art direction, rendering style, palette, and prompt vocabulary out of the alt text.',
          estimatedScoreDelta: 6,
        });
      }
    }

    if (!imageCaption) {
      actions.push({
        dimension:          'image_caption',
        priority:           1,
        deficit:            'Missing `image_caption` field',
        instruction:        'Add an `image_caption` that explains the editorial point of the hero image in one short line.',
        estimatedScoreDelta: 8,
      });
    } else if (/^(illustration|photo|chart)$/i.test(imageCaption)) {
      actions.push({
        dimension:          'image_caption_quality',
        priority:           2,
        deficit:            '`image_caption` is too generic',
        instruction:        'Replace the generic caption with a short editorial caption that explains the story the image is telling.',
        estimatedScoreDelta: 4,
      });
    }

    if (!fs.existsSync(sourcePath)) {
      actions.push({
        dimension:          'image_file',
        priority:           1,
        deficit:            `Image not found: ${imgPath}`,
        instruction:        `Add the hero image file at \`${imgPath}\` or update the front matter to the correct asset path.`,
        estimatedScoreDelta: 8,
      });
    } else if (imgExt === '.svg') {
      if (svgHasEmbeddedText(imgPath)) {
        actions.push({
          dimension:          'image_svg_text',
          priority:           1,
          deficit:            'SVG hero contains embedded text',
          instruction:        'Remove embedded text from the SVG hero art. Economist-style theme images should carry the story visually, not through labels or copy inside the image.',
          estimatedScoreDelta: 7,
        });
      }
    } else {
      if (!fs.existsSync(pngPath)) {
        actions.push({
          dimension:          'image_png',
          priority:           1,
          deficit:            `PNG not found: assets/images/${base}.png`,
          instruction:        `Add a PNG image at \`assets/images/${base}.png\`. Recommended: 1200×630px, compressed. Run \`cwebp assets/images/${base}.png -o assets/images/${base}.webp\` to generate WebP.`,
          estimatedScoreDelta: 7,
        });
      } else if (!fs.existsSync(webpPath)) {
        actions.push({
          dimension:          'image_webp',
          priority:           1,
          deficit:            `WebP not found: assets/images/${base}.webp`,
          instruction:        `Generate the WebP version: \`cwebp assets/images/${base}.png -o assets/images/${base}.webp\`. Required by \`_includes/responsive-image.html\` to avoid sitewide HTML-Proofer failures.`,
          estimatedScoreDelta: 8,
        });
      }
    }
  }

  // ── Content length ───────────────────────────────────────────────────────────
  const totalWords = result.words;
  if (totalWords < 800) {
    const deficit   = 800 - totalWords;
    const thinParts = [];
    if (sections.intro    < 50)  thinParts.push(`intro (${sections.intro} words — target ≥ 50)`);
    if (sections.body     < 400) thinParts.push(`body (${sections.body} words — target ≥ 400)`);
    if (sections.conclusion < 50) thinParts.push(`conclusion (${sections.conclusion} words — target ≥ 50)`);

    const cats2 = Array.isArray(fm.categories) ? fm.categories : [fm.categories].filter(Boolean);
    const validCat = cats2.find(c => VALID_CATEGORIES.includes(c)) || cats2[0];
    const dataSources = CATEGORY_DATA_SOURCES[validCat] || 'DORA, ISTQB, Gartner';

    actions.push({
      dimension:          'content_length',
      priority:           2,
      deficit:            `${totalWords} words (minimum 800, target 800–1500)`,
      instruction:        `Expand by ~${deficit} words. Thin sections: ${thinParts.length ? thinParts.join('; ') : 'distribute evenly'}. Suggested approach: add a concrete real-world example, or one data point with analysis. Relevant data sources for this category: ${dataSources}.`,
      estimatedScoreDelta: totalWords < 600 ? 15 : 7,
    });
  }

  // ── Excerpt quality ──────────────────────────────────────────────────────────
  if (sections.intro < 50 && sections.intro > 0) {
    actions.push({
      dimension:          'excerpt',
      priority:           3,
      deficit:            `Opening paragraph is ${sections.intro} words (target ≥ 50)`,
      instruction:        `Strengthen the opening paragraph to ≥ 50 words. It should state the key insight immediately, supported by a specific data point or provocative claim. The Economist style: lead with the finding, not the context.`,
      estimatedScoreDelta: 5,
    });
  }

  // ── Internal links ───────────────────────────────────────────────────────────
  if (result.internalLinks === 0) {
    const candidateText = linkCandidates.length > 0
      ? linkCandidates.map(c => `\`${c.url}\` — "${c.title}" (${c.sim}% keyword overlap)`).join('; ')
      : 'no strong candidates found — link to the most topically related post';
    actions.push({
      dimension:          'internal_links',
      priority:           3,
      deficit:            'No internal links to other posts',
      instruction:        `Add at least 1 contextual link to a related post. Top candidates by keyword similarity: ${candidateText}.`,
      estimatedScoreDelta: 10,
    });
  }

  // ── Citations ────────────────────────────────────────────────────────────────
  if (result.citations < 3) {
    const needed     = 3 - result.citations;
    const cats3      = Array.isArray(fm.categories) ? fm.categories : [fm.categories].filter(Boolean);
    const validCat2  = cats3.find(c => VALID_CATEGORIES.includes(c)) || cats3[0];
    const dataSrc    = CATEGORY_DATA_SOURCES[validCat2] || 'DORA, ISTQB, Gartner';
    actions.push({
      dimension:          'citations',
      priority:           3,
      deficit:            `${result.citations} citation(s) found (target ≥ 3)`,
      instruction:        `Add ${needed} more source reference(s). Use inline markdown links to external sources or parenthetical citations. Recommended sources for this category: ${dataSrc}.`,
      estimatedScoreDelta: needed >= 3 ? 10 : 5,
    });
  }

  // Sort by estimatedScoreDelta descending (highest impact first), then priority
  actions.sort((a, b) =>
    b.estimatedScoreDelta - a.estimatedScoreDelta || a.priority - b.priority
  );

  // Number the actions
  actions.forEach((a, i) => { a.priority = i + 1; });

  return actions;
}

// ── Issue body builder ────────────────────────────────────────────────────────

function buildIssueBody(plan) {
  const { file, currentScore, targetScore, actions } = plan;
  const slug = permalinkFromPost(path.basename(file), plan.fm || {});
  let md = `## Post\n\n`;
  md += `**File**: \`${file}\`\n`;
  if (slug) md += `**URL**: \`${slug}\`\n`;
  md += `**Current score**: ${currentScore}/100  →  **Target**: ${targetScore}/100\n\n`;
  md += `## Improvement Actions\n\n`;
  md += `_Sorted by estimated score impact, highest first._\n\n`;

  for (const a of actions) {
    const delta = a.estimatedScoreDelta > 0 ? `+${a.estimatedScoreDelta} pts` : '';
    md += `### ${a.priority}. ${titleCase(a.dimension.replace(/_/g, ' '))}  ${delta ? `(${delta})` : ''}\n\n`;
    md += `**Deficit**: ${a.deficit}\n\n`;
    md += `**Action**: ${a.instruction}\n\n`;
  }

  const totalDelta = actions.reduce((s, a) => s + (a.estimatedScoreDelta || 0), 0);
  md += `---\n`;
  md += `_Estimated score after all fixes: ${Math.min(currentScore + totalDelta, 100)}/100_\n\n`;
  md += `> This issue was auto-generated by \`scripts/content-remediation.js\`. `;
  md += `After implementing fixes, open a PR referencing this issue.\n`;
  return md;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(REVIEW_FILE)) {
    console.error(`ERROR: ${REVIEW_FILE} not found. Run scripts/content-review.js first.`);
    process.exit(1);
  }

  const reviewData = JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf8'));
  const allResults = reviewData.results || [];

  // Attach raw body text for keyword analysis
  const enriched = allResults.map(r => ({
    ...r,
    _body: readPostBody(r.filename),
  }));

  // Build queue: posts below threshold only
  const queue = enriched
    .filter(r => r.score < THRESHOLD)
    .sort((a, b) => a.score - b.score)
    .map(r => {
      const actions = buildActions(r, allResults);
      const totalDelta = actions.reduce((s, a) => s + (a.estimatedScoreDelta || 0), 0);
      return {
        file:         `_posts/${r.filename}`,
        title:        r.fm?.title || r.filename,
        fm:           r.fm || {},
        currentScore: r.score,
        targetScore:  Math.min(r.score + totalDelta, 100),
        actionCount:  actions.length,
        actions,
      };
    });

  const output = {
    generatedAt:   new Date().toISOString(),
    threshold:     THRESHOLD,
    postsInQueue:  queue.length,
    queue,
  };

  console.error(`Posts below threshold (${THRESHOLD}): ${queue.length} of ${allResults.length}`);
  for (const item of queue) {
    console.error(`  ${item.currentScore}/100 → ${item.targetScore}/100  ${item.title}`);
  }

  if (DRY_RUN) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(output, null, 2));
  console.error(`\nWritten: ${QUEUE_FILE}`);

  if (NO_ISSUES || queue.length === 0) return;

  // File one GitHub issue per post (idempotent — skip if open issue already exists)
  console.error('\nFiling GitHub improvement issues…');
  let filed = 0, skipped = 0;

  for (const plan of queue) {
    const existing = checkExistingIssue(plan.title);
    if (existing) {
      console.error(`  SKIP  #${existing.number} already open for "${plan.title.slice(0, 40)}"`);
      skipped++;
      continue;
    }

    const issueTitle = `[Editorial] Improve: "${plan.title}" (score: ${plan.currentScore} → ${plan.targetScore})`;
    const issueBody  = buildIssueBody(plan);

    try {
      const url = execSync(
        `gh issue create --repo ${REPO_SLUG} --title "${issueTitle.replace(/"/g, '\\"')}" --body-file - --label "agent:editorial-chief,editorial-improvement"`,
        { input: issueBody, encoding: 'utf8', cwd: REPO_ROOT }
      ).trim();
      console.error(`  FILED  ${url}`);
      filed++;
    } catch (err) {
      console.error(`  ERROR  Could not file issue for "${plan.title}": ${err.message}`);
    }
  }

  console.error(`\nDone: ${filed} issues filed, ${skipped} skipped (already open).`);
}

main();
