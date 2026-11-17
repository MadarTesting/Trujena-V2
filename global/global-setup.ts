import 'dotenv/config';
import { chromium, type Browser } from '@playwright/test';
import { LoginPage } from '../pages/auth/LoginPage';
import users from '../testData/users';
import paths from '../testData/paths';

// بيشتغل مرة واحدة قبل كل التستات

// بيعمل دخول ويحفظ الجلسة في ملف (عشان التستات تفتح وهي داخلة على طول)
async function login(browser: Browser, url: string, email: string, password: string, file: string) {
    const page = await browser.newPage({ baseURL: url });
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(email, password);
    await loginPage.assertLoggedIn();

    await page.context().storageState({ path: file });    // بيحفظ الجلسة
    await page.close();
}

export default async function globalSetup() {
    // رقم واحد للـ run كله، بيتحط في أسامي داتا التست (QA User 123456)
    process.env.RUN_ID ??= Date.now().toString().slice(-6);

    // Chrome المتسطب على الجهاز (Windows بيمنع الـ Chromium بتاع Playwright)
    const browser = await chromium.launch({ channel: 'chrome' });

    await login(browser, process.env.MERCHANT_URL!, users.merchant.email, users.merchant.password, paths.merchantState);
    await login(browser, process.env.ADMIN_URL!, users.admin.email, users.admin.password, paths.adminState);

    await browser.close();
}
