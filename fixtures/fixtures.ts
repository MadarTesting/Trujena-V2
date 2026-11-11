import { test as base, type Browser, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { POManager } from '../pages/POManager';
import paths from '../testData/paths';
import { logApiCalls, attachFailureInfo } from '../utils/apiLogger';
import { LoginPage } from '../pages/auth/LoginPage';
import users from '../testData/users';

//===================Types===================
type MyFixtures = {
    adminPO: POManager;          // a browser window logged in as ADMIN
    merchantPO: POManager;       // a browser window logged in as MERCHANT
    requestNumber: string;       // the request of the merchant (it already exists)
    testMerchantPO: POManager;   // a browser window logged in as the TEST merchant (users.testMerchant)
};

//===================Helpers===================
// open a new browser window that records a video
// (the "video" option in playwright.config.ts does NOT work for windows we open ourselves)
// بيفتح متصفح جديد بيسجل فيديو وبيطبع الـ APIs
export async function openWindow(browser: Browser, testInfo: TestInfo, baseURL?: string, storageState?: string) {
    const context = await browser.newContext({
        baseURL,
        storageState,
        recordVideo: { dir: testInfo.outputPath('videos') },
    });
    const page = await context.newPage();
    logApiCalls(page);                 // print every create / update / delete API call in the terminal
    return { context, page };
}

// close the window. If the test FAILED: attach a screenshot + the video to the report (Allure + HTML)
// بيقفل المتصفح، ولو التست فشل بيضيف screenshot وفيديو للتقرير
export async function closeWindow(context: BrowserContext, page: Page, testInfo: TestInfo, name: string) {
    const failed = testInfo.status !== testInfo.expectedStatus;

    if (failed && !page.isClosed()) {
        await testInfo.attach(`${name}-screenshot`, { body: await page.screenshot(), contentType: 'image/png' });
    }
    if (failed) await attachFailureInfo(page, testInfo, name);      // Frontend ولا Backend + الـ APIs

    await context.close();             // the video file is ready only after the window is closed

    const video = page.video();
    if (!video) return;
    if (failed) {
        await testInfo.attach(`${name}-video`, { path: await video.path(), contentType: 'video/webm' });
    } else {
        await video.delete();          // the test passed: we do not need the video
    }
}

//===================Fixtures===================
export const test = base.extend<MyFixtures>({

    // ---------- admin window ----------
    // متصفح الأدمن (داخل بالجلسة المحفوظة)
    adminPO: async ({ browser }, use, testInfo) => {
        // storageState = the saved login, so we do NOT login again
        const { context, page } = await openWindow(browser, testInfo, process.env.ADMIN_URL, paths.adminState);

        await use(new POManager(page));           // the test runs here

        await closeWindow(context, page, testInfo, 'admin');
    },

    // ---------- merchant window ----------
    // متصفح التاجر (داخل بالجلسة المحفوظة)
    merchantPO: async ({ browser }, use, testInfo) => {
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL, paths.merchantState);

        await use(new POManager(page));

        await closeWindow(context, page, testInfo, 'merchant');
    },

    // ---------- the request of the merchant ----------
    // the merchant account already has ONE request (it is created with the merchant),
    // so we read its number from the merchant table. Nothing is created or deleted here.
    // ---------- test merchant window ----------
    // متصفح تاجر التست: بيدخل بالإيميل والباسورد (مش بالجلسة المحفوظة)
    testMerchantPO: async ({ browser }, use, testInfo) => {
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
        const login = new LoginPage(page);
        await login.open();
        await login.login(users.testMerchant.email, users.testMerchant.password);
        await login.assertLoggedIn();

        await use(new POManager(page));

        await closeWindow(context, page, testInfo, 'test-merchant');
    },

    // رقم طلب التاجر
    requestNumber: async ({ merchantPO }, use) => {
        const requestNumber = await merchantPO.getMerchantAppPage().getRequestNumber();
        console.log(`request under test: ${requestNumber}`);
        await use(requestNumber);
    },
});

export { expect } from '@playwright/test';
