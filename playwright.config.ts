import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Economist Blog v5
 * Integrates with existing Jekyll server and testing infrastructure
 * Matches BackstopJS viewport configuration for consistency
 *
 * Sharding support:
 *   Set PLAYWRIGHT_SHARD env var to "1/3", "2/3", "3/3" etc. to run a shard.
 *   Set PLAYWRIGHT_GREP env var to a pipe-separated grep expression, e.g.
 *     "@REQ-NAV-01|@REQ-NAV-02"
 *   to run only tests matching those requirement tags.
 */

// Shard configuration: "1/3" → { current: 1, total: 3 }
const shardEnv = process.env.PLAYWRIGHT_SHARD;
const shard = shardEnv
  ? (() => {
      const parts = shardEnv.split('/').map(Number);
      return parts.length === 2 ? { current: parts[0], total: parts[1] } : undefined;
    })()
  : undefined;

// Grep expression for change-based test selection
const grepEnv = process.env.PLAYWRIGHT_GREP;
const grep    = grepEnv ? new RegExp(grepEnv) : undefined;

export default defineConfig({
  testDir: './tests/playwright-agents',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Allow parallelism on CI when sharding; use 2 workers per shard */
  workers: process.env.CI ? (shard ? 2 : 1) : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['github'],
    ['list']
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Video recording for debugging */
    video: 'retain-on-failure',
  },

  /* Change-based test selection: run only tests matching the grep expression */
  ...(grep ? { grep } : {}),

  /* Sharding: run a slice of the test suite */
  ...(shard ? { shard } : {}),

  /* Configure projects for major browsers and viewports */
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 320, height: 568 } // Match BackstopJS phone viewport
      },
    },
    {
      name: 'Tablet Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 } // Match BackstopJS tablet viewport
      },
    },
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 } // Match BackstopJS desktop viewport
      },
    },

    /* Cross-browser testing */
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local Jekyll server before starting the tests */
  /* In CI, server is started manually in workflow, so disable webServer */
  webServer: process.env.CI ? undefined : {
    command: 'bundle exec jekyll serve --config _config.yml,_config_dev.yml --port 4000 --no-watch',
    port: 4000,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000, // 2 minutes for Jekyll to start
  },

  /* Global timeout settings */
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 5000 // 5 seconds for assertions
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
});
