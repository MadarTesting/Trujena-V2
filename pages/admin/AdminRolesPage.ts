import { expect, type Locator, type Page } from '@playwright/test';
import { protectCustomers, allowed } from '../../utils/customerGuard';

// admin > الأدوار والصلاحيات
export class AdminRolesPage {
    //===================Locators===================
    readonly page: Page;
    readonly roles_lnk: Locator;
    readonly main: Locator;
    readonly headers: Locator;
    readonly rows: Locator;
    readonly add_btn: Locator;
    readonly name_tb: Locator;
    readonly AddRole_btn: Locator;
    readonly SaveChanges_btn: Locator;
    readonly confirmDelete_btn: Locator;
    readonly deleteDialog: Locator;
    readonly toast: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.roles_lnk = page.getByRole('link', { name: 'الأدوار والصلاحيات' }).filter({ visible: true }).first();
        this.main = page.locator('main');
        this.headers = page.locator('main thead th');
        this.rows = page.locator('main tbody tr').filter({ visible: true });
        this.add_btn = page.getByRole('button', { name: 'إضافة دور جديد' });
        this.name_tb = page.locator('#name-input');
        this.AddRole_btn = page.getByRole('button', { name: 'إضافة الدور' });
        this.SaveChanges_btn = page.getByRole('button', { name: 'حفظ التغييرات' });
        this.deleteDialog = page.getByRole('alertdialog');
        this.confirmDelete_btn = this.deleteDialog.getByRole('button', { name: 'حذف', exact: true });
        this.toast = page.locator('[data-sonner-toast]').last();
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيفتح الأدوار والصلاحيات من القايمة الجانبية (والحماية متركبة: مفيش تغيير غير على دور التست)
    async open() {
        await protectCustomers(this.page);
        await this.page.goto('/home');
        await this.roles_lnk.click();
        await expect(this.rows.first()).toBeVisible();
    }

    // بيفتح فورم إضافة دور جديد
    async openAddForm() {
        await this.open();
        await this.add_btn.click();
        await expect(this.name_tb).toBeVisible();
    }

    // بيملى الفورم: الاسم والحالة والصلاحية
    async fillRole(name: string, status: string, permission: string) {
        await this.name_tb.fill(name);
        await this.chooseStatus(status);
        await this.permission(permission).click();
    }

    // بيختار الحالة (نشط / غير نشط)
    async chooseStatus(status: string) {
        await this.main.locator('label').filter({ hasText: new RegExp(`^${status}$`) }).click();
    }

    // checkbox الصلاحية
    permission(name: string): Locator {
        return this.main.getByRole('checkbox', { name });
    }

    // بيدوس زرار ويرجّع رد السيرفر (مسموح بإضافة دور جديد هنا بس)
    async clickAndGetResponse(button: Locator) {
        allowed.create = true;
        const answer = this.page.waitForResponse(r => r.url().includes('/roles/') && r.request().method() !== 'GET');
        await button.click();
        const response = await answer;
        allowed.create = false;
        return response;
    }

    // بيضيف دور جديد
    async addRole(name: string, status: string, permission: string) {
        await this.openAddForm();
        await this.fillRole(name, status, permission);
        return await this.clickAndGetResponse(this.AddRole_btn);
    }

    // بيفتح صفحة تعديل دور التست ويسمح بالتغيير عليه هو بس
    async openEdit(name: string) {
        await this.open();
        await this.rowButton(name, 'تعديل').click();
        await expect(this.SaveChanges_btn).toBeVisible();
        allowed.id = new URL(this.page.url()).searchParams.get('id') ?? '';
    }

    // زرار في صف الدور (تعديل / حذف)
    rowButton(name: string, action: string): Locator {
        return this.main.getByRole('button', { name: `${action} دور ${name}`, exact: true }).first();
    }

    // بيمسح دور التست
    async deleteRole(name: string) {
        await this.openEdit(name);                    // عشان ياخد الـ id ويسمح بيه بس
        await this.open();
        await this.rowButton(name, 'حذف').click();
        return await this.clickAndGetResponse(this.confirmDelete_btn);
    }

    // السيرفر يرجع error في الحفظ (من غير ما حاجة تتحفظ)
    async makeSaveFail() {
        await this.page.route('**/api/v2/admin/roles/**', route =>
            route.request().method() === 'GET' ? route.continue() : route.fulfill({ status: 500, body: '{}' }));
    }

    //-------------------Assertions-------------------
    async assertColumn(column: string) {
        await expect(this.headers.filter({ hasText: column })).toHaveCount(1);
    }

    // صف الدور في الجدول وفيه الحالة دي
    async assertRole(name: string, status: string) {
        const row = this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
        await expect(row).toHaveCount(1);
        await expect(row).toContainText(status);
    }

    async assertNotInTable(name: string) {
        await expect(this.main.getByText(name, { exact: true })).toHaveCount(0);
    }

    async assertMessage(text: string) {
        await expect(this.page.getByText(text)).toBeVisible();
    }
}
