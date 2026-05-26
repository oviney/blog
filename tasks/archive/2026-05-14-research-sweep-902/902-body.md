<!-- Date floor: 2026-04-15 (created_at of #816). Plan SHA: dafab0e. Synthesis SHA: 624007a. -->
<!-- See SPEC.md and tasks/plan.md. This file is the staged body for `gh issue edit 902`. -->

# Research Sweep — 2026-05-01

> **Execution context:** Sweep is being executed locally under the `agent-skills` lifecycle (DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP), not via label-routed Copilot Coding Agent. See SPEC.md §1 in commit `dafab0e` for rationale.
>
> **Date floor for "what's new":** 2026-04-15 (created_at of prior sweep #816), per SPEC.md §6.
>
> **Counts:** Section 1 — 2 Action / 1 Watch / 1 No-op. Section 3 — 2 Action / 1 Watch / 1 No-op. AC-8 substance floor: satisfied (≥1 Action per in-scope section).

---

## 1. AI Agent Orchestration — New Developments

**Research prompts:**
- What new frameworks or patterns have emerged for multi-agent orchestration since 2026-04-15?
- Are there any notable GitHub releases, blog posts, or papers on agent-to-agent communication, tool use, or memory?
- How are teams handling agent escalation / handoff in production? Any new best practices?
- Are there relevant updates to LangChain, AutoGen, CrewAI, Claude Code subagents, or comparable orchestration libraries?

### Findings

1. **Claim:** Claude Code v2.1.33+ added a `memory:` frontmatter field on subagent definitions that gives each subagent its own persistent markdown knowledge store across sessions, and v2.1.117 (2026-04-22) extended this with `@mention` syntax and per-agent `mcpServers` loading.
   **Source:** https://orchestrator.dev/blog/2026-04-06--claude-code-agent-memory-2026/ (2026-04-06); https://help.apiyi.com/en/claude-code-changelog-2026-april-updates-en.html (2026-04-22)
   **Repo impact:** Action — add a `memory:` scope to each local subagent definition so repeated PR-review / test-engineer / security-audit sessions accumulate repo-specific knowledge instead of restarting cold.
     **Files to change:** `.claude/agents/code-reviewer.md`, `.claude/agents/test-engineer.md`, `.claude/agents/security-auditor.md`, `.claude/agents/playwright-test-planner.md`, `.claude/agents/playwright-test-generator.md`, `.claude/agents/playwright-test-healer.md`
     **Acceptance criterion:** Every `.claude/agents/*.md` file's YAML frontmatter contains a `memory:` line, verified by `awk '/^---$/{f=!f;next} f && /^memory:/{print FILENAME}' .claude/agents/*.md | wc -l` returning 6 (current file count verified via `ls .claude/agents/*.md | wc -l` @ `624007a`); `bundle exec jekyll build` still succeeds (these files live outside `_posts/`, so a build-time regression is unlikely but the check is cheap).

2. **Claim:** Anthropic's Claude Managed Agents shipped public-beta multi-agent orchestration on 2026-05-06, where a lead agent fans out to specialists on a shared filesystem with persistent events and mid-run check-back — distinct from local Claude Code subagents which still run with isolated context windows.
   **Source:** https://claude.com/blog/new-in-claude-managed-agents (2026-05-06)
   **Repo impact:** Watch — the "lead + parallel specialists on shared filesystem" pattern is a strict superset of the current `AGENTS.md` handoff model and could replace label-routed Copilot orchestration entirely if it lands in the local Claude Code runtime.
     **Trigger condition:** When the shared-filesystem + persistent-event-bus pattern from Managed Agents lands in the local Claude Code CLI (e.g., `.claude/agents/*.md` gains a `peers:` or `lead:` field, or release notes mention "managed-agents parity locally"), promote to Action and rewrite `AGENTS.md` §"Handoff triggers" and `CLAUDE.md` §"Local Agent Labels" to describe lead/specialist topology instead of sibling-handoff topology.

3. **Claim:** LangGraph 1.0 (GA October 2025) and the OpenAI Agents SDK April 2026 evolution have both standardised "Handoffs" as an explicit primitive — agents transfer control with carried context and a declared list of valid handoff targets — and this pattern is now the dominant production multi-agent escalation idiom in 2026.
   **Source:** https://blog.langchain.com/langchain-langgraph-1dot0/ (2025-10-22); https://www.agilesoftlabs.com/blog/2026/04/the-next-evolution-of-agents-sdk (2026-04); https://callsphere.ai/blog/openai-agents-sdk-2026-multi-agent-systems-handoffs-guardrails (2026)
   **Repo impact:** Action — make the implicit handoff list in `AGENTS.md` explicit and machine-readable so future automation (and human reviewers) can verify the routing graph isn't broken when a new persona is added.
     **Files to change:** `AGENTS.md`
     **Acceptance criterion:** Each of the five numbered persona blocks in `AGENTS.md` gains a `**Valid handoff targets:**` row listing the explicit set of sibling personas it may transfer to (a strict subset of the roster), and a new top-level section "Handoff Graph" renders the targets as a Mermaid `graph LR` diagram; `grep -c "Valid handoff targets" AGENTS.md` returns 5 and `bundle exec jekyll build` succeeds.

4. **Claim:** Google's Agent2Agent (A2A) protocol reached v1.2 under Linux Foundation governance with 150+ production organisations in 2026, positioning it as the cross-platform agent-communication standard complementary to MCP.
   **Source:** https://a2a-protocol.org/latest/ (2026); https://medium.com/@richardhightower/a2a-protocol-v1-2026-how-ai-agents-actually-talk-to-each-other-c500079bca73 (2026-04)
   **Repo impact:** No-op — this blog's agent surface is entirely intra-repo (five personas defined in a single roster, no cross-org or cross-platform agent calls), so a wire protocol for opaque agentic applications has nothing to attach to here.
     **Repo-state justification:** `grep -nE "^### [0-9]\." AGENTS.md @ 624007a` returns 5 numbered persona headings (`### 1. Creative Director` … `### 5. General Agent`), all of which route work via GitHub labels per `grep -n "agent:" .github/copilot-instructions.md @ 624007a` (label-based routing, not protocol-based); A2A has no integration surface to land on until this project gains a second-party agent runtime to talk to.

### Worth watching (no action, no issue)

- Claude Managed Agents "dreaming" feature (research preview, 2026-05-06) reviews past sessions to update memory automatically — relevant once local Claude Code subagents gain `memory:` storage we want self-curated. https://claude.com/blog/new-in-claude-managed-agents
- OpenAI Agents SDK v0.17.1 (2026-05-11) added sandboxing + long-horizon harness for production multi-agent systems; not on our stack today but the sandboxing primitive may inform future `scripts/` agent isolation. https://www.respan.ai/articles/openai-agents-sdk-vs-swarm
- "Forked subagents" flag `CLAUDE_CODE_FORK_SUBAGENT=1` (v2.1.117, 2026-04-22) — useful if we ever need parallel specialist runs on a single review; today our six `.claude/agents/*.md` are invoked serially. https://help.apiyi.com/en/claude-code-changelog-2026-april-updates-en.html
- Standardised three-tier escalation pattern (first-line → escalation → handoff packaging context for human) is becoming an industry idiom in 2026 multi-agent guides; worth revisiting when QA-Gatekeeper handoffs to Creative-Director feel noisy. https://www.flowhunt.io/blog/multi-agent-ai-system/

---

## 2. GitHub Copilot Coding Agent — Updates

**Out of scope this sweep.** Migrating off Copilot Coding Agent to local Claude Code with the agent-skills lifecycle (SPEC.md §1). Researching Copilot's latest features does not change that decision.

**Reversal trigger (SPEC §10):** Reopen Section 2 in a future sweep if Copilot ships a feature that materially affects label-routing or local-agent interop — e.g., local-runtime parity, or a Copilot/Claude-Code bridge. Otherwise, the next sweep inherits the same out-of-scope marker; this is not a one-off skip.

---

## 3. QE Automation — New Developments

**Research prompts:**
- What new Playwright, Backstop, Pa11y, or Lighthouse features are worth adopting since 2026-04-15?
- Are there emerging patterns for self-healing tests, AI-assisted test generation, or flakiness detection?
- Any relevant updates to the GitHub Actions ecosystem (e.g., new reusable action versions used in `.github/workflows/`)?
- What are the latest WCAG 2.2 or accessibility guidelines changes that affect automated checking?

### Findings

1. **Claim:** Playwright 1.60.0 (released 2026-05-11) introduces `test.abort()` for in-flight test cancellation, page-level `expect(page).toMatchAriaSnapshot()`, first-class HAR tracing (`tracing.startHar()`/`stopHar()`), and `locator.drop()`, all of which are additive over our pinned `^1.59.1`.
   **Source:** https://github.com/microsoft/playwright/releases (2026-05-11 published)
   **Repo impact:** Action — bump `@playwright/test` to `^1.60.0` in `package.json` and adopt page-level ARIA snapshots in nav/footer specs where they currently use element-scoped snapshots.
     **Files to change:** `package.json`, `package-lock.json`, `tests/playwright-agents/` (any spec using `toMatchAriaSnapshot`), `.github/skills/jekyll-qa/SKILL.md`
     **Acceptance criterion:** `@playwright/test` pinned at `^1.60.0` with (a) `package-lock.json` regenerated and committed in the same PR, (b) `.github/workflows/test-quality.yml` and `.github/workflows/auto-regression.yml` CI jobs pass green against the new version on a single PR run, (c) `.github/skills/jekyll-qa/SKILL.md` updated to reference the new Playwright minor and note `test.abort()` as available; `npx playwright test` exits 0 locally.

2. **Claim:** pa11y-ci 4.1.1 (released 2026-05-12) patches the `lodash` dependency to `~4.18.1` to clear GHSA-f23m-r3pf-42rh / CVE-2026-2950, and the existing `^4.1.0` caret in `package.json` already permits it but the lockfile must be regenerated to pull it in.
   **Source:** https://github.com/pa11y/pa11y-ci/releases (2026-05-12 published)
   **Repo impact:** Action — refresh `package-lock.json` so the installed `pa11y-ci` is 4.1.1 and the transitive `lodash` is patched; verify `npm run test:a11y` still passes.
     **Files to change:** `package-lock.json`, `.github/skills/jekyll-qa/SKILL.md`
     **Acceptance criterion:** `npm ls pa11y-ci` reports `4.1.1`, `npm audit` no longer reports GHSA-f23m-r3pf-42rh, (a) `package-lock.json` regenerated and committed in the same PR, (b) `.github/workflows/test-quality.yml` (which runs `pa11y-ci`) passes against the refreshed lockfile, (c) `.github/skills/jekyll-qa/SKILL.md` records the patch level; `package.json` semver range is unchanged.

3. **Claim:** Lighthouse 13.3.0 (released 2026-05-07) ships a new "agentic browsing" default category and bumps the major version line past our pinned `^12.8.2`, meaning a future bump crosses a semver-major boundary and may break our current audit assertions.
   **Source:** https://github.com/GoogleChrome/lighthouse/releases (2026-05-07 published)
   **Repo impact:** Watch — major-version bump is not pulled in automatically by `^12.8.2`; defer until we evaluate the new default category's effect on existing Lighthouse score thresholds in `.github/workflows/test-quality.yml`.
     **Trigger condition:** Promote to Action when (a) Lighthouse 13 reaches at least 13.4.x with the agentic category stabilised, or (b) Google announces deprecation of the 12.x line, or (c) Chromium ships a feature our current 12.8.2 audits miss — whichever comes first.

4. **Claim:** No new WCAG 2.2 normative changes were published between 2026-04-15 and 2026-05-16; the most recent W3C errata for WCAG 2.2 remains the 2024-12-12 update, and the 2026-04-24 milestone is the U.S. DOJ ADA Title II compliance deadline (referencing WCAG 2.1 AA), not a spec change.
   **Source:** https://www.w3.org/TR/WCAG22/ (last updated 2024-12-12)
   **Repo impact:** No-op — our `pa11y-ci` axe-core 4.10 (via pa11y-ci 4.1.x) already maps to the published WCAG 2.2 success criteria; no rule additions are required.
     **Repo-state justification:** `grep -E '"pa11y-ci"' package.json @ 624007a` returns `"pa11y-ci": "^4.1.0"`, which depends on pa11y 9 / axe-core 4.10 per https://github.com/pa11y/pa11y-ci/releases v4.0.0 notes; axe-core 4.10's WCAG 2.2 rule coverage matches the unchanged 2024-12-12 spec, so no `.pa11yci.json` or skill edits are warranted.

### Worth watching (no action, no issue)

- Playwright 1.59's Screencast replacing the old video recorder is now stable in 1.60 — re-evaluate our Playwright `video` config if we ever add video recording. https://github.com/microsoft/playwright/releases (2026-05-11)
- `actions/setup-node` v6.4.0 (2026-04-20) — already covered by our `@v6` floating major across workflows; no action. https://github.com/actions/setup-node/releases
- Node 20 deprecation on GitHub-hosted runners scheduled for 2026-09-16; our workflows pin `actions/setup-node@v6` and request Node via `.nvmrc` / `node-version` inputs, so the cascade is contained but worth a verification pass closer to the date. https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
- Lighthouse 13's "agentic browsing" category may become relevant if we add LLM-served content to viney.ca; revisit if/when that lands. https://github.com/GoogleChrome/lighthouse/releases (2026-05-07)

---

## Next Steps

- **Sections covered:** 1 (in scope), 3 (in scope). Section 2 explicitly out of scope per SPEC.md §1 / §10.
- **Findings:** 8 total (4 per in-scope section). Bucket split: **4 Action / 2 Watch / 2 No-op**. AC-8 substance floor satisfied (each in-scope section has ≥1 Action).
- **Follow-up issues:** 4 planned (one per Action finding). See `tasks/902-followups-plan.md` for collision pass and final routing. Final parallel-vs-sequential map will appear in the closure comment (T9) after T7 spawns the issues.

_Sweep generated by the [research-sweep workflow](../../../.github/workflows/research-sweep.yml); execution lifecycle: agent-skills DEFINE→PLAN→BUILD→VERIFY→REVIEW→SHIP._
