import { expect, type Locator, type Page } from '@playwright/test';
import type { AppConfig } from '../../../testData/config';
import actions from '../../../testData/actions';

// admin > request page when the status is "جاري الإعداد" (app configuration form)
// صفحة إعدادات التطبيق عند الأدمن
export class AdminConfigPage {
    //===================Locators===================
    readonly page: Page;
    readonly appName_tb: Locator;
    readonly packageName_tb: Locator;
    readonly bundleId_tb: Locator;
    readonly appIcon_file: Locator;
    readonly merchantEmail_tb: Locator;
    readonly oneSignalEmail_tb: Locator;
    readonly oneSignalPassword_tb: Locator;
    readonly oneSignalAppId_tb: Locator;
    readonly oneSignalApiKey_tb: Locator;
    readonly privacyPolicy_tb: Locator;
    readonly Save_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg (all fields have an id or a name)
        this.appName_tb = page.locator('#appName-input');
        this.packageName_tb = page.locator('#packageName-input');
        this.bundleId_tb = page.locator('#bundleId-input');
        this.appIcon_file = page.locator('main input[type="file"][accept*=".png"]');
        this.merchantEmail_tb = page.locator('#merchantEmail-input');
        this.oneSignalEmail_tb = page.locator('#onesignalEmail-input');
        this.oneSignalPassword_tb = page.locator('#onesignalPassword-password');
        this.oneSignalAppId_tb = page.locator('#onesignalAppId-input');
        this.oneSignalApiKey_tb = page.locator('#onesignalApiKey-input');
        this.privacyPolicy_tb = page.locator('input[name="privacyPolicyUrl"]');
        this.Save_btn = page.locator('main').getByRole('button', { name: actions.saveConfig });
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // بيملى بيانات الإعدادات
    async fillConfig(data: AppConfig) {
        await this.appName_tb.fill(data.appName);
        await this.packageName_tb.fill(data.packageName);
        await this.bundleId_tb.fill(data.bundleId);
        await this.appIcon_file.setInputFiles(data.appIcon);
        // NOTE: we do NOT click "إنشاء البريد الإلكتروني", it creates a real mailbox on the mail server
        await this.merchantEmail_tb.fill(data.merchantEmail);
        await this.oneSignalEmail_tb.fill(data.oneSignalEmail);
        await this.oneSignalPassword_tb.fill(data.oneSignalPassword);
        await this.oneSignalAppId_tb.fill(data.oneSignalAppId);
        await this.oneSignalApiKey_tb.fill(data.oneSignalApiKey);
        await this.privacyPolicy_tb.fill(data.privacyPolicy);
    }

    // بيدوس حفظ
    async save() {
        await this.Save_btn.click();
    }

    // بيملى البيانات ويحفظ
    async fillAndSave(data: AppConfig) {
        await this.fillConfig(data);
        await this.save();
    }

    //-------------------Assertions-------------------
    // بيتأكد إن فورم الإعدادات ظاهرة
    async assertFormVisible() {
        await expect(this.appName_tb).toBeVisible();
    }
}
