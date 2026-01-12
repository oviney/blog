#!/usr/bin/env node
/**
 * Failure Pattern Analysis
 * Analyzes failed test patterns to identify healing opportunities
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FailureAnalyzer {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'healing-reports');
    this.timestamp = new Date().toISOString();

    // Ensure directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }

    console.log(`🔍 Starting failure analysis at ${this.timestamp}`);
  }

  async runFailureAnalysis() {
    console.log('🧪 Running Playwright tests to capture failures...');

    try {
      // Run tests with JSON reporter to capture detailed failure info
      const output = execSync('npm run test:playwright -- --reporter=json', {
        encoding: 'utf8',
        timeout: 300000
      });

      return JSON.parse(output);
    } catch (error) {
      // Even if tests fail, we want to capture the output for analysis
      try {
        const output = error.stdout || error.message;

        // Try to parse JSON output from the error
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('Could not parse test output, using fallback analysis');
      }

      // Fallback: run individual test files to capture more detail
      return this.runIndividualTestAnalysis();
    }
  }

  async runIndividualTestAnalysis() {
    const testFiles = [
      'tests/playwright-agents/navigation.spec.ts',
      'tests/playwright-agents/responsive.spec.ts',
      'tests/playwright-agents/content-edge-cases.spec.ts'
    ];

    const results = {
      tests: [],
      stats: { passed: 0, failed: 0 }
    };

    for (const testFile of testFiles) {
      try {
        console.log(`  Analyzing ${testFile}...`);

        const output = execSync(`npm run test:playwright -- ${testFile} --reporter=json`, {
          encoding: 'utf8',
          timeout: 120000
        });

        const fileResults = JSON.parse(output);
        results.tests.push(...(fileResults.tests || []));

        if (fileResults.stats) {
          results.stats.passed += fileResults.stats.passed || 0;
          results.stats.failed += fileResults.stats.failed || 0;
        }

      } catch (error) {
        console.warn(`  Could not analyze ${testFile}: ${error.message.split('\n')[0]}`);

        // Add a placeholder for failed file analysis
        results.tests.push({
          title: `Failed to analyze ${testFile}`,
          outcome: 'unexpected',
          location: { file: testFile },
          results: [{
            error: { message: 'Analysis failed - test file could not be executed' }
          }]
        });
        results.stats.failed += 1;
      }
    }

    return results;
  }

  analyzeFailurePatterns(testResults) {
    const tests = testResults.tests || [];
    const failedTests = tests.filter(test => test.outcome !== 'expected');

    const analysis = {
      summary: {
        totalTests: tests.length,
        passedTests: tests.length - failedTests.length,
        failedTests: failedTests.length,
        successRate: tests.length > 0 ? Math.round(((tests.length - failedTests.length) / tests.length) * 100 * 100) / 100 : 0
      },
      failurePatterns: this.identifyFailurePatterns(failedTests),
      healingOpportunities: [],
      recommendations: []
    };

    // Generate healing opportunities
    analysis.healingOpportunities = this.generateHealingOpportunities(analysis.failurePatterns);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  identifyFailurePatterns(failedTests) {
    const patterns = {
      byCategory: {},
      byError: {},
      byFile: {},
      bySelector: {},
      recurring: [],
      newPatterns: []
    };

    // Group failures by different dimensions
    failedTests.forEach(test => {
      const error = test.results?.[0]?.error?.message || 'Unknown error';
      const file = test.location?.file || 'Unknown file';
      const testTitle = test.title || 'Unknown test';

      // Categorize by test file
      const fileName = file.split('/').pop() || file;
      if (!patterns.byFile[fileName]) {
        patterns.byFile[fileName] = [];
      }
      patterns.byFile[fileName].push({
        title: testTitle,
        error: error.split('\n')[0], // First line of error
        fullError: error
      });

      // Categorize by error type
      const errorCategory = this.categorizeError(error);
      if (!patterns.byError[errorCategory]) {
        patterns.byError[errorCategory] = [];
      }
      patterns.byError[errorCategory].push({
        title: testTitle,
        file: fileName,
        error: error.split('\n')[0]
      });

      // Look for selector-related failures
      const selectorInfo = this.extractSelectorInfo(error);
      if (selectorInfo) {
        if (!patterns.bySelector[selectorInfo.type]) {
          patterns.bySelector[selectorInfo.type] = [];
        }
        patterns.bySelector[selectorInfo.type].push({
          title: testTitle,
          file: fileName,
          selector: selectorInfo.selector,
          issue: selectorInfo.issue
        });
      }

      // Categorize by test category
      const testCategory = this.categorizeTest(testTitle, fileName);
      if (!patterns.byCategory[testCategory]) {
        patterns.byCategory[testCategory] = [];
      }
      patterns.byCategory[testCategory].push({
        title: testTitle,
        file: fileName,
        error: error.split('\n')[0]
      });
    });

    // Identify recurring patterns
    patterns.recurring = this.identifyRecurringPatterns(failedTests);

    return patterns;
  }

  categorizeError(error) {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('strict mode violation') || errorLower.includes('resolved to') && errorLower.includes('elements')) {
      return 'Strict Mode Violation';
    }
    if (errorLower.includes('timeout') || errorLower.includes('waiting for')) {
      return 'Timeout/Waiting';
    }
    if (errorLower.includes('tobevisible') || errorLower.includes('visible')) {
      return 'Visibility';
    }
    if (errorLower.includes('tocontaintext') || errorLower.includes('text')) {
      return 'Text Content';
    }
    if (errorLower.includes('tohaveurl') || errorLower.includes('url')) {
      return 'URL/Navigation';
    }
    if (errorLower.includes('tobegreaterthan') || errorLower.includes('tobelessthan') || errorLower.includes('tobe(') || errorLower.includes('expect(')) {
      return 'Assertion/Comparison';
    }
    if (errorLower.includes('locator') || errorLower.includes('selector')) {
      return 'Locator/Selector';
    }
    if (errorLower.includes('click') || errorLower.includes('hover') || errorLower.includes('type')) {
      return 'Interaction';
    }
    if (errorLower.includes('network') || errorLower.includes('request') || errorLower.includes('response')) {
      return 'Network';
    }

    return 'Other';
  }

  extractSelectorInfo(error) {
    // Extract selector information from error messages
    const selectorPatterns = [
      /getByRole\('([^']+)'[^)]*\)/,
      /locator\('([^']+)'\)/,
      /getByText\('([^']+)'\)/,
      /getByLabel\('([^']+)'\)/
    ];

    for (const pattern of selectorPatterns) {
      const match = error.match(pattern);
      if (match) {
        return {
          type: this.getSelectorType(match[0]),
          selector: match[1],
          issue: this.identifySelectorIssue(error)
        };
      }
    }

    return null;
  }

  getSelectorType(fullSelector) {
    if (fullSelector.includes('getByRole')) return 'Role-based';
    if (fullSelector.includes('locator')) return 'CSS Selector';
    if (fullSelector.includes('getByText')) return 'Text-based';
    if (fullSelector.includes('getByLabel')) return 'Label-based';
    return 'Other';
  }

  identifySelectorIssue(error) {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('resolved to') && errorLower.includes('elements')) {
      return 'Multiple elements found';
    }
    if (errorLower.includes('not found') || errorLower.includes('count() = 0')) {
      return 'Element not found';
    }
    if (errorLower.includes('hidden') || errorLower.includes('not visible')) {
      return 'Element hidden';
    }
    if (errorLower.includes('timeout')) {
      return 'Element timeout';
    }

    return 'Unknown selector issue';
  }

  categorizeTest(testTitle, fileName) {
    const titleLower = testTitle.toLowerCase();
    const fileLower = fileName.toLowerCase();

    if (fileLower.includes('navigation') || titleLower.includes('navigation')) {
      return 'Navigation';
    }
    if (fileLower.includes('responsive') || titleLower.includes('responsive') || titleLower.includes('viewport')) {
      return 'Responsive Design';
    }
    if (fileLower.includes('content') || titleLower.includes('content') || titleLower.includes('edge cases')) {
      return 'Content Handling';
    }
    if (titleLower.includes('accessibility') || titleLower.includes('keyboard') || titleLower.includes('focus')) {
      return 'Accessibility';
    }
    if (titleLower.includes('image') || titleLower.includes('visual')) {
      return 'Image/Visual';
    }
    if (titleLower.includes('typography') || titleLower.includes('font') || titleLower.includes('text')) {
      return 'Typography';
    }

    return 'General';
  }

  identifyRecurringPatterns(failedTests) {
    const errorSignatures = {};

    failedTests.forEach(test => {
      const error = test.results?.[0]?.error?.message || '';
      const signature = this.createErrorSignature(error);

      if (!errorSignatures[signature]) {
        errorSignatures[signature] = {
          signature,
          count: 0,
          tests: [],
          category: this.categorizeError(error)
        };
      }

      errorSignatures[signature].count++;
      errorSignatures[signature].tests.push({
        title: test.title,
        file: test.location?.file?.split('/').pop() || 'unknown'
      });
    });

    // Return patterns that occur 2+ times
    return Object.values(errorSignatures)
      .filter(pattern => pattern.count >= 2)
      .sort((a, b) => b.count - a.count);
  }

  createErrorSignature(error) {
    // Create a normalized signature for the error
    return error
      .split('\n')[0] // First line only
      .replace(/\d+/g, '#') // Replace numbers with #
      .replace(/'[^']*'/g, "'PLACEHOLDER'") // Replace quoted strings
      .replace(/Expected: .*/g, 'Expected: VALUE') // Normalize expected values
      .replace(/Received: .*/g, 'Received: VALUE') // Normalize received values
      .trim();
  }

  generateHealingOpportunities(patterns) {
    const opportunities = [];

    // Strict mode violations
    if (patterns.byError['Strict Mode Violation']?.length > 0) {
      opportunities.push({
        priority: 'high',
        type: 'Strict Mode Violation',
        count: patterns.byError['Strict Mode Violation'].length,
        description: 'Multiple elements found by selector - use .first(), .last(), or .nth() to be specific',
        healingPattern: 'Add element index selectors (.first(), .last(), .nth(index))',
        examples: patterns.byError['Strict Mode Violation'].slice(0, 3),
        implementation: `
// Before: page.locator('h1')
// After: page.locator('h1').first() or page.locator('h1').last()
await expect(page.locator('h1').last()).toBeVisible(); // For article titles
await expect(page.locator('h1').first()).toBeVisible(); // For site headers`
      });
    }

    // Timeout/waiting issues
    if (patterns.byError['Timeout/Waiting']?.length > 0) {
      opportunities.push({
        priority: 'high',
        type: 'Timeout/Waiting',
        count: patterns.byError['Timeout/Waiting'].length,
        description: 'Elements taking too long to load or become available',
        healingPattern: 'Add conditional checks and improved wait strategies',
        examples: patterns.byError['Timeout/Waiting'].slice(0, 3),
        implementation: `
// Before: await expect(element).toBeVisible();
// After:
if (await element.count() > 0) {
  await expect(element).toBeVisible();
} else {
  console.log('Element not found - skipping assertion');
}`
      });
    }

    // Element visibility issues
    if (patterns.byError['Visibility']?.length > 0) {
      opportunities.push({
        priority: 'medium',
        type: 'Element Visibility',
        count: patterns.byError['Visibility'].length,
        description: 'Elements not visible when expected',
        healingPattern: 'Add existence checks before visibility assertions',
        examples: patterns.byError['Visibility'].slice(0, 3),
        implementation: `
// Before: await expect(element).toBeVisible();
// After:
const elementCount = await element.count();
if (elementCount > 0) {
  await expect(element.first()).toBeVisible();
}`
      });
    }

    // URL/Navigation issues
    if (patterns.byError['URL/Navigation']?.length > 0) {
      opportunities.push({
        priority: 'medium',
        type: 'URL/Navigation',
        count: patterns.byError['URL/Navigation'].length,
        description: 'Navigation expectations not matching actual URLs',
        healingPattern: 'Use flexible URL matching instead of exact matches',
        examples: patterns.byError['URL/Navigation'].slice(0, 3),
        implementation: `
// Before: await expect(page).toHaveURL('/exact/path/');
// After:
const currentUrl = page.url();
expect(currentUrl.includes('/blog') || currentUrl.includes('/posts')).toBeTruthy();`
      });
    }

    // Assertion/Comparison issues
    if (patterns.byError['Assertion/Comparison']?.length > 0) {
      opportunities.push({
        priority: 'medium',
        type: 'Assertion Flexibility',
        count: patterns.byError['Assertion/Comparison'].length,
        description: 'Assertions too strict for responsive/dynamic content',
        healingPattern: 'Add tolerance ranges and conditional assertions',
        examples: patterns.byError['Assertion/Comparison'].slice(0, 3),
        implementation: `
// Before: expect(width).toBe(800);
// After: expect(width).toBeGreaterThan(750);
//        expect(width).toBeLessThan(850);
// Or: expect(width).toBeLessThan(viewportWidth + tolerance);`
      });
    }

    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0) || b.count - a.count;
    });
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // High-level recommendations based on failure rate
    if (analysis.summary.successRate < 70) {
      recommendations.push({
        priority: 'critical',
        type: 'Emergency Response',
        description: `Success rate (${analysis.summary.successRate}%) requires immediate intervention`,
        actions: [
          'Apply all high-priority healing patterns immediately',
          'Consider temporarily disabling unstable tests',
          'Investigate recent code/infrastructure changes',
          'Escalate to development team for urgent fixes'
        ]
      });
    } else if (analysis.summary.successRate < 80) {
      recommendations.push({
        priority: 'high',
        type: 'Rapid Improvement',
        description: `Success rate (${analysis.summary.successRate}%) below target - apply healing patterns`,
        actions: [
          'Implement high and medium priority healing patterns',
          'Focus on recurring failure patterns first',
          'Monitor improvement over next 24 hours',
          'Document successful healing patterns'
        ]
      });
    }

    // Pattern-specific recommendations
    if (analysis.healingOpportunities.length > 0) {
      const topOpportunity = analysis.healingOpportunities[0];
      recommendations.push({
        priority: 'high',
        type: 'Pattern-Based Healing',
        description: `Primary healing opportunity: ${topOpportunity.type} (${topOpportunity.count} failures)`,
        actions: [
          'Apply the healing pattern shown in the opportunities section',
          'Test the pattern on a subset of failures first',
          'Monitor success rate improvement',
          'Expand pattern to similar failures'
        ]
      });
    }

    // Specific recommendations by failure category
    const recurringPatterns = analysis.failurePatterns.recurring;
    if (recurringPatterns.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'Recurring Pattern Fix',
        description: `Address ${recurringPatterns.length} recurring failure patterns`,
        actions: [
          'Focus on the most frequent recurring pattern first',
          'Create reusable healing functions for common patterns',
          'Update test documentation with new patterns',
          'Consider refactoring common test utilities'
        ]
      });
    }

    return recommendations;
  }

  generateFailureReport(analysis) {
    const reportFile = path.join(this.reportsDir, `failure-analysis-${new Date().toISOString().split('T')[0]}.md`);

    const report = `# Failure Pattern Analysis Report

*Generated: ${this.timestamp}*

## 📊 Test Suite Summary

- **Total Tests**: ${analysis.summary.totalTests}
- **Passed**: ${analysis.summary.passedTests} (${analysis.summary.successRate}%)
- **Failed**: ${analysis.summary.failedTests}
- **Current Success Rate**: ${analysis.summary.successRate}%

${analysis.summary.successRate >= 81.1 ? '✅ **Target Achieved**' : analysis.summary.successRate >= 75 ? '⚠️ **Below Target**' : '🚨 **Critical Level**'}

## 🔍 Failure Breakdown

### By Error Category
${Object.entries(analysis.failurePatterns.byError).map(([category, failures]) => `
- **${category}**: ${failures.length} failures
${failures.slice(0, 2).map(f => `  - ${f.title} (${f.file})`).join('\n')}
${failures.length > 2 ? `  - ... and ${failures.length - 2} more` : ''}
`).join('')}

### By Test File
${Object.entries(analysis.failurePatterns.byFile).map(([file, failures]) => `
- **${file}**: ${failures.length} failures
`).join('')}

### By Test Category
${Object.entries(analysis.failurePatterns.byCategory).map(([category, failures]) => `
- **${category}**: ${failures.length} failures
`).join('')}

## 🔄 Recurring Patterns

${analysis.failurePatterns.recurring.length > 0 ?
  analysis.failurePatterns.recurring.map(pattern => `
### ${pattern.signature}
- **Occurrences**: ${pattern.count}
- **Category**: ${pattern.category}
- **Affected Tests**: ${pattern.tests.map(t => `${t.title} (${t.file})`).join(', ')}
`).join('') :
  'No recurring patterns detected with 2+ occurrences'}

## 🩹 Healing Opportunities

${analysis.healingOpportunities.length > 0 ?
  analysis.healingOpportunities.map(opportunity => `
### ${opportunity.priority.toUpperCase()}: ${opportunity.type} (${opportunity.count} failures)

**Description**: ${opportunity.description}

**Healing Pattern**: ${opportunity.healingPattern}

**Implementation Example**:
\`\`\`javascript${opportunity.implementation}
\`\`\`

**Sample Failures**:
${opportunity.examples.map(ex => `- ${ex.title} (${ex.file}): ${ex.error}`).join('\n')}
`).join('') :
  'No specific healing patterns identified'}

## 📋 Recommendations

${analysis.recommendations.length > 0 ?
  analysis.recommendations.map(rec => `
### ${rec.priority.toUpperCase()}: ${rec.type}

${rec.description}

**Actions**:
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('') :
  'No specific recommendations at this time'}

## 🎯 Implementation Priority

1. **Immediate (Critical)**: Apply healing patterns for recurring high-frequency failures
2. **Short-term (High)**: Implement selector improvements and conditional checks
3. **Medium-term (Medium)**: Enhance test robustness and tolerance ranges
4. **Long-term (Low)**: Optimize test architecture and utilities

## 📈 Expected Impact

${analysis.healingOpportunities.length > 0 ? `
If all identified healing opportunities are implemented:

- **Estimated Success Rate Improvement**: +${Math.min(analysis.healingOpportunities.reduce((sum, opp) => sum + opp.count, 0) / analysis.summary.totalTests * 100, 20).toFixed(1)}%
- **Target Success Rate**: ${Math.min(analysis.summary.successRate + (analysis.healingOpportunities.reduce((sum, opp) => sum + opp.count, 0) / analysis.summary.totalTests * 100), 95).toFixed(1)}%
- **Reduced Maintenance**: Fewer recurring failures and more robust test patterns
` : `
Current success rate is already high (${analysis.summary.successRate}%). Focus on:
- Maintaining current healing effectiveness
- Monitoring for new failure patterns
- Continuing optimization of existing patterns
`}

---
*This analysis provides actionable insights for improving test reliability through targeted healing patterns.*
`;

    fs.writeFileSync(reportFile, report);
    console.log(`📊 Failure analysis report saved to ${reportFile}`);

    return reportFile;
  }

  async run() {
    try {
      console.log('🔍 Starting comprehensive failure analysis...');

      // Run tests and capture failures
      const testResults = await this.runFailureAnalysis();

      // Analyze failure patterns
      console.log('📊 Analyzing failure patterns...');
      const analysis = this.analyzeFailurePatterns(testResults);

      // Generate detailed report
      console.log('📋 Generating failure analysis report...');
      const reportFile = this.generateFailureReport(analysis);

      // Output summary for CI logs
      console.log('\n📊 FAILURE ANALYSIS SUMMARY');
      console.log('=====================================');
      console.log(`Success Rate: ${analysis.summary.successRate}%`);
      console.log(`Failed Tests: ${analysis.summary.failedTests}/${analysis.summary.totalTests}`);
      console.log(`Healing Opportunities: ${analysis.healingOpportunities.length}`);
      console.log(`Recurring Patterns: ${analysis.failurePatterns.recurring.length}`);
      console.log(`Report: ${reportFile}`);
      console.log('=====================================\n');

      if (analysis.healingOpportunities.length > 0) {
        console.log('🩹 TOP HEALING OPPORTUNITIES:');
        analysis.healingOpportunities.slice(0, 3).forEach(opp => {
          console.log(`  • ${opp.type}: ${opp.count} failures (${opp.priority} priority)`);
        });
        console.log('');
      }

      process.exit(0);

    } catch (error) {
      console.error('💥 Failure analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the analyzer if called directly
if (require.main === module) {
  const analyzer = new FailureAnalyzer();
  analyzer.run();
}

module.exports = FailureAnalyzer;