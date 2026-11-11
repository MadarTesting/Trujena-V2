import { test } from '@playwright/test';
import { LoginPage } from '../pages/auth/LoginPage';
import users from '../testData/users';
import paths from '../testData/paths';

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
    test.describe(`Login - ${role.name}`, { tag: '@login' }, () => {
        test.use({ baseURL: role.baseURL });

        test.beforeEach('open the login page', async ({ page }, testInfo) => {
            loginPage = new LoginPage(page);
            await loginPage.open();
            console.log(`test starts for: ${testInfo.title}`);
        });

        // دخول صح بالإيميل والباسورد
        test('[Positive] valid login', { tag: '@smoke' }, async () => {
            await loginPage.login(role.user.email, role.user.password);
            await loginPage.assertLoggedIn();
        });

        // Data-Driven: one test for every row in users.wrongLogin
        for (const data of users.wrongLogin) {
            // دخول غلط (باسورد غلط / إيميل مش متسجل) من الداتا
            test(`[Negative] ${data.title}`, async () => {
                // ?? means: if the email is null use the real email of this role
                await loginPage.login(data.email ?? role.user.email, data.password);
                await loginPage.assertLoginPageIsOpen();
            });
        }

        // Data-Driven: the form blocks the data, so the login button must be disabled
        for (const data of users.invalidForm) {
            // فورم ناقصة أو إيميل غلط: زرار الدخول مقفول
            test(`[Negative] ${data.title}`, async () => {
                await loginPage.fillForm(data.email ?? role.user.email, data.password);
                await loginPage.assertLoginButtonDisabled();
                await loginPage.assertLoginPageIsOpen();
            });
        }

        // صفحة جوه السيستم من غير دخول بتفتح صفحة الدخول
        test('[Negative] a protected page needs login', async ({ page }) => {
            await page.goto(role.protectedPath);
            await loginPage.assertLoginPageIsOpen();
        });
    });
}

// the merchant account must NOT open the admin website
// الصلاحيات: كل حساب يدخل على موقعه بس
test.describe('Login - permissions', { tag: '@login' }, () => {
    test.use({ baseURL: process.env.ADMIN_URL });

    // حساب التاجر ما يقدرش يدخل على موقع الأدمن
    test('[Negative] merchant account cannot login to the admin website', async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.open();
        await loginPage.login(users.merchant.email, users.merchant.password);
        await loginPage.assertLoginPageIsOpen();
    });
});
