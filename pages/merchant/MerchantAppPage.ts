import { expect, type Locator, type Page } from '@playwright/test';
import paths from '../../testData/paths';

// merchant > إدارة التطبيق (the requests table + the request details page)
// صفحة إدارة التطبيق عند التاجر
export class MerchantAppPage {
    //===================Locators===================
    readonly page: Page;
    readonly createRequest_btn: Locator;
    readonly requestRows: Locator;
    readonly detailsStatus_lbl: Locator;
    readonly notifications_btn: Locator;
    readonly notificationsPanel: Locator;
    readonly supportAlert_msg: Locator;
    readonly googlePlay_lnk: Locator;
    readonly appStore_lnk: Locator;

    //===================Variables===================
    readonly supportAlertText: string = 'يمكنك التواصل مع الدعم الفني';   // from the SRS

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg
        this.createRequest_btn = page.locator('main').getByRole('button', { name: 'طلب إنشاء تطبيق' });
        this.requestRows = page.locator('main table tbody tr');
        this.detailsStatus_lbl = page.locator('main').getByText('حالة الطلب', { exact: true }).locator('..');
        this.notifications_btn = page.getByRole('button', { name: 'الإشعارات' }).filter({ visible: true });
        // SEEN on stg: the list has no role, it is the element right after the bell button
        this.notificationsPanel = this.notifications_btn.first().locator('xpath=following-sibling::*[1]');
        this.supportAlert_msg = page.getByText(this.supportAlertText);
        // SEEN on stg ("تم النشر"): the store links are BUTTONS, not <a> links
        this.googlePlay_lnk = page.locator('main').getByRole('button', { name: 'تحميل في Google Play' });
        this.appStore_lnk = page.locator('main').getByRole('button', { name: 'تحميل في App Store' });
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيفتح صفحة إدارة التطبيق
    async open() {
        await this.page.goto(paths.merchantAppPath);
        await expect(this.requestRows.first()).toBeVisible();
    }

    // the request number of the merchant (first row of the table)
    // بيقرا رقم الطلب من الجدول
    async getRequestNumber() {
        await this.open();
        const numberCell = this.requestRows.first().locator('td').nth(0);
        // wait until the real data is loaded (the first row can be an empty loading row)
        await expect(numberCell).toHaveText(/\S+/);
        return (await numberCell.innerText()).trim();
    }

    // click the "view" icon of the request
    // بيفتح تفاصيل الطلب
    async openRequestDetails(requestNumber: string) {
        await this.open();
        await this.requestRows.filter({ hasText: requestNumber })
            .getByRole('button', { name: 'view request details' }).click();
        await expect(this.page).toHaveURL(new RegExp(`${requestNumber}/details`));
    }

    // the store link of the merchant ("رابط المتجر" in the request details)
    // بيقرا لينك المتجر بتاع الطلب
    async getStoreLink(requestNumber: string): Promise<string> {
        await this.openRequestDetails(requestNumber);
        const storeLink = this.page.locator('main li').filter({ hasText: 'رابط المتجر' }).getByRole('link');
        const href = await storeLink.getAttribute('href');
        if (!href) throw new Error('the request has no store link');
        return href;
    }

    // بيفتح قايمة الإشعارات
    async openNotifications() {
        await this.notifications_btn.first().click();
    }

    //-------------------Assertions-------------------
    // the status in the table (column: الحالة الحالية)
    // بيتأكد من الحالة في الجدول
    async assertStatusInTable(requestNumber: string, statusText: string) {
        await this.open();
        const row = this.requestRows.filter({ hasText: requestNumber });
        await expect(row.locator('td').nth(3)).toContainText(statusText);
    }

    // the status inside the request details page (view icon)
    // بيتأكد من الحالة في صفحة التفاصيل
    async assertStatusInDetails(requestNumber: string, statusText: string) {
        await this.openRequestDetails(requestNumber);
        await expect(this.detailsStatus_lbl).toContainText(statusText);
    }

    // the table + the details page together
    // بيتأكد من الحالة في الجدول والتفاصيل
    async assertRequestStatus(requestNumber: string, statusText: string) {
        await this.assertStatusInTable(requestNumber, statusText);
        await this.assertStatusInDetails(requestNumber, statusText);
    }

    // NOT USED in the lifecycle tests: on stg no notifications arrive to the merchant,
    // so the status is checked from إدارة التطبيق (table + details) only
    // بيتأكد إن فيه إشعار جديد
    async assertNewNotification(text: string) {
        await this.page.reload();
        await this.openNotifications();
        await expect(this.notificationsPanel).toBeVisible();
        await expect(this.notificationsPanel, `merchant should get a notification with "${text}"`).toContainText(text);
        await this.page.keyboard.press('Escape');
    }

    // بيتأكد إن زرار طلب جديد مقفول
    async assertCreateRequestDisabled() {
        await this.open();
        await expect(this.createRequest_btn.filter({ visible: true })).toBeDisabled();
    }

    // بيتأكد من رسالة التواصل مع الدعم
    async assertSupportAlert(requestNumber: string) {
        await this.openRequestDetails(requestNumber);
        await expect(this.supportAlert_msg).toBeVisible();
    }

    // بيتأكد من روابط Google Play و App Store
    async assertStoreLinks(requestNumber: string, googlePlayUrl: string, appStoreUrl: string) {
        await this.assertStoreButtonOpens(requestNumber, this.googlePlay_lnk, googlePlayUrl);
        await this.assertStoreButtonOpens(requestNumber, this.appStore_lnk, appStoreUrl);
    }

    // click the store button and check the url it opens (new tab or same tab).
    // the store website is NOT really opened: the request is answered with an empty page
    private async assertStoreButtonOpens(requestNumber: string, storeButton: Locator, expectedUrl: string) {
        const context = this.page.context();
        const storeHost = new URL(expectedUrl).host;
        await context.route(url => url.host === storeHost, route => route.fulfill({ status: 200, body: 'store page' }));

        await this.openRequestDetails(requestNumber);
        const storeRequest = context.waitForEvent('request', request => new URL(request.url()).host === storeHost);
        await storeButton.click();
        expect((await storeRequest).url(), `the button should open ${expectedUrl}`).toBe(expectedUrl);

        // close the store tab if it opened in a new tab
        for (const tab of context.pages()) {
            if (tab !== this.page) await tab.close();
        }
        await context.unrouteAll();
    }
}
