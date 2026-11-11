import { expect, type Locator, type Page } from '@playwright/test';

// merchant reviews the app when the status is "جاهز للمراجعة"
// ADJUST: this screen was not seen on stg yet (our request was not ready), the texts are from the SRS
// صفحة مراجعة التطبيق عند التاجر
export class MerchantReviewPage {
    //===================Locators===================
    readonly page: Page;
    readonly reviewApp_btn: Locator;
    readonly download_btn: Locator;
    readonly approve_btn: Locator;
    readonly requestEdit_btn: Locator;
    readonly editNotes_tb: Locator;
    readonly sendNotes_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg: there is no "مراجعة التطبيق" button, the review box is shown inside the request details page
        this.reviewApp_btn = page.locator('main').getByRole('heading', { name: 'تطبيقك جاهز للمراجعة!' });
        this.download_btn = page.getByRole('link', { name: /تحميل/ }).or(page.getByRole('button', { name: /تحميل/ }));
        this.approve_btn = page.getByRole('button', { name: /موافقة/ });
        this.requestEdit_btn = page.getByRole('button', { name: 'طلب تعديل' });
        // SEEN on stg: the edit popup is an alertdialog "التعديلات" (not role="dialog")
        const editPopup = page.getByRole('alertdialog', { name: 'التعديلات' });
        this.editNotes_tb = editPopup.getByRole('textbox', { name: /الملاحظات/ });
        this.sendNotes_btn = editPopup.getByRole('button', { name: 'إرسال' });
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // the merchant must already be on the request details page
    // SEEN on stg: the review box ("تحميل APK", "موافقة واعتماد", "طلب تعديل") is already there, nothing to click
    // بيفتح صفحة المراجعة
    async open() {
        await expect(this.reviewApp_btn).toBeVisible();
    }

    // SEEN on stg: approve opens a popup "هل أنت متأكد من الموافقة على النشر؟" -> "تأكيد النشر"
    // بيوافق على النشر
    async approve() {
        await this.approve_btn.click();
        await this.page.getByRole('alertdialog').getByRole('button', { name: 'تأكيد النشر' }).click();
    }

    // بيطلب تعديل ويكتب الملاحظات
    async requestEdit(notes: string) {
        await this.requestEdit_btn.click();
        await this.editNotes_tb.fill(notes);
        await this.sendNotes_btn.click();
    }

    //-------------------Assertions-------------------
    // بيتأكد إن زرار التحميل ظاهر
    async assertDownloadAvailable() {
        await expect(this.download_btn.first()).toBeVisible();
    }

    // بيتأكد إن زرار الموافقة ظاهر
    async assertApproveButtonVisible() {
        await expect(this.approve_btn).toBeVisible();
    }

    // بيتأكد إن زرار التعديل ظاهر
    async assertEditButtonVisible() {
        await expect(this.requestEdit_btn).toBeVisible();
    }

    // second version: NO edit button (SRS step 9)
    // بيتأكد إن زرار التعديل مش ظاهر
    async assertEditButtonHidden() {
        await expect(this.requestEdit_btn).toBeHidden();
    }
}
