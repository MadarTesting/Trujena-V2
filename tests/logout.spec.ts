import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { openWindow, closeWindow } from '../fixtures/fixtures';
import { LoginPage } from '../pages/auth/LoginPage';
import { MerchantLogoutPage } from '../pages/merchant/MerchantLogoutPage';
import users from '../testData/users';
import logoutData from '../testData/logout';

// merchant > تسجيل الخروج (UC-18)
// every test logs in with a NEW browser, so the saved session of the other tests is not closed

let context: BrowserContext;
let page: Page;
let logout: MerchantLogoutPage;

// تستات تسجيل الخروج (UC-18)
test.describe('Merchant - logout', { tag: '@logout' }, () => {

    test.beforeEach(async ({ browser }, testInfo) => {
        ({ context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL));
        const loginPage = new LoginPage(page);
        await loginPage.open();
        await loginPage.login(users.merchant.email, users.merchant.password);
        await loginPage.assertLoggedIn();

        logout = new MerchantLogoutPage(page);
        await page.goto(logoutData.startPage);
    });

    // if the test failed: screenshot + video are attached to the report
    test.afterEach(async ({}, testInfo) => {
        await closeWindow(context, page, testInfo, 'merchant');
    });

    // زرار الخروج بيفتح نافذة التأكيد
    test('[Positive] the logout button opens the confirm popup', async () => {
        await logout.openPopup();
        await expect(logout.popup).toContainText(logoutData.question);
        await expect(logout.confirm_btn).toBeVisible();
        await expect(logout.back_btn).toBeVisible();
    });

    // "الرجوع" بيقفل النافذة والتاجر بيفضل داخل
    test('[Negative] "الرجوع": the popup closes and the merchant stays on the same page', async () => {
        await logout.openPopup();
        await logout.back_btn.click();
        await logout.assertPopupClosed();
        await expect(page).toHaveURL(new RegExp(logoutData.startPage));

        await page.reload();
        await expect(page).toHaveURL(new RegExp(logoutData.startPage));   // still logged in
    });

    // علامة X بتقفل النافذة والتاجر بيفضل داخل
    test('[Negative] "X": the popup closes and the merchant stays logged in', async () => {
        await logout.openPopup();
        await logout.close_btn.click();
        await logout.assertPopupClosed();

        await page.reload();
        await expect(page).toHaveURL(new RegExp(logoutData.startPage));
    });

    // "تأكيد" بينهي الجلسة
    test('[Positive] "تأكيد": the session ends', async () => {
        await logout.openPopup();
        const response = await logout.confirmLogout();
        expect(response.ok()).toBeTruthy();
        await logout.assertLoginPageIsOpen();
    });

    // requirement: after logout the merchant goes to the HOME page of the marketing website
    // SEEN on stg: he goes to the login page (/auth)
    // بعد "تأكيد" المفروض يروح للموقع التسويقي (gap: بيروح لصفحة الدخول)
    test('[Positive] "تأكيد": the merchant goes to the home page of the marketing website', async () => {
        await logout.openPopup();
        await logout.confirmLogout();
        await expect(page, 'must open the marketing home page, not the login page').not.toHaveURL(/\/(auth|login)/, { timeout: 10000 });
    });

    // Business rule: no page inside the dashboard can be opened after logout
    // بعد الخروج كل صفحات لوحة التحكم بتفتح صفحة الدخول
    test('[Negative] after logout every inside page opens the login page', async () => {
        await logout.openPopup();
        await logout.confirmLogout();

        // Data-Driven: one step for every page in logoutData.insidePages
        for (const insidePage of logoutData.insidePages) {
            await test.step(insidePage, async () => {
                await page.goto(insidePage);
                await logout.assertLoginPageIsOpen();
            });
        }
    });

    // بعد الخروج زرار Back ما بيرجعش للوحة التحكم
    test('[Negative] after logout the browser back button does not open the dashboard', async () => {
        await logout.openPopup();
        await logout.confirmLogout();
        await logout.assertLoginPageIsOpen();

        await page.goBack();
        await logout.assertLoginPageIsOpen();
    });

    // Alternative 1: closing the browser ends the session after some time.
    // can not be automated: the time is not in the requirement
    // انتهاء الجلسة بعد قفل المتصفح (مقفول: المدة مش محددة)
    test.fixme('[Alternative] closing the browser ends the session after a time', async () => {});
});
