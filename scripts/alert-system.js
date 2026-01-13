#!/usr/bin/env node
/**
 * Advanced Healing Alert System
 * Multi-channel alerting for healing degradation and critical failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HealingAlertSystem {
  constructor() {
    this.metricsDir = path.join(process.cwd(), 'healing-metrics');
    this.alertsDir = path.join(process.cwd(), 'healing-alerts');
    this.configFile = path.join(process.cwd(), 'healing-alerts-config.json');
    this.timestamp = new Date().toISOString();

    // Ensure alerts directory exists
    if (!fs.existsSync(this.alertsDir)) {
      fs.mkdirSync(this.alertsDir, { recursive: true });
    }

    this.config = this.loadConfig();
    this.alertHistory = this.loadAlertHistory();

    console.log(`🚨 Healing Alert System initialized at ${this.timestamp}`);
  }

  loadConfig() {
    const defaultConfig = {
      thresholds: {
        critical: 75.0,        // Below this triggers critical alerts
        warning: 81.1,         // Below this triggers warning alerts
        degradation: -5.0,     // Trend degradation threshold (percentage points)
        consecutive_failures: 3 // Consecutive failures to trigger alert
      },
      channels: {
        console: true,
        file: true,
        webhook: false,
        email: false,
        slack: false
      },
      settings: {
        webhook_url: '',
        email_smtp: {
          host: '',
          port: 587,
          secure: false,
          auth: { user: '', pass: '' }
        },
        slack_webhook: '',
        cooldown_minutes: 30,  // Minimum time between similar alerts
        retry_attempts: 3
      },
      notifications: {
        on_recovery: true,
        on_degradation: true,
        on_critical: true,
        on_improvement: true
      }
    };

    if (fs.existsSync(this.configFile)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn('⚠️ Failed to load alert config, using defaults:', error.message);
        return defaultConfig;
      }
    }

    // Save default config for user customization
    fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
    console.log(`📋 Default alert config created at ${this.configFile}`);
    return defaultConfig;
  }

  loadAlertHistory() {
    const historyFile = path.join(this.alertsDir, 'alert-history.json');

    if (fs.existsSync(historyFile)) {
      try {
        return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Failed to load alert history, starting fresh');
        return { alerts: [] };
      }
    }

    return { alerts: [] };
  }

  saveAlertHistory() {
    const historyFile = path.join(this.alertsDir, 'alert-history.json');
    fs.writeFileSync(historyFile, JSON.stringify(this.alertHistory, null, 2));
  }

  async loadLatestMetrics() {
    const cumulativeFile = path.join(this.metricsDir, 'cumulative.json');

    if (!fs.existsSync(cumulativeFile)) {
      throw new Error('No metrics data available. Run healing monitor first.');
    }

    try {
      return JSON.parse(fs.readFileSync(cumulativeFile, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to load metrics: ${error.message}`);
    }
  }

  analyzeAlertConditions(metrics) {
    const summary = metrics.summary || {};
    const runs = metrics.runs || [];
    const alerts = [];

    const currentRate = summary.currentSuccessRate || 0;
    const averageRate = summary.averageSuccessRate || 0;
    const trend = summary.trend || 'stable';

    // Critical threshold alert
    if (currentRate < this.config.thresholds.critical) {
      alerts.push({
        type: 'critical',
        severity: 'high',
        title: 'Critical: Healing Success Rate Below Minimum',
        message: `Current success rate (${currentRate}%) is below critical threshold (${this.config.thresholds.critical}%)`,
        details: {
          current_rate: currentRate,
          threshold: this.config.thresholds.critical,
          average_rate: averageRate,
          trend: trend,
          total_runs: summary.totalRuns || 0
        },
        timestamp: this.timestamp
      });
    }

    // Warning threshold alert
    else if (currentRate < this.config.thresholds.warning) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: 'Warning: Healing Success Rate Below Target',
        message: `Current success rate (${currentRate}%) is below target threshold (${this.config.thresholds.warning}%)`,
        details: {
          current_rate: currentRate,
          threshold: this.config.thresholds.warning,
          average_rate: averageRate,
          trend: trend
        },
        timestamp: this.timestamp
      });
    }

    // Degradation trend alert
    if (trend === 'degrading' && this.config.notifications.on_degradation) {
      const degradationAmount = this.calculateDegradation(runs);
      if (degradationAmount <= this.config.thresholds.degradation) {
        alerts.push({
          type: 'degradation',
          severity: 'medium',
          title: 'Trend Alert: Healing Effectiveness Degrading',
          message: `Healing success rate has degraded by ${Math.abs(degradationAmount).toFixed(1)} percentage points`,
          details: {
            current_rate: currentRate,
            degradation_amount: degradationAmount,
            trend: trend,
            threshold: this.config.thresholds.degradation
          },
          timestamp: this.timestamp
        });
      }
    }

    // Recovery alert
    if (currentRate >= this.config.thresholds.warning && this.config.notifications.on_recovery) {
      const lastAlert = this.getLastAlertOfType(['critical', 'warning']);
      if (lastAlert && lastAlert.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) {
        alerts.push({
          type: 'recovery',
          severity: 'low',
          title: 'Recovery: Healing Success Rate Restored',
          message: `Success rate (${currentRate}%) has recovered above target threshold`,
          details: {
            current_rate: currentRate,
            threshold: this.config.thresholds.warning,
            recovery_time: this.timestamp
          },
          timestamp: this.timestamp
        });
      }
    }

    // Consecutive failures alert
    const recentFailures = this.countRecentFailures(runs);
    if (recentFailures >= this.config.thresholds.consecutive_failures) {
      alerts.push({
        type: 'consecutive_failures',
        severity: 'high',
        title: 'Alert: Multiple Consecutive Test Failures',
        message: `${recentFailures} consecutive runs below success threshold`,
        details: {
          consecutive_failures: recentFailures,
          threshold: this.config.thresholds.consecutive_failures,
          recent_rates: runs.slice(-recentFailures).map(r => r.successRate)
        },
        timestamp: this.timestamp
      });
    }

    return alerts;
  }

  calculateDegradation(runs) {
    if (runs.length < 5) return 0;

    const recent = runs.slice(-3).map(r => r.successRate);
    const previous = runs.slice(-6, -3).map(r => r.successRate);

    if (previous.length === 0) return 0;

    const recentAvg = recent.reduce((sum, rate) => sum + rate, 0) / recent.length;
    const previousAvg = previous.reduce((sum, rate) => sum + rate, 0) / previous.length;

    return recentAvg - previousAvg;
  }

  countRecentFailures(runs) {
    let count = 0;
    for (let i = runs.length - 1; i >= 0; i--) {
      if (runs[i].successRate < this.config.thresholds.warning) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  getLastAlertOfType(types) {
    const relevantAlerts = this.alertHistory.alerts.filter(alert =>
      types.includes(alert.type)
    );
    return relevantAlerts.length > 0 ? relevantAlerts[relevantAlerts.length - 1] : null;
  }

  shouldSendAlert(alert) {
    const cooldownMs = this.config.settings.cooldown_minutes * 60 * 1000;
    const now = Date.now();

    // Check for similar recent alerts within cooldown period
    const recentSimilar = this.alertHistory.alerts.find(histAlert =>
      histAlert.type === alert.type &&
      new Date(histAlert.timestamp).getTime() > now - cooldownMs
    );

    return !recentSimilar;
  }

  async sendAlert(alert) {
    if (!this.shouldSendAlert(alert)) {
      console.log(`🔕 Skipping alert (cooldown): ${alert.title}`);
      return false;
    }

    const channels = [];

    // Console notification
    if (this.config.channels.console) {
      this.sendConsoleAlert(alert);
      channels.push('console');
    }

    // File notification
    if (this.config.channels.file) {
      await this.sendFileAlert(alert);
      channels.push('file');
    }

    // Webhook notification
    if (this.config.channels.webhook && this.config.settings.webhook_url) {
      try {
        await this.sendWebhookAlert(alert);
        channels.push('webhook');
      } catch (error) {
        console.error('Failed to send webhook alert:', error.message);
      }
    }

    // Save to history
    this.alertHistory.alerts.push({
      ...alert,
      channels: channels,
      sent_at: new Date().toISOString()
    });

    // Keep only last 100 alerts
    if (this.alertHistory.alerts.length > 100) {
      this.alertHistory.alerts = this.alertHistory.alerts.slice(-100);
    }

    this.saveAlertHistory();

    console.log(`📤 Alert sent via ${channels.join(', ')}: ${alert.title}`);
    return true;
  }

  sendConsoleAlert(alert) {
    const icons = {
      critical: '🚨',
      warning: '⚠️',
      degradation: '📉',
      recovery: '✅',
      consecutive_failures: '🔴'
    };

    const colors = {
      critical: '\x1b[31m',    // Red
      warning: '\x1b[33m',     // Yellow
      degradation: '\x1b[35m', // Magenta
      recovery: '\x1b[32m',    // Green
      consecutive_failures: '\x1b[31m' // Red
    };

    const reset = '\x1b[0m';
    const color = colors[alert.type] || '';

    console.log(`\n${color}${icons[alert.type] || '🔔'} ${alert.title}${reset}`);
    console.log(`${color}${alert.message}${reset}`);

    if (alert.details) {
      console.log(`${color}Details: ${JSON.stringify(alert.details, null, 2)}${reset}`);
    }

    console.log(`${color}Timestamp: ${alert.timestamp}${reset}\n`);
  }

  async sendFileAlert(alert) {
    const alertFile = path.join(this.alertsDir, `alert-${new Date().toISOString().split('T')[0]}.json`);
    const logFile = path.join(this.alertsDir, 'alerts.log');

    // JSON alert file
    let dailyAlerts = [];
    if (fs.existsSync(alertFile)) {
      try {
        dailyAlerts = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
      } catch (error) {
        dailyAlerts = [];
      }
    }

    dailyAlerts.push(alert);
    fs.writeFileSync(alertFile, JSON.stringify(dailyAlerts, null, 2));

    // Text log file
    const logEntry = `[${alert.timestamp}] ${alert.severity.toUpperCase()}: ${alert.title} - ${alert.message}\n`;
    fs.appendFileSync(logFile, logEntry);
  }

  async sendWebhookAlert(alert) {
    const payload = {
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      details: alert.details,
      timestamp: alert.timestamp,
      source: 'playwright-healing-monitor'
    };

    // Use curl for webhook since we don't have external dependencies
    const curlCmd = [
      'curl', '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(payload),
      this.config.settings.webhook_url
    ].join(' ');

    execSync(curlCmd, { encoding: 'utf8', timeout: 10000 });
  }

  generateAlertReport() {
    const reportFile = path.join(this.alertsDir, `alert-report-${new Date().toISOString().split('T')[0]}.md`);

    const recentAlerts = this.alertHistory.alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return alertTime > oneDayAgo;
    });

    const report = `# Healing Alert Report - ${new Date().toLocaleDateString()}

## 📊 Alert Summary (Last 24 Hours)

- **Total Alerts**: ${recentAlerts.length}
- **Critical Alerts**: ${recentAlerts.filter(a => a.severity === 'high').length}
- **Warning Alerts**: ${recentAlerts.filter(a => a.severity === 'medium').length}
- **Recovery Alerts**: ${recentAlerts.filter(a => a.type === 'recovery').length}

## 🔔 Recent Alerts

${recentAlerts.length > 0 ? recentAlerts.map(alert => `
### ${alert.title}
- **Type**: ${alert.type}
- **Severity**: ${alert.severity}
- **Time**: ${new Date(alert.timestamp).toLocaleString()}
- **Message**: ${alert.message}
- **Channels**: ${alert.channels ? alert.channels.join(', ') : 'unknown'}

${alert.details ? `**Details**:
\`\`\`json
${JSON.stringify(alert.details, null, 2)}
\`\`\`` : ''}
`).join('') : 'No alerts in the last 24 hours.'}

## ⚙️ Alert Configuration

- **Critical Threshold**: ${this.config.thresholds.critical}%
- **Warning Threshold**: ${this.config.thresholds.warning}%
- **Degradation Threshold**: ${this.config.thresholds.degradation} percentage points
- **Consecutive Failures**: ${this.config.thresholds.consecutive_failures} runs
- **Cooldown Period**: ${this.config.settings.cooldown_minutes} minutes

---
*Generated at ${new Date().toISOString()}*
`;

    fs.writeFileSync(reportFile, report);
    console.log(`📋 Alert report generated: ${reportFile}`);
    return reportFile;
  }

  async run() {
    try {
      console.log('🎯 Starting Healing Alert Analysis');

      // Load latest metrics
      const metrics = await this.loadLatestMetrics();

      // Analyze for alert conditions
      const alerts = this.analyzeAlertConditions(metrics);

      if (alerts.length === 0) {
        console.log('✅ No alert conditions detected');
        return;
      }

      console.log(`🚨 Found ${alerts.length} alert condition(s)`);

      // Send alerts
      for (const alert of alerts) {
        await this.sendAlert(alert);
      }

      // Generate alert report
      this.generateAlertReport();

      // Exit with appropriate code
      const criticalAlerts = alerts.filter(a => a.severity === 'high');
      if (criticalAlerts.length > 0) {
        console.log('❌ Critical alerts detected');
        process.exit(1);
      } else {
        console.log('⚠️ Non-critical alerts processed');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Alert system failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const alertSystem = new HealingAlertSystem();
  alertSystem.run();
}

module.exports = HealingAlertSystem;