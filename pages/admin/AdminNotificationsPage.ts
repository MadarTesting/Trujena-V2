import { expect, type Locator, type Page } from '@playwright/test';
import { protectCustomers, allowed } from '../../utils/customerGuard';

// admin > إدارة الإشعارات
export class AdminNotificationsPage {
    //===================Locators===================
    readonly page: Page;
    readonly notifications_lnk: Locator;
    readonly add_btn: Locator;
    readonly search_tb: Locator;
    readonly typeFilter_cmb: Locator;
    readonly headers: Locator;
    readonly rows: Locator;
    readonly recipients_btn: Locator;
    readonly recipientSearch_tb: Locator;
    readonly title_tb: Locator;
    readonly content_tb: Locator;
    readonly send_btn: Locator;
    readonly confirmDelete_btn: Locator;
    readonly sent_msg: Locator;

    //===================Variables===================
    // SEEN on stg: "تم الإرسال بنجاح" (الريكوايرمنت بتقول "تم ارسال الاشعار بنجاح")
    readonly sentMessageText: string = 'تم الإرسال بنجاح';

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.notifications_lnk = page.getByRole('link', { name: 'إدارة الإشعارات' }).filter({ visible: true }).first();
        this.add_btn = page.locator('main').getByRole('button', { name: /إضافة إشعار/ });
        this.search_tb = page.locator('#notification-search');
        this.typeFilter_cmb = page.locator('main').getByRole('combobox').filter({ hasText: 'نوع المستلمين' });
        this.headers = page.locator('main thead th');
        this.rows = page.locator('main tbody tr');
        this.recipients_btn = page.locator('main').getByText('اختر المستلمين');
        this.recipientSearch_tb = page.getByPlaceholder('ابحث عن مستلم');
        this.title_tb = page.locator('#title-input');
        this.content_tb = page.locator('#content-textarea');
        this.send_btn = page.getByRole('button', { name: 'Submit notification' });   // SEEN on stg: aria-label is English
        this.confirmDelete_btn = page.getByRole('alertdialog').getByRole('button', { name: 'حذف', exact: true });
        this.sent_msg = page.getByText(this.sentMessageText);
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيفتح إدارة الإشعارات من القايمة الجانبية (والحماية متركبة: مفيش تغيير غير على إشعار التست)
    async open() {
        await protectCustomers(this.page);
        await this.page.goto('/home');
        await this.notifications_lnk.click();
        await expect(this.rows.first()).toBeVisible();
    }

    // بيدوّر بعنوان الإشعار
    async search(title: string) {
        const answer = this.page.waitForResponse(r => r.url().includes('search='));
        await this.search_tb.fill(title);
        await answer;                                         // the table is refreshed
        await expect(this.rows.first()).toContainText(title);
    }

    // بيفلتر بنوع المستلمين
    async filterByType(type: string) {
        await this.typeFilter_cmb.click();
        await this.page.getByRole('option', { name: type, exact: true }).click();
        await this.page.waitForTimeout(2000);
    }

    // بيفتح إشعار التست في الجدول ويسمح بالتغيير عليه هو بس
    async openNotification(title: string) {
        await this.open();
        await this.search(title);
        allowed.id = await this.getNumber();
    }

    // رقم أول إشعار في الجدول
    async getNumber() {
        return (await this.rows.first().locator('td').first().innerText()).trim();
    }

    // بيدوس أيقونة في أول صف (عرض الإشعار / إعادة إرسال / نسخ الإشعار / حذف الإشعار)
    async clickIcon(icon: string) {
        await this.rows.first().getByRole('button', { name: icon, exact: true }).click();
    }

    // بيملى فورم إشعار جديد
    async fillNotification(data: { type: string; recipient: string; title: string; content: string }) {
        await this.add_btn.click();
        await this.page.locator('main label').filter({ hasText: new RegExp(`^${data.type}$`) }).click();
        await this.recipients_btn.click();
        await this.recipientSearch_tb.fill(data.recipient);
        await this.page.locator('span[role="button"]').filter({ hasText: data.recipient }).first().click();
        await this.page.keyboard.press('Escape');
        await this.title_tb.fill(data.title);
        await this.content_tb.fill(data.content);
    }

    // بيدوس زرار ويرجّع رد السيرفر (مسموح بإضافة إشعار جديد هنا بس)
    async clickAndGetResponse(button: Locator) {
        allowed.create = true;
        const answer = this.page.waitForResponse(r => r.url().includes('/api/v2/admin/') && r.request().method() !== 'GET');
        await button.click();
        const response = await answer;
        allowed.create = false;
        return response;
    }

    // بيفتح الصفحة ويملى الفورم ويبعت
    async sendNotification(data: { type: string; recipient: string; title: string; content: string }) {
        await this.open();
        await this.fillNotification(data);
        return await this.clickAndGetResponse(this.send_btn);
    }

    // بيعيد إرسال إشعار التست
    async resendNotification(title: string) {
        await this.openNotification(title);
        return await this.clickAndGetResponse(this.rows.first().getByRole('button', { name: 'إعادة إرسال', exact: true }));
    }

    // بيمسح إشعار التست (أول واحد بالعنوان ده)
    async deleteNotification(title: string) {
        await this.openNotification(title);
        await this.clickIcon('حذف الإشعار');
        return await this.clickAndGetResponse(this.confirmDelete_btn);
    }

    //-------------------Assertions-------------------
    async assertSent() {
        await expect(this.sent_msg).toBeVisible();
    }

    async assertColumn(column: string) {
        await expect(this.headers.filter({ hasText: column })).toHaveCount(1);
    }

    async assertIcon(icon: string) {
        await expect(this.rows.first().getByRole('button', { name: icon, exact: true })).toBeVisible();
    }

    // كل الصفوف من نوع المستلمين ده
    async assertOnlyType(type: string) {
        for (const cell of await this.rows.locator('td:nth-child(2)').allInnerTexts()) {
            expect(cell.trim()).toBe(type);
        }
    }

    // الإشعار مش موجود في الجدول
    async assertNotInTable(title: string) {
        await this.open();
        await this.search_tb.fill(title);
        await expect(this.rows.filter({ hasText: title })).toHaveCount(0);
    }
}
