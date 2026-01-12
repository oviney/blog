#!/usr/bin/env node
/**
 * Healing Degradation Alerting
 * Checks for healing success degradation and triggers appropriate alerts
 */

const fs = require('fs');
const path = require('path');

class HealingDegradationChecker {
  constructor() {
    this.metricsDir = path.join(process.cwd(), 'healing-metrics');
    this.reportsDir = path.join(process.cwd(), 'healing-reports');
    this.timestamp = new Date().toISOString();

    // Alert thresholds
    this.thresholds = {
      critical: 75,     // Below this triggers critical alert
      warning: 81.1,    // Below this triggers warning alert
      volatility: 8,    // Above this volatility triggers stability alert
      consecutiveFailures: 3, // Consecutive failures below warning threshold
      trendConfidence: 60     // Minimum confidence for trend-based alerts
    };

    console.log(`🚨 Starting healing degradation check at ${this.timestamp}`);
  }

  loadMetrics() {
    const cumulativeFile = path.join(this.metricsDir, 'cumulative.json');

    if (!fs.existsSync(cumulativeFile)) {
      throw new Error('No metrics found. Run healing monitor first.');
    }

    try {
      return JSON.parse(fs.readFileSync(cumulativeFile, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to load metrics: ${error.message}`);
    }
  }

  checkDegradation(metrics) {
    const runs = metrics.runs || [];
    const summary = metrics.summary || {};
    const alerts = [];

    // Check current success rate
    const currentRate = summary.currentSuccessRate || 0;
    const avgRate = summary.averageSuccessRate || 0;

    // Critical success rate alert
    if (currentRate < this.thresholds.critical) {
      alerts.push({
        level: 'critical',
        type: 'success-rate',
        title: 'Critical Success Rate Alert',
        description: `Current success rate (${currentRate}%) has fallen below critical threshold (${this.thresholds.critical}%)`,
        impact: 'immediate',
        data: {
          currentRate,
          threshold: this.thresholds.critical,
          difference: currentRate - this.thresholds.critical
        }
      });
    }
    // Warning success rate alert
    else if (currentRate < this.thresholds.warning) {
      alerts.push({
        level: 'warning',
        type: 'success-rate',
        title: 'Below Target Success Rate',
        description: `Current success rate (${currentRate}%) is below target (${this.thresholds.warning}%)`,
        impact: 'moderate',
        data: {
          currentRate,
          threshold: this.thresholds.warning,
          difference: currentRate - this.thresholds.warning
        }
      });
    }

    // Check for degrading trend
    if (summary.trend === 'degrading') {
      alerts.push({
        level: 'warning',
        type: 'trend',
        title: 'Degrading Trend Detected',
        description: 'Test success rate shows a degrading trend pattern',
        impact: 'long-term',
        data: {
          trend: summary.trend,
          avgRate,
          currentRate
        }
      });
    }

    // Check consecutive failures
    const consecutiveFailures = this.checkConsecutiveFailures(runs);
    if (consecutiveFailures >= this.thresholds.consecutiveFailures) {
      alerts.push({
        level: consecutiveFailures >= 5 ? 'critical' : 'warning',
        type: 'consecutive-failures',
        title: 'Consecutive Failures Alert',
        description: `${consecutiveFailures} consecutive runs below warning threshold`,
        impact: 'immediate',
        data: {
          consecutiveFailures,
          threshold: this.thresholds.consecutiveFailures,
          warningThreshold: this.thresholds.warning
        }
      });
    }

    // Check volatility
    const volatility = this.calculateVolatility(runs);
    if (volatility > this.thresholds.volatility) {
      alerts.push({
        level: 'warning',
        type: 'volatility',
        title: 'High Result Volatility',
        description: `Test results show high volatility (${volatility}% standard deviation)`,
        impact: 'stability',
        data: {
          volatility,
          threshold: this.thresholds.volatility
        }
      });
    }

    // Check for recent sharp drops
    const sharpDrop = this.checkSharpDrop(runs);
    if (sharpDrop) {
      alerts.push({
        level: 'critical',
        type: 'sharp-drop',
        title: 'Sharp Success Rate Drop',
        description: `Detected significant drop in success rate: ${sharpDrop.drop}% in last ${sharpDrop.period} runs`,
        impact: 'immediate',
        data: sharpDrop
      });
    }

    return {
      timestamp: this.timestamp,
      status: alerts.length > 0 ? 'alerts-detected' : 'healthy',
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.level === 'critical').length,
      warningAlerts: alerts.filter(a => a.level === 'warning').length,
      alerts,
      metrics: {
        currentRate,
        avgRate,
        trend: summary.trend,
        volatility,
        consecutiveFailures
      }
    };
  }

  checkConsecutiveFailures(runs) {
    let consecutive = 0;

    // Check from most recent runs backwards
    for (let i = runs.length - 1; i >= 0; i--) {
      if (runs[i].successRate < this.thresholds.warning) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  calculateVolatility(runs) {
    if (runs.length < 2) return 0;

    const recentRuns = runs.slice(-10); // Last 10 runs
    const successRates = recentRuns.map(run => run.successRate);
    const mean = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    const variance = successRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / successRates.length;

    return Math.round(Math.sqrt(variance) * 100) / 100;
  }

  checkSharpDrop(runs) {
    if (runs.length < 5) return null;

    const recentCount = Math.min(3, Math.floor(runs.length / 3));
    const previousCount = recentCount;

    const recentRuns = runs.slice(-recentCount);
    const previousRuns = runs.slice(-(recentCount + previousCount), -recentCount);

    if (previousRuns.length === 0) return null;

    const recentAvg = recentRuns.reduce((sum, run) => sum + run.successRate, 0) / recentRuns.length;
    const previousAvg = previousRuns.reduce((sum, run) => sum + run.successRate, 0) / previousRuns.length;

    const drop = previousAvg - recentAvg;

    // Consider it a sharp drop if it's more than 5 percentage points
    if (drop > 5) {
      return {
        drop: Math.round(drop * 100) / 100,
        period: recentCount,
        recentAvg: Math.round(recentAvg * 100) / 100,
        previousAvg: Math.round(previousAvg * 100) / 100
      };
    }

    return null;
  }

  generateAlertReport(degradationCheck) {
    const reportFile = path.join(this.reportsDir, `degradation-alert-${new Date().toISOString().split('T')[0]}.md`);

    const statusEmoji = degradationCheck.status === 'healthy' ? '✅' :
                       degradationCheck.criticalAlerts > 0 ? '🚨' : '⚠️';

    const report = `# Healing Degradation Alert Report ${statusEmoji}

*Generated: ${degradationCheck.timestamp}*

## 🎯 Alert Summary

**Status**: ${degradationCheck.status.toUpperCase()} ${statusEmoji}
- **Total Alerts**: ${degradationCheck.alertCount}
- **Critical**: ${degradationCheck.criticalAlerts}
- **Warning**: ${degradationCheck.warningAlerts}

## 📊 Current Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Current Success Rate** | ${degradationCheck.metrics.currentRate}% | ${degradationCheck.metrics.currentRate >= this.thresholds.warning ? '✅' : degradationCheck.metrics.currentRate >= this.thresholds.critical ? '⚠️' : '🚨'} |
| **Average Success Rate** | ${degradationCheck.metrics.avgRate}% | ${degradationCheck.metrics.avgRate >= this.thresholds.warning ? '✅' : '⚠️'} |
| **Trend** | ${degradationCheck.metrics.trend} | ${degradationCheck.metrics.trend === 'improving' ? '📈' : degradationCheck.metrics.trend === 'degrading' ? '📉' : '➡️'} |
| **Volatility** | ${degradationCheck.metrics.volatility}% | ${degradationCheck.metrics.volatility <= this.thresholds.volatility ? '✅' : '⚠️'} |
| **Consecutive Failures** | ${degradationCheck.metrics.consecutiveFailures} | ${degradationCheck.metrics.consecutiveFailures < this.thresholds.consecutiveFailures ? '✅' : '⚠️'} |

${degradationCheck.alerts.length > 0 ? `
## 🚨 Active Alerts

${degradationCheck.alerts.map(alert => `
### ${alert.level.toUpperCase()}: ${alert.title}

**Description**: ${alert.description}
**Impact**: ${alert.impact}

${alert.data ? `**Details**: ${JSON.stringify(alert.data, null, 2)}\n` : ''}
`).join('')}

## 📋 Immediate Actions Required

${degradationCheck.criticalAlerts > 0 ? `
### 🚨 Critical Actions (Immediate)
${degradationCheck.alerts.filter(a => a.level === 'critical').map(alert =>
  this.getActionPlan(alert)).join('\n')}
` : ''}

${degradationCheck.warningAlerts > 0 ? `
### ⚠️ Warning Actions (Within 24 Hours)
${degradationCheck.alerts.filter(a => a.level === 'warning').map(alert =>
  this.getActionPlan(alert)).join('\n')}
` : ''}
` : `
## ✅ System Health

No degradation alerts detected. The healing system is functioning within normal parameters.

### Maintenance Actions
- Continue regular monitoring
- Review healing patterns for optimization opportunities
- Monitor trends for early warning signs
- Document successful healing patterns
`}

## 📞 Escalation Path

${degradationCheck.criticalAlerts > 0 ? `
### Immediate Escalation Required
1. **Development Team Lead**: Investigate critical failures immediately
2. **QA Team**: Review test environment and infrastructure
3. **DevOps**: Check CI/CD pipeline health and resource allocation
4. **Product Team**: Assess impact on release timeline if applicable
` : ''}

${degradationCheck.warningAlerts > 0 ? `
### Standard Escalation
1. **Test Automation Engineer**: Review and update healing patterns
2. **Development Team**: Investigate recurring failure patterns
3. **QA Team**: Validate test environment stability
` : ''}

## 📈 Monitoring Recommendations

1. **Frequency**: ${degradationCheck.alertCount > 0 ? 'Increase monitoring to every 4 hours until alerts resolve' : 'Continue twice-daily monitoring'}
2. **Focus Areas**: ${this.getMonitoringFocus(degradationCheck.alerts)}
3. **Thresholds**: ${degradationCheck.criticalAlerts > 0 ? 'Consider temporary threshold adjustments during investigation' : 'Current thresholds appear appropriate'}

---
*This alert report is generated automatically. Take action based on alert levels and escalate as necessary.*
`;

    fs.writeFileSync(reportFile, report);
    console.log(`🚨 Degradation alert report saved to ${reportFile}`);

    return reportFile;
  }

  getActionPlan(alert) {
    const actionPlans = {
      'success-rate': `
- **Investigate failing tests**: Run detailed test analysis
- **Review recent changes**: Check for code/infrastructure changes
- **Apply emergency healing**: Implement quick fixes for known patterns
- **Consider test suspension**: Temporarily disable unstable tests if blocking CI`,

      'trend': `
- **Trend analysis**: Review historical data for pattern identification
- **Root cause analysis**: Investigate underlying causes of degradation
- **Healing pattern review**: Update healing rules based on new failure modes
- **Monitoring enhancement**: Increase monitoring frequency`,

      'consecutive-failures': `
- **Immediate investigation**: Analyze last ${alert.data?.consecutiveFailures || 'N'} failed runs
- **Pattern identification**: Look for recurring failure signatures
- **Quick healing**: Apply known healing patterns to common failures
- **Escalation**: Alert development team if pattern is code-related`,

      'volatility': `
- **Environment check**: Investigate test environment stability
- **Infrastructure review**: Check for resource constraints or intermittent issues
- **Flaky test analysis**: Identify and address non-deterministic test behavior
- **Retry mechanism**: Consider implementing retry logic for unstable tests`,

      'sharp-drop': `
- **Emergency investigation**: Immediate analysis of the drop trigger
- **Change correlation**: Map the drop to recent deployments or changes
- **Rollback consideration**: Evaluate need for immediate rollback
- **Stakeholder notification**: Alert relevant teams of significant degradation`
    };

    return actionPlans[alert.type] || `
- **Generic response**: Investigate the ${alert.type} alert
- **Monitor closely**: Increase monitoring frequency
- **Document findings**: Record investigation results for future reference`;
  }

  getMonitoringFocus(alerts) {
    if (alerts.length === 0) return 'General health monitoring';

    const focusAreas = new Set();
    alerts.forEach(alert => {
      switch (alert.type) {
        case 'success-rate':
        case 'consecutive-failures':
          focusAreas.add('test failure patterns');
          break;
        case 'trend':
          focusAreas.add('long-term trend analysis');
          break;
        case 'volatility':
          focusAreas.add('result consistency');
          break;
        case 'sharp-drop':
          focusAreas.add('change correlation');
          break;
      }
    });

    return Array.from(focusAreas).join(', ');
  }

  async run() {
    try {
      console.log('📊 Loading healing metrics...');
      const metrics = this.loadMetrics();

      console.log('🔍 Checking for degradation...');
      const degradationCheck = this.checkDegradation(metrics);

      console.log('📋 Generating alert report...');
      const reportFile = this.generateAlertReport(degradationCheck);

      // Output summary for CI logs
      console.log('\n🚨 DEGRADATION CHECK SUMMARY');
      console.log('=====================================');
      console.log(`Status: ${degradationCheck.status.toUpperCase()}`);
      console.log(`Current Success Rate: ${degradationCheck.metrics.currentRate}%`);
      console.log(`Critical Alerts: ${degradationCheck.criticalAlerts}`);
      console.log(`Warning Alerts: ${degradationCheck.warningAlerts}`);
      console.log(`Report: ${reportFile}`);
      console.log('=====================================\n');

      if (degradationCheck.alerts.length > 0) {
        console.log('📋 ALERTS DETECTED:');
        degradationCheck.alerts.forEach(alert => {
          const emoji = alert.level === 'critical' ? '🚨' : '⚠️';
          console.log(`${emoji} ${alert.level.toUpperCase()}: ${alert.title}`);
        });
        console.log('');
      }

      // Set exit code based on alert levels
      if (degradationCheck.criticalAlerts > 0) {
        console.error('💥 Critical degradation detected - failing build');
        process.exit(1);
      } else if (degradationCheck.warningAlerts > 0) {
        console.warn('⚠️ Warning level degradation detected');
        process.exit(0); // Don't fail build, but log warnings
      } else {
        console.log('✅ No degradation detected');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Degradation check failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the checker if called directly
if (require.main === module) {
  const checker = new HealingDegradationChecker();
  checker.run();
}

module.exports = HealingDegradationChecker;