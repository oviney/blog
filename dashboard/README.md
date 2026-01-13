# Playwright Healing Dashboard

This directory contains the static GitHub Pages dashboard for monitoring Playwright test healing effectiveness.

## Dashboard Features

- **Real-time Metrics**: Success rates, test counts, and performance data
- **Trend Analysis**: Visual charts showing healing improvements over time
- **Status Monitoring**: Health indicators and alerts
- **Auto-refresh**: Updates every 5 minutes with latest data

## How it Works

1. **GitHub Actions** runs the healing monitor workflow every 4 hours
2. **Dashboard Data** is generated as `dashboard-data.json` with current metrics
3. **GitHub Pages** serves the static dashboard at your repository's Pages URL
4. **Live Dashboard** fetches data and updates charts automatically

## Accessing the Dashboard

The dashboard is automatically deployed to: `https://[your-username].github.io/[repo-name]/`

## Local Development

To test the dashboard locally:

```bash
# Serve the docs folder locally
npx serve docs
# Or use Python
python -m http.server 8000 --directory docs
```

## Data Sources

- Healing metrics from GitHub Actions workflows
- Test results from Playwright test runs
- Success rate calculations from cumulative data
- Trend analysis from historical workflow data

The dashboard gracefully falls back to demo data when GitHub API data is unavailable, making it perfect for development and preview.