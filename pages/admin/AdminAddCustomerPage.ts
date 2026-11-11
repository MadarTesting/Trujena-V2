import { expect, type Locator, type Page } from '@playwright/test';
import paths from '../../testData/paths';
import { protectCustomers, allowed } from '../../utils/customerGuard';

// فورم إضافة عميل جديد عند الأدمن (3 خطوات: الحساب / المتجر / الاشتراك)
export class AdminAddCustomerPage {
    //===================Locators===================
    readonly page: Page;
    readonly main: Locator;
    readonly name_tb: Locator;
    readonly email_tb: Locator;
    readonly storeName_tb: Locator;
    readonly whatsapp_tb: Locator;
    readonly password_tb: Locator;
    readonly confirmPassword_tb: Locator;
    readonly storeLink_tb: Locator;
    readonly logo_file: Locator;
    readonly next_btn: Locator;
    readonly add_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.main = page.locator('main');
        // خطوة 1: بيانات الحساب
        this.name_tb = this.main.locator('#name-input');
        this.email_tb = this.main.locator('#email-input');
        this.storeName_tb = this.main.locator('#storeName-input');
        this.whatsapp_tb = this.main.locator('#whatsapp-tel');
        this.password_tb = this.main.locator('#password-password');
        this.confirmPassword_tb = this.main.locator('#confirmPassword-password');
        // خطوة 2: بيانات المتجر
        this.storeLink_tb = this.main.locator('#storeLink-input');
        this.logo_file = this.main.locator('input[type="file"]');
        // الأزرار
        this.next_btn = this.main.getByRole('button', { name: 'التالي' });
        this.add_btn = this.main.getByRole('button', { name: 'إضافة العميل' });
    }

    //===================Methods===================
    // بيفتح فورم الإضافة (والحماية متركبة)
    async open() {
        await protectCustomers(this.page);
        await this.page.goto(paths.adminCreateCustomerPath);
        await expect(this.name_tb).toBeVisible();
    }

    // خطوة 1: بيملى بيانات الحساب ويدوس التالي
    async fillAccount(customer: { name: string; email: string; storeName: string; whatsapp: string; password: string }) {
        await this.name_tb.fill(customer.name);
        await this.email_tb.fill(customer.email);
        await this.storeName_tb.fill(customer.storeName);
        await this.whatsapp_tb.fill(customer.whatsapp);
        await this.password_tb.fill(customer.password);
        await this.confirmPassword_tb.fill(customer.password);
        await this.main.getByText('نشط', { exact: true }).click();
        await this.next_btn.click();
        await expect(this.storeLink_tb).toBeVisible();
    }

    // خطوة 2: بيملى رابط المتجر والشعار ويدوس التالي
    async fillStore(customer: { storeLink: string; logo: string }) {
        await this.storeLink_tb.fill(customer.storeLink);
        await this.logo_file.setInputFiles(customer.logo);
        await this.next_btn.click();
        await expect(this.add_btn).toBeVisible();
    }

    // خطوة 3: بيختار خطة الاشتراك ويدوس "إضافة العميل" ويستنى السيرفر
    async addWithPlan(plan: string) {
        await this.main.getByRole('combobox').filter({ hasText: 'اختر خطة الاشتراك' }).click();
        await this.page.getByRole('option', { name: plan, exact: true }).click();
        const answer = this.page.waitForResponse(r => r.url().includes('/api/v2/admin/') && r.request().method() === 'POST', { timeout: 60000 });
        await this.add_btn.click();
        return await answer;
    }

    // بيضيف عميل جديد كامل (الـ 3 خطوات) ويرجّع رد السيرفر
    async addCustomer(customer: { name: string; email: string; storeName: string; whatsapp: string; password: string; storeLink: string; logo: string; plan: string }) {
        allowed.create = true;                  // مسموح بإضافة عميل جديد هنا بس
        try {
            await this.open();
            await this.fillAccount(customer);
            await this.fillStore(customer);
            return await this.addWithPlan(customer.plan);
        } finally {
            allowed.create = false;
        }
    }
}
