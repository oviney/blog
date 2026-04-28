#!/usr/bin/env node
/**
 * content-review.js — Score all blog posts against editorial standards.
 *
 * Closes: https://github.com/oviney/blog/issues/568
 *
 * Scoring (0–100 per post):
 *   15 pts — Front matter completeness
 *   15 pts — Image validation (file exists, PNG + WebP, not default)
 *   10 pts — Category compliance (valid category from allowed list)
 *   15 pts — SEO (title length, description length, heading hierarchy)
 *   15 pts — Content length (800–1500 words)
 *   10 pts — Excerpt quality (first paragraph ≥ 50 words)
 *   10 pts — Internal links (≥ 1 link to another post)
 *   10 pts — Citations (≥ 3 references with sources)
 *
 * Cross-article checks (flags only):
 *   — Topic uniqueness  : posts with > 60% title-word similarity
 *   — Topic coverage    : if one category > 70% of posts
 *   — Freshness         : posts older than 6 months with no update
 *
 * Usage:
 *   node scripts/content-review.js [--dry-run] [--json]
 *
 *   --dry-run  Print report; do not create a GitHub issue.
 *   --json     Also write results to content-review-results.json.
 *
 * Normal non-dry runs always refresh content-review-results.json so downstream
 * automation (for example content-remediation.js and dashboard generation) can
 * consume the latest scores without relying on a caller-specific flag.
 *
 * Dependencies: Node.js built-ins only (fs, path, child_process).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Configuration ─────────────────────────────────────────────────────────────

const REPO_ROOT      = path.resolve(__dirname, '..');
const POSTS_DIR      = path.join(REPO_ROOT, '_posts');
const IMAGES_DIR     = path.join(REPO_ROOT, 'assets', 'images');
const RESULTS_FILE   = path.join(REPO_ROOT, 'content-review-results.json');

const VALID_CATEGORIES = [
  'Quality Engineering',
  'Software Engineering',
  'Test Automation',
  'Security',
];

const REQUIRED_FIELDS = ['title', 'date', 'author', 'categories', 'image', 'image_alt', 'image_caption', 'description'];
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

const ARGS     = process.argv.slice(2);
const DRY_RUN  = ARGS.includes('--dry-run');
const JSON_OUT = ARGS.includes('--json');

// ── Front matter parser ───────────────────────────────────────────────────────

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { fm: {}, body: content };

  const raw  = match[1];
  const body = content.slice(match[0].length).trim();
  const fm   = {};

  const lines = raw.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Block array:  key:\n  - val
    const blockKey = line.match(/^(\w[\w-]*):\s*$/);
    if (blockKey) {
      const key   = blockKey[1];
      const items = [];
      i++;
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s*/, '').replace(/^["']|["']$/g, '').trim());
        i++;
      }
      if (items.length) { fm[key] = items; continue; }
      fm[key] = null;
      continue;
    }

    // key: value  (scalar or inline array)
    const scalarMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (scalarMatch) {
      const key = scalarMatch[1];
      let   val = scalarMatch[2].trim();

      // Inline array:  ["a", "b"]  or  [a, b]
      if (/^\[/.test(val)) {
        val = val.replace(/^\[|\]$/g, '');
        fm[key] = val.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        i++;
        continue;
      }

      // Strip surrounding quotes
      val = val.replace(/^["']|["']$/g, '');
      fm[key] = val || null;
      i++;
      continue;
    }

    i++;
  }

  // Normalise common aliases
  if (!fm.description && fm.summary) fm.description = fm.summary;

  return { fm, body };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function wordCount(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')   // strip code blocks
    .replace(/`[^`]+`/g, '')          // strip inline code
    .replace(/!\[.*?\]\(.*?\)/g, '')  // strip images
    .replace(/\[.*?\]\(.*?\)/g, 'LINK')
    .replace(/#+\s/g, '')
    .replace(/[*_~]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0).length;
}

function excerptText(block) {
  return String(block || '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')
    .replace(/[*_~`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSourceOnlyParagraph(block) {
  const text = excerptText(block).toLowerCase();
  return /^source:\s+/.test(text) || /^illustration:\s+/.test(text);
}

function firstParagraph(body) {
  const paras = body.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  // Skip headings, figures, images, and standalone source/credit lines.
  for (const p of paras) {
    const cleaned = excerptText(p);
    if (
      !p.startsWith('#') &&
      !p.startsWith('---') &&
      !p.startsWith('<figure') &&
      !p.startsWith('![') &&
      cleaned.length > 20 &&
      !isSourceOnlyParagraph(p)
    ) {
      return cleaned;
    }
  }
  return '';
}

function extractHeadings(body) {
  return (body.match(/^(#{1,6})\s+/gm) || []).map(h => h.trim().length);
}

function countInternalLinks(body) {
  const links = (body.match(/\[.*?\]\((.*?)\)/g) || []);
  return links.filter(l => {
    const url = l.match(/\(([^)]+)\)/)[1];
    return /\/(20\d\d)\//.test(url) || /^\/(?!http)/.test(url);
  }).length;
}

function countCitations(body) {
  // Count markdown links, parenthetical citations, and explicit source mentions
  const mdLinks     = (body.match(/\[.+?\]\(https?:\/\//g) || []).length;
  const parenCites  = (body.match(/\([^)]*(?:20\d\d|19\d\d)[^)]*\)/g) || []).length;
  const sourceMentions = (body.match(/\b(?:according to|source:|reference:|ibid|et al\.|reports?|found that|published|survey|study|data from)\b/gi) || []).length;
  return mdLinks + parenCites + Math.min(sourceMentions, 5);
}

function titleSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  if (wordsA.size === 0 && wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function imageBase(imagePath) {
  return path.basename(imagePath || '');
}

function imageExists(imagePath, ext) {
  if (!imagePath) return false;
  const base = imageBase(imagePath).replace(/\.[^.]+$/, '');
  return fs.existsSync(path.join(IMAGES_DIR, `${base}${ext}`));
}

function imageFileExists(imagePath) {
  if (!imagePath) return false;
  return fs.existsSync(path.join(REPO_ROOT, imagePath.replace(/^\/+/, '')));
}

function promptLikeAltTerms(text) {
  const lower = String(text || '').toLowerCase();
  return PROMPT_ALT_TERMS.filter(term => lower.includes(term));
}

function imageHasEmbeddedText(imagePath) {
  if (path.extname(imagePath || '').toLowerCase() !== '.svg' || !imageFileExists(imagePath)) return false;
  const raw = fs.readFileSync(path.join(REPO_ROOT, imagePath.replace(/^\/+/, '')), 'utf8');
  return /<text(?:\s|>)/i.test(raw);
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scorePost(fm, body, filename) {
  const issues   = [];
  const warnings = [];
  let   score    = 0;

  // ── 1. Front matter completeness (15 pts, 2.5 per field) ──────────────────
  const fmPts = 15 / REQUIRED_FIELDS.length;
  let   fmScore = 0;
  for (const field of REQUIRED_FIELDS) {
    const val = fm[field];
    if (val && (Array.isArray(val) ? val.length > 0 : String(val).trim().length > 0)) {
      fmScore += fmPts;
    } else {
      issues.push(`Missing front matter field: \`${field}\``);
    }
  }
  score += Math.round(fmScore);

  // ── 2. Image validation (15 pts) ──────────────────────────────────────────
  const imgPath = fm.image || '';
  const imgBase = imageBase(imgPath);
  const imgExt = path.extname(imgPath).toLowerCase();
  const altText = String(fm.image_alt || '').trim();
  const imageCaption = String(fm.image_caption || '').trim();
  if (!imgPath) {
    issues.push('No `image` field in front matter');
  } else if (imgBase === 'blog-default.svg') {
    issues.push('Image is the default placeholder (`blog-default.svg`)');
  } else {
    let imgScore = 0;
    if (imageFileExists(imgPath)) {
      imgScore += 5;
    } else {
      issues.push(`Image file not found: \`${imgPath}\``);
    }

    if (imgExt === '.svg') {
      imgScore += 10;
      if (imageHasEmbeddedText(imgPath)) {
        issues.push('SVG hero image contains embedded text — keep hero artwork text-free');
      }
    } else {
      if (imageExists(imgPath, '.png')) {
        imgScore += 5;
      } else {
        issues.push(`PNG image not found: \`assets/images/${imgBase.replace(/\.[^.]+$/, '')}.png\``);
      }
      if (imageExists(imgPath, '.webp')) {
        imgScore += 5;
      } else {
        issues.push(`WebP image not found: \`assets/images/${imgBase.replace(/\.[^.]+$/, '')}.webp\``);
      }
    }
    score += imgScore;
  }

  if (!altText) {
    issues.push('Missing `image_alt` — add concise, reader-facing alt text');
  } else {
    const promptTerms = promptLikeAltTerms(altText);
    if (promptTerms.length > 0) {
      issues.push(`image_alt reads like prompt/style text (${promptTerms.join(', ')}) — describe the scene instead`);
    }
  }

  if (!imageCaption) {
    issues.push('Missing `image_caption` — explain the story the hero image tells');
  } else if (/^(illustration|photo|chart)$/i.test(imageCaption)) {
    warnings.push('image_caption is too generic — describe the image’s editorial point');
  }

  // ── 3. Category compliance (10 pts) ───────────────────────────────────────
  const cats = Array.isArray(fm.categories) ? fm.categories : [fm.categories].filter(Boolean);
  const validCats = cats.filter(c => VALID_CATEGORIES.includes(c));
  if (validCats.length === 0) {
    issues.push(`No valid category. Found: [${cats.join(', ')}]. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  } else {
    score += 10;
    if (cats.length > validCats.length) {
      const invalid = cats.filter(c => !VALID_CATEGORIES.includes(c));
      warnings.push(`Non-standard category values: [${invalid.join(', ')}]`);
    }
  }

  // ── 4. SEO (15 pts) ───────────────────────────────────────────────────────
  let seoScore = 0;
  const title = String(fm.title || '');
  if (title.length > 0 && title.length <= 60) {
    seoScore += 5;
  } else if (title.length > 60) {
    warnings.push(`Title is ${title.length} chars (target ≤ 60): "${title.slice(0, 60)}…"`);
    seoScore += 2; // partial credit
  }

  const desc = String(fm.description || '');
  if (desc.length > 0 && desc.length <= 160) {
    seoScore += 5;
  } else if (desc.length > 160) {
    warnings.push(`Description is ${desc.length} chars (target ≤ 160)`);
    seoScore += 2;
  }

  const headings = extractHeadings(body);
  if (headings.length >= 2) {
    seoScore += 3;
  } else {
    warnings.push('Fewer than 2 headings — consider adding section structure');
  }
  // Check for heading hierarchy gaps (e.g. H2 followed immediately by H4)
  let hierarchyOk = true;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) { hierarchyOk = false; break; }
  }
  if (hierarchyOk) seoScore += 2;
  else warnings.push('Heading hierarchy has gaps (e.g. H2 → H4)');

  score += seoScore;

  // ── 5. Content length (15 pts) ────────────────────────────────────────────
  const words = wordCount(body);
  if (words >= 800 && words <= 1500) {
    score += 15;
  } else if (words >= 600 && words < 800) {
    score += 8;
    warnings.push(`Content is ${words} words (target: 800–1500) — slightly short`);
  } else if (words > 1500 && words <= 2000) {
    score += 10;
    warnings.push(`Content is ${words} words (target: 800–1500) — slightly long`);
  } else if (words > 2000) {
    score += 5;
    warnings.push(`Content is ${words} words (target: 800–1500) — consider splitting`);
  } else {
    issues.push(`Content is only ${words} words (minimum: 800)`);
  }

  // ── 6. Excerpt quality (10 pts) ───────────────────────────────────────────
  const firstPara = firstParagraph(body);
  const firstParaWords = wordCount(firstPara);
  if (firstParaWords >= 50) {
    score += 10;
  } else if (firstParaWords >= 25) {
    score += 5;
    warnings.push(`Opening paragraph is only ${firstParaWords} words — aim for ≥ 50 for a strong hook`);
  } else {
    issues.push(`Opening paragraph is very short (${firstParaWords} words) — needs a compelling hook`);
  }

  // ── 7. Internal links (10 pts) ────────────────────────────────────────────
  const internalLinks = countInternalLinks(body);
  if (internalLinks >= 1) {
    score += 10;
  } else {
    warnings.push('No internal links to other posts — consider linking to related content');
  }

  // ── 8. Citations (10 pts) ─────────────────────────────────────────────────
  const citations = countCitations(body);
  if (citations >= 3) {
    score += 10;
  } else if (citations >= 1) {
    score += 5;
    warnings.push(`Only ${citations} citation(s) found (target: ≥ 3) — add more data/source references`);
  } else {
    issues.push('No citations or external references found — add data points with sources');
  }

  return { score: Math.min(score, 100), words, internalLinks, citations, issues, warnings };
}

// ── Cross-article analysis ────────────────────────────────────────────────────

function crossArticleChecks(posts) {
  const flags = [];

  // Topic uniqueness
  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const sim = titleSimilarity(posts[i].fm.title || '', posts[j].fm.title || '');
      if (sim > 0.6) {
        flags.push({
          type:    'duplicate',
          message: `High title similarity (${Math.round(sim * 100)}%) between:\n  - "${posts[i].fm.title}" (${posts[i].filename})\n  - "${posts[j].fm.title}" (${posts[j].filename})`,
        });
      }
    }
  }

  // Topic coverage
  const catCounts = {};
  for (const p of posts) {
    const cats = Array.isArray(p.fm.categories) ? p.fm.categories : [p.fm.categories].filter(Boolean);
    for (const c of cats) {
      if (VALID_CATEGORIES.includes(c)) catCounts[c] = (catCounts[c] || 0) + 1;
    }
  }
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
  for (const [cat, count] of Object.entries(catCounts)) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    if (pct > 70) {
      flags.push({
        type:    'coverage',
        message: `Category "${cat}" dominates at ${Math.round(pct)}% of posts (${count}/${total}) — consider diversifying topics`,
      });
    }
  }

  // Freshness — posts with no update in > 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  for (const p of posts) {
    const dateStr = p.fm.date ? String(p.fm.date).slice(0, 10) : null;
    if (dateStr) {
      const postDate = new Date(dateStr);
      if (postDate < sixMonthsAgo) {
        flags.push({
          type:    'freshness',
          message: `"${p.fm.title}" was published ${dateStr} (> 6 months ago) — consider a refresh or follow-up`,
        });
      }
    }
  }

  return { catCounts, flags };
}

// ── Report builder ────────────────────────────────────────────────────────────

function gradeLabel(score) {
  if (score >= 90) return '🟢 Excellent';
  if (score >= 75) return '🔵 Good';
  if (score >= 60) return '🟡 Needs Work';
  return '🔴 Critical';
}

function buildReport(results, cross) {
  const now = new Date().toISOString().slice(0, 10);
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const critical  = results.filter(r => r.score < 60);
  const needsWork = results.filter(r => r.score >= 60 && r.score < 75);
  const good      = results.filter(r => r.score >= 75 && r.score < 90);
  const excellent = results.filter(r => r.score >= 90);

  let md = `# Content Review Report — ${now}\n\n`;
  md += `> Auto-generated by \`scripts/content-review.js\`. Scores 0–100 across the editorial quality dimensions below.\n\n`;

  // Summary
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Posts reviewed | ${results.length} |\n`;
  md += `| Average score | **${avg}/100** |\n`;
  md += `| 🟢 Excellent (≥90) | ${excellent.length} |\n`;
  md += `| 🔵 Good (75–89) | ${good.length} |\n`;
  md += `| 🟡 Needs Work (60–74) | ${needsWork.length} |\n`;
  md += `| 🔴 Critical (<60) | ${critical.length} |\n\n`;

  // Category distribution
  md += `## Category Distribution\n\n`;
  for (const cat of VALID_CATEGORIES) {
    const count = cross.catCounts[cat] || 0;
    const pct   = results.length ? Math.round((count / results.length) * 100) : 0;
    const bar   = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');
    md += `| ${cat} | ${bar} ${count} posts (${pct}%) |\n`;
  }
  md += '\n';

  // Per-post scores (sorted by score ascending — worst first)
  md += `## Per-Post Scores\n\n`;
  md += `| Score | Grade | Post | Words | Links | Cites |\n`;
  md += `|-------|-------|------|-------|-------|-------|\n`;
  const sorted = [...results].sort((a, b) => a.score - b.score);
  for (const r of sorted) {
    const title = String(r.fm.title || r.filename).slice(0, 55);
    md += `| ${r.score}/100 | ${gradeLabel(r.score)} | ${title} | ${r.words} | ${r.internalLinks} | ${r.citations} |\n`;
  }
  md += '\n';

  // Issues requiring action
  const withIssues = results.filter(r => r.issues.length > 0);
  if (withIssues.length > 0) {
    md += `## ❌ Critical Issues (action required)\n\n`;
    for (const r of withIssues.sort((a, b) => a.score - b.score)) {
      md += `### ${r.fm.title || r.filename} (${r.score}/100)\n\n`;
      for (const issue of r.issues) md += `- ${issue}\n`;
      md += '\n';
    }
  }

  // Warnings
  const withWarnings = results.filter(r => r.warnings.length > 0);
  if (withWarnings.length > 0) {
    md += `## ⚠️ Warnings (consider improving)\n\n`;
    for (const r of withWarnings.sort((a, b) => a.score - b.score)) {
      md += `### ${r.fm.title || r.filename}\n\n`;
      for (const w of r.warnings) md += `- ${w}\n`;
      md += '\n';
    }
  }

  // Cross-article flags
  if (cross.flags.length > 0) {
    const dupes     = cross.flags.filter(f => f.type === 'duplicate');
    const coverage  = cross.flags.filter(f => f.type === 'coverage');
    const freshness = cross.flags.filter(f => f.type === 'freshness');

    if (dupes.length) {
      md += `## 🔁 Potential Duplicate Topics\n\n`;
      for (const f of dupes) md += `- ${f.message}\n\n`;
    }
    if (coverage.length) {
      md += `## 📊 Topic Coverage Imbalance\n\n`;
      for (const f of coverage) md += `- ${f.message}\n\n`;
    }
    if (freshness.length) {
      md += `## 🕐 Stale Content (> 6 months old)\n\n`;
      for (const f of freshness) md += `- ${f.message}\n\n`;
    }
  }

  md += `---\n*Reviewed ${results.length} posts. Next review runs automatically on Monday.*\n`;
  return md;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`ERROR: Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  const postFiles = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  console.error(`Reviewing ${postFiles.length} posts…`);

  const posts   = [];
  const results = [];

  for (const filename of postFiles) {
    const filePath = path.join(POSTS_DIR, filename);
    const content  = fs.readFileSync(filePath, 'utf8');
    const { fm, body } = parseFrontMatter(content);
    posts.push({ filename, fm, body });
  }

  for (const { filename, fm, body } of posts) {
    const result = scorePost(fm, body, filename);
    results.push({ filename, fm, ...result });
    const grade = gradeLabel(result.score);
    console.error(`  ${grade} ${result.score}/100  ${filename}`);
  }

  const cross  = crossArticleChecks(posts);
  const report = buildReport(results, cross);

  const WRITE_RESULTS = JSON_OUT || !DRY_RUN;
  if (WRITE_RESULTS) {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, cross }, null, 2));
    console.error(`\nResults written to ${RESULTS_FILE}`);
  }

  if (DRY_RUN) {
    console.log(report);
    return;
  }

  // Create GitHub issue
  const critical = results.filter(r => r.score < 60).length;
  const avg      = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;
  const title    = `Content Review — avg ${avg}/100 | ${critical} critical issue(s) | ${new Date().toISOString().slice(0, 10)}`;

  try {
    const issueUrl = execSync(
      `gh issue create --repo oviney/blog --title "${title.replace(/"/g, '\\"')}" --body-file - --label "content-review"`,
      { input: report, encoding: 'utf8', cwd: REPO_ROOT }
    ).trim();
    console.log(`Issue created: ${issueUrl}`);
  } catch (err) {
    console.error('Failed to create GitHub issue:', err.message);
    console.log(report);
    process.exit(1);
  }
}

main();
