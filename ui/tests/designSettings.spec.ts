// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب data من testData/designSettings.ts
import data from '../../testData/designSettings';

// merchant > إعدادات التصميم (requirements/MerchantDesignSetting.md = UC-7)
// التستات بتشتغل بتاجر الـ .env وبتغيّر تصميم تطبيقه (مفيش حاجة بتتمسح)
// اللينكات لازم تكون على دومين المتجر، فبناخد "رابط المتجر" من الطلب

// مجموعة تستات: Merchant - design settings
test.describe('Merchant - design settings', { tag: '@design' }, () => {

    // الأقسام الخمسة موجودة
    for (const tab of data.tabs) {
        // التست ده بياخد: merchantPO = متصفح التاجر
        test(`[Positive] the page has the section "${tab}"`, async ({ merchantPO }) => {
            // بيجيب صفحة إعدادات التصميم من متصفح التاجر
            const design = merchantPO.getMerchantDesignSettingsPage();

            // بيفتح الصفحة
            await design.open();
            // بيفتح التاب ده
            await design.openTab(tab);
        });
    }

    // المعاينة المباشرة بتتغير قبل الحفظ
    test('[Positive] live preview: the colors change before save', async ({ merchantPO }) => {
        // بيجيب صفحة إعدادات التصميم من متصفح التاجر
        const design = merchantPO.getMerchantDesignSettingsPage();

        // بيفتح الصفحة
        await design.open();
        // بيفتح التاب ده
        await design.openTab(design.tabs.colors);
        // بيختار اللون ده
        await design.setColor(design.colorLabels.background, data.previewColors.backgroundColor);
        // بيختار اللون ده
        await design.setColor(design.colorLabels.icons, data.previewColors.iconsColor);
        // بيتأكد إن المعاينة بالألوان دي
        await design.assertPreviewColors(data.previewColors.backgroundColor, data.previewColors.iconsColor);
    });

    // لينك من برا دومين المتجر بيترفض
    test('[Negative] a link outside the store is rejected', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إعدادات التصميم من متصفح التاجر
        const design = merchantPO.getMerchantDesignSettingsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await design.open();
        // بيملى كل البيانات المطلوبة في التصميم
        await design.fillRequired(data.colors, data.icons, storeLink);
        // بيفتح التاب ده
        await design.openTab(design.tabs.navigation);
        // بيكتب data.outsideStoreLink في خانة رابط الأيقونة (data.icons[0].key)
        await design.iconLink(data.icons[0].key).fill(data.outsideStoreLink);
        // بيدوس حفظ
        await design.clickSave();
        // بيتأكد إن الحفظ فشل
        await design.assertSaveFailed();
    });

    // الحفظ فشل: بتظهر رسالة خطأ
    test('[Negative] when saving fails, an error message is shown', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إعدادات التصميم من متصفح التاجر
        const design = merchantPO.getMerchantDesignSettingsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await design.open();
        // بيخلّي السيرفر يرجّع error في الحفظ (مفيش حاجة بتتحفظ)
        await design.makeSaveFail();
        // بيملى كل البيانات المطلوبة في التصميم
        await design.fillRequired(data.colors, data.icons, storeLink);
        // بيدوس حفظ
        await design.clickSave();
        // بيتأكد إن الحفظ فشل
        await design.assertSaveFailed();
    });

    // بيحفظ تصميم، وبعدين بيحفظ تصميم تاني (آخر تصميم)
    test('[Positive] save a design, then save the last design', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إعدادات التصميم من متصفح التاجر
        const design = merchantPO.getMerchantDesignSettingsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await design.open();
        // بيملى كل البيانات المطلوبة في التصميم
        await design.fillRequired(data.colors, data.icons, storeLink);
        // بيدوس حفظ
        await design.save();

        // بيملى كل البيانات المطلوبة في التصميم
        await design.fillRequired(data.lastColors, data.icons, storeLink);
        // بيدوس حفظ
        await design.save();
    });

    // بيرجع لإعدادات التصميم على طول ويتأكد إن آخر تصميم هو اللي موجود
    test('[Positive] back to design settings: the last design is shown', async ({ merchantPO }) => {
        // بيجيب صفحة إعدادات التصميم من متصفح التاجر
        const design = merchantPO.getMerchantDesignSettingsPage();

        // بيفتح الصفحة
        await design.open();
        // بيفتح التاب ده
        await design.openTab(design.tabs.colors);
        // بيتأكد إن اللون ده محفوظ
        await design.assertColor(design.colorLabels.background, data.lastColors.backgroundColor);
        // بيتأكد إن اللون ده محفوظ
        await design.assertColor(design.colorLabels.icons, data.lastColors.iconsColor);
    });
});
