import { test as base, type Browser, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { POManager } from '../pages/POManager';
import { LoginPage } from '../pages/auth/LoginPage';
import { logApiCalls, attachFailureInfo } from '../utils/apiLogger';
import paths from '../testData/paths';
import users from '../testData/users';

// الـ fixtures = حاجات جاهزة التست بياخدها من غير ما يجهزها بنفسه
// مثال:  test('...', async ({ merchantPO }) => { ... })
//        merchantPO هنا = متصفح التاجر جاهز وداخل بحسابه

//===================فتح وقفل المتصفح===================

// بيفتح متصفح جديد بيسجّل فيديو، وبيسجّل الـ APIs اللي بتحصل فيه
// (لو حطينا جلسة محفوظة "session"، المتصفح بيفتح وهو داخل على طول)
export async function openWindow(browser: Browser, testInfo: TestInfo, url?: string, session?: string) {
    const context = await browser.newContext({
        baseURL: url,
        storageState: session,
        recordVideo: { dir: testInfo.outputPath('videos') },
    });
    const page = await context.newPage();
    logApiCalls(page);
    return { context, page };
}

// بيقفل المتصفح
// لو التست فشل: بيحط في الريبورت صورة + فيديو + الـ APIs
// لو التست نجح: بيمسح الفيديو (مش محتاجينه)
export async function closeWindow(context: BrowserContext, page: Page, testInfo: TestInfo, name: string) {
    const failed = testInfo.status !== testInfo.expectedStatus;

    if (failed) {
        if (!page.isClosed()) {
            await testInfo.attach(`${name}-screenshot`, { body: await page.screenshot(), contentType: 'image/png' });
        }
        await attachFailureInfo(page, testInfo, name);
    }

    await context.close();             // الفيديو بيجهز بعد ما المتصفح يتقفل

    const video = page.video();
    if (!video) return;
    if (failed) {
        await testInfo.attach(`${name}-video`, { path: await video.path(), contentType: 'video/webm' });
    } else {
        await video.delete();
    }
}

//===================الـ fixtures===================

type MyFixtures = {
    adminPO: POManager;          // متصفح الأدمن
    merchantPO: POManager;       // متصفح التاجر (حساب الـ .env)
    testMerchantPO: POManager;   // متصفح تاجر التست (users.testMerchant)
    requestNumber: string;       // رقم طلب التاجر
};

// كل fixture بيعمل 3 حاجات:
// 1. يجهز (يفتح المتصفح)   2. use = التست بيشتغل هنا   3. ينضّف (يقفل المتصفح)
export const test = base.extend<MyFixtures>({

    // متصفح الأدمن: بيفتح بالجلسة المحفوظة (من غير login)
    adminPO: async ({ browser }, use, testInfo) => {
        const { context, page } = await openWindow(browser, testInfo, process.env.ADMIN_URL, paths.adminState);
        await use(new POManager(page));
        await closeWindow(context, page, testInfo, 'admin');
    },

    // متصفح التاجر: بيفتح بالجلسة المحفوظة (من غير login)
    merchantPO: async ({ browser }, use, testInfo) => {
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL, paths.merchantState);
        await use(new POManager(page));
        await closeWindow(context, page, testInfo, 'merchant');
    },

    // متصفح تاجر التست: بيعمل login بالإيميل والباسورد
    testMerchantPO: async ({ browser }, use, testInfo) => {
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
        const login = new LoginPage(page);
        await login.open();
        await login.login(users.testMerchant.email, users.testMerchant.password);
        await login.assertLoggedIn();

        await use(new POManager(page));
        await closeWindow(context, page, testInfo, 'test-merchant');
    },

    // رقم طلب التاجر: بيقراه من جدول "إدارة التطبيق" (مش بيعمل طلب جديد)
    requestNumber: async ({ merchantPO }, use) => {
        const requestNumber = await merchantPO.getMerchantAppPage().getRequestNumber();
        await use(requestNumber);
    },
});

export { expect } from '@playwright/test';
