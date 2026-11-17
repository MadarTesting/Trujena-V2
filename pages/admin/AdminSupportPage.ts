import { expect, type Locator, type Page } from '@playwright/test';
import { protectCustomers, allowed } from '../../utils/customerGuard';

// admin > الدعم والتواصل
export class AdminSupportPage {
    //===================Locators===================
    readonly page: Page;
    readonly support_lnk: Locator;
    readonly search_tb: Locator;
    readonly headers: Locator;
    readonly rows: Locator;
    readonly view_btn: Locator;
    readonly details: Locator;
    readonly status_badge: Locator;
    readonly viewed_rb: Locator;
    readonly Save_btn: Locator;
    readonly empty_msg: Locator;
    readonly error_msg: Locator;

    //===================Variables===================
    readonly emptyMessageText: string = 'لا توجد رسائل حاليا';
    // SEEN on stg: "خطأ في التحديث" (الريكوايرمنت بتقول "حدث خطأ أثناء تحميل الرسائل يرجى المحاولة لاحقا")
    readonly errorMessageText: string = 'خطأ في التحديث';

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.support_lnk = page.getByRole('link', { name: 'الدعم والتواصل' }).filter({ visible: true }).first();
        this.search_tb = page.locator('#support-search');
        this.headers = page.locator('main thead th');
        this.rows = page.locator('main tbody tr');
        this.view_btn = this.rows.first().getByRole('button', { name: 'View message details' });   // SEEN on stg: English aria-label
        this.details = page.locator('main');
        this.status_badge = page.locator('main [data-slot="badge"]').first();
        this.viewed_rb = page.locator('main input[value="viewed"]');
        this.Save_btn = page.getByRole('button', { name: 'حفظ الحالة' });
        this.empty_msg = page.getByRole('heading', { name: this.emptyMessageText });
        this.error_msg = page.getByText(this.errorMessageText);
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيفتح الصفحة من القايمة الجانبية (والحماية متركبة)
    async open() {
        await protectCustomers(this.page);
        await this.page.goto('/home');
        await this.support_lnk.click();
        await expect(this.search_tb).toBeVisible();
    }

    // بيفتح تاب (رسائل الدعم الفني / رسائل تواصل معنا)
    async openTab(tab: string) {
        await this.page.locator('main').getByRole('button', { name: tab, exact: true }).click();
        await this.page.waitForTimeout(2000);
    }

    // بيدوّر باسم العميل
    async search(name: string) {
        await this.search_tb.fill(name);
        await this.page.waitForTimeout(2000);
    }

    // بيختار من فلتر (نوع الرسالة / الحالة)
    async filter(filterName: string, option: string) {
        await this.page.locator('main').getByRole('combobox').filter({ hasText: filterName }).click();
        await this.page.getByRole('option', { name: option, exact: true }).click();
        await this.page.waitForTimeout(2000);
    }

    // بيفتح رسالة التست ويسمح بالتغيير عليها هي بس
    async openMessage(name: string) {
        await this.open();
        await this.search(name);
        allowed.id = (await this.rows.first().locator('td').first().innerText()).trim();   // SUP-00xx
        await this.view_btn.click();
    }

    // بيختار "تم الاطلاع" ويحفظ
    async markAsViewed() {
        await this.viewed_rb.check();
        await this.Save_btn.click();
    }

    // السيرفر يرجع error في الحفظ (من غير ما حاجة تتغير)
    async makeSaveFail() {
        await this.page.route('**/api/v2/admin/support/**', route =>
            route.request().method() === 'GET' ? route.continue() : route.fulfill({ status: 500 }));
    }

    //-------------------Assertions-------------------
    async assertColumn(column: string) {
        await expect(this.headers.filter({ hasText: column })).toHaveCount(1);
    }

    async assertFirstRowHas(text: string) {
        await expect(this.rows.first()).toContainText(text);
    }

    async assertDetailsHave(text: string) {
        await expect(this.details).toContainText(text);
    }

    async assertStatus(status: string) {
        await expect(this.status_badge).toHaveText(status);
    }

    // كل الصفوف في العمود ده فيها القيمة دي
    async assertOnly(column: number, value: string) {
        for (const cell of await this.rows.locator(`td:nth-child(${column})`).allInnerTexts()) {
            expect(cell.trim()).toBe(value);
        }
    }

    async assertEmpty() {
        await expect(this.empty_msg).toBeVisible();
    }

    async assertSaveError() {
        await expect(this.error_msg).toBeVisible();
    }
}
