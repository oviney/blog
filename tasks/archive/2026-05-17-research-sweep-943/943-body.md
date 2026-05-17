<!-- Date floors: §1=2026-05-01, §3=2026-05-01, §4=2026-02-15. Plan SHA: bfe8f5c. Synthesis SHA: 530a728. -->
<!-- Dedup against open #902 followups: #945, #946, #947. -->

# Research Sweep — 2026-05-15

> **Execution context:** Sweep executed locally under the `agent-skills` lifecycle (DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP). #943 was filed before #948's methodology guardrails landed, so this body's prompts are from the old template — the guardrails (three-bucket schema, `package.json overrides` precheck, substance floor, hard cap) apply via SPEC.md and `tasks/lessons.md` L3 instead of being inline.
>
> **Date floors:** §1 and §3 at **2026-05-01** (created_at of prior sweep #902); §4 at **2026-02-15** (last 90 days; #902 didn't cover §4 so the standard prior-sweep anchor doesn't apply).
>
> **Dedup target:** open #902 followups — #945, #946, #947.
>
> **Counts:** §1 — **1A / 1W / 0N / 1T**. §3 — **0A / 1W / 1N / 1T** (AC-8 satisfied by recorded justification — see §3 below). §4 — **4A / 0W / 0N / 0T** (post-merge: 3 spawn-bound after collision pass merges F1+F3). **Total spawnable: 4** — cap satisfied.

---

## 1. AI Agent Orchestration — New Developments

**Research prompts:**
- What new frameworks or patterns have emerged for multi-agent orchestration since the last sweep?
- Are there any notable GitHub releases, blog posts, or papers on agent-to-agent communication, tool use, or memory?
- How are teams handling agent escalation / handoff in production? Any new best practices?
- Are there relevant updates to LangChain, AutoGen, CrewAI, or comparable orchestration libraries?

### Findings

1. **Claim:** Claude Code v2.1.139 (2026-05-11) introduced a `/goal` command that sets explicit completion conditions for autonomous sessions and a `claude agents` view that lists every active subagent session, both of which materially change how multi-step agent work is orchestrated and observed.
   **Source:** https://releasebot.io/updates/anthropic/claude-code (2026-05-11)
   **Repo impact:** Action — `.github/skills/using-agent-skills/SKILL.md` and `.github/skills/jekyll-qa/SKILL.md` describe the spec/plan/build/test/review/ship lifecycle without referencing `/goal` or `claude agents`; documenting them gives operators a concrete mechanism for the existing "verify before complete" guidance.
     **Files to change:** `.github/skills/using-agent-skills/SKILL.md`, `.github/skills/jekyll-qa/SKILL.md`
     **Acceptance criterion:** `grep -E "/goal|claude agents" .github/skills/using-agent-skills/SKILL.md .github/skills/jekyll-qa/SKILL.md | wc -l` returns at least 2 and each reference includes a one-line description of when to invoke it during the lifecycle (verified by `bundle exec jekyll build` passing).

2. **Claim:** Claude Code v2.1.142 (2026-05-15) began surfacing any plugin with a root-level `SKILL.md` (no `skills/` subdirectory required) as a first-class skill in the `/skills` picker, which means our `.github/skills/*/SKILL.md` files are structurally one manifest away from being directly loadable by Claude Code users.
   **Source:** https://releasebot.io/updates/anthropic/claude-code (2026-05-15)
   **Repo impact:** Watch — packaging `.github/skills/` as a Claude Code plugin would be a non-trivial governance change (those files are currently documentation, not executable surface) and the loading semantics for nested per-skill `SKILL.md` files are still in flux; we want to see the v2.1.143+ behavior stabilize before committing the repo to a plugin layout.
     **Trigger condition:** Claude Code documentation or a v2.1.150+ release note specifies how a single repo can expose multiple sibling `SKILL.md` files (one per `.github/skills/<name>/`) as distinct loadable skills without a top-level `plugin.json` — at that point promote to Action and propose a `.claude-plugin.json` manifest.

3. **Claim:** A2A is now a Linux Foundation standard and the Agentic AI Foundation (founded December 2025 by OpenAI, Anthropic, Google, Microsoft, AWS, Block) reports 150+ organisations running A2A-mediated agent handoffs in production as of April 2026, cementing "Handoff" as the canonical cross-vendor escalation primitive.
   **Source:** https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade (2026-04)
   **Repo impact:** **Tracked in #946** — #946 already adopts the LangGraph/OpenAI-Agents-SDK "Handoff" primitive as the model for `AGENTS.md` (explicit `Valid handoff targets:` rows + Mermaid graph); the A2A standardisation news reinforces the same direction without changing files or acceptance criteria, so no separate spawn is warranted. The only addition #946 might absorb is a one-line note that the handoff vocabulary aligns with the A2A Linux Foundation standard.

### Worth watching (no action, no issue)

- Claude Code v2.1.141 (2026-05-14) added OTEL `agent_id` / `parent_agent_id` attributes and `x-claude-code-agent-id` HTTP headers on subagent requests — useful for future traceability of `.claude/agents/*.md` invocations once we have an observability pipeline. https://releasebot.io/updates/anthropic/claude-code (2026-05-14)
- Claude Code v2.1.139 `continueOnBlock` hook option lets a hook feed its rejection reason back into the agent loop — relevant if we ever add a hook that blocks commits on failing `validate-posts.sh` and want Claude to retry rather than abort. https://releasebot.io/updates/anthropic/claude-code (2026-05-11)
- AutoGen 1.0 GA (April 2026) and Microsoft Agent Framework v1.0 absorption of AutoGen are pre-floor; we use neither framework, flagged only to note that AutoGen major development has slowed and migrating documentation references is unnecessary. https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/

---

## 2. GitHub Copilot Coding Agent — Updates

**Out of scope this sweep.** Migrating off Copilot Coding Agent to local Claude Code with the agent-skills lifecycle (SPEC.md §1, same decision as #902). Researching Copilot's latest features does not change that decision.

**Reversal trigger (SPEC.md §10 / #902 precedent):** Reopen Section 2 in a future sweep if Copilot ships a feature that materially affects label-routing or local-agent interop — e.g., local-runtime parity, or a Copilot/Claude-Code bridge. Otherwise, the next sweep inherits the same out-of-scope marker; this is not a one-off skip.

---

## 3. QE Automation — New Developments

**Research prompts:**
- What new Playwright, Backstop, Pa11y, or Lighthouse features are worth adopting?
- Are there emerging patterns for self-healing tests, AI-assisted test generation, or flakiness detection?
- Any relevant updates to the GitHub Actions ecosystem (e.g., new reusable action versions)?
- What are the latest WCAG or accessibility guidelines changes that affect automated checking?

### Findings

1. **Claim:** Lighthouse 13.3.0 (2026-05-07) ships a new `agentic-browsing` default-config category and webmcp audits and requires Node ≥ 22.19; the companion `@lhci/cli` (current 0.15.x in our `package.json`) is still pinned to Lighthouse 12.6.1, so a Lighthouse 13 bump is blocked on both an LHCI upgrade and a CI Node-runtime bump.
   **Source:** https://developer.chrome.com/blog/lighthouse-13-0; https://github.com/GoogleChrome/lighthouse/releases (13.3.0 published 2026-05-07); repo state — `node -e "const p=require('./package.json'); console.log(p.devDependencies.lighthouse, p.devDependencies['@lhci/cli']);" @ bfe8f5c` → `^12.8.2 ^0.15.1`; `grep -H 'node-version' .github/workflows/test-quality.yml @ bfe8f5c` → `node-version: '20'`.
   **Repo impact:** Watch — two upstream blockers prevent a Lighthouse 13 bump today: (1) `@lhci/cli ^0.15.1` still pins Lighthouse 12.6.1; bumping `lighthouse` directly desyncs from `lhci autorun`. (2) CI runs on Node 20; Lighthouse 13 needs ≥ 22.19.
     **Trigger condition:** Promote to Action when **either** condition fires: (a) `@lhci/cli` ≥ 0.16.0 releases with Lighthouse 13 support (track https://github.com/GoogleChrome/lighthouse-ci/releases), **OR** (b) an independent decision is made to move CI to Node 22 (then bump Lighthouse + LHCI together with the Node bump). Spawned issue's AC must cover: `package.json` (`lighthouse`, `@lhci/cli`), `package-lock.json`, `lighthouserc.*` config (review the new `agentic-browsing` category — likely needs to be skipped on a static blog), all `.github/workflows/*.yml` `node-version` lines, `.github/skills/jekyll-qa/SKILL.md` toolchain note.

2. **Claim:** Playwright 1.60.0 (2026-05-11) shipped page-level `expect(page).toMatchAriaSnapshot()`, `test.abort()`, `tracing.startHar()`/`stopHar()`, and `locator.drop()`; a 1.61.0-alpha line is also active on npm.
   **Source:** https://github.com/microsoft/playwright/releases (1.60.0 published 2026-05-11); repo state — `node -e "console.log(require('./package.json').devDependencies['@playwright/test']);" @ bfe8f5c` → `^1.59.1`.
   **Repo impact:** **Tracked in #947** — `feat(tests): bump @playwright/test to ^1.60.0 + adopt page-level ARIA snapshots`. Overlap: AC and `Files to change` are an exact match (`package.json`, `package-lock.json`, `tests/playwright-agents/`, `.github/skills/jekyll-qa/SKILL.md`). #947 is unblocked since #944 merged (`01eb11c`). New research adds: the 1.61.0-alpha is on npm but does not change #947's scope (still target stable 1.60).

3. **Claim:** Every `uses:` step across `.github/workflows/` is already pinned to the latest stable major; no new majors have been published in the §3 date window (≥ 2026-05-01) for the action set in use.
   **Source:** https://github.com/actions/upload-artifact/releases (`v7.0.0` released 2026-03-16 — pre-floor; already adopted); https://github.com/actions/checkout/releases (latest `v6.0.2` 2026-01-09); repo state — `grep -rH 'uses: actions/\|uses: ruby/' .github/workflows/ | awk -F'uses: ' '{print $2}' | sort -u @ bfe8f5c` → `actions/checkout@v6`, `actions/configure-pages@v6`, `actions/deploy-pages@v5`, `actions/download-artifact@v8`, `actions/github-script@v9`, `actions/setup-node@v6`, `actions/upload-artifact@v7`, `actions/upload-pages-artifact@v4`, `ruby/setup-ruby@v1`.
   **Repo impact:** No-op — all action majors are current; `upload-artifact v7.0.0` (2026-03-16) — the only fresh GHA release we considered — predates the §3 floor and is already adopted. WCAG 2.2 errata page was last modified 2026-03-05 (also pre-floor; out of scope).
     **Repo-state justification:** the `grep -rH ... | sort -u @ bfe8f5c` command above is the citation. Nothing in the §3 window warrants Action.

### §3 substance-floor justification (AC-8)

§3 has zero Action findings. **No substantive change identified** after researching ≥ 3 sources (Lighthouse releases page, Playwright releases page, GitHub Actions releases pages, pa11y-ci releases page, W3C WCAG 2.2 errata) in the 2026-05-01 floor window. Rationale:

- The only material Playwright development (1.60.0) is **already tracked in #947**.
- Lighthouse 13 is blocked by LHCI lag + CI Node version; appropriately Watch, not Action.
- GHA action versions are already current as of `bfe8f5c`.
- pa11y-ci has no 4.2 release in window (last 4.0.1 in January, lockfile picks up 4.1.1 after #944).
- WCAG 2.2 errata last changed pre-floor.

This satisfies AC-8 (substance floor — recorded "no substantive change identified" justification).

### Worth watching (no action, no issue)

- AI self-healing test trend continues across May 2026 (Healwright, Functionize, Momentic, QA Wolf, BrowserStack Self-Heal). The repo already operationalises this via `.claude/agents/playwright-test-healer.md` + `.mcp.json` + the `test:agents:heal` npm script; further `.claude/agents/playwright-test-*.md` work falls under **#945** scope. https://testdino.com/blog/playwright-ai-ecosystem
- pa11y-ci 4.x — no 4.2 in window; re-check next sweep. https://github.com/pa11y/pa11y-ci/releases
- WCAG 2.2 errata page last modified 2026-03-05 (pre-floor). Re-check next sweep. https://www.w3.org/WAI/WCAG22/errata/

---

## 4. Audience Experience / UI / UX / Usability

**Research prompts:**
- How easy is it for a first-time reader to understand what the blog covers from the homepage and blog index?
- Where does the reader journey feel weak: navigation, summaries, topic discovery, scanability, mobile ergonomics, or trust cues?
- Are article cards, topic pages, search results, and post CTAs helping readers find the next relevant piece?
- Which issues belong to design, which belong to editorial clarity, and which should be verified with QA automation?

### Findings

1. **Claim:** Card excerpt length varies across the three primary discovery surfaces (homepage hero 40 words, homepage/topic cards 20 words, blog index cards 15 words), violating the "coherent internal card structure" principle that lets readers parse cards without re-learning the pattern.
   **Source:** https://landdding.com/blog/ui-design-trends-2026 (2026-04); repo state — `grep -n "truncatewords" blog/index.html security.md software-engineering.md test-automation.md index.md @ 530a728` returns 15/20/20/20/40.
   **Repo impact:** Action — standardise excerpt length on cross-page discovery cards (likely 20 words; keep hero at 40 as an intentional emphasis).
     **Files to change:** `blog/index.html`, `security.md`, `software-engineering.md`, `test-automation.md`, `index.md` (topic-card-excerpt block only — leave `hero-post-excerpt` at 40 words by design)
     **Acceptance criterion:** all `topic-card-excerpt` / `econ-card-excerpt` instances use the same `truncatewords` value across `/blog/`, `/security/`, `/software-engineering/`, `/test-automation/`, and the homepage "From the Blog" grid; hero retains 40 words with a code comment marking it deliberate.
     **Label:** `agent:creative-director` — template-level layout consistency (card-component contract); touches only Liquid templates and design-system uniformity.

2. **Claim:** 0 of 24 posts populate the `subtitle` front-matter field even though `_layouts/post.html` renders `<h2 class="article-subtitle">` when present and `index.md` line 43 renders `hero-post-subtitle` — Economist-style standfirst summaries are wired up in the design system but never authored, costing the inverted-pyramid scanability advantage NN/G credits with up to a 124% usability lift.
   **Source:** https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/ (2024 eye-tracking re-study per https://www.nngroup.com/articles/why-web-users-scan-instead-reading/); repo state — `grep -l "^subtitle:" _posts/*.md | wc -l @ 530a728` returns 0 of 24; `grep -n "subtitle" _layouts/post.html index.md @ 530a728` confirms the template is wired up.
   **Repo impact:** Action — backfill `subtitle:` front-matter for all 24 posts using each post's existing `description:` as the seed, then add a `validate-post-quality.sh` rule that warns when `subtitle:` is missing.
     **Files to change:** `_posts/*.md` (24 files — add `subtitle:` line under `title:`), `scripts/validate-post-quality.sh` (add subtitle check)
     **Acceptance criterion:** `grep -L "^subtitle:" _posts/*.md` returns no results; `bash scripts/validate-post-quality.sh` exits non-zero when a post is missing `subtitle:`; rendered post HTML shows `<h2 class="article-subtitle">` on every post.
     **Label:** `agent:editorial-chief` — authoring 24 standfirst summaries (editorial copy) plus extending the editorial quality gate. The template change is already in place; this is content work.

3. **Claim:** Article cards and the article header omit the author byline, suppressing the "named authors with visible credentials" trust signal that 2026 E-E-A-T and AI-search guidance treats as foundational — the byline only appears in `<section class="author-bio">` at the bottom of `_layouts/post.html`, well below the fold, and never on cards.
   **Source:** https://metronyx.co.uk/blog/general-seo/author-bios-e-e-a-t-signals (2026); https://www.webimax.com/blog/author-eeat-expert-bylines-ai-search (2026); repo state — `grep -n "author" _layouts/post.html @ 530a728` shows author rendering only at line 224+ (post-footer); `grep -n "author" blog/index.html security.md index.md @ 530a728` shows zero card-level author rendering.
   **Repo impact:** Action — add a compact author/date byline to the article header (immediately under `article-subtitle` or `article-section-line`) and a one-line "By {{ post.author | default: site.author.name }}" on topic/blog/home cards.
     **Files to change:** `_layouts/post.html`, `_includes/` (consider new `_includes/byline.html` partial), `blog/index.html`, `security.md`, `software-engineering.md`, `test-automation.md`, `index.md`
     **Acceptance criterion:** every post page shows the author name within the first viewport on a 375px-wide device; every card surface renders a "By {author}" line; Playwright assertion in `tests/playwright-agents/` verifies presence on at least one post and one card surface.
     **Label:** `agent:creative-director` — template-and-layout decision (where the byline lives, card-component contract); data (`page.author`, `site.author.name`) already exists, no editorial copy authored.

4. **Claim:** Mobile navigation relies exclusively on a top-left hamburger menu with no persistent bottom-zone shortcut, contradicting current mobile-ergonomics consensus that high-priority destinations (Search, Topics) should sit in the thumb-reachable zone on increasingly tall phones.
   **Source:** https://pageoneformula.com/designing-for-thumb-friendly-navigation-2/ (2026-03); https://parachutedesign.ca/blog/thumb-zone-ux/ (2026); repo state — `_layouts/default.html @ 530a728` lines 28–49 (only top hamburger), lines 91–113 (no bottom-nav script); `_sass/economist-theme.scss @ 530a728` has no `.bottom-nav` rules.
   **Repo impact:** Action — add an opt-in mobile bottom-nav strip (Home / Blog / Search) visible only on `≤ 640px` viewports.
     **Files to change:** `_layouts/default.html`, `_sass/economist-theme.scss`, `tests/playwright-agents/`
     **Acceptance criterion:** visiting the site at 375×667 shows a fixed bottom nav with Home/Blog/Search; at 1024×768 the bottom nav is hidden via media query; pa11y-ci passes on `/` and `/blog/` at mobile viewport with no new violations; Lighthouse mobile score does not regress.
     **Label:** `agent:creative-director` — pure layout + CSS + responsive media-query work routed through the design system; no copy authored, no audience-research artifact produced.

### Worth watching (no action, no issue)

- Personalization / "Recommended for you" widgets — NN/G caps related links at 5–7; current `post.html` "Related reading" is limited to 3 (line 154) and "More from <section>" to 6 (line 186) — within guidance. Trigger: analytics show <8% click-through on `related-list` / `more-from-list`. https://www.nngroup.com/articles/related-content-pageviews/
- Search ranking quality — `search.html` uses naive `indexOf` substring matching (line 64) — fine for a 24-post archive, but at ~75 posts the lack of relevance ranking will hurt. Trigger: `_posts/` count > 60 or any user-reported "search returned wrong order."
- Print stylesheet / save-for-later — `print-url` span at `_layouts/post.html` line 261 hints at print intent, but no `@media print` rules audited. Trigger: a single reader report or PDF-export ask.
- Reading-time formula divergence — `index.md` uses `divided_by: 200` (line 54) while `_layouts/post.html` uses `divided_by: 180` (line 57). Minor — readers don't compare. Trigger: editorial decision on canonical WPM.

---

## Next Steps

<!-- Counts and spawn list finalised after T4-collision merge (§4 F1 + §4 F3 → one issue) and CHECKPOINT-A approval. -->

- **Sections covered:** §1 (in scope), §3 (in scope, AC-8 satisfied by recorded justification), §4 (in scope, fresh territory). §2 explicitly out of scope per SPEC.md §10.
- **Findings:** 10 total — 6 Action / 2 Watch / 1 No-op / 2 Tracked-in (3+3+4, where §4 F1 and F3 merge into one spawn at collision pass). AC-8 satisfied per section.
- **Spawnable issues after collision merge:** 4 — see `tasks/943-followups-plan.md`.
- **Tracked in #946:** A2A standardisation reinforces #946's direction.
- **Tracked in #947:** Playwright 1.60 is already #947's exact scope.

_Sweep generated by the [research-sweep workflow](../../actions/workflows/research-sweep.yml); execution lifecycle: agent-skills DEFINE→PLAN→BUILD→VERIFY→REVIEW→SHIP._
