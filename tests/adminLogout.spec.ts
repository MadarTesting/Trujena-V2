import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { openWindow, closeWindow } from '../fixtures/fixtures';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminLogoutPage } from '../pages/admin/AdminLogoutPage';
import users from '../testData/users';
import data from '../testData/adminLogout';

// admin > تسجيل الخروج (requirements/AdminLogoutPage.md = UC-14)
// كل تست بيعمل دخول جديد في متصفح جديد، عشان الجلسة المحفوظة بتاعة التستات التانية ما تتقفلش
// مفيش أي داتا بتتغير: الخروج بينهي جلسة التست بس

let context: BrowserContext;
let page: Page;
let logout: AdminLogoutPage;

test.describe('Admin - logout', { tag: '@adminLogout' }, () => {

    test.beforeEach(async ({ browser }, testInfo) => {
        ({ context, page } = await openWindow(browser, testInfo, process.env.ADMIN_URL));
        const loginPage = new LoginPage(page);
        await loginPage.open();
        await loginPage.login(users.admin.email, users.admin.password);
        await loginPage.assertLoggedIn();

        logout = new AdminLogoutPage(page);
        await page.goto(data.startPage);
    });

    // لو التست فشل: screenshot + فيديو في الريبورت
    test.afterEach(async ({}, testInfo) => {
        await closeWindow(context, page, testInfo, 'admin');
    });

    // Data-Driven: الزرار في القايمة الجانبية وفي الملف الشخصي بيفتح نافذة التأكيد
    for (const place of data.places) {
        test(`[Positive] the logout button in ${place.name} opens the confirm popup`, async () => {
            await page.goto(place.page);
            await logout.openPopup();
            await expect(logout.popup).toContainText(data.question);
            await expect(logout.confirm_btn).toBeVisible();
            await expect(logout.back_btn).toBeVisible();
        });
    }

    // الإلغاء: النافذة بتتقفل والأدمن بيفضل في نفس الصفحة وداخل
    test('[Negative] cancel: the popup closes and the admin stays on the same page', async () => {
        await logout.openPopup();
        await logout.back_btn.click();
        await logout.assertPopupClosed();
        await expect(page).toHaveURL(new RegExp(data.startPage));

        await page.reload();
        await expect(page).toHaveURL(new RegExp(data.startPage));   // still logged in
    });

    // علامة X: النافذة بتتقفل والأدمن بيفضل داخل
    test('[Negative] "X": the popup closes and the admin stays logged in', async () => {
        await logout.openPopup();
        await logout.close_btn.click();
        await logout.assertPopupClosed();

        await page.reload();
        await expect(page).toHaveURL(new RegExp(data.startPage));
    });

    // Data-Driven: "تأكيد" من المكانين بينهي الجلسة ويفتح صفحة الدخول
    for (const place of data.places) {
        test(`[Positive] confirm from ${place.name}: the session ends and the login page opens`, async () => {
            await page.goto(place.page);
            await logout.openPopup();
            const response = await logout.confirmLogout();
            expect(response.ok()).toBeTruthy();
            await logout.assertLoginPageIsOpen();
        });
    }

    // Main flow 3: بعد "تأكيد" تظهر رسالة "تم تسجيل الخروج بنجاح"
    test('[Positive] confirm: the message "تم تسجيل الخروج بنجاح" is shown', async () => {
        await logout.openPopup();
        await logout.confirmLogout();
        await logout.assertMessage(data.successMessage);
    });

    // Business rule: بعد الخروج مفيش صفحة جوه لوحة التحكم بتفتح
    test('[Negative] business rule: after logout every inside page opens the login page', async () => {
        await logout.openPopup();
        await logout.confirmLogout();
        await logout.assertLoginPageIsOpen();

        for (const insidePage of data.insidePages) {
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

    // Alternative 1: فشل الاتصال: رسالة خطأ والأدمن بيفضل داخل
    test('[Negative] Alternative 1: when the connection fails, an error message is shown', async () => {
        await logout.makeLogoutFail();
        await logout.openPopup();
        await logout.confirm_btn.click();
        await logout.assertMessage(data.errorMessage);
        await expect(page).toHaveURL(new RegExp(data.startPage));
    });
});
