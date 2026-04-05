#!/usr/bin/env node
/**
 * Content Review Script
 * Scores every blog post against editorial standards and produces a report.
 * Called by .github/workflows/content-review.yml
 *
 * Exit codes:
 *   0 – report produced (even if issues found)
 *   1 – fatal error (cannot read posts directory, etc.)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const POSTS_DIR = path.join(__dirname, '..', '_posts');
const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');

const VALID_CATEGORIES = [
  'Quality Engineering',
  'Software Engineering',
  'Test Automation',
  'Security',
];

const REQUIRED_FRONT_MATTER = [
  'layout',
  'title',
  'date',
  'author',
  'categories',
  'tags',
  'image',
  'description',
];

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;
const WORD_COUNT_MIN = 800;
const WORD_COUNT_MAX = 1500;
const FRESHNESS_MONTHS = 6;
const DUPLICATE_THRESHOLD = 0.6; // 60 % similarity
const CATEGORY_DOMINANCE_THRESHOLD = 0.7; // 70 % one category
const MIN_CITATIONS = 3;

// ─── YAML front-matter parser (tiny, no external deps) ───────────────────────

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: content };

  const raw = match[1];
  const body = content.slice(match[0].length).trimStart();
  const data = {};

  let currentKey = null;
  let inList = false;

  for (const line of raw.split('\n')) {
    // Inline array: key: [a, b, c]
    const inlineArr = line.match(/^(\w[\w_-]*):\s*\[([^\]]*)\]\s*$/);
    if (inlineArr) {
      data[inlineArr[1]] = inlineArr[2]
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''));
      currentKey = null;
      inList = false;
      continue;
    }

    // Key-value
    const kv = line.match(/^(\w[\w_-]*):\s*(.*)/);
    if (kv) {
      const val = kv[2].trim().replace(/^["']|["']$/g, '');
      data[kv[1]] = val === '' ? null : val;
      currentKey = kv[1];
      inList = false;
      continue;
    }

    // List item
    const li = line.match(/^\s+-\s+(.*)/);
    if (li && currentKey) {
      if (!inList) {
        data[currentKey] = [];
        inList = true;
      }
      if (Array.isArray(data[currentKey])) {
        data[currentKey].push(li[1].trim().replace(/^["']|["']$/g, ''));
      }
      continue;
    }

    inList = false;
  }

  return { data, body };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countWords(text) {
  return text
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/`[^`]*`/g, '')        // strip inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // strip images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // keep link text
    .replace(/[#*_~>]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function cosineSimilarity(a, b) {
  const tokenise = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const ta = tokenise(a);
  const tb = tokenise(b);
  const all = [...new Set([...ta, ...tb])];
  const freq = (tokens) => {
    const f = {};
    tokens.forEach((t) => { f[t] = (f[t] || 0) + 1; });
    return f;
  };
  const fa = freq(ta);
  const fb = freq(tb);
  let dot = 0, na = 0, nb = 0;
  for (const w of all) {
    const va = fa[w] || 0;
    const vb = fb[w] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function imageBaseName(imagePath) {
  return path.basename(imagePath, path.extname(imagePath));
}

function monthsAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth())
  );
}

// ─── Per-article scoring ─────────────────────────────────────────────────────

function scorePost(file, data, body) {
  const issues = [];   // { severity: 'critical'|'warning'|'info', message }
  let score = 100;

  // 1. Front matter completeness
  for (const field of REQUIRED_FRONT_MATTER) {
    if (!data[field]) {
      issues.push({ severity: 'critical', message: `Missing front matter field: \`${field}\`` });
      score -= 10;
    }
  }

  // ai_assisted is optional but noted when absent
  if (data.ai_assisted === undefined || data.ai_assisted === null) {
    issues.push({ severity: 'info', message: 'Front matter field `ai_assisted` not set' });
  }

  // 2. Image validation
  const imagePath = data.image || '';
  if (!imagePath) {
    issues.push({ severity: 'critical', message: 'No image specified in front matter' });
    score -= 15;
  } else if (imagePath.includes('blog-default.svg')) {
    issues.push({ severity: 'critical', message: 'Using default placeholder image (`blog-default.svg`)' });
    score -= 10;
  } else {
    const base = imageBaseName(imagePath);
    const pngExists = fs.existsSync(path.join(IMAGES_DIR, `${base}.png`));
    const webpExists = fs.existsSync(path.join(IMAGES_DIR, `${base}.webp`));
    if (!pngExists) {
      issues.push({ severity: 'critical', message: `Image file not found: \`assets/images/${base}.png\`` });
      score -= 10;
    }
    if (!webpExists) {
      issues.push({ severity: 'warning', message: `WebP variant not found: \`assets/images/${base}.webp\`` });
      score -= 3;
    }
  }

  // 3. Category compliance
  const cats = Array.isArray(data.categories)
    ? data.categories
    : data.categories
    ? [data.categories]
    : [];

  const validCats = cats.filter((c) => VALID_CATEGORIES.includes(c));
  const invalidCats = cats.filter((c) => !VALID_CATEGORIES.includes(c));

  if (cats.length === 0) {
    issues.push({ severity: 'critical', message: 'No categories defined' });
    score -= 10;
  } else if (validCats.length === 0) {
    issues.push({ severity: 'critical', message: `Invalid category/categories: ${invalidCats.map((c) => `\`${c}\``).join(', ')}` });
    score -= 10;
  } else {
    if (invalidCats.length > 0) {
      issues.push({ severity: 'warning', message: `Unrecognised category/categories (will be ignored): ${invalidCats.map((c) => `\`${c}\``).join(', ')}` });
      score -= 3;
    }
    if (validCats.length > 1) {
      issues.push({ severity: 'warning', message: `More than one valid category assigned (${validCats.join(', ')}); convention is exactly one` });
      score -= 2;
    }
  }

  // 4. SEO checks
  const title = data.title || '';
  const description = data.description || '';

  if (title.length > SEO_TITLE_MAX) {
    issues.push({ severity: 'warning', message: `Title is ${title.length} chars (max ${SEO_TITLE_MAX})` });
    score -= 5;
  }
  if (!description) {
    issues.push({ severity: 'critical', message: 'Missing `description` field (required for SEO)' });
    score -= 10;
  } else if (description.length > SEO_DESC_MAX) {
    issues.push({ severity: 'warning', message: `Description is ${description.length} chars (max ${SEO_DESC_MAX})` });
    score -= 3;
  }

  // Heading hierarchy: H1 should not appear in body (it's the title); check H2→H3
  const h1InBody = (body.match(/^#{1}\s/gm) || []).length;
  if (h1InBody > 0) {
    issues.push({ severity: 'warning', message: 'H1 found in post body; title is the H1 — use H2/H3 for sections' });
    score -= 3;
  }

  const headings = [];
  for (const m of body.matchAll(/^(#{1,6})\s/gm)) {
    headings.push(m[1].length);
  }
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      issues.push({ severity: 'warning', message: 'Heading hierarchy skips a level (e.g., H2 → H4)' });
      score -= 2;
      break;
    }
  }

  // 5. Content length
  const wordCount = countWords(body);
  if (wordCount < WORD_COUNT_MIN) {
    issues.push({ severity: 'warning', message: `Word count ${wordCount} is below minimum ${WORD_COUNT_MIN}` });
    score -= 5;
  } else if (wordCount > WORD_COUNT_MAX) {
    issues.push({ severity: 'info', message: `Word count ${wordCount} exceeds recommended maximum ${WORD_COUNT_MAX}` });
  }

  // 6. Excerpt quality (first paragraph as hook)
  const firstPara = body.split(/\n\s*\n/)[0] || '';
  const firstParaWords = countWords(firstPara);
  if (firstParaWords < 20) {
    issues.push({ severity: 'warning', message: `Opening paragraph is very short (${firstParaWords} words); it should work as a standalone hook` });
    score -= 3;
  }

  // 7. Internal links
  const internalLinks = [...body.matchAll(/\[.*?\]\(\/[^)]*\)/g)];
  if (internalLinks.length === 0) {
    issues.push({ severity: 'warning', message: 'No internal links found; add at least one link to a related post' });
    score -= 5;
  }

  // 8. Citations (lines/paragraphs referencing external data sources)
  // Detect citation-like patterns: "according to", "per ", "found that", "reported", URLs in parens, etc.
  const citationPatterns = [
    /according to/i,
    /\bper\b .{0,40}(?:survey|report|study|research|data)/i,
    /found that/i,
    /reported(?: that)?/i,
    /published(?: in| data| research)?/i,
    /https?:\/\//,
    /\[\d+\]/,
  ];
  const citationCount = citationPatterns.reduce((acc, re) => {
    const matches = body.match(new RegExp(re.source, 'gi')) || [];
    return acc + matches.length;
  }, 0);

  if (citationCount < MIN_CITATIONS) {
    issues.push({ severity: 'warning', message: `Fewer than ${MIN_CITATIONS} citation-style references detected (found ~${citationCount})` });
    score -= 5;
  }

  return { score: Math.max(0, score), wordCount, issues };
}

// ─── Load all posts ───────────────────────────────────────────────────────────

function loadPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    return { filename, data, body, raw };
  });
}

// ─── Cross-article checks ────────────────────────────────────────────────────

function crossArticleChecks(posts) {
  const warnings = [];

  // 9. Duplicate / near-duplicate detection
  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const a = posts[i];
      const b = posts[j];
      const titleSim = cosineSimilarity(a.data.title || '', b.data.title || '');
      // Use first 500 words of body for content comparison (performance)
      const bodyA = (a.body || '').split(/\s+/).slice(0, 500).join(' ');
      const bodyB = (b.body || '').split(/\s+/).slice(0, 500).join(' ');
      const bodySim = cosineSimilarity(bodyA, bodyB);
      const sim = Math.max(titleSim, bodySim);
      if (sim >= DUPLICATE_THRESHOLD) {
        warnings.push({
          type: 'duplicate',
          message: `**Possible duplicate** (${Math.round(sim * 100)}% similarity): \`${a.filename}\` ↔ \`${b.filename}\``,
        });
      }
    }
  }

  // 10. Topic coverage distribution
  const catCounts = {};
  for (const post of posts) {
    const cats = Array.isArray(post.data.categories)
      ? post.data.categories
      : post.data.categories
      ? [post.data.categories]
      : [];
    const primary = cats.find((c) => VALID_CATEGORIES.includes(c));
    if (primary) catCounts[primary] = (catCounts[primary] || 0) + 1;
  }
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const [cat, count] of Object.entries(catCounts)) {
      if (count / total >= CATEGORY_DOMINANCE_THRESHOLD) {
        warnings.push({
          type: 'coverage',
          message: `**Category dominance**: \`${cat}\` accounts for ${Math.round((count / total) * 100)}% of posts (threshold: ${Math.round(CATEGORY_DOMINANCE_THRESHOLD * 100)}%)`,
        });
      }
    }
  }

  // 11. Freshness
  const now = new Date();
  for (const post of posts) {
    if (!post.data.date) continue;
    const age = monthsAgo(post.data.date);
    if (age >= FRESHNESS_MONTHS) {
      warnings.push({
        type: 'freshness',
        message: `**Stale post** (${age} months old, no updates noted): \`${post.filename}\``,
      });
    }
  }

  return warnings;
}

// ─── Report generation ────────────────────────────────────────────────────────

function buildReport(posts, crossWarnings) {
  const now = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push(`# 📋 Content Review Report — ${now}`);
  lines.push('');
  lines.push('> Auto-generated by `scripts/content-review.js`. Scores are 0–100; 100 = fully compliant.');
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Post | Score | Words | Critical | Warnings |');
  lines.push('|------|-------|-------|----------|----------|');

  const results = [];
  for (const post of posts) {
    const { score, wordCount, issues } = scorePost(post.filename, post.data, post.body);
    const critical = issues.filter((i) => i.severity === 'critical').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    results.push({ post, score, wordCount, issues, critical, warnings });
    const slug = post.filename.replace(/\.md$/, '');
    lines.push(`| \`${slug}\` | ${score} | ${wordCount} | ${critical} | ${warnings} |`);
  }

  lines.push('');

  // Per-article detail
  lines.push('## Per-article detail');
  lines.push('');

  const criticalPosts = [];

  for (const { post, score, wordCount, issues } of results) {
    lines.push(`### \`${post.filename}\``);
    lines.push('');
    lines.push(`**Score:** ${score}/100 &nbsp; **Words:** ${wordCount}`);
    lines.push('');

    if (issues.length === 0) {
      lines.push('✅ No issues found.');
    } else {
      for (const issue of issues) {
        const emoji = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
        lines.push(`- ${emoji} ${issue.message}`);
      }
    }
    lines.push('');

    const crits = issues.filter((i) => i.severity === 'critical');
    if (crits.length > 0) {
      criticalPosts.push({ filename: post.filename, score, crits });
    }
  }

  // Cross-article section
  lines.push('## Cross-article checks');
  lines.push('');
  if (crossWarnings.length === 0) {
    lines.push('✅ No cross-article issues found.');
  } else {
    for (const w of crossWarnings) {
      lines.push(`- ${w.message}`);
    }
  }
  lines.push('');

  // Critical failures summary
  if (criticalPosts.length > 0) {
    lines.push('## 🔴 Critical failures');
    lines.push('');
    lines.push('The following posts have critical issues that must be resolved:');
    lines.push('');
    for (const { filename, score, crits } of criticalPosts) {
      lines.push(`**\`${filename}\`** (score: ${score})`);
      for (const c of crits) {
        lines.push(`  - ${c.message}`);
      }
      lines.push('');
    }
  }

  // Category distribution
  const catCounts = {};
  for (const post of posts) {
    const cats = Array.isArray(post.data.categories)
      ? post.data.categories
      : post.data.categories
      ? [post.data.categories]
      : [];
    const primary = cats.find((c) => VALID_CATEGORIES.includes(c));
    if (primary) catCounts[primary] = (catCounts[primary] || 0) + 1;
  }
  lines.push('## Category distribution');
  lines.push('');
  lines.push('| Category | Posts | % |');
  lines.push('|----------|-------|---|');
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;
  for (const cat of VALID_CATEGORIES) {
    const n = catCounts[cat] || 0;
    lines.push(`| ${cat} | ${n} | ${Math.round((n / total) * 100)}% |`);
  }
  lines.push('');

  // Scores histogram
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
      : 0;
  lines.push(`**Average score:** ${avgScore}/100 across ${results.length} posts.`);
  lines.push('');
  lines.push('---');
  lines.push('_Generated by the Content Review workflow. Label: `content-review`_');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`ERROR: Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  const posts = loadPosts();
  if (posts.length === 0) {
    console.warn('No posts found — nothing to review.');
    process.exit(0);
  }

  console.error(`Reviewing ${posts.length} posts…`);

  const crossWarnings = crossArticleChecks(posts);
  const report = buildReport(posts, crossWarnings);

  // Write report to stdout (workflow captures it)
  process.stdout.write(report + '\n');

  // Also write to a file for the artifact upload
  const outPath = path.join(__dirname, '..', 'content-review-report.md');
  fs.writeFileSync(outPath, report, 'utf8');
  console.error(`Report written to ${outPath}`);
}

main();
