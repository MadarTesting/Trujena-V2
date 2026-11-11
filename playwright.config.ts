import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',

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
        ['list'],
        ['./reporters/summaryReporter.ts'],          // PASSED / FAILED / SKIPPED at the end of the run (in the terminal)
        ['html', { open: 'always' }],                // the report opens in the browser after the run
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
    ],
});
