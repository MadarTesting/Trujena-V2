import { type Locator, type Page } from '@playwright/test';

// admin > request page when the status is "قيد النشر" (store links)
// ADJUST: this screen was not seen on stg yet (no request was in "قيد النشر")
// صفحة النشر عند الأدمن (روابط المتاجر)
export class AdminPublishPage {
    //===================Locators===================
    readonly page: Page;
    readonly googlePlay_tb: Locator;
    readonly appStore_tb: Locator;
    readonly Save_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        this.googlePlay_tb = page.locator('main input[name*="google" i], main input[placeholder*="Google" i]').first();
        this.appStore_tb = page.locator('main input[name*="apple" i], main input[name*="appStore" i], main input[placeholder*="App Store" i]').first();
        this.Save_btn = page.locator('main').getByRole('button', { name: /حفظ/ }).first();
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيضيف لينك Google Play
    async addGooglePlayLink(url: string) {
        await this.googlePlay_tb.fill(url);
        await this.Save_btn.click();
    }

    // بيضيف لينك App Store
    async addAppStoreLink(url: string) {
        await this.appStore_tb.fill(url);
        await this.Save_btn.click();
    }
}
