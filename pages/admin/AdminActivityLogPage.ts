import { expect, type Locator, type Page } from '@playwright/test';

// admin > سجل النشاطات (عرض بس، مفيش أي تغيير)
export class AdminActivityLogPage {
    //===================Locators===================
    readonly page: Page;
    readonly activityLog_lnk: Locator;
    readonly main: Locator;
    readonly search_tb: Locator;
    readonly type_cmb: Locator;
    readonly admin_cmb: Locator;
    readonly date_btn: Locator;
    readonly userImages: Locator;
    readonly dates: Locator;
    readonly empty_msg: Locator;
    readonly error_msg: Locator;

    //===================Variables===================
    readonly emptyMessageText: string = 'لا توجد نشاطات';                                       // SEEN on stg
    readonly errorMessageText: string = 'حدث خطأ أثناء تحميل البيانات يرجى المحاولة مرة أخرى';   // from the requirement

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.activityLog_lnk = page.getByRole('link', { name: 'سجل النشاطات' }).filter({ visible: true }).first();
        this.main = page.locator('main');
        this.search_tb = page.locator('#activity-search');
        this.type_cmb = this.main.getByRole('combobox').first();
        this.admin_cmb = this.main.getByRole('combobox').nth(1);
        this.date_btn = this.main.locator('[data-slot="popover-trigger"]');
        this.userImages = this.main.locator('img[width="40"]');                 // صورة المستخدم في كل نشاط (alt = اسمه)
        this.dates = this.main.getByText(/^\d{2}-\d{2}-\d{4}$/);
        this.empty_msg = this.main.getByText(this.emptyMessageText, { exact: true });
        this.error_msg = page.getByText(this.errorMessageText);
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيفتح سجل النشاطات من القايمة الجانبية
    async open() {
        await this.page.goto('/home');
        await this.activityLog_lnk.click();
        await expect(this.search_tb).toBeVisible();
    }

    // بيدوّر باسم المستخدم
    async search(name: string) {
        await this.search_tb.fill(name);
        await this.page.waitForTimeout(2500);
    }

    // بيفلتر بنوع الإجراء
    async filterByType(type: string) {
        await this.type_cmb.click();
        await this.page.getByRole('option', { name: type, exact: true }).click();
        await this.page.waitForTimeout(2500);
    }

    // بيفلتر بالمشرف
    async filterByAdmin(name: string) {
        await this.admin_cmb.click();
        await this.page.getByRole('option', { name, exact: true }).click();
        await this.page.waitForTimeout(2500);
    }

    // بيفلتر بيوم من التقويم
    async filterByDay(dayButton: string) {
        await this.date_btn.click();
        await this.page.locator(`button[data-day="${dayButton}"]`).click();
        await this.page.waitForTimeout(2500);
    }

    // عدد النشاطات المعروضة
    async countActivities() {
        return await this.userImages.count();
    }

    // السيرفر مش بيرد (فشل الاتصال)
    async makeLoadFail() {
        await this.page.route('**/api/v2/admin/activity-logs/**', route => route.abort());
    }

    //-------------------Assertions-------------------
    // في نشاطات معروضة
    async assertHasActivities() {
        await expect(this.userImages.first()).toBeVisible();
    }

    async assertEmpty() {
        await expect(this.empty_msg).toBeVisible();
    }

    // كل النشاطات اللي معروضة بتاعة المستخدم ده
    async assertOnlyUser(name: string) {
        for (const image of await this.userImages.all()) {
            await expect(image).toHaveAttribute('alt', name);
        }
    }

    // كل النشاطات اللي معروضة في اليوم ده
    async assertOnlyDate(date: string) {
        for (const text of await this.dates.allInnerTexts()) {
            expect(text.trim()).toBe(date);
        }
    }

    // أول نشاط فيه النص ده لازم يكون فيه كمان البيانات دي (زي اسم الموديول)
    async assertActivityHas(activityText: string, text: string) {
        const activity = this.main.locator('div').filter({ hasText: activityText }).filter({ has: this.userImages }).last();
        await expect(activity).toContainText(text);
    }

    // مفيش نوع إجراء تاني معروض
    async assertOnlyType(type: string, allTypes: string[]) {
        for (const other of allTypes.filter(t => t !== type)) {
            await expect(this.main.getByText(other, { exact: true })).toHaveCount(0);
        }
    }

    async assertLoadError() {
        await expect(this.error_msg).toBeVisible();
    }
}
