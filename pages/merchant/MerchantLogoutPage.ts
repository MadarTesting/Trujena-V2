import { expect, type Locator, type Page } from '@playwright/test';

// merchant > تسجيل الخروج (UC-18)
// تسجيل الخروج عند التاجر
export class MerchantLogoutPage {
    //===================Locators===================
    readonly page: Page;
    readonly logout_btn: Locator;
    readonly popup: Locator;
    readonly confirm_btn: Locator;
    readonly back_btn: Locator;
    readonly close_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.logout_btn = page.getByRole('button', { name: 'تسجيل الخروج' }).filter({ visible: true }).first();
        this.popup = page.getByRole('alertdialog');
        this.confirm_btn = this.popup.getByRole('button', { name: 'تأكيد' });
        this.back_btn = this.popup.getByRole('button', { name: 'الرجوع' });
        this.close_btn = this.popup.getByRole('button', { name: 'Close' });
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيدوس "تسجيل الخروج" ويستنى النافذة
    async openPopup() {
        await this.logout_btn.click();
        await expect(this.popup).toBeVisible();
    }

    // click "تأكيد" and wait for the logout request
    // بيدوس "تأكيد" ويستنى طلب الخروج
    async confirmLogout() {
        const answer = this.page.waitForResponse(r => r.url().includes('/signout'));
        await this.confirm_btn.click();
        return await answer;
    }

    //-------------------Assertions-------------------
    // بيتأكد إن النافذة اتقفلت
    async assertPopupClosed() {
        await expect(this.popup).toBeHidden();
    }

    // بيتأكد إن صفحة الدخول مفتوحة
    async assertLoginPageIsOpen() {
        await expect(this.page).toHaveURL(/\/(auth|login)/);
    }
}
