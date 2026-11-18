import { expect, type Locator, type Page } from '@playwright/test';
import paths from '../../../testData/paths';
import { protectCustomers, allowed } from '../../../utils/customerGuard';

// صفحة إدارة العملاء عند الأدمن (العملاء الفعليين + المحتملين + إضافة عميل)
// IMPORTANT: this page NEVER saves, deletes or changes a customer
export class AdminCustomersPage {
    //===================Locators===================
    readonly page: Page;
    readonly main: Locator;
    readonly customers_lnk: Locator;
    readonly actualTab_btn: Locator;
    readonly leadsTab_btn: Locator;
    readonly addCustomer_btn: Locator;
    readonly search_tb: Locator;
    readonly headers: Locator;
    readonly rows: Locator;
    readonly deleteDialog: Locator;
    readonly cancelDelete_btn: Locator;
    readonly confirmDelete_btn: Locator;
    readonly save_btn: Locator;
    readonly next_btn: Locator;
    readonly subscriptionData_btn: Locator;
    readonly subscriptionStatus_cmb: Locator;
    readonly cancelledOption: Locator;
    readonly name_tb: Locator;
    readonly email_tb: Locator;
    readonly password_tb: Locator;
    readonly confirmPassword_tb: Locator;
    readonly subscriptionFilter_cmb: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.main = page.locator('main');
        this.customers_lnk = page.getByRole('link', { name: 'إدارة العملاء' }).filter({ visible: true }).first();
        this.actualTab_btn = this.main.getByRole('button', { name: 'العملاء الفعليين' });
        this.leadsTab_btn = this.main.getByRole('button', { name: 'العملاء المحتملين' });
        this.addCustomer_btn = this.main.getByRole('button', { name: 'إضافة عميل جديد' });
        this.search_tb = this.main.locator('#customer-search');
        this.headers = this.main.locator('thead th');
        this.rows = this.main.locator('tbody tr');
        this.deleteDialog = page.getByRole('alertdialog');
        this.cancelDelete_btn = this.deleteDialog.getByRole('button', { name: 'تراجع' });
        this.confirmDelete_btn = this.deleteDialog.getByRole('button', { name: 'حذف', exact: true });
        this.save_btn = this.main.getByRole('button', { name: 'حفظ التغييرات' });
        this.next_btn = this.main.getByRole('button', { name: 'التالي' });
        this.subscriptionData_btn = this.main.getByRole('button', { name: 'بيانات الاشتراك' });
        this.subscriptionStatus_cmb = this.main.getByRole('combobox').filter({ hasText: 'نشط' });
        this.cancelledOption = page.getByRole('option', { name: 'ملغي', exact: true });
        this.name_tb = this.main.locator('#name-input');
        this.email_tb = this.main.locator('#email-input');
        this.password_tb = this.main.locator('#password-password');
        this.confirmPassword_tb = this.main.locator('#confirmPassword-password');
        this.subscriptionFilter_cmb = this.main.getByRole('combobox').filter({ hasText: 'حالة الاشتراك' });
    }

    //===================Methods===================
    //-------------------فتح الصفحات-------------------
    // بيفتح إدارة العملاء من القايمة الجانبية (الحماية بتتركب الأول)
    async open() {
        await protectCustomers(this.page);
        await this.page.goto(paths.adminHomePath);
        await this.customers_lnk.click();
        await expect(this.page).toHaveURL(new RegExp(paths.adminCustomersPath));
        await expect(this.rows.first()).toBeVisible();
    }

    // بيفتح تاب العملاء المحتملين
    async openLeads() {
        await this.leadsTab_btn.click();
        await expect(this.page).toHaveURL(/type=potential/);
        await expect(this.rows.first()).toBeVisible();
    }

    // بيفتح فورم إضافة عميل جديد (من غير حفظ)
    async openAddForm() {
        await this.addCustomer_btn.click();
        await expect(this.page).toHaveURL(new RegExp(paths.adminCreateCustomerPath));
    }

    //-------------------بحث وفلتر-------------------
    // بيدوّر على عميل باسمه
    async search(text: string) {
        await this.search_tb.fill(text);
        await this.page.waitForResponse(r => r.url().includes('/admin/merchants/') && r.url().includes('search='));
    }

    // بيختار اختيار من فلتر
    async chooseFilter(filterName: string, option: string) {
        await this.main.getByRole('combobox').filter({ hasText: filterName }).click();
        await this.page.getByRole('option', { name: option }).click();
        await this.page.waitForResponse(r => r.url().includes('/admin/merchants/active/?'));
        await this.page.waitForTimeout(500);       // الجدول بيرسم الصفوف الجديدة
    }

    // خلية من الصف الأول (رقم العمود من 1)
    async firstRowCell(column: number) {
        return (await this.rows.first().locator('td').nth(column - 1).innerText()).trim();
    }

    // زرار في الصف الأول (عرض التفاصيل / تعديل بيانات العميل / حذف العميل)
    firstRowButton(name: string): Locator {
        return this.rows.first().getByRole('button', { name, exact: true });
    }

    //-------------------locators فيها قيمة بتتبعت-------------------
    header(column: string): Locator {
        return this.headers.filter({ hasText: column });
    }

    row(name: string): Locator {
        return this.rows.filter({ hasText: name });
    }

    text(text: string): Locator {
        return this.main.getByText(text);
    }

    step(name: string): Locator {
        return this.main.getByText(name, { exact: true }).first();
    }

    toast(text: string): Locator {
        return this.page.getByText(text);
    }

    section(name: string): Locator {
        return this.main.getByRole('button', { name });
    }

    option(name: string): Locator {
        return this.page.getByRole('option', { name, exact: true });
    }

    field(selector: string): Locator {
        return this.main.locator(selector);
    }

    // بيدوس على "عرض التفاصيل" في صف
    async viewDetails(row: Locator) {
        await row.getByRole('button', { name: 'عرض التفاصيل' }).click();
    }

    //-------------------عميل التست (التغيير مسموح عليه هو بس)-------------------
    // بيلاقي عميل التست ويسمح بالتغيير عليه هو بس (بالـ id بتاعه)
    async openTestCustomer(name: string): Promise<Locator> {
        await this.open();
        await this.search(name);
        const row = this.rows.filter({ hasText: name });
        await expect(row).toHaveCount(1);
        allowed.id = (await row.locator('td').first().innerText()).replace('#', '').trim();
        return row;
    }

    // بيدوس زرار ويرجّع رد السيرفر (أي طلب مش GET)
    async clickAndWaitForServer(button: Locator) {
        const answer = this.page.waitForResponse(r => r.url().includes('/api/v2/admin/') && r.request().method() !== 'GET', { timeout: 15000 });
        await button.click();
        return await answer;
    }

    // الأدمن مود: أيقونة "فتح لوحة تحكم التاجر"
    async openAdminMode(name: string) {
        const row = await this.openTestCustomer(name);
        return await this.clickAndWaitForServer(row.getByRole('button', { name: 'فتح لوحة تحكم التاجر' }));
    }

    // بيعدّل خانة ويحفظ
    async editTestCustomer(name: string, field: string, value: string) {
        const row = await this.openTestCustomer(name);
        await row.getByRole('button', { name: 'تعديل بيانات العميل' }).click();
        await this.main.locator(field).fill(value);
        return await this.clickAndWaitForServer(this.save_btn);
    }

    // بيلغي الاشتراك
    async cancelTestSubscription(name: string) {
        const row = await this.openTestCustomer(name);
        await row.getByRole('button', { name: 'تعديل بيانات العميل' }).click();
        await this.subscriptionData_btn.click();
        await this.subscriptionStatus_cmb.click();
        await this.cancelledOption.click();
        return await this.clickAndWaitForServer(this.save_btn);
    }

    // بيمسح العميل
    async deleteTestCustomer(name: string) {
        const row = await this.openTestCustomer(name);
        await row.getByRole('button', { name: 'حذف العميل' }).click();
        return await this.clickAndWaitForServer(this.confirmDelete_btn);
    }

    // الـ switch بتاع لوحة التاجر في صف العميل
    dashboardSwitch(row: Locator): Locator {
        return row.getByRole('switch', { name: 'تفعيل لوحة التاجر' });
    }

    async clickTestDashboardSwitch(name: string) {
        const row = await this.openTestCustomer(name);
        await this.dashboardSwitch(row).click();
        await this.page.waitForTimeout(2000);
    }

    //-------------------Assertions-------------------
    // بيدوس "التالي" ويتأكد إن الفورم لسه في بيانات الحساب
    async assertNextDoesNotMove() {
        await this.next_btn.click();
        await expect(this.name_tb).toBeVisible();
        await expect(this.page).toHaveURL(new RegExp(paths.adminCreateCustomerPath));
    }

    // كل صفوف العمود فيها النص ده
    async assertColumnHas(column: number, text: string) {
        const cells = await this.rows.locator(`td:nth-child(${column})`).allInnerTexts();
        expect(cells.length, 'the filter must show at least one customer').toBeGreaterThan(0);
        for (const cell of cells) expect(cell).toContain(text);
    }
}
