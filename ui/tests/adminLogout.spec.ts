// بيجيب test و expect و type Page و type BrowserContext من @playwright/test
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
// بيجيب openWindow و closeWindow من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { openWindow, closeWindow } from '../../fixtures/fixtures';
// بيجيب LoginPage من pages/auth/LoginPage
import { LoginPage } from '../pages/auth/LoginPage';
// بيجيب AdminLogoutPage من pages/admin/AdminLogoutPage
import { AdminLogoutPage } from '../pages/admin/AdminLogoutPage';
// بيجيب users من testData/users.ts
import users from '../../testData/users';
// بيجيب data من testData/adminLogout.ts
import data from '../../testData/adminLogout';

// admin > تسجيل الخروج (requirements/AdminLogoutPage.md = UC-14)
// كل تست بيعمل دخول جديد في متصفح جديد، عشان الجلسة المحفوظة بتاعة التستات التانية ما تتقفلش
// مفيش أي داتا بتتغير: الخروج بينهي جلسة التست بس

let context: BrowserContext;
let page: Page;
let logout: AdminLogoutPage;

// مجموعة تستات: Admin - logout
test.describe('Admin - logout', { tag: '@adminLogout' }, () => {

    // beforeEach = بيشتغل قبل كل تست في المجموعة
    test.beforeEach(async ({ browser }, testInfo) => {
        // بيفتح متصفح جديد (context, page)
        ({ context, page } = await openWindow(browser, testInfo, process.env.ADMIN_URL));
        // بيعمل صفحة Login على المتصفح ده
        const loginPage = new LoginPage(page);
        // بيفتح الصفحة
        await loginPage.open();
        // بيكتب الإيميل والباسورد ويدوس دخول
        await loginPage.login(users.admin.email, users.admin.password);
        // بيتأكد إن الدخول نجح
        await loginPage.assertLoggedIn();

        // بيعمل AdminLogoutPage على المتصفح ده
        logout = new AdminLogoutPage(page);
        // بيفتح الصفحة دي بالرابط
        await page.goto(data.startPage);
    });

    // لو التست فشل: screenshot + فيديو في الريبورت
    test.afterEach(async ({}, testInfo) => {
        // بينادي على الدالة closeWindow
        await closeWindow(context, page, testInfo, 'admin');
    });

    // Data-Driven: الزرار في القايمة الجانبية وفي الملف الشخصي بيفتح نافذة التأكيد
    for (const place of data.places) {
        // تست جديد
        test(`[Positive] the logout button in ${place.name} opens the confirm popup`, async () => {
            // بيفتح الصفحة دي بالرابط
            await page.goto(place.page);
            // بيفتح النافذة (popup)
            await logout.openPopup();
            // بيتأكد إن النافذة فيه النص data.question
            await expect(logout.popup).toContainText(data.question);
            // بيتأكد إن زرار confirm ظاهر
            await expect(logout.confirm_btn).toBeVisible();
            // بيتأكد إن زرار back ظاهر
            await expect(logout.back_btn).toBeVisible();
        });
    }

    // الإلغاء: النافذة بتتقفل والأدمن بيفضل في نفس الصفحة وداخل
    test('[Negative] cancel: the popup closes and the admin stays on the same page', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس على زرار back
        await logout.back_btn.click();
        // بيتأكد إن النافذة اتقفلت
        await logout.assertPopupClosed();
        // بيتأكد إن page الرابط بقى new RegExp(data.startPage)
        await expect(page).toHaveURL(new RegExp(data.startPage));

        // بيعمل reload للصفحة
        await page.reload();
        // still logged in
        await expect(page).toHaveURL(new RegExp(data.startPage));
    });

    // علامة X: النافذة بتتقفل والأدمن بيفضل داخل
    test('[Negative] "X": the popup closes and the admin stays logged in', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس على زرار close
        await logout.close_btn.click();
        // بيتأكد إن النافذة اتقفلت
        await logout.assertPopupClosed();

        // بيعمل reload للصفحة
        await page.reload();
        // بيتأكد إن page الرابط بقى new RegExp(data.startPage)
        await expect(page).toHaveURL(new RegExp(data.startPage));
    });

    // Data-Driven: "تأكيد" من المكانين بينهي الجلسة ويفتح صفحة الدخول
    for (const place of data.places) {
        // تست جديد
        test(`[Positive] confirm from ${place.name}: the session ends and the login page opens`, async () => {
            // بيفتح الصفحة دي بالرابط
            await page.goto(place.page);
            // بيفتح النافذة (popup)
            await logout.openPopup();
            // بيدوس "تأكيد" الخروج ويستنى رد السيرفر، وبيحفظ النتيجة في response
            const response = await logout.confirmLogout();
            // بيتأكد إن السيرفر رد بنجاح
            expect(response.ok()).toBeTruthy();
            // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
            await logout.assertLoginPageIsOpen();
        });
    }

    // Main flow 3: بعد "تأكيد" تظهر رسالة "تم تسجيل الخروج بنجاح"
    test('[Positive] confirm: the message "تم تسجيل الخروج بنجاح" is shown', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس "تأكيد" الخروج ويستنى رد السيرفر
        await logout.confirmLogout();
        // بيتأكد إن الرسالة دي ظهرت
        await logout.assertMessage(data.successMessage);
    });

    // Business rule: بعد الخروج مفيش صفحة جوه لوحة التحكم بتفتح
    test('[Negative] business rule: after logout every inside page opens the login page', async () => {
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس "تأكيد" الخروج ويستنى رد السيرفر
        await logout.confirmLogout();
        // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
        await logout.assertLoginPageIsOpen();

        // Data-Driven: بيلف على data.insidePages، وبيعمل الكود اللي جوه لكل insidePage
        for (const insidePage of data.insidePages) {
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

    // Alternative 1: فشل الاتصال: رسالة خطأ والأدمن بيفضل داخل
    test('[Negative] Alternative 1: when the connection fails, an error message is shown', async () => {
        // بيخلّي طلب الخروج يفشل (عشان نشوف رسالة الخطأ)
        await logout.makeLogoutFail();
        // بيفتح النافذة (popup)
        await logout.openPopup();
        // بيدوس على زرار confirm
        await logout.confirm_btn.click();
        // بيتأكد إن الرسالة دي ظهرت
        await logout.assertMessage(data.errorMessage);
        // بيتأكد إن page الرابط بقى new RegExp(data.startPage)
        await expect(page).toHaveURL(new RegExp(data.startPage));
    });
});
