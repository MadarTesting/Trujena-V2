import { expect, type Locator, type Page } from '@playwright/test';
import paths from '../../testData/paths';
import actions from '../../testData/actions';
import statuses from '../../testData/statuses';
import { protectCustomers, allowed } from '../../utils/customerGuard';

// admin > إدارة الطلبات (the list) + تفاصيل الطلب (the request page)
// صفحة الطلبات وتفاصيل الطلب عند الأدمن
export class AdminRequestPage {
    //===================Locators===================
    readonly page: Page;
    readonly search_tb: Locator;
    readonly requestRows: Locator;
    readonly headers: Locator;
    readonly status_lbl: Locator;
    readonly nextStage_btns: Locator;
    readonly reject_btn: Locator;
    readonly rejectReason_tb: Locator;
    readonly confirmReject_btn: Locator;
    readonly cancelReject_btn: Locator;
    readonly build_file: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg
        this.search_tb = page.getByPlaceholder('البحث برقم الطلب أو اسم العميل').filter({ visible: true });
        this.requestRows = page.locator('main table tbody tr');
        this.headers = page.locator('main table thead th');
        this.status_lbl = page.locator('main').getByText('حالة الطلب الحالية:').locator('..');
        this.nextStage_btns = page.locator('main').getByRole('button', { name: /الانتقال إلى/ });
        this.reject_btn = page.locator('main').getByRole('button', { name: actions.reject });
        this.rejectReason_tb = page.locator('[role="dialog"] textarea');
        this.confirmReject_btn = page.locator('[role="dialog"]').getByRole('button', { name: 'تأكيد رفض الطلب' });
        this.cancelReject_btn = page.locator('[role="dialog"]').getByRole('button', { name: 'إلغاء' });
        this.build_file = page.locator('main input[type="file"][accept*=".apk"]');
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيفتح صفحة الطلبات
    async open() {
        await this.page.goto(paths.adminRequestsPath);
        await expect(this.requestRows.first()).toBeVisible();
    }

    // search the request number, then click its "view" icon (the last button in the row)
    // بيفتح تفاصيل طلب من الجدول
    async openRequest(requestNumber: string) {
        await this.search_tb.fill(requestNumber);
        const row = this.requestRows.filter({ hasText: requestNumber });
        await expect(row).toHaveCount(1);
        await row.getByRole('button').last().click();
        await expect(this.page).toHaveURL(new RegExp(`/orders/${requestNumber}`));
    }

    // بيدوّر على الطلب برقمه ويفتحه
    async openRequestByNumber(requestNumber: string) {
        await this.open();
        await this.openRequest(requestNumber);
    }

    // بيفتح طلب التست من أيقونة العرض، والحماية متركبة: التغيير مسموح على الطلب ده بس
    async openTestRequest(requestNumber: string) {
        await protectCustomers(this.page);
        allowed.id = requestNumber;
        await this.openRequestByNumber(requestNumber);
    }

    // بيعمل reload كل شوية لحد ما الحالة تتغير (الحفظ والرفع بياخدوا وقت)
    async waitForStatus(statusText: string) {
        await this.page.waitForTimeout(5000);
        await expect(async () => {
            await this.refresh();
            await expect(this.status_lbl).toContainText(statusText, { timeout: 5000 });
        }).toPass({ timeout: 90000, intervals: [5000] });
    }

    // بيدوّر باسم العميل في الطلبات ويرجّع رقم الطلب بتاعه
    async findRequestNumber(customerName: string) {
        await this.open();
        await this.search(customerName);
        const row = this.requestRows.filter({ hasText: customerName });
        await expect(row).toHaveCount(1);
        return (await row.locator('td').first().innerText()).trim();
    }

    // بيكتب في البحث ويستنى النتيجة
    async search(text: string) {
        const answer = this.page.waitForResponse(r => r.url().includes('app-requests/?') && r.url().includes('search='));
        await this.search_tb.fill(text);
        await answer;
    }

    // بيفلتر بيوم في كالندر "تاريخ الطلب" (من اليوم ده لنفس اليوم)
    async filterByDay(day: string) {
        await this.page.locator('main button[data-slot="popover-trigger"]').click();
        const dayButton = this.page.locator('[role="grid"] button').filter({ hasText: new RegExp(`^${day}$`) }).first();
        const answer = this.page.waitForResponse(r => r.url().includes('app-requests/?'), { timeout: 15000 });
        await dayButton.click();
        await answer;
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);
    }

    // بيفلتر بحالة الطلب ويستنى النتيجة
    async filterByStatus(status: string) {
        await this.page.locator('main').getByRole('combobox').filter({ hasText: 'حالة الطلب' }).click();
        const answer = this.page.waitForResponse(r => r.url().includes('app-requests/?'));
        await this.page.getByRole('option', { name: status, exact: true }).click();
        await answer;
        await this.page.waitForTimeout(500);       // the table draws the new rows
    }

    // بيعمل reload للصفحة
    async refresh() {
        await this.page.reload();
    }

    // click a "next stage" button by its text (texts are in testData/actions.ts)
    // بيدوس زرار المرحلة اللي بعدها
    async goToNextStage(buttonText: string) {
        await this.page.locator('main').getByRole('button', { name: buttonText, exact: true }).click();
    }

    // بيرفض الطلب ويكتب السبب
    async reject(reason: string) {
        await this.reject_btn.click();
        await this.rejectReason_tb.fill(reason);
        await this.confirmReject_btn.click();
    }

    // upload the APK/AAB and move to "جاهز للمراجعة"
    // بيرفع ملف التطبيق ويبعته للمراجعة
    async uploadBuildAndSendToReview(filePath: string) {
        await this.build_file.setInputFiles(filePath);
        await this.goToNextStage(actions.uploadAndReady);
    }

    // read the current status of the open request (one of the names in testData/statuses.ts)
    // بيرجّع حالة الطلب الحالية
    async getStatus(): Promise<string> {
        await expect(this.status_lbl).toBeVisible();
        const text = await this.status_lbl.innerText();
        const found = Object.values(statuses.admin).find(status => text.includes(status));
        if (!found) throw new Error(`unknown request status: "${text}"`);
        return found;
    }

    // SEEN on stg: after the merchant asks for an edit, the request page shows "ملاحظات العميل"
    // بيشوف التاجر طلب تعديل قبل كده ولا لأ
    async hasEditRequest(): Promise<boolean> {
        return (await this.page.locator('main').getByText('ملاحظات العميل', { exact: true }).count()) > 0;
    }

    //-------------------Assertions-------------------
    // بيتأكد من حالة الطلب
    async assertStatus(statusText: string) {
        await expect(this.status_lbl).toContainText(statusText);
    }

    // statuses move in order: only ONE next stage button is shown
    // بيتأكد إن زرار المرحلة الجاية بس هو اللي ظاهر
    async assertOnlyNextStage(buttonText: string) {
        await expect(this.nextStage_btns).toHaveCount(1);
        await expect(this.nextStage_btns).toHaveText(buttonText);
    }

    // BA answer: reject is allowed only from "قيد المراجعة"
    // بيتأكد إن زرار الرفض مش ظاهر
    async assertRejectHidden() {
        await expect(this.reject_btn).toHaveCount(0);
    }

    // بيتأكد إن زرار الرفض ظاهر
    async assertRejectVisible() {
        await expect(this.reject_btn).toBeVisible();
    }
}
