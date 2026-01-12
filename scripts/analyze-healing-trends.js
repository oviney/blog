#!/usr/bin/env node
/**
 * Healing Trend Analysis
 * Analyzes healing success patterns and trends over time
 */

const fs = require('fs');
const path = require('path');

class HealingTrendAnalyzer {
  constructor() {
    this.metricsDir = path.join(process.cwd(), 'healing-metrics');
    this.reportsDir = path.join(process.cwd(), 'healing-reports');
    this.timestamp = new Date().toISOString();

    console.log(`📈 Starting healing trend analysis at ${this.timestamp}`);
  }

  loadCumulativeMetrics() {
    const cumulativeFile = path.join(this.metricsDir, 'cumulative.json');

    if (!fs.existsSync(cumulativeFile)) {
      throw new Error('No cumulative metrics found. Run healing monitor first.');
    }

    try {
      return JSON.parse(fs.readFileSync(cumulativeFile, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to load cumulative metrics: ${error.message}`);
    }
  }

  analyzeTrends(metrics) {
    const runs = metrics.runs || [];
    const analysis = {
      summary: {
        totalRuns: runs.length,
        dateRange: {
          from: runs[0]?.date || 'unknown',
          to: runs[runs.length - 1]?.date || 'unknown'
        },
        overallTrend: this.calculateOverallTrend(runs),
        volatility: this.calculateVolatility(runs)
      },
      periods: this.analyzePeriods(runs),
      patterns: this.identifyPatterns(runs),
      healing: this.analyzeHealingEffectiveness(runs),
      recommendations: []
    };

    // Generate recommendations based on analysis
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  calculateOverallTrend(runs) {
    if (runs.length < 2) return { direction: 'unknown', confidence: 0 };

    // Use linear regression to determine overall trend
    const dataPoints = runs.map((run, index) => ({
      x: index,
      y: run.successRate
    }));

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + (point.x * point.y), 0);
    const sumX2 = dataPoints.reduce((sum, point) => sum + (point.x * point.x), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const rSquared = this.calculateRSquared(dataPoints, slope, sumY / n);

    return {
      direction: slope > 0.1 ? 'improving' : slope < -0.1 ? 'degrading' : 'stable',
      slope: Math.round(slope * 1000) / 1000,
      confidence: Math.round(rSquared * 100),
      interpretation: this.interpretTrend(slope, rSquared)
    };
  }

  calculateRSquared(dataPoints, slope, yMean) {
    const yIntercept = yMean - slope * (dataPoints.length - 1) / 2;

    const totalSumSquares = dataPoints.reduce((sum, point) =>
      sum + Math.pow(point.y - yMean, 2), 0);

    const residualSumSquares = dataPoints.reduce((sum, point) =>
      sum + Math.pow(point.y - (slope * point.x + yIntercept), 2), 0);

    return Math.max(0, 1 - (residualSumSquares / totalSumSquares));
  }

  interpretTrend(slope, rSquared) {
    if (rSquared < 0.3) return 'High variability, trend uncertain';
    if (rSquared < 0.6) return 'Moderate correlation, trend somewhat reliable';
    return 'Strong correlation, trend highly reliable';
  }

  calculateVolatility(runs) {
    if (runs.length < 2) return 0;

    const successRates = runs.map(run => run.successRate);
    const mean = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    const variance = successRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / successRates.length;

    return Math.round(Math.sqrt(variance) * 100) / 100;
  }

  analyzePeriods(runs) {
    const periods = {
      last7Days: [],
      last30Days: [],
      last90Days: []
    };

    const now = new Date();
    const cutoffs = {
      last7Days: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      last30Days: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      last90Days: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    runs.forEach(run => {
      const runDate = new Date(run.timestamp);

      Object.keys(cutoffs).forEach(period => {
        if (runDate >= cutoffs[period]) {
          periods[period].push(run);
        }
      });
    });

    // Calculate statistics for each period
    return Object.keys(periods).reduce((result, period) => {
      const periodRuns = periods[period];

      if (periodRuns.length === 0) {
        result[period] = { count: 0, average: 0, min: 0, max: 0, trend: 'no-data' };
        return result;
      }

      const successRates = periodRuns.map(run => run.successRate);
      result[period] = {
        count: periodRuns.length,
        average: Math.round((successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length) * 100) / 100,
        min: Math.min(...successRates),
        max: Math.max(...successRates),
        trend: this.calculatePeriodTrend(periodRuns),
        dates: {
          from: periodRuns[0].date,
          to: periodRuns[periodRuns.length - 1].date
        }
      };

      return result;
    }, {});
  }

  calculatePeriodTrend(runs) {
    if (runs.length < 3) return 'insufficient-data';

    const firstHalf = runs.slice(0, Math.floor(runs.length / 2));
    const secondHalf = runs.slice(Math.floor(runs.length / 2));

    const firstAvg = firstHalf.reduce((sum, run) => sum + run.successRate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, run) => sum + run.successRate, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;

    if (change > 1) return 'improving';
    if (change < -1) return 'degrading';
    return 'stable';
  }

  identifyPatterns(runs) {
    return {
      successRateDistribution: this.analyzeSuccessRateDistribution(runs),
      dailyPatterns: this.analyzeDailyPatterns(runs),
      weeklyPatterns: this.analyzeWeeklyPatterns(runs),
      anomalies: this.identifyAnomalies(runs)
    };
  }

  analyzeSuccessRateDistribution(runs) {
    const bins = {
      excellent: 0,    // >= 85%
      good: 0,         // 80-84%
      acceptable: 0,   // 75-79%
      poor: 0,         // 70-74%
      critical: 0      // < 70%
    };

    runs.forEach(run => {
      const rate = run.successRate;
      if (rate >= 85) bins.excellent++;
      else if (rate >= 80) bins.good++;
      else if (rate >= 75) bins.acceptable++;
      else if (rate >= 70) bins.poor++;
      else bins.critical++;
    });

    const total = runs.length;
    return Object.keys(bins).reduce((result, bin) => {
      result[bin] = {
        count: bins[bin],
        percentage: total > 0 ? Math.round((bins[bin] / total) * 100) : 0
      };
      return result;
    }, {});
  }

  analyzeDailyPatterns(runs) {
    // Group runs by hour of day to identify patterns
    const hourlyStats = {};

    runs.forEach(run => {
      const hour = new Date(run.timestamp).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, totalRate: 0, rates: [] };
      }

      hourlyStats[hour].count++;
      hourlyStats[hour].totalRate += run.successRate;
      hourlyStats[hour].rates.push(run.successRate);
    });

    return Object.keys(hourlyStats).reduce((result, hour) => {
      const stats = hourlyStats[hour];
      result[hour] = {
        count: stats.count,
        averageRate: Math.round((stats.totalRate / stats.count) * 100) / 100,
        minRate: Math.min(...stats.rates),
        maxRate: Math.max(...stats.rates)
      };
      return result;
    }, {});
  }

  analyzeWeeklyPatterns(runs) {
    // Group runs by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyStats = {};

    runs.forEach(run => {
      const dayOfWeek = new Date(run.timestamp).getDay();
      const dayName = dayNames[dayOfWeek];

      if (!weeklyStats[dayName]) {
        weeklyStats[dayName] = { count: 0, totalRate: 0, rates: [] };
      }

      weeklyStats[dayName].count++;
      weeklyStats[dayName].totalRate += run.successRate;
      weeklyStats[dayName].rates.push(run.successRate);
    });

    return Object.keys(weeklyStats).reduce((result, day) => {
      const stats = weeklyStats[day];
      result[day] = {
        count: stats.count,
        averageRate: Math.round((stats.totalRate / stats.count) * 100) / 100,
        minRate: Math.min(...stats.rates),
        maxRate: Math.max(...stats.rates)
      };
      return result;
    }, {});
  }

  identifyAnomalies(runs) {
    if (runs.length < 5) return [];

    const successRates = runs.map(run => run.successRate);
    const mean = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    const stdDev = Math.sqrt(successRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / successRates.length);

    const anomalies = [];
    const threshold = 2; // 2 standard deviations

    runs.forEach((run, index) => {
      const deviation = Math.abs(run.successRate - mean);
      if (deviation > threshold * stdDev) {
        anomalies.push({
          timestamp: run.timestamp,
          date: run.date,
          successRate: run.successRate,
          deviation: Math.round(deviation * 100) / 100,
          type: run.successRate > mean ? 'positive' : 'negative',
          severity: deviation > 3 * stdDev ? 'high' : 'medium'
        });
      }
    });

    return anomalies;
  }

  analyzeHealingEffectiveness(runs) {
    // Analyze the effectiveness of healing patterns over time
    const healingTarget = 81.1; // Target from healing implementation
    const baseline = 46; // Original success rate before healing

    const effectiveness = {
      targetAchievement: {
        runsAtTarget: runs.filter(run => run.successRate >= healingTarget).length,
        percentageAtTarget: runs.length > 0 ? Math.round((runs.filter(run => run.successRate >= healingTarget).length / runs.length) * 100) : 0
      },
      improvementFromBaseline: {
        averageImprovement: 0,
        minImprovement: 0,
        maxImprovement: 0
      },
      stability: {
        consecutiveTargetRuns: this.calculateConsecutiveTargetRuns(runs, healingTarget),
        longestStableStreak: this.calculateLongestStableStreak(runs, healingTarget - 2, healingTarget + 2)
      }
    };

    if (runs.length > 0) {
      const improvements = runs.map(run => run.successRate - baseline);
      effectiveness.improvementFromBaseline = {
        averageImprovement: Math.round((improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length) * 100) / 100,
        minImprovement: Math.min(...improvements),
        maxImprovement: Math.max(...improvements)
      };
    }

    return effectiveness;
  }

  calculateConsecutiveTargetRuns(runs, target) {
    let current = 0;
    let max = 0;

    for (let i = runs.length - 1; i >= 0; i--) {
      if (runs[i].successRate >= target) {
        current++;
      } else {
        max = Math.max(max, current);
        current = 0;
      }
    }

    return Math.max(max, current);
  }

  calculateLongestStableStreak(runs, lowerBound, upperBound) {
    let current = 0;
    let max = 0;

    runs.forEach(run => {
      if (run.successRate >= lowerBound && run.successRate <= upperBound) {
        current++;
      } else {
        max = Math.max(max, current);
        current = 0;
      }
    });

    return Math.max(max, current);
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Trend-based recommendations
    if (analysis.summary.overallTrend.direction === 'degrading' && analysis.summary.overallTrend.confidence > 60) {
      recommendations.push({
        priority: 'high',
        category: 'trend',
        title: 'Degrading Trend Detected',
        description: 'Test success rate is showing a degrading trend with high confidence.',
        actions: [
          'Review recent code changes for potential test impacts',
          'Analyze failed test patterns for new healing opportunities',
          'Consider temporary tolerance adjustments while investigating',
          'Increase monitoring frequency to catch issues early'
        ]
      });
    }

    // Volatility-based recommendations
    if (analysis.summary.volatility > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'stability',
        title: 'High Test Result Volatility',
        description: `Test results show high volatility (${analysis.summary.volatility}% std dev).`,
        actions: [
          'Investigate flaky test patterns',
          'Review test environment stability',
          'Consider adding retry mechanisms for unstable tests',
          'Analyze infrastructure factors affecting test consistency'
        ]
      });
    }

    // Success rate recommendations
    const recentAverage = analysis.periods.last7Days?.average || analysis.periods.last30Days?.average || 0;
    if (recentAverage < 75) {
      recommendations.push({
        priority: 'critical',
        category: 'success-rate',
        title: 'Critical Success Rate',
        description: `Recent average success rate (${recentAverage}%) below minimum threshold (75%).`,
        actions: [
          'Immediate investigation of critical failures required',
          'Apply emergency healing patterns for recurring failures',
          'Consider disabling unstable tests temporarily',
          'Escalate to development team for urgent fixes'
        ]
      });
    } else if (recentAverage < 81.1) {
      recommendations.push({
        priority: 'medium',
        category: 'success-rate',
        title: 'Below Target Success Rate',
        description: `Recent average success rate (${recentAverage}%) below target (81.1%).`,
        actions: [
          'Analyze failed test patterns for healing opportunities',
          'Review healing rule effectiveness',
          'Consider expanding healing coverage',
          'Monitor for emerging failure patterns'
        ]
      });
    }

    // Anomaly-based recommendations
    if (analysis.patterns.anomalies.length > 0) {
      const highSeverityAnomalies = analysis.patterns.anomalies.filter(a => a.severity === 'high');
      if (highSeverityAnomalies.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'anomalies',
          title: 'Significant Anomalies Detected',
          description: `${highSeverityAnomalies.length} high-severity anomalies detected in test results.`,
          actions: [
            'Investigate causes of extreme success rate variations',
            'Review system changes during anomaly periods',
            'Check for infrastructure or environmental factors',
            'Consider adding monitoring for anomaly triggers'
          ]
        });
      }
    }

    // Healing effectiveness recommendations
    if (analysis.healing.targetAchievement.percentageAtTarget < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'healing',
        title: 'Healing Target Achievement Low',
        description: `Only ${analysis.healing.targetAchievement.percentageAtTarget}% of runs meet healing target.`,
        actions: [
          'Review and update healing patterns',
          'Identify new failure modes requiring healing',
          'Consider adjusting healing tolerances',
          'Expand healing coverage to additional test scenarios'
        ]
      });
    }

    return recommendations;
  }

  generateTrendReport(analysis) {
    const reportFile = path.join(this.reportsDir, `trend-analysis-${new Date().toISOString().split('T')[0]}.md`);

    const report = `# Healing Trend Analysis Report

*Generated: ${this.timestamp}*

## 📊 Executive Summary

- **Total Monitoring Runs**: ${analysis.summary.totalRuns}
- **Date Range**: ${analysis.summary.dateRange.from} to ${analysis.summary.dateRange.to}
- **Overall Trend**: ${analysis.summary.overallTrend.direction} (${analysis.summary.overallTrend.confidence}% confidence)
- **Volatility**: ${analysis.summary.volatility}% standard deviation
- **Interpretation**: ${analysis.summary.overallTrend.interpretation}

## 📈 Trend Analysis

### Overall Performance Trend
- **Direction**: ${analysis.summary.overallTrend.direction}
- **Slope**: ${analysis.summary.overallTrend.slope} percentage points per run
- **Confidence**: ${analysis.summary.overallTrend.confidence}%

### Period Analysis
| Period | Runs | Average | Min | Max | Trend |
|--------|------|---------|-----|-----|-------|
| **Last 7 Days** | ${analysis.periods.last7Days.count} | ${analysis.periods.last7Days.average}% | ${analysis.periods.last7Days.min}% | ${analysis.periods.last7Days.max}% | ${analysis.periods.last7Days.trend} |
| **Last 30 Days** | ${analysis.periods.last30Days.count} | ${analysis.periods.last30Days.average}% | ${analysis.periods.last30Days.min}% | ${analysis.periods.last30Days.max}% | ${analysis.periods.last30Days.trend} |
| **Last 90 Days** | ${analysis.periods.last90Days.count} | ${analysis.periods.last90Days.average}% | ${analysis.periods.last90Days.min}% | ${analysis.periods.last90Days.max}% | ${analysis.periods.last90Days.trend} |

## 🎯 Healing Effectiveness

### Target Achievement (81.1% Success Rate)
- **Runs Meeting Target**: ${analysis.healing.targetAchievement.runsAtTarget}/${analysis.summary.totalRuns} (${analysis.healing.targetAchievement.percentageAtTarget}%)
- **Current Consecutive Target Runs**: ${analysis.healing.stability.consecutiveTargetRuns}
- **Longest Stable Streak**: ${analysis.healing.stability.longestStableStreak} runs

### Improvement from Baseline (46% original)
- **Average Improvement**: +${analysis.healing.improvementFromBaseline.averageImprovement} percentage points
- **Best Improvement**: +${analysis.healing.improvementFromBaseline.maxImprovement} percentage points
- **Worst Performance**: +${analysis.healing.improvementFromBaseline.minImprovement} percentage points

## 📊 Success Rate Distribution

| Category | Count | Percentage |
|----------|-------|------------|
| **Excellent (≥85%)** | ${analysis.patterns.successRateDistribution.excellent.count} | ${analysis.patterns.successRateDistribution.excellent.percentage}% |
| **Good (80-84%)** | ${analysis.patterns.successRateDistribution.good.count} | ${analysis.patterns.successRateDistribution.good.percentage}% |
| **Acceptable (75-79%)** | ${analysis.patterns.successRateDistribution.acceptable.count} | ${analysis.patterns.successRateDistribution.acceptable.percentage}% |
| **Poor (70-74%)** | ${analysis.patterns.successRateDistribution.poor.count} | ${analysis.patterns.successRateDistribution.poor.percentage}% |
| **Critical (<70%)** | ${analysis.patterns.successRateDistribution.critical.count} | ${analysis.patterns.successRateDistribution.critical.percentage}% |

## 🔍 Pattern Analysis

### Daily Patterns (by Hour)
${Object.keys(analysis.patterns.dailyPatterns).length > 0 ?
  Object.keys(analysis.patterns.dailyPatterns).map(hour =>
    `- **${hour}:00**: ${analysis.patterns.dailyPatterns[hour].count} runs, avg ${analysis.patterns.dailyPatterns[hour].averageRate}%`
  ).join('\n') :
  'No daily patterns detected (insufficient data)'}

### Weekly Patterns
${Object.keys(analysis.patterns.weeklyPatterns).length > 0 ?
  Object.keys(analysis.patterns.weeklyPatterns).map(day =>
    `- **${day}**: ${analysis.patterns.weeklyPatterns[day].count} runs, avg ${analysis.patterns.weeklyPatterns[day].averageRate}%`
  ).join('\n') :
  'No weekly patterns detected (insufficient data)'}

## 🚨 Anomalies Detected

${analysis.patterns.anomalies.length > 0 ?
  analysis.patterns.anomalies.map(anomaly =>
    `- **${anomaly.date}** (${anomaly.type}): ${anomaly.successRate}% (${anomaly.deviation} deviation, ${anomaly.severity} severity)`
  ).join('\n') :
  'No significant anomalies detected'}

## 📋 Recommendations

${analysis.recommendations.length > 0 ?
  analysis.recommendations.map(rec => `
### ${rec.priority.toUpperCase()}: ${rec.title}

${rec.description}

**Recommended Actions:**
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('\n') :
  'No specific recommendations at this time. Continue monitoring for trends.'}

## 📊 Key Insights

1. **Healing Effectiveness**: The healing system has improved test success rates by an average of ${analysis.healing.improvementFromBaseline.averageImprovement} percentage points from the original 46% baseline.

2. **Stability Assessment**: ${analysis.healing.targetAchievement.percentageAtTarget}% of monitoring runs meet the 81.1% target success rate, indicating ${analysis.healing.targetAchievement.percentageAtTarget >= 70 ? 'good' : analysis.healing.targetAchievement.percentageAtTarget >= 50 ? 'moderate' : 'poor'} healing stability.

3. **Trend Direction**: The overall trend is ${analysis.summary.overallTrend.direction} with ${analysis.summary.overallTrend.confidence}% confidence, ${analysis.summary.overallTrend.confidence >= 70 ? 'providing reliable insight into system health' : 'requiring continued monitoring for conclusive patterns'}.

4. **Volatility Impact**: Test result volatility of ${analysis.summary.volatility}% indicates ${analysis.summary.volatility <= 3 ? 'excellent' : analysis.summary.volatility <= 5 ? 'good' : analysis.summary.volatility <= 8 ? 'moderate' : 'high'} result consistency.

---
*This analysis is generated automatically from healing monitoring data. Review recommendations and take action as appropriate for maintaining test suite health.*
`;

    fs.writeFileSync(reportFile, report);
    console.log(`📊 Trend analysis report saved to ${reportFile}`);

    return { analysis, reportFile };
  }

  async run() {
    try {
      console.log('📈 Loading cumulative metrics...');
      const metrics = this.loadCumulativeMetrics();

      console.log('🔍 Analyzing trends...');
      const analysis = this.analyzeTrends(metrics);

      console.log('📋 Generating trend report...');
      const { reportFile } = this.generateTrendReport(analysis);

      // Output summary for CI logs
      console.log('\n📊 TREND ANALYSIS SUMMARY');
      console.log('=====================================');
      console.log(`Total Runs Analyzed: ${analysis.summary.totalRuns}`);
      console.log(`Overall Trend: ${analysis.summary.overallTrend.direction} (${analysis.summary.overallTrend.confidence}% confidence)`);
      console.log(`Volatility: ${analysis.summary.volatility}%`);
      console.log(`Target Achievement: ${analysis.healing.targetAchievement.percentageAtTarget}%`);
      console.log(`Recommendations: ${analysis.recommendations.length}`);
      console.log(`Report: ${reportFile}`);
      console.log('=====================================\n');

    } catch (error) {
      console.error('💥 Trend analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the analyzer if called directly
if (require.main === module) {
  const analyzer = new HealingTrendAnalyzer();
  analyzer.run();
}

module.exports = HealingTrendAnalyzer;