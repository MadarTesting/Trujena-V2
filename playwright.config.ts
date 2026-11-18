import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './ui/tests',

    // runs ONE time before all tests: logs in and saves the sessions
    globalSetup: './global/global-setup.ts',
    // runs ONE time after all tests: deletes the saved sessions (NO data is deleted from the system)
    globalTeardown: './global/global-teardown.ts',

    timeout: 180000,                // the full journey has many steps, so it needs more time
    expect: { timeout: 15000 },
    fullyParallel: false,           // all tests use the SAME request of the merchant, so they run one by one
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: 0,                     // no retry: a retry would try to change a status that already changed

    reporter: [
        // the terminal shows the FAILED tests only (with their APIs). the passed tests are in the HTML report
        ['./reporters/summaryReporter.ts'],
        // the report opens in the browser after the run (NOT on GitHub: there is no browser to open it)
        ['html', { open: process.env.CI ? 'never' : 'always' }],
        ['allure-playwright', { resultsDir: 'allure-results' }],
    ],

    use: {
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        // channel 'chrome' = use the installed Google Chrome, because Windows Application Control
        // blocks the Chromium that Playwright downloads (ms-playwright\chromium-xxxx\chrome.dll)
        { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome', headless: true } },
        // تستات الـ API (من غير متصفح): npx playwright test --project=api
        { name: 'api', testDir: './api/tests' },
    ],
});
