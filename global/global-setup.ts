import 'dotenv/config';
import { chromium, type Browser } from '@playwright/test';
import fs from 'fs';
import { LoginPage } from '../pages/auth/LoginPage';
import users from '../testData/users';
import paths from '../testData/paths';

//===================Login one role and save the session===================
// بيعمل دخول ويحفظ الجلسة في ملف
async function loginAndSave(
    browser: Browser,
    baseURL: string,
    user: { email: string; password: string },
    stateFile: string
) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(user.email, user.password);
    await loginPage.assertLoggedIn();

    // storageState = the saved login (cookies + local storage) in a file
    await context.storageState({ path: stateFile });
    await context.close();
}

//===================Runs once before all tests===================
// بيشتغل مرة واحدة قبل كل التستات: دخول التاجر والأدمن
async function globalSetup() {
    fs.mkdirSync('playwright/.auth', { recursive: true });
    // رقم واحد للـ run كله (كل الـ workers بيشوفوه)، عشان عميل التست يفضل بنفس الاسم
    process.env.RUN_ID ??= Date.now().toString().slice(-6);

    // installed Chrome: Windows Application Control blocks the Chromium downloaded by Playwright
    const browser = await chromium.launch({ channel: 'chrome' });
    const roles = [
        { name: 'merchant', baseURL: process.env.MERCHANT_URL!, user: users.merchant, stateFile: paths.merchantState },
        { name: 'admin', baseURL: process.env.ADMIN_URL!, user: users.admin, stateFile: paths.adminState },
    ];

    // if one role cannot login, we do NOT stop all the tests:
    // the tests that do not need this role still run, the tests that need it fail (no saved session)
    const failed: string[] = [];
    for (const role of roles) {
        try {
            await loginAndSave(browser, role.baseURL, role.user, role.stateFile);
        } catch {
            failed.push(role.name);
            console.warn(`WARNING: the ${role.name} login failed (${role.user.email}). Check the email/password in .env`);
        }
    }
    await browser.close();

    if (failed.length === roles.length) throw new Error('Global setup: all the logins failed');
    console.log(`Global setup: sessions saved for: ${roles.map(r => r.name).filter(n => !failed.includes(n)).join(', ')}`);
}

export default globalSetup;
