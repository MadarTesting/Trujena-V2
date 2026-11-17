import { test, expect } from '../fixtures/fixtures';
import data from '../testData/designSettings';

// merchant > إعدادات التصميم (requirements/MerchantDesignSetting.md = UC-7)
// التستات بتشتغل بتاجر الـ .env وبتغيّر تصميم تطبيقه (مفيش حاجة بتتمسح)
// اللينكات لازم تكون على دومين المتجر، فبناخد "رابط المتجر" من الطلب

test.describe('Merchant - design settings', { tag: '@design' }, () => {

    // الأقسام الخمسة موجودة
    for (const tab of data.tabs) {
        test(`[Positive] the page has the section "${tab}"`, async ({ merchantPO }) => {
            const design = merchantPO.getMerchantDesignSettingsPage();

            await design.open();
            await design.openTab(tab);
        });
    }

    // المعاينة المباشرة بتتغير قبل الحفظ
    test('[Positive] live preview: the colors change before save', async ({ merchantPO }) => {
        const design = merchantPO.getMerchantDesignSettingsPage();

        await design.open();
        await design.openTab(design.tabs.colors);
        await design.setColor(design.colorLabels.background, data.previewColors.backgroundColor);
        await design.setColor(design.colorLabels.icons, data.previewColors.iconsColor);
        await design.assertPreviewColors(data.previewColors.backgroundColor, data.previewColors.iconsColor);
    });

    // لينك من برا دومين المتجر بيترفض
    test('[Negative] a link outside the store is rejected', async ({ merchantPO, requestNumber }) => {
        const design = merchantPO.getMerchantDesignSettingsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await design.open();
        await design.fillRequired(data.colors, data.icons, storeLink);
        await design.openTab(design.tabs.navigation);
        await design.iconLink(data.icons[0].key).fill(data.outsideStoreLink);
        await design.clickSave();
        await design.assertSaveFailed();
    });

    // الحفظ فشل: بتظهر رسالة خطأ
    test('[Negative] when saving fails, an error message is shown', async ({ merchantPO, requestNumber }) => {
        const design = merchantPO.getMerchantDesignSettingsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await design.open();
        await design.makeSaveFail();
        await design.fillRequired(data.colors, data.icons, storeLink);
        await design.clickSave();
        await design.assertSaveFailed();
    });

    // بيحفظ تصميم، وبعدين بيحفظ تصميم تاني (آخر تصميم)
    test('[Positive] save a design, then save the last design', async ({ merchantPO, requestNumber }) => {
        const design = merchantPO.getMerchantDesignSettingsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await design.open();
        await design.fillRequired(data.colors, data.icons, storeLink);
        await design.save();

        await design.fillRequired(data.lastColors, data.icons, storeLink);
        await design.save();
    });

    // بيرجع لإعدادات التصميم على طول ويتأكد إن آخر تصميم هو اللي موجود
    test('[Positive] back to design settings: the last design is shown', async ({ merchantPO }) => {
        const design = merchantPO.getMerchantDesignSettingsPage();

        await design.open();
        await design.openTab(design.tabs.colors);
        await design.assertColor(design.colorLabels.background, data.lastColors.backgroundColor);
        await design.assertColor(design.colorLabels.icons, data.lastColors.iconsColor);
    });
});
