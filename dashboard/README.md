# Playwright Healing Dashboard

This directory contains the healing monitoring dashboard for Playwright test automation.

## Files

- `index.html` - Static HTML dashboard with Chart.js visualizations
- `dashboard-data.json` - Generated JSON data file (updated by GitHub Actions)

## Features

- Real-time healing success rate monitoring
- Historical trend analysis with interactive charts
- Test results visualization
- Auto-refresh every 5 minutes
- Responsive design matching Economist theme

## Access

**Live Dashboard**: [https://oviney.github.io/blog/dashboard/](https://oviney.github.io/blog/dashboard/)

**Local Development**:
```bash
npm run dashboard:dev  # Serves on localhost:8081
```

## Data Updates

The dashboard data is automatically updated every 4 hours by the GitHub Actions healing monitor workflow. The workflow:

1. Runs Playwright tests and healing analysis
2. Generates current metrics and historical trends
3. Updates `dashboard-data.json` with latest data
4. Commits changes back to the repository
5. Dashboard automatically reflects new data on next load

## Navigation

The dashboard is accessible from the main blog navigation menu via the "📊 Dashboard" link.