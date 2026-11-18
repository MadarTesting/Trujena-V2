import { expect, type Locator, type Page } from '@playwright/test';
import paths from '../../../testData/paths';

// the same login page for the merchant (stg.trujena.com) and the admin (admin.stg.trujena.com)
// صفحة الدخول (واحدة للتاجر والأدمن)
export class LoginPage {
    //===================Locators===================
    readonly page: Page;
    readonly email_tb: Locator;
    readonly password_tb: Locator;
    readonly Login_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg: the page has 2 login forms (desktop + mobile), only one is visible
        const form = page.locator('form').filter({ visible: true });
        this.email_tb = form.locator('#email-input');
        this.password_tb = form.locator('#password-password');
        this.Login_btn = form.locator('button[type="submit"]');
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيفتح صفحة الدخول
    async open() {
        await this.page.goto(paths.loginPath);
    }

    // بيكتب الإيميل والباسورد
    async fillForm(email: string, password: string) {
        await this.email_tb.fill(email);
        await this.password_tb.fill(password);
    }

    // بيكتب البيانات ويدوس دخول
    async login(email: string, password: string) {
        await this.fillForm(email, password);
        await this.Login_btn.click();
    }

    //-------------------Assertions-------------------
    // بيتأكد إن الدخول نجح
    async assertLoggedIn() {
        // after a good login the website opens /home
        await expect(this.page).toHaveURL(/\/home/, { timeout: 30000 });
    }

    // بيتأكد إن صفحة الدخول مفتوحة
    async assertLoginPageIsOpen() {
        // SEEN on stg: admin uses /auth, merchant redirects protected pages to /login?callbackUrl=...
        await expect(this.page).toHaveURL(/\/(auth|login)/);
        await expect(this.Login_btn).toBeVisible();
    }

    // بيتأكد إن زرار الدخول مقفول
    async assertLoginButtonDisabled() {
        await expect(this.Login_btn).toBeDisabled();
    }
}
