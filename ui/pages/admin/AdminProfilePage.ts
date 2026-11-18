import { expect, type Locator, type Page } from '@playwright/test';

// admin > الملف الشخصي (صفحة + 3 نوافذ: تعديل الملف / تغيير كلمة المرور / تسجيل الخروج)
// ⚠️ read only: أي طلب للسيرفر غير GET بيتقفل، عشان مفيش داتا تتغير
export class AdminProfilePage {
    //===================Locators===================
    readonly page: Page;
    readonly profile_lnk: Locator;
    readonly sideLogout_lnk: Locator;
    readonly topBarProfile: Locator;
    readonly topBarName_lbl: Locator;
    readonly main: Locator;
    readonly popup: Locator;
    readonly back_btn: Locator;
    readonly avatar: Locator;
    readonly popupEmail_tb: Locator;
    // edit profile popup
    readonly fullName_tb: Locator;
    readonly profileImage_file: Locator;
    readonly saveProfile_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.profile_lnk = page.getByRole('link', { name: 'الملف الشخصي' }).filter({ visible: true }).first();
        this.sideLogout_lnk = page.locator('aside, [data-slot="sidebar"]').getByText('تسجيل الخروج').filter({ visible: true }).first();

        // SEEN on stg: الشريط العلوي = صورة + الاسم + الدور (div مش زرار)
        this.topBarProfile = page.locator('span[data-slot="avatar"]').filter({ visible: true }).first().locator('..');
        this.topBarName_lbl = this.topBarProfile.locator('p').first();

        this.main = page.locator('main');
        // SEEN on stg: كل النوافذ alertdialog وفيها زرار "الرجوع"
        this.popup = page.getByRole('alertdialog');
        this.back_btn = this.popup.getByRole('button', { name: 'الرجوع' });
        this.avatar = this.topBarProfile.locator('[data-slot="avatar"]');
        this.popupEmail_tb = this.popup.locator('input[type="email"], input[name*="email" i]');

        this.fullName_tb = this.popup.locator('#fullName-input');
        this.profileImage_file = this.popup.locator('#profileImage-upload');
        this.saveProfile_btn = this.popup.getByRole('button', { name: 'حفظ التعديلات' });
    }

    //===================Methods===================
    text(text: string): Locator {
        return this.page.getByText(text);
    }

    //-------------------Actions-------------------
    // بيقفل أي طلب بيغيّر داتا (POST / PUT / PATCH / DELETE)
    async blockChanges() {
        await this.page.route('**/api/**', route =>
            route.request().method() === 'GET' ? route.continue() : route.abort());
    }

    // بيفتح الملف الشخصي من القايمة الجانبية
    async open() {
        await this.blockChanges();
        await this.page.goto('/home');
        await this.profile_lnk.click();
        await expect(this.page).toHaveURL(/\/profile/);
        await expect(this.popupButton('تعديل الملف الشخصي')).toBeVisible();
    }

    // زرار في الصفحة بيفتح نافذة
    popupButton(name: string) {
        return this.main.locator('button', { hasText: name }).filter({ visible: true }).last();
    }

    // بيفتح نافذة ويتأكد من عنوانها
    async openPopup(button: string, title: string) {
        await this.popupButton(button).click();
        await expect(this.popup).toContainText(title);
    }

    // بيدوس "الرجوع" ويتأكد إن النافذة اتقفلت
    async closePopup() {
        await this.back_btn.click();
        await expect(this.popup).toBeHidden();
    }

    // الاسم اللي في الشريط العلوي
    async topBarName() {
        return (await this.topBarName_lbl.innerText()).trim();
    }

    //-------------------Assertions-------------------
    async assertPageHas(text: string) {
        await expect(this.main.getByText(text, { exact: true }).filter({ visible: true }).first(),
            `the page must show "${text}"`).toBeVisible();
    }

    async assertPopupHas(text: string) {
        await expect(this.popup).toContainText(text);
    }
}
