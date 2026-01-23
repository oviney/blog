import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Economist Blog v5
 * Integrates with existing Jekyll server and testing infrastructure
 * Matches BackstopJS viewport configuration for consistency
 */
export default defineConfig({
  testDir: './tests/playwright-agents',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/.last-run.json' }],
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

    /* Optional: Test against other browsers - uncomment when ready */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local Jekyll server before starting the tests */
  /* In CI, server is started manually in workflow, so disable webServer */
  webServer: process.env.CI ? undefined : {
    command: 'bundle exec jekyll serve --port 4000 --detach',
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