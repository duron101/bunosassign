import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive End-to-End Test Configuration
 * For Bug Fixes and Optimizations Validation
 */
export default defineConfig({
  testDir: './tests/comprehensive-e2e',
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for data integrity
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'comprehensive-e2e-report' }],
    ['json', { outputFile: 'comprehensive-e2e-results.json' }],
    ['junit', { outputFile: 'comprehensive-e2e-results.xml' }],
    ['line'],
    ['./tests/utils/custom-reporter.ts']
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8081',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',
    
    /* Record video on test failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 15000,
    
    /* Global timeout for navigation */
    navigationTimeout: 45000,
    
    /* Custom headers for all requests */
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    },
    
    /* Locale for testing */
    locale: 'zh-CN',
    
    /* Timezone for testing */
    timezoneId: 'Asia/Shanghai'
  },

  /* Configure projects for comprehensive testing */
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: '**/setup/**/*.spec.ts',
      teardown: 'cleanup'
    },
    
    // Authentication and Authorization Tests
    {
      name: 'auth-tests',
      testMatch: '**/auth-security/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    // API Integration Tests
    {
      name: 'api-integration',
      testMatch: '**/api-integration/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Performance Tests
    {
      name: 'performance',
      testMatch: '**/performance/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Database Layer Tests
    {
      name: 'database',
      testMatch: '**/database/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Bonus Calculation Tests
    {
      name: 'bonus-calculation',
      testMatch: '**/bonus-calculation/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Security Tests
    {
      name: 'security',
      testMatch: '**/security/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Regression Tests
    {
      name: 'regression',
      testMatch: '**/regression/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Cross-browser testing for critical paths
    {
      name: 'firefox-critical',
      testMatch: '**/critical-path/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'safari-critical',
      testMatch: '**/critical-path/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing
    {
      name: 'mobile-critical',
      testMatch: '**/mobile/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Pixel 5'] },
    },
    
    // Cleanup project
    {
      name: 'cleanup',
      testMatch: '**/cleanup/**/*.spec.ts',
    }
  ],

  /* Global timeout for each test */
  timeout: 120000, // 2 minutes per test

  /* Global timeout for the whole test suite */
  globalTimeout: 3600000, // 1 hour for entire suite

  /* Maximum time one test can run for */
  expect: {
    /* Timeout for expect() calls */
    timeout: 15000,
    /* Threshold for visual comparisons */
    toHaveScreenshot: { threshold: 0.2 },
    toMatchSnapshot: { threshold: 0.2 },
  },

  /* Output directory for test artifacts */
  outputDir: 'comprehensive-e2e-results/',

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 180000, // 3 minutes startup
      env: {
        NODE_ENV: 'test',
        JWT_SECRET: 'test-jwt-secret-key',
        DATABASE_LOGGING: 'false'
      }
    },
    {
      command: 'npm run dev',
      port: 8081,
      reuseExistingServer: !process.env.CI,
      timeout: 180000, // 3 minutes startup
      env: {
        NODE_ENV: 'test',
        VITE_API_BASE_URL: 'http://localhost:3000'
      }
    }
  ],

  /* Test metadata for reporting */
  metadata: {
    testSuite: 'Comprehensive E2E Tests',
    version: '1.0.0',
    environment: 'test',
    purpose: 'Validate all bug fixes and optimizations'
  }
});