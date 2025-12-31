# Economist-Style Blog Automation

A multi-agent AI system that produces publication-quality blog posts with The Economist's signature style: clear prose, rigorous data analysis, and professional visualizations.

## What Makes This Different

This isn't a simple "generate blog post" script. It's a **multi-stage agent pipeline** with an **editorial board swarm** that ensures quality:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FULL PIPELINE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STAGE 1: DISCOVERY                                                     │
│  ┌──────────────────┐                                                   │
│  │   TOPIC SCOUT    │  Scans QE landscape for hot topics               │
│  │                  │  Outputs 5 scored candidates                      │
│  └────────┬─────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  STAGE 2: EDITORIAL BOARD (Agent Swarm)                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ VP of   │ │ Senior  │ │  Data   │ │ Career  │ │Economist│   │   │
│  │  │  Eng    │ │ QE Lead │ │ Skeptic │ │ Climber │ │ Editor  │   │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │   │
│  │       │           │           │           │           │         │   │
│  │       └───────────┴─────┬─────┴───────────┴───────────┘         │   │
│  │                         ▼                                        │   │
│  │               ┌─────────────────┐                                │   │
│  │               │  WEIGHTED VOTE  │                                │   │
│  │               │  + CONSENSUS    │                                │   │
│  │               └────────┬────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  STAGE 3: ARTICLE GENERATION                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   RESEARCH   │→ │   GRAPHICS   │→ │  VISUAL QA   │                  │
│  │    AGENT     │  │    AGENT     │  │    AGENT     │                  │
│  └──────────────┘  └──────────────┘  └──────┬───────┘                  │
│                                             │                           │
│                                             ▼                           │
│                    ┌──────────────┐  ┌──────────────┐                  │
│                    │    WRITER    │→ │    EDITOR    │                  │
│                    │    AGENT     │  │    AGENT     │                  │
│                    └──────────────┘  └──────┬───────┘                  │
│                                             │                           │
│                                             ▼                           │
│                                      ┌──────────────┐                   │
│                                      │   CRITIQUE   │                   │
│                                      │    AGENT     │                   │
│                                      └──────┬───────┘                   │
│                                             │                           │
│                                             ▼                           │
│                                      ┌──────────────┐                   │
│                                      │  PR CREATED  │                   │
│                                      │  You Merge   │                   │
│                                      └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## The Editorial Board

Six persona agents vote on every topic, each with different priorities:

| Board Member | Perspective | Weight |
|--------------|-------------|--------|
| **VP of Engineering** | "Will this help me make a business case?" | 1.2x |
| **Senior QE Lead** | "Is this actionable for my team?" | 1.0x |
| **Data Skeptic** | "Are these claims backed by real data?" | 1.1x |
| **Career Climber** | "Will this advance my career?" | 0.8x |
| **Economist Editor** | "Is this worthy of our style?" | 1.3x |
| **Busy Reader** | "Would I actually read this?" | 0.9x |

Each member scores topics 1-10 with rationale. Weighted votes determine the winner.

## Responsible AI Governance: Human-in-the-Loop

**This system generates content for your review, not instead of your review.** Think of AI agents as fast junior writers who need editorial supervision.

### Four Governance Checkpoints

#### **Checkpoint #1: Topic Review**
```bash
python3 scripts/topic_scout.py
# → Review content_queue.json
```
- Reject off-brand or ethically problematic topics
- Add context constraints
- Manually edit queue before next stage

#### **Checkpoint #2: Editorial Decision**
```bash
python3 scripts/editorial_board.py
# → Read board_report.md
```
- Review all agent reasoning
- Override consensus if flawed
- Veto topics that shouldn't have passed
- Force specific topics via environment variables

#### **Checkpoint #3: Article Review**
```bash
python3 scripts/economist_agent.py
# → Article saved to _posts/ (NOT auto-published)
```
**Human reviews before publication:**
- Verify factual accuracy and data sources
- Check for bias or misleading claims
- Ensure appropriate tone
- Edit markdown directly if needed
- Re-run through editor if major changes required

#### **Checkpoint #4: Publication Approval**
```bash
git add _posts/2025-01-01-new-article.md
git commit -m "Publish: Article title"
git push origin main
```
- Final approval via git commit
- Can delay for legal/PR review
- Can add disclaimers or editor's notes
- Version control creates audit trail

### Built-in Quality Controls

**Transparency:**
- Every agent documents reasoning
- Research agent flags [UNVERIFIED] claims
- Editor shows which quality gates passed/failed
- All prompts are auditable code

**Quality Gates (enforced by Editor Agent):**
- ✅ Economist voice (no throat-clearing, confident tone)
- ✅ British spelling (organisation, favour, etc.)
- ✅ Data sourced (all stats have named sources)
- ✅ No unverified claims (rejects [UNVERIFIED] content)
- ✅ Readability (Hemingway score < 10)

## End-to-End Workflow

The **Scout → Vote → Generate** workflow runs every Monday:

1. **Topic Scout** identifies 5 trending topics in QE
2. **Editorial Board** (6 agents) votes on each topic
3. **Winning topic** feeds into the article pipeline
4. **Research → Graphics → Writer → Editor** produce the article
5. **PR created** with full board report
6. **You just merge** when ready

## The Economist Style Applied

### Writing Voice
- **Lead with impact**: Open with the most interesting fact, not background
- **Evidence over assertion**: Every claim backed by data
- **Witty but not forced**: Clever titles, subtle humor in prose
- **Respect the reader**: No over-explanation, no hedging
- **British English**: Favour, organisation, analyse

### Visual Style
- Light background (#f1f0e9 warm or #dee9ec cool)
- Economist color palette: navy, teal, gold, burgundy
- Horizontal gridlines only, no chart borders
- Bold title top-left, factual subtitle
- Source attribution bottom-left
- One clear message per chart

## Setup (One-Time, ~5 minutes)

### 1. Add files to your repository

```bash
# Clone your blog repo
git clone https://github.com/oviney/blog.git
cd blog

# Unzip the package (overwrites existing files)
unzip ~/Downloads/economist-blog-automation.zip -d .

# Commit and push
git add -A
git commit -m "Add Economist-style agent pipeline"
git push origin main
```

### 2. Add your Anthropic API key

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your API key from [console.anthropic.com](https://console.anthropic.com)
5. Click **Add secret**

### 3. Enable GitHub Actions permissions

1. **Settings** → **Actions** → **General**
2. Workflow permissions: **Read and write permissions**
3. Check: **Allow GitHub Actions to create and approve pull requests**
4. Save

## Usage

### Option A: Fully Automated (Scout + Generate)

The complete hands-off workflow:

1. Go to **Actions** → **Scout Topics & Generate Article**
2. Click **Run workflow**
3. Optionally set a focus area (e.g., "AI", "performance")
4. Check "auto_generate" to create article from top topic
5. Wait ~3-4 minutes
6. Review the PR → Merge

Or let it run on schedule every Monday—zero interaction needed.

### Option B: Generate on demand (skip scouting)

If you already have a topic in mind:

1. Go to **Actions** tab
2. Select **Generate Economist-Style Blog Post**
3. Click **Run workflow**
4. Fill in:
   - **Topic**: "The ROI of Test Automation"
   - **Talking points**: "payback period, maintenance costs, industry benchmarks"
   - **Category**: quality-engineering
5. Watch the pipeline run (~2-3 minutes)
6. Review the PR → Merge when satisfied

### Option C: Scout only (see what's trending)

### Option C: Scout only (see what's trending)

Run the scout without generating:

1. **Actions** → **Scout Topics & Generate Article**
2. Uncheck "auto_generate"
3. Run workflow
4. Download `content_queue.json` artifact
5. Review the 5 scored topics
6. Manually trigger generation for the one you like

### Option D: Scheduled (fully hands-off)

The **Scout and Generate** workflow runs every Monday at 8am UTC:
1. Scouts for trending topics
2. Picks the highest-scored one
3. Runs the full article pipeline
4. Creates a PR for your review
5. You just merge when ready

## Content Queue

Pre-loaded topics (edit `scripts/economist_agent.py` to customize):

1. **The ROI of Test Automation** - payback periods, maintenance costs, benchmarks
2. **Quality Metrics That Executives Actually Care About** - defect escape rate, cost of quality
3. **The Death of the QA Department** - embedded models, shift-left economics
4. **Performance Engineering's Productivity Paradox** - load testing ROI, observability
5. **AI in Software Testing: Hype vs. Reality** - test generation accuracy, adoption curves
6. **Technical Debt's Hidden Interest Rate** - velocity degradation, refactoring ROI
7. **The Economics of Flaky Tests** - developer time costs, trust erosion
8. **Shift-Left Testing: A Cost-Benefit Analysis** - defect cost multipliers

## Output Quality

Each generated article includes:

| Component | Quality Standard |
|-----------|-----------------|
| **Research** | 3-5 specific, cited statistics from reliable sources |
| **Chart** | Economist-style visualization, 300 DPI PNG |
| **Prose** | 800-1200 words, clear structure, no jargon without explanation |
| **Voice** | Matches Economist tone: confident, witty, evidence-based |
| **Title** | Clever but not forced (puns welcome, clickbait forbidden) |

## Customization

### Change the voice/style

Edit the agent prompts in `scripts/economist_agent.py`:
- `RESEARCH_AGENT_PROMPT` - What data to gather
- `WRITER_AGENT_PROMPT` - Writing style and structure
- `GRAPHICS_AGENT_PROMPT` - Chart styling
- `EDITOR_AGENT_PROMPT` - Quality standards

### Add topics to the queue

Edit the `CONTENT_QUEUE` list in `scripts/economist_agent.py`:

```python
CONTENT_QUEUE = [
    {
        "topic": "Your New Topic Here",
        "category": "quality-engineering",
        "talking_points": "key point 1, key point 2, data angle"
    },
    # ... more topics
]
```

### Adjust the schedule

Edit `.github/workflows/generate-post.yml`:

```yaml
schedule:
  # Current: Every Monday 9am UTC
  - cron: '0 9 * * 1'
  
  # Every Friday 2pm UTC
  - cron: '0 14 * * 5'
  
  # Twice weekly (Monday and Thursday)
  - cron: '0 9 * * 1,4'
```

## Cost Estimate

Each article generation uses ~4 Claude API calls:
- Research: ~1,000 tokens
- Graphics: ~500 tokens
- Writing: ~2,000 tokens
- Editing: ~2,000 tokens

**Total per article**: ~$0.05-0.10 (Sonnet pricing)
**Monthly (4 posts)**: ~$0.20-0.40

## Troubleshooting

**"API key not found"**
→ Verify `ANTHROPIC_API_KEY` secret is set in repo settings

**Chart not generated**
→ Check if matplotlib installed; review action logs for Python errors

**PR not created**
→ Enable "Allow GitHub Actions to create pull requests" in settings

**Style doesn't match Economist**
→ Review and tune the `WRITER_AGENT_PROMPT` and `EDITOR_AGENT_PROMPT`

## Architecture Decisions

**Why multiple agents instead of one prompt?**
- Each agent can be tested and tuned independently
- Separation of concerns: research ≠ writing ≠ visualization
- Quality gates between stages catch errors early
- Easier to debug when something goes wrong

**Why Claude Sonnet instead of Opus?**
- Sonnet offers excellent quality at lower cost for structured tasks
- Speed: Pipeline completes in ~2 minutes vs ~5+ with Opus
- For publication-critical work, swap to Opus in the `model` parameter

**Why matplotlib instead of a chart service?**
- Full control over Economist styling
- No external dependencies or API limits
- Charts generated at publication quality (300 DPI)
- Runs entirely in GitHub Actions

## File Structure

```
your-blog/
├── .github/
│   └── workflows/
│       ├── generate-post.yml       # Direct article generation
│       ├── scout-and-generate.yml  # Scout → Generate (no voting)
│       └── full-pipeline.yml       # Scout → Vote → Generate
├── scripts/
│   ├── economist_agent.py          # Research/Write/Edit agents
│   ├── topic_scout.py              # Topic discovery agent
│   └── editorial_board.py          # 6-agent voting swarm
├── assets/
│   └── charts/                     # Generated visualizations
├── _posts/                         # Generated articles land here
├── content_queue.json              # Scouted topics (auto-generated)
├── board_decision.json             # Voting results (auto-generated)
├── board_report.md                 # Human-readable board report
└── README.md
```
