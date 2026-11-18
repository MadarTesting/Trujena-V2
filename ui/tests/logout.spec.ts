// بيجيب test و expect و type Page و type BrowserContext من @playwright/test
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
// بيجيب openWindow و closeWindow من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { openWindow, closeWindow } from '../../fixtures/fixtures';
// بيجيب LoginPage من pages/auth/LoginPage
import { LoginPage } from '../pages/auth/LoginPage';
// بيجيب MerchantLogoutPage من pages/merchant/MerchantLogoutPage
import { MerchantLogoutPage } from '../pages/merchant/MerchantLogoutPage';
// بيجيب users من testData/users.ts
import users from '../../testData/users';
// بيجيب logoutData من testData/logout.ts
import logoutData from '../../testData/logout';

// merchant > تسجيل الخروج (UC-18)
// every test logs in with a NEW browser, so the saved session of the other tests is not closed

let context: BrowserContext;
let page: Page;
let logout: MerchantLogoutPage;

// تستات تسجيل الخروج (UC-18)
test.describe('Merchant - logout', { tag: '@logout' }, () => {

    // beforeEach = بيشتغل قبل كل تست في المجموعة
    test.beforeEach(async ({ browser }, testInfo) => {
        // بيفتح متصفح جديد (context, page)
        ({ context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL));
        // بيعمل صفحة Login على المتصفح ده
        const loginPage = new LoginPage(page);
        // بيفتح الصفحة
        await loginPage.open();
        // بيكتب الإيميل والباسورد ويدوس دخول
        await loginPage.login(users.merchant.email, users.merchant.password);
        // بيتأكد إن الدخول نجح
        await loginPage.assertLoggedIn();

        // بيعمل MerchantLogoutPage على المتصفح ده
        logout = new MerchantLogoutPage(page);
        // بيفتح الصفحة دي بالرابط
        await page.goto(logoutData.startPage);
    });

    // if the test failed: screenshot + video are attached to the report
    test.afterEach(async ({}, testInfo) => {
        // بينادي على الدالة closeWindow
        await closeWindow(context, page, testInfo, 'merchant');
    });

    // زرار الخروج بيفتح نافذة التأكيد
    test('[Positive] the logout button opens the confirm popup', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيتأكد إن النافذة فيه النص logoutData.question
        await expect(logout.popup).toContainText(logoutData.question);
        // بيتأكد إن زرار confirm ظاهر
        await expect(logout.confirm_btn).toBeVisible();
        // بيتأكد إن زرار back ظاهر
        await expect(logout.back_btn).toBeVisible();
    });

    // "الرجوع" بيقفل النافذة والتاجر بيفضل داخل
    test('[Negative] "الرجوع": the popup closes and the merchant stays on the same page', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس على زرار back
        await logout.back_btn.click();
        // بيتأكد إن النافذة اتقفلت
        await logout.assertPopupClosed();
        // بيتأكد إن page الرابط بقى new RegExp(logoutData.startPage)
        await expect(page).toHaveURL(new RegExp(logoutData.startPage));

        // بيعمل reload للصفحة
        await page.reload();
        // still logged in
        await expect(page).toHaveURL(new RegExp(logoutData.startPage));
    });

    // علامة X بتقفل النافذة والتاجر بيفضل داخل
    test('[Negative] "X": the popup closes and the merchant stays logged in', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس على زرار close
        await logout.close_btn.click();
        // بيتأكد إن النافذة اتقفلت
        await logout.assertPopupClosed();

        // بيعمل reload للصفحة
        await page.reload();
        // بيتأكد إن page الرابط بقى new RegExp(logoutData.startPage)
        await expect(page).toHaveURL(new RegExp(logoutData.startPage));
    });

    // "تأكيد" بينهي الجلسة
    test('[Positive] "تأكيد": the session ends', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس "تأكيد" الخروج ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await logout.confirmLogout();
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();
        // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
        await logout.assertLoginPageIsOpen();
    });

    // requirement: after logout the merchant goes to the HOME page of the marketing website
    // SEEN on stg: he goes to the login page (/auth)
    // بعد "تأكيد" المفروض يروح للموقع التسويقي (gap: بيروح لصفحة الدخول)
    test('[Positive] "تأكيد": the merchant goes to the home page of the marketing website', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس "تأكيد" الخروج ويستنى رد السيرفر
        await logout.confirmLogout();
        // بيتأكد إن page الرابط مش بقى /\/(auth|login)/, { timeout: 10000 }
        await expect(page, 'must open the marketing home page, not the login page').not.toHaveURL(/\/(auth|login)/, { timeout: 10000 });
    });

    // Business rule: no page inside the dashboard can be opened after logout
    // بعد الخروج كل صفحات لوحة التحكم بتفتح صفحة الدخول
    test('[Negative] after logout every inside page opens the login page', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس "تأكيد" الخروج ويستنى رد السيرفر
        await logout.confirmLogout();

        // Data-Driven: one step for every page in logoutData.insidePages
        for (const insidePage of logoutData.insidePages) {
            // خطوة في الفورم
            await test.step(insidePage, async () => {
                // بيفتح الصفحة دي بالرابط
                await page.goto(insidePage);
                // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
                await logout.assertLoginPageIsOpen();
            });
        }
    });

    // بعد الخروج زرار Back ما بيرجعش للوحة التحكم
    test('[Negative] after logout the browser back button does not open the dashboard', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس "تأكيد" الخروج ويستنى رد السيرفر
        await logout.confirmLogout();
        // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
        await logout.assertLoginPageIsOpen();

        // بيدوس Back في المتصفح
        await page.goBack();
        // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
        await logout.assertLoginPageIsOpen();
    });

    // Alternative 1: closing the browser ends the session after some time.
    // can not be automated: the time is not in the requirement
    // انتهاء الجلسة بعد قفل المتصفح (مقفول: المدة مش محددة)
    test.fixme('[Alternative] closing the browser ends the session after a time', async () => {});
});
