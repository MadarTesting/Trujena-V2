import { expect, type Locator, type Page } from '@playwright/test';

// admin > تسجيل الخروج (UC-14)
// SEEN on stg: زرار الخروج موجود في القايمة الجانبية وفي صفحة الملف الشخصي، والاتنين بيفتحوا نفس النافذة
export class AdminLogoutPage {
    //===================Locators===================
    readonly page: Page;
    readonly logout_btn: Locator;
    readonly popup: Locator;
    readonly confirm_btn: Locator;
    readonly back_btn: Locator;
    readonly close_btn: Locator;
    readonly toast: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // في صفحة الملف الشخصي فيه زرارين (القايمة + الصفحة)، فبناخد اللي في main لو موجود
        this.logout_btn = page.getByRole('button', { name: 'تسجيل الخروج' }).filter({ visible: true }).last();
        this.popup = page.getByRole('alertdialog');
        this.confirm_btn = this.popup.getByRole('button', { name: 'تأكيد' });
        this.back_btn = this.popup.getByRole('button', { name: 'الرجوع' });     // SEEN on stg: "الرجوع" مش "إلغاء"
        this.close_btn = this.popup.getByRole('button', { name: 'Close' });
        this.toast = page.locator('[data-sonner-toast]');
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيدوس "تسجيل الخروج" ويستنى النافذة
    async openPopup() {
        await this.logout_btn.click();
        await expect(this.popup).toBeVisible();
    }

    // بيدوس "تأكيد" ويستنى طلب الخروج
    async confirmLogout() {
        const answer = this.page.waitForResponse(r => r.url().includes('/signout'));
        await this.confirm_btn.click();
        return await answer;
    }

    // الاتصال بيفشل: طلب الخروج بيتقفل
    async makeLogoutFail() {
        await this.page.route('**/signout', route => route.abort());
    }

    //-------------------Assertions-------------------
    async assertPopupClosed() {
        await expect(this.popup).toBeHidden();
    }

    async assertLoginPageIsOpen() {
        await expect(this.page).toHaveURL(/\/auth/);
    }

    async assertMessage(text: string) {
        await expect(this.toast.filter({ hasText: text }), `the message "${text}" must be shown`).toBeVisible();
    }
}
