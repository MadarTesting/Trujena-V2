import { expect, type Locator, type Page } from '@playwright/test';
import paths from '../../testData/paths';

// merchant > الملف الشخصي (profile page + 3 popups: edit profile / change password / logout)
// صفحة الملف الشخصي عند التاجر
export class MerchantProfilePage {
    //===================Locators===================
    readonly page: Page;
    readonly profile_lnk: Locator;
    readonly topBarProfile: Locator;
    readonly topBarName_lbl: Locator;
    readonly editProfile_btn: Locator;
    readonly changePassword_btn: Locator;
    readonly logout_btn: Locator;
    readonly popup: Locator;
    readonly back_btn: Locator;
    readonly toast: Locator;
    // edit profile popup
    readonly fullName_tb: Locator;
    readonly profileImage_file: Locator;
    readonly saveProfile_btn: Locator;
    // change password popup
    readonly currentPassword_tb: Locator;
    readonly newPassword_tb: Locator;
    readonly confirmPassword_tb: Locator;
    readonly savePassword_btn: Locator;
    // logout popup
    readonly confirmLogout_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.profile_lnk = page.getByRole('link', { name: 'الملف الشخصي' }).filter({ visible: true }).first();

        // SEEN on stg: the top bar box = avatar + name + store name (it is a <div>, NOT a button)
        this.topBarProfile = page.locator('span[data-slot="avatar"]').filter({ visible: true }).first().locator('..');
        this.topBarName_lbl = this.topBarProfile.locator('p').first();

        // SEEN on stg: the 3 buttons of the profile page (each one opens a popup)
        this.editProfile_btn = page.locator('main button', { hasText: 'تعديل الملف الشخصي' }).filter({ visible: true }).last();
        this.changePassword_btn = page.locator('main button', { hasText: 'تغيير كلمة المرور' }).filter({ visible: true }).last();
        this.logout_btn = page.locator('main button', { hasText: 'تسجيل الخروج' }).filter({ visible: true }).last();

        // SEEN on stg: all the popups are alertdialog with a "الرجوع" button
        this.popup = page.getByRole('alertdialog');
        this.back_btn = this.popup.getByRole('button', { name: 'الرجوع' });
        this.toast = page.locator('[data-sonner-toast]').last();

        this.fullName_tb = this.popup.locator('#fullName-input');
        this.profileImage_file = this.popup.locator('#profileImage-upload');
        this.saveProfile_btn = this.popup.getByRole('button', { name: 'حفظ التعديلات' });

        this.currentPassword_tb = this.popup.locator('#currentPassword-password');
        this.newPassword_tb = this.popup.locator('#newPassword-password');
        this.confirmPassword_tb = this.popup.locator('#confirmPassword-password');
        this.savePassword_btn = this.popup.getByRole('button', { name: 'تغيير كلمة المرور' });

        this.confirmLogout_btn = this.popup.getByRole('button', { name: 'تأكيد' });
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // from the dashboard: click "الملف الشخصي" in the side bar
    // بيفتح الملف الشخصي من القايمة الجانبية
    async open() {
        await this.page.goto(paths.merchantHomePath);
        await this.profile_lnk.click();
        await expect(this.page).toHaveURL(new RegExp(paths.profilePath));
        await expect(this.editProfile_btn).toBeVisible();
    }

    // بيفتح نافذة تعديل الملف الشخصي
    async openEditProfile() {
        await this.editProfile_btn.click();
        await expect(this.popup).toContainText('إعدادات الملف الشخصي');
    }

    // بيفتح نافذة تغيير كلمة المرور
    async openChangePassword() {
        await this.changePassword_btn.click();
        await expect(this.popup).toContainText('حافظ على أمان حسابك');
    }

    // بيفتح نافذة تسجيل الخروج
    async openLogout() {
        await this.logout_btn.click();
        await expect(this.popup).toContainText('هل أنت متأكد من تسجيل الخروج؟');
    }

    // بيدوس "الرجوع" ويتأكد إن النافذة اتقفلت
    async closePopup() {
        await this.back_btn.click();
        await expect(this.popup).toBeHidden();
    }

    // click a button and wait for the server to answer (any request that is not GET)
    // بيدوس زرار ويستنى رد السيرفر
    async clickAndWaitForServer(button: Locator, timeout = 15000) {
        const answer = this.page.waitForResponse(r => r.url().includes('/api/') && r.request().method() !== 'GET', { timeout });
        await button.click();
        return await answer;
    }

    // بيغيّر الاسم ويحفظ
    async saveName(name: string) {
        await this.openEditProfile();
        await this.fullName_tb.fill(name);
        const response = await this.clickAndWaitForServer(this.saveProfile_btn);
        expect(response.ok(), `save profile failed: ${response.status()} ${await response.text()}`).toBeTruthy();
        await expect(this.popup).toBeHidden();
    }

    // بيملى خانات الباسورد التلاتة
    async fillPasswords(current: string, newPassword: string, confirm: string) {
        await this.currentPassword_tb.fill(current);
        await this.newPassword_tb.fill(newPassword);
        await this.confirmPassword_tb.fill(confirm);
    }

    //-------------------Assertions-------------------
    // the profile page shows the account data (name, email, store, phone, WhatsApp)
    // بيتأكد من بيانات الحساب
    async assertAccountData(data: { name: string; email: string; storeName: string; phone?: string; whatsapp: string }) {
        // SEEN on stg: some values are on the page 2 times (one is hidden), so we take the visible one
        for (const value of Object.values(data)) {
            await expect(this.page.locator('main').getByText(value, { exact: true }).filter({ visible: true }).first(),
                `the page must show "${value}"`).toBeVisible();
        }
    }

    // بيتأكد من الاسم في الشريط العلوي
    async assertTopBarName(name: string) {
        await expect(this.topBarName_lbl).toHaveText(name);
    }

    // SEEN on stg: the password rules are shown under the field
    // بيتأكد إن شرط الباسورد ظاهر
    async assertPasswordRuleShown(ruleText: string) {
        await expect(this.popup.getByText(ruleText)).toBeVisible();
    }
}
