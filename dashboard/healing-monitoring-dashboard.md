# 🎭 Playwright Healing Monitoring Dashboard

## Overview

The Healing Monitoring Dashboard provides comprehensive real-time monitoring and alerting for Playwright test healing effectiveness. This system tracks test success rates, identifies trends, and alerts on degradation to maintain optimal test suite health.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test Suites   │    │  Healing Data   │    │   Dashboard     │
│                 │    │   Collection    │    │     Server      │
│ • Playwright    │───▶│                 │───▶│                 │
│ • BackstopJS    │    │ • Metrics       │    │ • Web UI        │
│ • pa11y-ci      │    │ • Trends        │    │ • REST API      │
│ • Lighthouse    │    │ • Analytics     │    │ • Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Alert System   │
                       │                 │
                       │ • Console       │
                       │ • File          │
                       │ • Webhook       │
                       │ • Multi-channel │
                       └─────────────────┘
```

## 🚀 Quick Start

### 1. Start Monitoring

```bash
# Run complete monitoring cycle
npm run monitoring:full

# Individual components
npm run monitor:healing    # Collect metrics
npm run alert:system      # Check for alerts
npm run dashboard         # Start web dashboard
```

### 2. Access Dashboard

- **Web Dashboard**: http://localhost:8081/dashboard
- **API Status**: http://localhost:8081/api/status
- **API Metrics**: http://localhost:8081/api/metrics

### 3. Configure Alerts

Edit `healing-alerts-config.json` to customize alert thresholds and notification channels:

```json
{
  "thresholds": {
    "critical": 75.0,
    "warning": 81.1,
    "degradation": -5.0,
    "consecutive_failures": 3
  },
  "channels": {
    "console": true,
    "file": true,
    "webhook": false
  }
}
```

## 📊 Components

### 1. Healing Monitor (`scripts/healing-monitor.js`)

Collects test suite metrics and healing effectiveness data:

- **Runs**: All test suites (Playwright, BackstopJS, pa11y-ci)
- **Metrics**: Success rates, execution times, failure patterns
- **Storage**: Daily and cumulative JSON files
- **Reporting**: Markdown reports with trends and recommendations

**Usage:**
```bash
npm run monitor:healing
```

**Output:**
- `healing-metrics/YYYY-MM-DD.json` - Daily metrics
- `healing-metrics/cumulative.json` - Trend data
- `healing-reports/healing-report-YYYY-MM-DD.md` - Analysis reports

### 2. Alert System (`scripts/alert-system.js`)

Multi-channel alerting for degradation and critical failures:

**Alert Types:**
- **Critical**: Success rate < 75%
- **Warning**: Success rate < 81.1%
- **Degradation**: Trending downward > 5 percentage points
- **Recovery**: Success rate restored after degradation
- **Consecutive Failures**: Multiple runs below threshold

**Notification Channels:**
- **Console**: Colored terminal output
- **File**: JSON alerts and text logs
- **Webhook**: HTTP POST notifications
- **Email**: SMTP notifications (configurable)
- **Slack**: Webhook integration (configurable)

**Usage:**
```bash
npm run alert:system
```

### 3. Dashboard Server (`scripts/dashboard-server.js`)

Real-time web dashboard with REST API:

**Features:**
- **Real-time Metrics**: Current success rates and trends
- **Interactive Charts**: Success rate trends and test breakdowns
- **Status Indicators**: Health status with visual indicators
- **Auto-refresh**: Configurable refresh intervals
- **REST API**: Programmatic access to metrics and status

**API Endpoints:**
- `GET /api/status` - Current system status
- `GET /api/metrics` - Complete metrics data
- `POST /api/refresh` - Trigger metrics refresh

**Usage:**
```bash
npm run dashboard
# Access: http://localhost:8081/dashboard
```

### 4. Analytics Scripts

**Trend Analysis** (`scripts/analyze-healing-trends.js`):
```bash
npm run analyze:healing-trends
```

**Failure Analysis** (`scripts/analyze-failures.js`):
```bash
npm run analyze:failures
```

## 📈 Dashboard Features

### Metrics Overview
- **Overall Success Rate**: Current healing effectiveness
- **Playwright Tests**: E2E test results (111 tests)
- **Visual Tests**: BackstopJS screenshot comparisons (15 tests)
- **Average Success**: Rolling 10-run average

### Trend Charts
- **Success Rate Trend**: Last 20 runs with time series
- **Test Suite Breakdown**: Doughnut chart of pass/fail distribution
- **Interactive Tooltips**: Detailed information on hover

### Status Monitoring
- **Overall Health**: System-wide status indicator
- **Suite-specific Status**: Individual test suite health
- **Trend Direction**: Improving, stable, or degrading indicators

### Real-time Updates
- **Auto-refresh**: 30-second intervals (configurable)
- **Manual Refresh**: On-demand updates
- **Live Status**: Current timestamp and health indicators

## 🔔 Alert Configuration

### Threshold Settings

```json
{
  "thresholds": {
    "critical": 75.0,        // Triggers critical alerts
    "warning": 81.1,         // Healing target threshold
    "degradation": -5.0,     // Trend degradation (percentage points)
    "consecutive_failures": 3 // Consecutive runs below threshold
  }
}
```

### Notification Channels

```json
{
  "channels": {
    "console": true,         // Terminal notifications
    "file": true,           // JSON and log files
    "webhook": false,       // HTTP POST notifications
    "email": false,         // SMTP email alerts
    "slack": false          // Slack webhook integration
  }
}
```

### Channel Configuration

**Webhook Setup:**
```json
{
  "settings": {
    "webhook_url": "https://your-webhook-endpoint.com/alerts",
    "cooldown_minutes": 30,
    "retry_attempts": 3
  }
}
```

## 📁 File Structure

```
healing-monitoring/
├── scripts/
│   ├── healing-monitor.js      # Metrics collection
│   ├── alert-system.js         # Multi-channel alerting
│   ├── dashboard-server.js     # Web dashboard server
│   ├── analyze-healing-trends.js
│   └── analyze-failures.js
├── healing-metrics/            # Metrics data storage
│   ├── YYYY-MM-DD.json        # Daily metrics
│   └── cumulative.json        # Trend data
├── healing-reports/            # Analysis reports
│   └── healing-report-YYYY-MM-DD.md
├── healing-alerts/             # Alert storage
│   ├── alert-YYYY-MM-DD.json  # Daily alerts
│   ├── alerts.log            # Text log
│   └── alert-history.json    # Alert history
├── healing-dashboard.html      # Web dashboard UI
└── healing-alerts-config.json  # Alert configuration
```

## 🎯 Success Metrics

### Target Thresholds
- **Primary Goal**: Maintain ≥81.1% success rate (healing baseline)
- **Minimum Acceptable**: ≥75% success rate
- **Trend Stability**: <5 percentage point degradation
- **Recovery Time**: <24 hours from degradation to recovery

### Performance Benchmarks
- **Monitoring Execution**: <2 minutes total runtime
- **Dashboard Response**: <500ms API response times
- **Alert Delivery**: <30 seconds from detection to notification
- **Data Retention**: 100 monitoring runs (rolling window)

## 🔧 Maintenance

### Daily Operations
1. **Review Dashboard**: Check http://localhost:8081/dashboard
2. **Check Alerts**: Review `healing-alerts/alerts.log`
3. **Validate Trends**: Ensure success rates remain stable

### Weekly Operations
1. **Analyze Reports**: Review `healing-reports/` for patterns
2. **Update Thresholds**: Adjust based on performance trends
3. **Clean Old Data**: Archive metrics older than 30 days

### Troubleshooting

**Dashboard Not Loading:**
```bash
# Check server status
curl http://localhost:8081/api/status

# Restart dashboard server
npm run dashboard
```

**No Metrics Data:**
```bash
# Run initial data collection
npm run monitor:healing

# Verify data files exist
ls healing-metrics/
```

**Alerts Not Firing:**
```bash
# Test alert system
npm run alert:system

# Check alert configuration
cat healing-alerts-config.json
```

## 🔗 Integration

### CI/CD Integration

Add to GitHub Actions workflow:
```yaml
- name: Monitor Healing Effectiveness
  run: |
    npm run monitor:healing
    npm run alert:system
```

### Webhook Integration

Configure webhook endpoint to receive JSON alerts:
```json
{
  "alert_type": "critical",
  "severity": "high",
  "title": "Critical: Healing Success Rate Below Minimum",
  "message": "Current success rate (72%) is below critical threshold (75%)",
  "timestamp": "2026-01-13T02:55:10.226Z",
  "source": "playwright-healing-monitor"
}
```

## 📚 Advanced Usage

### Custom Metrics Collection
```javascript
const HealingMonitor = require('./scripts/healing-monitor');
const monitor = new HealingMonitor();

// Custom monitoring run
monitor.runTestSuites().then(results => {
  console.log('Custom metrics:', results);
});
```

### Programmatic Alerts
```javascript
const AlertSystem = require('./scripts/alert-system');
const alerts = new AlertSystem();

// Send custom alert
alerts.sendAlert({
  type: 'custom',
  severity: 'medium',
  title: 'Custom Alert',
  message: 'Custom condition detected',
  timestamp: new Date().toISOString()
});
```

## 🎨 Dashboard Customization

The dashboard uses Chart.js and custom CSS. To customize:

1. **Colors**: Edit CSS variables in `healing-dashboard.html`
2. **Charts**: Modify Chart.js configurations
3. **Metrics**: Add new metric cards and API endpoints
4. **Refresh Rate**: Adjust `setInterval` timing

---

**Generated by Playwright Healing Monitoring System**
*Documentation updated: 2026-01-13*