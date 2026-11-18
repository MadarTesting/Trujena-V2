// بيجيب test من @playwright/test
import { test } from '@playwright/test';
// بيجيب LoginPage من pages/auth/LoginPage
import { LoginPage } from '../pages/auth/LoginPage';
// بيجيب users من testData/users.ts
import users from '../../testData/users';
// بيجيب paths من testData/paths.ts
import paths from '../../testData/paths';

//===================Variables===================
let loginPage: LoginPage;

// the same tests run for the two roles
const roles = [
    { name: 'merchant', baseURL: process.env.MERCHANT_URL, user: users.merchant, protectedPath: paths.merchantAppPath },
    { name: 'admin', baseURL: process.env.ADMIN_URL, user: users.admin, protectedPath: paths.adminRequestsPath },
];

//===================Test Cases===================
// نفس التستات بتتكرر للتاجر وللأدمن
for (const role of roles) {
    // مجموعة تستات: Login - ${role.name}
    test.describe(`Login - ${role.name}`, { tag: '@login' }, () => {
        // إعدادات للتستات اللي في المجموعة دي
        test.use({ baseURL: role.baseURL });

        // beforeEach = بيشتغل قبل كل تست في المجموعة
        test.beforeEach('open the login page', async ({ page }, testInfo) => {
            // بيعمل LoginPage على المتصفح ده
            loginPage = new LoginPage(page);
            // بيفتح الصفحة
            await loginPage.open();
            // بيطبع في الترمنال
            console.log(`test starts for: ${testInfo.title}`);
        });

        // دخول صح بالإيميل والباسورد
        test('[Positive] valid login', { tag: '@smoke' }, async () => {
            // بيكتب الإيميل والباسورد ويدوس دخول
            await loginPage.login(role.user.email, role.user.password);
            // بيتأكد إن الدخول نجح
            await loginPage.assertLoggedIn();
        });

        // Data-Driven: one test for every row in users.wrongLogin
        for (const data of users.wrongLogin) {
            // دخول غلط (باسورد غلط / إيميل مش متسجل) من الداتا
            test(`[Negative] ${data.title}`, async () => {
                // ?? means: if the email is null use the real email of this role
                await loginPage.login(data.email ?? role.user.email, data.password);
                // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
                await loginPage.assertLoginPageIsOpen();
            });
        }

        // Data-Driven: the form blocks the data, so the login button must be disabled
        for (const data of users.invalidForm) {
            // فورم ناقصة أو إيميل غلط: زرار الدخول مقفول
            test(`[Negative] ${data.title}`, async () => {
                // بيملى الإيميل والباسورد من غير ما يدوس دخول
                await loginPage.fillForm(data.email ?? role.user.email, data.password);
                // بيتأكد إن زرار الدخول مقفول
                await loginPage.assertLoginButtonDisabled();
                // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
                await loginPage.assertLoginPageIsOpen();
            });
        }

        // صفحة جوه السيستم من غير دخول بتفتح صفحة الدخول
        test('[Negative] a protected page needs login', async ({ page }) => {
            // بيفتح الصفحة دي بالرابط
            await page.goto(role.protectedPath);
            // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
            await loginPage.assertLoginPageIsOpen();
        });
    });
}

// the merchant account must NOT open the admin website
// الصلاحيات: كل حساب يدخل على موقعه بس
test.describe('Login - permissions', { tag: '@login' }, () => {
    // إعدادات للتستات اللي في المجموعة دي
    test.use({ baseURL: process.env.ADMIN_URL });

    // حساب التاجر ما يقدرش يدخل على موقع الأدمن
    test('[Negative] merchant account cannot login to the admin website', async ({ page }) => {
        // بيعمل LoginPage على المتصفح ده
        loginPage = new LoginPage(page);
        // بيفتح الصفحة
        await loginPage.open();
        // بيكتب الإيميل والباسورد ويدوس دخول
        await loginPage.login(users.merchant.email, users.merchant.password);
        // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
        await loginPage.assertLoginPageIsOpen();
    });
});
