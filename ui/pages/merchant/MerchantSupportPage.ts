import { expect, type Locator, type Page, type Response } from '@playwright/test';
import paths from '../../../testData/paths';

// merchant > الدعم والتواصل (send a support request to the admin "طلبات الدعم الفني")
// صفحة الدعم والتواصل عند التاجر
export class MerchantSupportPage {
    //===================Locators===================
    readonly page: Page;
    readonly main: Locator;
    readonly support_lnk: Locator;
    readonly toast: Locator;
    readonly name_tb: Locator;
    readonly phone_tb: Locator;
    readonly email_tb: Locator;
    readonly message_tb: Locator;
    readonly Send_btn: Locator;
    readonly fiveMinutesRule_msg: Locator;

    //===================Variables===================
    // the request types on the website (SEEN on stg: "شكوى", the requirement says "مشكلة")
    readonly types = {
        inquiry: 'استفسار',
        complaint: 'شكوى',
    };

    readonly texts = {
        fiveMinutesRule: 'لا يمكن إرسال أكثر من طلب خلال 5 دقائق',
    };

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.main = page.locator('main[data-slot="sidebar-inset"]');
        this.support_lnk = page.getByRole('link', { name: 'الدعم والتواصل' }).filter({ visible: true }).first();
        this.toast = page.locator('[data-sonner-toast]').last();
        // SEEN on stg (all fields have an id)
        this.name_tb = this.main.locator('#customerName-input');
        this.phone_tb = this.main.locator('#phoneNumber-tel');
        this.email_tb = this.main.locator('#email-input');
        this.message_tb = this.main.locator('#messageContent-textarea');
        this.Send_btn = this.main.getByRole('button', { name: 'إرسال' });
        this.fiveMinutesRule_msg = this.main.getByText(this.texts.fiveMinutesRule);
    }

    //===================Methods===================
    // نوع الطلب (radio)
    type(name: string): Locator {
        return this.main.getByRole('radio', { name });
    }

    //-------------------Actions-------------------
    // from the dashboard: click "الدعم والتواصل" in the side bar
    // بيفتح صفحة الدعم
    async open() {
        await this.page.goto(paths.merchantHomePath);
        await this.support_lnk.click();
        await expect(this.page).toHaveURL(new RegExp(paths.supportPath));
        await expect(this.Send_btn).toBeVisible();
    }

    // choose the request type by clicking its text (like a user)
    // بيختار نوع الطلب
    async chooseType(typeText: string) {
        // NOTE: the locator inside "has" is searched INSIDE the label, so it must not start from main
        await this.main.locator('label').filter({ has: this.page.getByRole('radio', { name: typeText }) }).click();
        await expect(this.main.getByRole('radio', { name: typeText })).toBeChecked();
    }

    // بيملى بيانات الطلب
    async fillRequest(data: { name: string; phone: string; email: string; type: string; message: string }) {
        await this.name_tb.fill(data.name);
        await this.phone_tb.fill(data.phone);
        await this.email_tb.fill(data.email);
        await this.chooseType(data.type);
        await this.message_tb.fill(data.message);
    }

    // IMPORTANT: this sends a REAL support request to the admin (max 1 every 5 minutes)
    // بيدوس إرسال ويستنى السيرفر
    async send(): Promise<Response> {
        const answer = this.page.waitForResponse(response =>
            response.url().includes('/api/') && response.request().method() !== 'GET', { timeout: 30000 });
        await this.Send_btn.click();
        return await answer.catch(async () => {
            const errors = await this.main.getByRole('alert').allInnerTexts();
            throw new Error(`"إرسال" did not send anything to the server. Errors on the page: ${JSON.stringify(errors)}`);
        });
    }

    // بيبعت الرسالة، ولو السيرفر رفض (قاعدة الـ 5 دقايق: فيه رسالة اتبعتت من شوية)
    // بيستنى دقيقة ويحاول تاني (لحد 6 مرات = حوالي 6 دقايق)، بدل ما التست يفشل
    // التست اللي بيستخدمها محتاج وقت أطول: test.setTimeout(supportWaitTimeout)
    async sendWhenAllowed(data: { name: string; phone: string; email: string; type: string; message: string }): Promise<Response> {
        let response!: Response;
        for (let attempt = 1; attempt <= 6; attempt++) {
            await this.open();
            await this.fillRequest(data);
            response = await this.send();
            // SEEN on stg: قاعدة الـ 5 دقايق = 429 "You can only send one support message every 5 minutes"
            // أي رد تاني (نجاح أو error تاني) بيرجع على طول
            if (response.status() !== 429) return response;
            console.log(`support: 429 (the 5 minutes rule), waiting 1 minute (attempt ${attempt}/6)`);
            await this.page.waitForTimeout(60000);
        }
        return response;
    }

    //-------------------Assertions-------------------
    // business rule: name, phone and email are filled with the registration data (the merchant can change them)
    // بيتأكد إن البيانات متملية من التسجيل
    async assertPrefilled(profile: { name: string; phoneDigits: string; email: string }) {
        await expect(this.name_tb, 'the name must be filled with the registration name').toHaveValue(profile.name);
        await expect(this.email_tb, 'the email must be filled with the registration email').toHaveValue(profile.email);
        // compare digits only (the website can show the number with spaces)
        await expect(this.phone_tb, 'the phone must be filled with the registration phone')
            .toHaveValue(new RegExp(profile.phoneDigits.split('').join('\\s*')));
    }

    // بيتأكد إن زرار الإرسال مقفول
    async assertSendDisabled() {
        await expect(this.Send_btn).toBeDisabled();
    }

    // بيتأكد إن زرار الإرسال شغال
    async assertSendEnabled() {
        await expect(this.Send_btn).toBeEnabled();
    }

    // بيتأكد من الرسالة اللي بتظهر
    async assertToast(text: string) {
        await expect(this.toast).toContainText(text);
    }
}
