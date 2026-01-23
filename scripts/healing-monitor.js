#!/usr/bin/env node
/**
 * Healing Success Monitor
 * Tracks Playwright test healing effectiveness over time
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class HealingMonitor {
  constructor() {
    this.metricsDir = path.join(process.cwd(), 'healing-metrics');
    this.reportsDir = path.join(process.cwd(), 'healing-reports');
    this.timestamp = new Date().toISOString();
    this.date = this.timestamp.split('T')[0];
    this.TOTAL_PLAYWRIGHT_TESTS = 111; // Total number of Playwright tests in the suite

    // Ensure directories exist
    [this.metricsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log(`🔍 Starting healing monitoring at ${this.timestamp}`);
  }

  async runTestSuites() {
    const results = {
      timestamp: this.timestamp,
      date: this.date,
      suites: {},
      overall: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0,
        executionTime: 0
      }
    };

    const startTime = Date.now();

    // Read Playwright results from JSON reporter instead of re-running tests
    console.log('📊 Reading Playwright test results...');
    try {
      const resultsPath = path.join(process.cwd(), 'test-results', '.last-run.json');
      
      if (fs.existsSync(resultsPath)) {
        const playwrightData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        results.suites.playwright = this.parsePlaywrightResults(playwrightData);
        const total = results.suites.playwright.passed + results.suites.playwright.failed;
        console.log(`✅ Playwright results loaded: ${results.suites.playwright.passed}/${total}`);
      } else {
        // Fallback: Try to read from playwright-report/index.html or other artifacts
        console.warn('⚠️ Playwright results file not found, attempting to parse from reporter output');
        
        // Check if we can find results in playwright-report directory
        const reportDir = path.join(process.cwd(), 'playwright-report');
        if (fs.existsSync(reportDir)) {
          // Parse results from HTML report or other available data
          results.suites.playwright = this.parsePlaywrightReportDir(reportDir);
        } else {
          console.warn('⚠️ No Playwright results available, using defaults');
          results.suites.playwright = {
            passed: 0,
            failed: this.TOTAL_PLAYWRIGHT_TESTS,
            skipped: 0,
            successRate: 0,
            executionTime: 0,
            failedTests: [],
            status: 'unknown',
            note: 'Results not available - tests may not have run'
          };
        }
      }
    } catch (error) {
      console.error('⚠️ Error reading Playwright results:', error.message);
      results.suites.playwright = {
        passed: 0,
        failed: this.TOTAL_PLAYWRIGHT_TESTS,
        skipped: 0,
        successRate: 0,
        executionTime: 0,
        failedTests: [],
        status: 'error',
        note: `Error: ${error.message}`
      };
    }

    // Run BackstopJS visual tests (keep existing logic)
    console.log('🖼️ Running BackstopJS visual tests...');
    try {
      execSync('npm run test:visual', { encoding: 'utf8' });
      results.suites.visual = {
        passed: 15,
        failed: 0,
        successRate: 100,
        status: 'pass'
      };
    } catch (error) {
      results.suites.visual = {
        passed: 0,
        failed: 15,
        successRate: 0,
        status: 'fail'
      };
    }

    // Calculate overall metrics
    const totalPassed = Object.values(results.suites).reduce((sum, suite) => sum + (suite.passed || 0), 0);
    const totalFailed = Object.values(results.suites).reduce((sum, suite) => sum + (suite.failed || 0), 0);
    const totalTests = totalPassed + totalFailed;

    results.overall = {
      totalTests,
      passedTests: totalPassed,
      failedTests: totalFailed,
      successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100 * 100) / 100 : 0,
      executionTime: Math.round((Date.now() - startTime) / 1000)
    };

    console.log(`✅ Monitoring complete: ${totalPassed}/${totalTests} tests passed (${results.overall.successRate}%)`);

    return results;
  }

  parsePlaywrightOutput(output) {
    // Parse Playwright reporter output format (works with both 'line' and 'list' reporters)
    const lines = output.split('\n');

    // Look for summary line like "90 passed (41.1s)" or "21 failed"
    const summaryLine = lines[lines.length - 1] || lines[lines.length - 2] || '';

    let passed = 0;
    let failed = 0;
    let executionTime = 0;

    // Extract passed count
    const passedMatch = summaryLine.match(/(\d+) passed/);
    if (passedMatch) {
      passed = parseInt(passedMatch[1]);
    }

    // Extract failed count
    const failedMatch = summaryLine.match(/(\d+) failed/);
    if (failedMatch) {
      failed = parseInt(failedMatch[1]);
    }

    // Extract execution time
    const timeMatch = summaryLine.match(/\(([0-9.]+)s\)/);
    if (timeMatch) {
      executionTime = Math.round(parseFloat(timeMatch[1]));
    }

    // Extract failed test information from the output
    const failedTests = this.extractFailedTests(lines);

    return {
      passed,
      failed,
      skipped: 0,
      successRate: passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100 * 100) / 100 : 0,
      executionTime,
      failedTests,
      status: failed === 0 ? 'pass' : 'fail'
    };
  }

  extractFailedTests(lines) {
    const failedTests = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for failed test lines
      if (line.includes('›') && !line.includes('✓')) {
        const testMatch = line.match(/› (.+) › (.+)/);
        if (testMatch) {
          failedTests.push({
            title: testMatch[2],
            file: testMatch[1].split('/').pop(),
            error: 'Test failed - see logs for details',
            location: testMatch[1]
          });
        }
      }
    }

    return failedTests.slice(0, 10); // Limit to 10 for performance
  }

  parsePlaywrightResults(data) {
    const stats = data.stats || {};
    const tests = data.tests || [];

    const failedTests = tests
      .filter(test => test.outcome !== 'expected')
      .map(test => ({
        title: test.title,
        file: test.location?.file?.split('/').slice(-1)[0] || 'unknown',
        error: test.results?.[0]?.error?.message || 'Unknown error',
        location: test.location
      }));

    return {
      passed: stats.passed || 0,
      failed: stats.failed || 0,
      skipped: stats.skipped || 0,
      successRate: stats.passed && (stats.passed + stats.failed) > 0
        ? Math.round((stats.passed / (stats.passed + stats.failed)) * 100 * 100) / 100
        : 0,
      executionTime: Math.round((stats.duration || 0) / 1000),
      failedTests,
      status: (stats.failed || 0) === 0 ? 'pass' : 'fail'
    };
  }

  parsePlaywrightFailure(output) {
    // Parse failure output to extract test counts
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : this.TOTAL_PLAYWRIGHT_TESTS;

    return {
      passed,
      failed,
      skipped: 0,
      successRate: passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100 * 100) / 100 : 0,
      executionTime: 0,
      failedTests: [],
      status: 'fail',
      note: 'Parsed from failure output'
    };
  }

  parsePlaywrightReportDir(reportDir) {
    // Helper method to parse results from playwright-report directory
    try {
      // Look for data.json or other result files in the report directory
      const dataFile = path.join(reportDir, 'data.json');
      if (fs.existsSync(dataFile)) {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        return this.parsePlaywrightResults(data);
      }
    } catch (error) {
      console.warn('⚠️ Could not parse playwright report directory:', error.message);
    }
    
    return {
      passed: 0,
      failed: this.TOTAL_PLAYWRIGHT_TESTS,
      skipped: 0,
      successRate: 0,
      executionTime: 0,
      failedTests: [],
      status: 'unknown',
      note: 'Could not parse results from report directory'
    };
  }

  saveMetrics(results) {
    // Save daily metrics
    const dailyMetricsFile = path.join(this.metricsDir, `${this.date}.json`);
    let dailyMetrics = [];

    if (fs.existsSync(dailyMetricsFile)) {
      try {
        dailyMetrics = JSON.parse(fs.readFileSync(dailyMetricsFile, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Could not read existing daily metrics, starting fresh');
        dailyMetrics = [];
      }
    }

    dailyMetrics.push(results);
    fs.writeFileSync(dailyMetricsFile, JSON.stringify(dailyMetrics, null, 2));

    // Update cumulative metrics
    const cumulativeFile = path.join(this.metricsDir, 'cumulative.json');
    let cumulativeMetrics = { runs: [], summary: {} };

    if (fs.existsSync(cumulativeFile)) {
      try {
        cumulativeMetrics = JSON.parse(fs.readFileSync(cumulativeFile, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Could not read cumulative metrics, starting fresh');
        cumulativeMetrics = { runs: [], summary: {} };
      }
    }

    cumulativeMetrics.runs.push({
      timestamp: results.timestamp,
      date: results.date,
      successRate: results.overall.successRate,
      playwrightPassed: results.suites.playwright?.passed || 0,
      playwrightFailed: results.suites.playwright?.failed || 0,
      visualPassed: results.suites.visual?.passed || 0,
      visualFailed: results.suites.visual?.failed || 0
    });

    // Keep only last 100 runs to prevent file bloat
    if (cumulativeMetrics.runs.length > 100) {
      cumulativeMetrics.runs = cumulativeMetrics.runs.slice(-100);
    }

    // Update summary statistics
    const recentRuns = cumulativeMetrics.runs.slice(-10); // Last 10 runs
    const avgSuccessRate = recentRuns.reduce((sum, run) => sum + run.successRate, 0) / recentRuns.length;
    const trend = this.calculateTrend(cumulativeMetrics.runs);

    cumulativeMetrics.summary = {
      lastUpdate: results.timestamp,
      totalRuns: cumulativeMetrics.runs.length,
      averageSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      currentSuccessRate: results.overall.successRate,
      trend,
      baseline: {
        target: 81.1, // Target from healing success
        minimum: 75.0  // Minimum acceptable success rate
      }
    };

    fs.writeFileSync(cumulativeFile, JSON.stringify(cumulativeMetrics, null, 2));

    console.log(`💾 Metrics saved to ${dailyMetricsFile} and cumulative.json`);
    return cumulativeMetrics;
  }

  calculateTrend(runs) {
    if (runs.length < 2) return 'stable';

    const recentRuns = runs.slice(-5); // Last 5 runs
    const previousRuns = runs.slice(-10, -5); // 5 runs before that

    if (previousRuns.length === 0) return 'stable';

    const recentAvg = recentRuns.reduce((sum, run) => sum + run.successRate, 0) / recentRuns.length;
    const previousAvg = previousRuns.reduce((sum, run) => sum + run.successRate, 0) / previousRuns.length;

    const change = recentAvg - previousAvg;

    if (change > 2) return 'improving';
    if (change < -2) return 'degrading';
    return 'stable';
  }

  generateHealingReport(results, cumulativeMetrics) {
    const reportFile = path.join(this.reportsDir, `healing-report-${this.date}.md`);

    const report = `# Healing Success Report - ${this.date}

## 📊 Test Suite Health Summary

| Metric | Current | Target | Status |
|--------|---------|---------|---------|
| **Overall Success Rate** | ${results.overall.successRate}% | 81.1% | ${results.overall.successRate >= 81.1 ? '✅' : results.overall.successRate >= 75 ? '⚠️' : '❌'} |
| **Playwright Tests** | ${results.suites.playwright?.passed || 0}/${(results.suites.playwright?.passed || 0) + (results.suites.playwright?.failed || 0)} | 90/111 | ${(results.suites.playwright?.passed || 0) >= 90 ? '✅' : (results.suites.playwright?.passed || 0) >= 80 ? '⚠️' : '❌'} |
| **Visual Tests** | ${results.suites.visual?.passed || 0}/${(results.suites.visual?.passed || 0) + (results.suites.visual?.failed || 0)} | 15/15 | ${results.suites.visual?.status === 'pass' ? '✅' : '❌'} |
| **Execution Time** | ${results.overall.executionTime}s | <300s | ${results.overall.executionTime < 300 ? '✅' : '⚠️'} |

## 📈 Trend Analysis

- **Current Trend**: ${cumulativeMetrics.summary.trend} (${cumulativeMetrics.summary.trend === 'improving' ? '📈' : cumulativeMetrics.summary.trend === 'degrading' ? '📉' : '➡️'})
- **10-Run Average**: ${cumulativeMetrics.summary.averageSuccessRate}%
- **Total Monitoring Runs**: ${cumulativeMetrics.summary.totalRuns}

## 🔧 Healing Effectiveness

### Playwright Suite Analysis
- **Success Rate**: ${results.suites.playwright?.successRate || 0}%
- **Healing Target**: Maintaining 81.1% success rate achieved through healing
- **Failed Tests**: ${results.suites.playwright?.failed || 0}

${results.suites.playwright?.failedTests?.length > 0 ? `
### Failed Test Patterns
${results.suites.playwright.failedTests.slice(0, 5).map(test => `
- **${test.title}** (${test.file})
  - Error: ${test.error.split('\n')[0]}
`).join('')}

${results.suites.playwright.failedTests.length > 5 ? `_... and ${results.suites.playwright.failedTests.length - 5} more failures_` : ''}
` : '✅ **No failed test patterns detected**'}

## 🚨 Alert Conditions

${results.overall.successRate < 75 ? '🚨 **CRITICAL**: Success rate below minimum threshold (75%)' : ''}
${results.overall.successRate >= 75 && results.overall.successRate < 81.1 ? '⚠️ **WARNING**: Success rate below target (81.1%)' : ''}
${cumulativeMetrics.summary.trend === 'degrading' ? '📉 **ATTENTION**: Degrading trend detected' : ''}
${results.overall.successRate >= 81.1 && cumulativeMetrics.summary.trend !== 'degrading' ? '✅ **HEALTHY**: All metrics within target ranges' : ''}

## 📋 Recommended Actions

${results.overall.successRate < 75 ? `
### Immediate Actions Required
1. **Investigate critical failures** in Playwright test suite
2. **Review recent code changes** that may have affected test stability
3. **Apply additional healing patterns** for new failure modes
4. **Consider temporary test adjustments** while issues are resolved
` : ''}

${results.overall.successRate >= 75 && results.overall.successRate < 81.1 ? `
### Optimization Opportunities
1. **Analyze failed test patterns** for new healing opportunities
2. **Review healing rule effectiveness** for edge cases
3. **Consider tolerance adjustments** for borderline failures
4. **Monitor for recurring failure patterns**
` : ''}

${results.overall.successRate >= 81.1 ? `
### Maintenance Actions
1. **Continue monitoring** for stability
2. **Document successful patterns** for team knowledge sharing
3. **Consider expanding healing coverage** to other test areas
4. **Review performance optimizations** for execution time
` : ''}

---
*Generated automatically by Healing Success Monitor at ${results.timestamp}*
`;

    fs.writeFileSync(reportFile, report);
    console.log(`📋 Healing report saved to ${reportFile}`);

    return reportFile;
  }

  async run() {
    try {
      console.log('🎯 Healing Success Monitoring Started');

      // Run test suites and collect metrics
      const results = await this.runTestSuites();

      // Save metrics for trending
      const cumulativeMetrics = this.saveMetrics(results);

      // Generate human-readable report
      const reportFile = this.generateHealingReport(results, cumulativeMetrics);

      // Log summary for CI output
      console.log('\n📊 HEALING MONITORING SUMMARY');
      console.log('=====================================');
      console.log(`Overall Success Rate: ${results.overall.successRate}%`);
      console.log(`Playwright Tests: ${results.suites.playwright?.passed || 0}/${(results.suites.playwright?.passed || 0) + (results.suites.playwright?.failed || 0)}`);
      console.log(`Visual Tests: ${results.suites.visual?.passed || 0}/${(results.suites.visual?.passed || 0) + (results.suites.visual?.failed || 0)}`);
      console.log(`Trend: ${cumulativeMetrics.summary.trend}`);
      console.log(`Report: ${reportFile}`);
      console.log('=====================================\n');

      // Set exit code based on success rate
      if (results.overall.successRate < 75) {
        console.error('❌ Critical: Success rate below minimum threshold');
        process.exit(1);
      } else if (results.overall.successRate < 81.1) {
        console.warn('⚠️ Warning: Success rate below target');
        process.exit(0); // Don't fail CI, but log warning
      } else {
        console.log('✅ Success: All metrics healthy');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Healing monitoring failed:', error.message);

      // Save error for debugging
      const errorLog = {
        timestamp: this.timestamp,
        error: error.message,
        stack: error.stack
      };

      fs.writeFileSync(
        path.join(this.reportsDir, `error-${this.date}.json`),
        JSON.stringify(errorLog, null, 2)
      );

      process.exit(1);
    }
  }
}

// Run the monitor if called directly
if (require.main === module) {
  const monitor = new HealingMonitor();
  monitor.run();
}

module.exports = HealingMonitor;