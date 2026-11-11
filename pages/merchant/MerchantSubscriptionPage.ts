import { expect, type Locator, type Page } from '@playwright/test';
import paths from '../../testData/paths';

// merchant > اشتراكي (only shows the subscription, nothing to change)
// صفحة اشتراكي عند التاجر
export class MerchantSubscriptionPage {
    //===================Locators===================
    readonly page: Page;
    readonly subscription_lnk: Locator;
    readonly planName_lbl: Locator;
    readonly status_lbl: Locator;
    readonly type_lbl: Locator;
    readonly price_lbl: Locator;
    readonly startDate_lbl: Locator;
    readonly endDate_lbl: Locator;
    readonly remainingDays_lbl: Locator;
    readonly features_lbls: Locator;
    readonly renew_btn: Locator;

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        const main = page.locator('main[data-slot="sidebar-inset"]');
        this.subscription_lnk = page.getByRole('link', { name: 'اشتراكي' }).filter({ visible: true }).first();

        // SEEN on stg: every row in "تفاصيل الخطة" is <p>label</p><p>value</p>
        this.planName_lbl = main.locator('p:text-is("اسم الخطة") + p');
        this.type_lbl = main.locator('p:text-is("نوع الاشتراك") + p');
        this.price_lbl = main.locator('p:text-is("السعر") + p');
        this.startDate_lbl = main.locator('p:text-is("تاريخ البداية") + p');
        this.endDate_lbl = main.locator('p:text-is("تاريخ النهاية") + p');
        this.remainingDays_lbl = main.locator('p:text-is("الأيام المتبقية") + p');

        // SEEN on stg: the status badge, its text is "نشط" or "غير نشط"
        this.status_lbl = main.getByText(/^(نشط|غير نشط)$/).first();

        // SEEN on stg: the features are in the card "الميزات المتاحة", one <p> for every feature
        this.features_lbls = main.getByRole('heading', { name: 'الميزات المتاحة' }).locator('xpath=ancestor::div[3]/div[2]//p');

        // BR: the merchant can NOT renew from the dashboard, so this button must NOT be on the page
        this.renew_btn = main.getByRole('button', { name: /تجديد|ترقية/ });
    }

    //===================Methods===================
    //-------------------Actions-------------------
    // from the dashboard: click "اشتراكي" in the side bar
    // بيفتح صفحة اشتراكي
    async open() {
        await this.page.goto(paths.merchantHomePath);
        await this.subscription_lnk.click();
        await expect(this.page).toHaveURL(new RegExp(paths.subscriptionPath));
        await expect(this.planName_lbl).toBeVisible();
    }

    // print the subscription data in the terminal
    // بيطبع بيانات الاشتراك في التيرمنال
    async printData() {
        const features = await this.features_lbls.allInnerTexts();
        console.log('');
        console.log('==================== اشتراكي ====================');
        console.log('اسم الخطة       :', await this.planName_lbl.innerText());
        console.log('الحالة          :', await this.status_lbl.innerText());
        console.log('نوع الاشتراك    :', await this.type_lbl.innerText());
        console.log('السعر           :', await this.price_lbl.innerText());
        console.log('تاريخ البداية   :', await this.startDate_lbl.innerText());
        console.log('تاريخ النهاية   :', await this.endDate_lbl.innerText());
        console.log('الأيام المتبقية :', await this.remainingDays_lbl.innerText());
        console.log(`الميزات المتاحة (${features.length}):`);
        features.forEach((feature, i) => console.log(`   ${i + 1}. ${feature}`));
        console.log('=================================================');
        console.log('');
    }

    //-------------------Assertions-------------------
    // بيتأكد إن كل البيانات ظاهرة
    async assertAllDataShown() {
        await expect(this.planName_lbl).not.toBeEmpty();
        await expect(this.status_lbl).not.toBeEmpty();
        await expect(this.type_lbl).not.toBeEmpty();
        await expect(this.price_lbl).not.toBeEmpty();
        await expect(this.startDate_lbl).not.toBeEmpty();
        await expect(this.endDate_lbl).not.toBeEmpty();
        await expect(this.remainingDays_lbl).not.toBeEmpty();
        await expect(this.features_lbls.first()).toBeVisible();
    }

    // بيتأكد من حالة الاشتراك
    async assertStatus(status: string) {
        await expect(this.status_lbl).toHaveText(status);
    }

    // BR: the dates are updated every day, so the remaining days = end date - today
    // بيتأكد إن الأيام المتبقية صح
    async assertRemainingDays() {
        const endDate = new Date(await this.endDate_lbl.innerText());
        const today = new Date(new Date().toISOString().slice(0, 10));
        const days = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        await expect(this.remainingDays_lbl).toContainText(String(days));
    }

    // بيتأكد إن مفيش زرار تجديد
    async assertNoRenewButton() {
        await expect(this.renew_btn).toHaveCount(0);
    }
}
