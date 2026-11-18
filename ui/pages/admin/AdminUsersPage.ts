import { expect, type Locator, type Page } from '@playwright/test';
import { protectCustomers, allowed } from '../../../utils/customerGuard';

// مستخدم التست: الاسم للبحث والإيميل لتحديد الصف
type TestUser = { name: string; email: string };

// admin > إدارة المستخدمين
export class AdminUsersPage {
    //===================Locators===================
    readonly page: Page;
    readonly users_lnk: Locator;
    readonly main: Locator;
    readonly search_tb: Locator;
    readonly headers: Locator;
    readonly rows: Locator;
    readonly add_btn: Locator;
    readonly name_tb: Locator;
    readonly email_tb: Locator;
    readonly password_tb: Locator;
    readonly confirmPassword_tb: Locator;
    readonly role_cmb: Locator;
    readonly AddUser_btn: Locator;
    readonly SaveChanges_btn: Locator;
    readonly changePassword_btn: Locator;
    readonly newPassword_tb: Locator;
    readonly dialog: Locator;
    readonly cancel_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.users_lnk = page.getByRole('link', { name: 'إدارة المستخدمين' }).filter({ visible: true }).first();
        this.main = page.locator('main');
        this.search_tb = page.locator('#user-search');
        this.headers = page.locator('main thead th');
        this.rows = page.locator('main tbody tr').filter({ visible: true });
        this.add_btn = page.getByRole('button', { name: 'إضافة مستخدم جديد' });
        this.name_tb = page.locator('#name-input');
        this.email_tb = page.locator('#email-input');
        this.password_tb = page.locator('#password-password');
        this.confirmPassword_tb = page.locator('#confirmPassword-password');
        this.role_cmb = this.main.locator('form').getByRole('combobox');
        this.AddUser_btn = page.getByRole('button', { name: 'إضافة المستخدم' });
        this.SaveChanges_btn = page.getByRole('button', { name: 'حفظ التغييرات' });
        this.changePassword_btn = this.main.getByRole('button', { name: 'تغيير كلمة المرور' });
        this.newPassword_tb = page.locator('#newPassword-password');
        this.dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
        this.cancel_btn = this.dialog.getByRole('button', { name: 'تراجع' });
    }

    //===================Methods===================
    text(text: string): Locator {
        return this.page.getByText(text);
    }

    //-------------------Actions-------------------
    // بيفتح إدارة المستخدمين من القايمة الجانبية (والحماية متركبة: مفيش تغيير غير على مستخدم التست)
    async open() {
        await protectCustomers(this.page);
        await this.page.goto('/home');
        await this.users_lnk.click();
        await expect(this.search_tb).toBeVisible();
    }

    // بيدوّر بالاسم (البحث في الصفحة بالاسم بس)
    async search(text: string) {
        await this.search_tb.fill(text);
        await this.page.waitForTimeout(2500);
    }

    // بيفلتر (دور المستخدم / الحالة)
    async filter(filterId: string, option: string) {
        await this.page.locator(`#${filterId}`).click();
        await this.page.getByRole('option', { name: option, exact: true }).click();
        await this.page.waitForTimeout(2500);
    }

    // صف المستخدم (بالإيميل)
    row(email: string): Locator {
        return this.rows.filter({ hasText: email });
    }

    // بيفتح فورم إضافة مستخدم جديد
    async openAddForm() {
        await this.open();
        await this.add_btn.click();
        await expect(this.name_tb).toBeVisible();
    }

    // بيملى فورم الإضافة
    async fillUser(user: { name: string; email: string; password: string; role: string; status: string }) {
        await this.name_tb.fill(user.name);
        await this.email_tb.fill(user.email);
        await this.fillPassword(user.password, user.password);
        await this.chooseRole(user.role);
        await this.chooseStatus(user.status);
    }

    // بيكتب الباسورد والتأكيد
    async fillPassword(password: string, confirm: string) {
        await this.password_tb.fill(password);
        await this.confirmPassword_tb.fill(confirm);
        await this.name_tb.click();                              // عشان رسايل الباسورد تظهر
    }

    // بيختار الدور
    async chooseRole(role: string) {
        await this.role_cmb.click();
        await this.page.getByRole('option', { name: role, exact: true }).click();
    }

    // بيختار الحالة (نشط / غير نشط)
    async chooseStatus(status: string) {
        await this.main.locator('label').filter({ hasText: new RegExp(`^${status}$`) }).click();
    }

    // بيدوس زرار ويرجّع رد السيرفر (مسموح بإضافة مستخدم جديد هنا بس)
    async clickAndGetResponse(button: Locator) {
        allowed.create = true;
        const answer = this.page.waitForResponse(r => r.url().includes('/admin/users/') && r.request().method() !== 'GET');
        await button.click();
        const response = await answer;
        allowed.create = false;
        return response;
    }

    // بيضيف مستخدم جديد
    async addUser(user: { name: string; email: string; password: string; role: string; status: string }) {
        await this.openAddForm();
        await this.fillUser(user);
        return await this.clickAndGetResponse(this.AddUser_btn);
    }

    // بيدوّر على مستخدم التست (بالاسم) ويسمح بالتغيير عليه هو بس
    async findTestUser(user: TestUser) {
        await this.open();
        await this.search(user.name);
        await expect(this.row(user.email)).toHaveCount(1);
        allowed.id = (await this.row(user.email).locator('td').first().innerText()).trim();
    }

    // رقم مستخدم التست (الرقم التسلسلي)، وهو اللي بيتكتب في سجل النشاطات: "(المُعرّف: 105)"
    async getTestUserId(user: TestUser) {
        await this.findTestUser(user);
        return allowed.id.replace(/\D/g, '');
    }

    // بيفتح صفحة عرض مستخدم التست (بالضغط على اسمه)
    async openView(user: TestUser) {
        await this.findTestUser(user);
        await this.row(user.email).getByRole('button', { name: /^الاسم:/ }).click();
    }

    // بيفتح صفحة تعديل مستخدم التست
    async openEdit(user: TestUser) {
        await this.findTestUser(user);
        await this.row(user.email).getByRole('button', { name: 'تعديل المستخدم' }).click();
        await expect(this.SaveChanges_btn).toBeVisible();
    }

    // بيغيّر باسورد مستخدم التست
    async changePassword(user: TestUser, password: string) {
        await this.openEdit(user);
        await this.changePassword_btn.click();
        await this.newPassword_tb.fill(password);
        await this.dialog.locator('#confirmPassword-password').fill(password);
        return await this.clickAndGetResponse(this.dialog.getByRole('button', { name: 'تغيير كلمة المرور' }));
    }

    // بيفتح رسالة حذف مستخدم (من غير تأكيد)
    async clickDelete(email: string) {
        await this.row(email).getByRole('button', { name: 'حذف المستخدم' }).click();
        await expect(this.dialog).toBeVisible();
    }

    // بيمسح مستخدم التست
    async deleteUser(user: TestUser) {
        await this.findTestUser(user);
        await this.clickDelete(user.email);
        return await this.clickAndGetResponse(this.dialog.getByRole('button', { name: 'حذف', exact: true }));
    }

    // السيرفر يرجع error (الحفظ أو تحميل القايمة)
    async makeServerFail(method: 'GET' | 'SAVE') {
        await this.page.route('**/api/v2/admin/users/**', route => {
            const isGet = route.request().method() === 'GET';
            return (method === 'GET') === isGet ? route.fulfill({ status: 500, body: '{}' }) : route.continue();
        });
    }

    //-------------------Assertions-------------------
    async assertColumn(column: string) {
        await expect(this.headers.filter({ hasText: column })).toHaveCount(1);
    }

    // صف المستخدم فيه البيانات دي
    async assertUserRow(user: TestUser, texts: string[]) {
        await this.open();
        await this.search(user.name);
        for (const text of texts) {
            await expect(this.row(user.email)).toContainText(text);
        }
    }

    // كل الصفوف في العمود ده فيها القيمة دي
    async assertOnly(column: number, value: string) {
        for (const cell of await this.rows.locator(`td:nth-child(${column})`).allInnerTexts()) {
            expect(cell.trim()).toBe(value);
        }
    }

    async assertMessage(text: string) {
        await expect(this.page.getByText(text).first()).toBeVisible();
    }
}
