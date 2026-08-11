# Observability dashboards

Internal observability surfaces for the blog. Both pages carry
`sitemap: false` and `noindex, nofollow` — they are reachable by direct link but
excluded from the sitemap and search engines (GH-1053).

## Files

| File | Purpose | Data source |
|------|---------|-------------|
| `index.html` | Landing page — links to the agent dashboard | none (static) |
| `agents.html` | Agent activity, evaluations, rework rates | `agents-data.json` |
| `agents-data.json` | Generated agent metrics | `agent-dashboard.yml` |

## Access

- **Landing**: <https://www.viney.ca/dashboard/>
- **Agent dashboard**: <https://www.viney.ca/dashboard/agents.html>

## Data updates

`agent-dashboard.yml` regenerates `agents-data.json` via
`scripts/agent-dashboard-data.js` and opens a PR on the
`automation/agent-dashboard-data` branch. The data is reviewed and merged like
any other change — it is not committed straight to `main`.

## Contract

`tests/playwright-agents/sitemap-exclusions.spec.ts` asserts that both pages
stay **reachable (200)** and **non-indexable**, and that neither appears in
`sitemap.xml`. `tests/playwright-agents/viewport-overflow.spec.ts` covers
`agents.html` at 320px. Deleting either page outright will turn those specs red
— replace it with a reachable stub instead.

## Retired

The **Playwright healing dashboard** (`index.html` + `dashboard-data.json`) was
removed in August 2026 along with `healing-monitor.yml`. The workflow had not
successfully written data since 2026-04-04, and the metric it published derived
`passingTests` from a hardcoded `totalTests: 135` rather than a measurement.
See issue #1251.
