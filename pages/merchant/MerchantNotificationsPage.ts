import { expect, type Locator, type Page, type Response } from '@playwright/test';
import paths from '../../testData/paths';

// merchant > إدارة الإشعارات (push notifications to the users of the merchant app)
// list tabs: الإشعارات المرسله / المسودات + create page (/notification-management/create-notification)
// صفحة إدارة الإشعارات عند التاجر
export class MerchantNotificationsPage {
    //===================Locators===================
    readonly page: Page;
    readonly main: Locator;
    readonly notifications_lnk: Locator;
    readonly toast: Locator;
    // list
    readonly addNotification_btn: Locator;
    readonly rows: Locator;
    readonly emptyList_msg: Locator;
    readonly draftsAutoDelete_msg: Locator;
    // create / edit page
    readonly title_tb: Locator;
    readonly message_tb: Locator;
    readonly image_file: Locator;
    readonly destination_tb: Locator;
    readonly SaveDraft_btn: Locator;
    readonly Send_btn: Locator;
    readonly fourHoursRule_msg: Locator;
    readonly preview: Locator;

    //===================Variables===================
    readonly tabs = {
        sent: 'الإشعارات المرسله',      // SEEN on stg (written "المرسله" on the website)
        drafts: 'المسودات',
    };

    readonly validity = {
        day: '24 ساعة',
        threeDays: '3 أيام',
        week: '7 أيام',
    };

    readonly texts = {
        fourHoursRule: 'يمكن ارسال اشعار واحد كل 4 ساعات كحد ادني',
        draftsAutoDelete: 'تُحذف المسودات تلقائيًا بعد 30 يومًا من آخر تحديث',
        emptyList: 'لا توجد بيانات متاحة',
    };

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg: the phone preview has its own <main>, so we use the main of the page only
        this.main = page.locator('main[data-slot="sidebar-inset"]');
        this.notifications_lnk = page.getByRole('link', { name: 'إدارة الإشعارات' }).filter({ visible: true }).first();
        this.toast = page.locator('[data-sonner-toast]').last();

        this.addNotification_btn = this.main.getByRole('button', { name: 'إضافة اشعار جديد' });
        this.rows = this.main.locator('table tbody tr');
        this.emptyList_msg = this.main.getByText(this.texts.emptyList);
        this.draftsAutoDelete_msg = this.main.getByText(this.texts.draftsAutoDelete);

        this.title_tb = this.main.locator('#title-input');
        this.message_tb = this.main.locator('#message-input');
        this.image_file = this.main.locator('input[type="file"]');
        this.destination_tb = this.main.locator('input[name="destination"]');
        this.SaveDraft_btn = this.main.getByRole('button', { name: 'حفظ كمسودة' });
        this.Send_btn = this.main.getByRole('button', { name: 'إرسال الإشعار' });
        this.fourHoursRule_msg = this.main.getByText(this.texts.fourHoursRule);
        // the live preview box ("معاينة مباشرة")
        this.preview = this.main.locator('div').filter({ has: page.getByText('معاينة مباشرة', { exact: true }) }).last();
    }

    //===================Methods===================
    //-------------------Locators with a value-------------------
    // صف إشعار في الجدول بعنوانه
    row(title: string): Locator {
        return this.rows.filter({ hasText: title });
    }

    // SEEN on stg: the row buttons have NO name (no aria-label), only icons:
    // drafts: [edit (blue pen) , delete (red trash)]
    // زرار تعديل الإشعار
    rowEditButton(title: string): Locator {
        return this.row(title).locator('button').first();
    }

    // زرار مسح الإشعار
    rowDeleteButton(title: string): Locator {
        return this.row(title).locator('button:has(svg[class*="text-red"])');
    }

    //-------------------Actions-------------------
    // from the dashboard: click "إدارة الإشعارات" in the side bar
    // بيفتح صفحة الإشعارات
    async open() {
        await this.page.goto(paths.merchantHomePath);
        await this.notifications_lnk.click();
        await expect(this.page).toHaveURL(new RegExp(`${paths.notificationsPath}$`));
        await expect(this.addNotification_btn).toBeVisible();
    }

    // بيفتح تاب (المرسلة / المسودات)
    async openTab(tabName: string) {
        await this.main.getByRole('button', { name: tabName, exact: true }).click();
    }

    // بيدوس "إضافة إشعار جديد"
    async startNewNotification() {
        await this.addNotification_btn.click();
        await expect(this.page).toHaveURL(new RegExp(paths.createNotificationPath));
        await expect(this.title_tb).toBeVisible();
    }

    // بيملى بيانات الإشعار
    async fillNotification(data: { title: string; message: string; image?: string; destination: string; validity: string }) {
        await this.title_tb.fill(data.title);
        await this.message_tb.fill(data.message);
        if (data.image) await this.image_file.setInputFiles(data.image);
        await this.destination_tb.fill(data.destination);
        await this.main.getByRole('radio', { name: data.validity }).check({ force: true });
    }

    // click a button and wait for the server to answer (any request that is not GET)
    // SEEN on stg: without image the answer comes in less than 1s, WITH image it can take 10s to 60s
    // بيدوس زرار ويستنى رد السيرفر
    async clickAndWaitForServer(button: Locator, timeout = 15000): Promise<Response> {
        const answer = this.page.waitForResponse(response =>
            response.url().includes('/push-notifications') && response.request().method() !== 'GET', { timeout });
        await button.click();
        return await answer.catch(async () => {
            const errors = await this.main.getByRole('alert').allInnerTexts();
            throw new Error(`no answer from the server in ${timeout / 1000}s. Errors on the page: ${JSON.stringify(errors)}`);
        });
    }

    // open a draft from the drafts list (edit mode, the form has the saved data)
    // بيفتح مسودة للتعديل
    async openDraft(title: string) {
        await this.openTab(this.tabs.drafts);
        await this.rowEditButton(title).click();
        await expect(this.page).toHaveURL(/notification-details\/.+mode=edit/);
        await expect(this.title_tb).toHaveValue(title);
    }

    // بيحفظ كمسودة ويتأكد إن الحفظ نجح
    async saveDraft(timeout = 15000) {
        const response = await this.clickAndWaitForServer(this.SaveDraft_btn, timeout);
        if (!response.ok()) throw new Error(`save draft failed with status ${response.status()}: ${await response.text()}`);
        return response;
    }

    // IMPORTANT: this SENDS a real push notification to all the users of the app (max 1 every 4 hours)
    // بيدوس "إرسال الإشعار"
    async send(): Promise<Response> {
        return await this.clickAndWaitForServer(this.Send_btn);
    }

    //-------------------Assertions-------------------
    // بيتأكد إن الإشعار موجود في التاب
    async assertInList(tabName: string, title: string, validity: string) {
        await this.openTab(tabName);
        await expect(this.row(title)).toHaveCount(1);
        await expect(this.row(title)).toContainText(validity);
    }

    // بيتأكد إن الإشعار مش موجود في التاب
    async assertNotInList(tabName: string, title: string) {
        await this.openTab(tabName);
        await expect(this.row(title)).toHaveCount(0);
    }

    // the preview shows the title and the text while typing (requirement step 4)
    // بيتأكد من المعاينة
    async assertPreview(title: string, message: string) {
        await expect(this.preview).toContainText(title);
        await expect(this.preview).toContainText(message);
    }

    // بيتأكد من رسالة الخطأ تحت الخانة
    async assertFieldError(message: string) {
        await expect(this.main.getByRole('alert').filter({ hasText: message }).first()).toBeVisible();
    }

    // بيتأكد إن زرار الإرسال مقفول
    async assertSendDisabled() {
        await expect(this.Send_btn).toBeDisabled();
    }

    // بيتأكد إن زرار الإرسال شغال
    async assertSendEnabled() {
        await expect(this.Send_btn).toBeEnabled();
    }
}
