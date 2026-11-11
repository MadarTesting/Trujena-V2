import { test, expect } from '../fixtures/fixtures';
import pluginsData from '../testData/pluginsAds';

// merchant > الإضافات والإعلانات
// the merchant is already logged in (global setup), every test starts from the dashboard
// IMPORTANT: these tests ADD ads and CHANGE the WhatsApp icon and the privacy policy.
// Only the ads created BY the tests are deleted. Ads that are turned ON are turned OFF again at the end.
// the tests do not depend on each other, so if one fails the others still run

//===================Helper===================
// a full text ad (القالب1) with a given name, on the store link of the merchant
function textAd(name: string, storeLink: string) {
    return { ...pluginsData.ad, name, destinationUrl: storeLink, buttonUrl: storeLink };
}

//===================Test Cases===================
// تستات الإضافات والإعلانات الأساسية
test.describe('Merchant - plugins and ads', { tag: '@plugins' }, () => {

    //-------------------إعلانات العروض-------------------
    // مينفعش تحفظ إعلان من غير اسم
    test('[Negative] ad: cannot save without a name', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.startNewAd();
        await plugins.adName_tb.fill('');
        await plugins.SaveAd_btn.click();

        await plugins.assertFieldError(pluginsData.errors.required);
        await test.expect(plugins.page).toHaveURL(/offers-ads\/create/);     // still on the create page
    });

    // إضافة إعلان جديد وظهوره في القايمة
    test('[Positive] ad: add a new ad and see it in the list', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await plugins.open();
        await plugins.startNewAd();
        await plugins.fillAd({ ...pluginsData.ad, destinationUrl: storeLink, buttonUrl: storeLink });
        await plugins.saveAd();

        await plugins.reload();
        await plugins.assertAdInList(pluginsData.ad.name);
    });

    //-------------------أيقونة واتساب-------------------
    // مينفعش تحفظ الواتساب من غير رقم
    test('[Negative] WhatsApp: cannot save without a phone number', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.setWhatsapp({ ...pluginsData.whatsapp, phone: '' });
        await plugins.Save_btn.click();

        await plugins.assertFieldError(pluginsData.errors.required);
    });

    // تشغيل أيقونة الواتساب وملء البيانات والحفظ
    test('[Positive] WhatsApp: turn on the icon, fill the data and save', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.setWhatsapp(pluginsData.whatsapp);
        await plugins.saveAndCheck(plugins.Save_btn);

        await plugins.reload();
        await plugins.assertWhatsapp(pluginsData.whatsapp);
    });

    //-------------------سياسة الخصوصية-------------------
    // تشغيل سياسة الخصوصية وكتابة النص والحفظ
    test('[Positive] privacy policy: turn it on, write the text and save', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.setPrivacyPolicy(pluginsData.privacyPolicy.text);
        await plugins.saveAndCheck(plugins.Save_btn);

        await plugins.reload();
        await plugins.assertPrivacyPolicy(pluginsData.privacyPolicy.text);
    });
});

//===================إعلانات العروض: more cases===================
// حالات تانية للإعلانات
test.describe('Merchant - plugins and ads: more ad cases', { tag: '@plugins' }, () => {

    // إعلان بصورة (قالب 2) بحجم الصفحة كلها
    test('[Positive] ad template 2 (image), full page size, shown on open', async ({ merchantPO, requestNumber }) => {
        test.setTimeout(5 * 60 * 1000);
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const ad = { ...pluginsData.imageAd, destinationUrl: storeLink, buttonUrl: storeLink };

        await plugins.createAd(ad, 120000);      // SEEN on stg: the image upload is slow, we wait up to 2 minutes
        await plugins.openAdsList();
        await expect(plugins.adCard(ad.name)).toBeVisible();
    });

    // إعلان بصورة وعنوان (قالب 3)
    test('[Positive] ad template 3 (image + header title)', async ({ merchantPO, requestNumber }) => {
        test.setTimeout(5 * 60 * 1000);
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const ad = { ...pluginsData.headerAd, destinationUrl: storeLink, buttonUrl: storeLink };

        await plugins.createAd(ad, 120000);      // SEEN on stg: the image upload is slow, we wait up to 2 minutes
        await plugins.openAdsList();
        await expect(plugins.adCard(ad.name)).toBeVisible();
    });

    // تعديل اسم إعلان
    test('[Positive] edit an ad: the new name is saved', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const oldName = `${pluginsData.ad.name} edit`;

        await plugins.createAd(textAd(oldName, storeLink));
        await plugins.openAdsList();
        await plugins.openAdForEdit(oldName);
        await plugins.adName_tb.fill(pluginsData.editedAdName);
        await plugins.saveAd();

        await plugins.openAdsList();
        await expect(plugins.adCard(pluginsData.editedAdName)).toBeVisible();
        await expect(plugins.adCard(oldName)).toHaveCount(0);
    });

    // تكرار إعلان: عدد الإعلانات بيزيد واحد
    test('[Positive] duplicate an ad: one more ad in the list', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.tempAdNames.duplicate;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await expect(plugins.adCard(name)).toBeVisible();          // wait for the list before counting
        const before = await plugins.adCards.count();
        await plugins.duplicateAd(name);

        await plugins.openAdsList();
        await expect(plugins.adCards).toHaveCount(before + 1);
    });

    // مسح إعلان ثم "الرجوع": الإعلان ما بيتمسحش
    test('[Negative] delete an ad and press "الرجوع": the ad is NOT deleted', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.tempAdNames.deleteCancel;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await plugins.deleteAd(name, false);

        await plugins.openAdsList();
        await expect(plugins.adCard(name)).toBeVisible();
    });

    // مسح إعلان: مش بيظهر بعد reload
    test('[Positive] delete an ad: it is not in the list after reload', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.tempAdNames.delete;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await plugins.deleteAd(name);

        await plugins.openAdsList();
        await expect(plugins.adCard(name)).toHaveCount(0);
    });

    // تشغيل وإيقاف إعلان من الـ switch بتاعه
    test('[Positive] turn an ad ON and OFF from its switch (saved after reload)', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.tempAdNames.activate;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();

        await test.step('turn it ON', async () => {
            const response = await plugins.setAdActive(name, true);
            expect(response?.ok(), `turn on failed: ${await response?.text()}`).toBeTruthy();
            await plugins.openAdsList();
            await plugins.assertSwitch(plugins.adSwitch(name), true);
        });

        await test.step('turn it OFF again (so it is not shown in the app)', async () => {
            await plugins.setAdActive(name, false);
            await plugins.openAdsList();
            await plugins.assertSwitch(plugins.adSwitch(name), false);
        });
    });

    // business rule on the page: "يمكنك إضافة إعلان واحد فقط لكل صفحة داخل التطبيق"
    // إعلان واحد بس شغال لنفس الصفحة
    test('[Negative] business rule: only ONE active ad for the same page', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const { samePage1, samePage2 } = pluginsData.tempAdNames;

        await plugins.createAd(textAd(samePage1, storeLink));
        await plugins.createAd(textAd(samePage2, storeLink));
        await plugins.openAdsList();

        try {
            await plugins.setAdActive(samePage1, true);
            await plugins.openAdsList();
            await plugins.setAdActive(samePage2, true);

            // the 2 ads are on the same page, so they must NOT be ON together
            await plugins.openAdsList();
            const first = await plugins.adSwitch(samePage1).getAttribute('aria-checked');
            const second = await plugins.adSwitch(samePage2).getAttribute('aria-checked');
            expect(first === 'true' && second === 'true', 'two ads are ON for the same page').toBeFalsy();
        } finally {
            // clean: turn both OFF
            await plugins.openAdsList();
            await plugins.setAdActive(samePage1, false);
            await plugins.setAdActive(samePage2, false);
        }
    });
});

//===================أيقونة واتساب: more cases===================
// حالات تانية للواتساب
test.describe('Merchant - plugins and ads: more WhatsApp cases', { tag: '@plugins' }, () => {
    test.describe.configure({ mode: 'serial' });     // they change the same settings

    // الواتساب مع الحركة: المسافات بتختفي والشكل بيتحفظ
    test('[Positive] WhatsApp with movement ON: the paddings are hidden and the shape is saved', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const data = { ...pluginsData.whatsapp, movement: true, shape: pluginsData.whatsappWithMovement.shape };

        await plugins.open();
        await plugins.setWhatsapp(data);
        await expect(plugins.whatsappRightPadding_tb).toBeHidden();         // SEEN on stg: hidden when movement is ON
        await expect(plugins.whatsappBottomPadding_tb).toBeHidden();
        await plugins.assertWhatsappShape(data.shape);                      // the preview shows the new shape
        await plugins.saveAndCheck(plugins.Save_btn);

        await plugins.reload();
        await plugins.assertWhatsapp(data);
        await plugins.assertWhatsappShape(data.shape);
    });

    // إيقاف أيقونة الواتساب وتشغيلها تاني
    test('[Positive] turn the WhatsApp icon OFF, then ON again', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.openTab(plugins.tabs.whatsapp);
        await plugins.switchOff(plugins.enabled_switch);
        await plugins.saveAndCheck(plugins.Save_btn);
        await plugins.reload();
        await plugins.openTab(plugins.tabs.whatsapp);
        await plugins.assertSwitch(plugins.enabled_switch, false);

        // turn it ON again (with new data, so the save button is enabled)
        await plugins.setWhatsapp(pluginsData.whatsapp);
        await plugins.saveAndCheck(plugins.Save_btn);
        await plugins.reload();
        await plugins.assertWhatsapp(pluginsData.whatsapp);
    });
});

//===================سياسة الخصوصية: more cases===================
// حالات تانية لسياسة الخصوصية
test.describe('Merchant - plugins and ads: more privacy policy cases', { tag: '@plugins' }, () => {
    test.describe.configure({ mode: 'serial' });     // they change the same settings

    // التنسيق (Bold / Italic / Underline) بيتحفظ
    test('[Positive] privacy policy formatting: Bold, Italic and Underline are saved', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.setPrivacyPolicy(pluginsData.privacyPolicy.text);
        for (const format of pluginsData.privacyFormats) {
            await plugins.addFormattedWord(format.word, format.button);
        }
        await plugins.saveAndCheck(plugins.Save_btn);

        await plugins.reload();
        await plugins.openTab(plugins.tabs.privacy);
        for (const format of pluginsData.privacyFormats) {
            await plugins.assertFormattedWord(format.word, format.tag);
        }
    });

    // إيقاف سياسة الخصوصية: النص المفروض يفضل موجود
    test('[Positive] turn the privacy policy OFF (the text is kept), then ON again', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const text = pluginsData.privacyPolicy.text;

        await test.step('start from a known text (ON)', async () => {
            await plugins.open();
            await plugins.setPrivacyPolicy(text);
            await plugins.saveAndCheck(plugins.Save_btn);
        });

        await test.step('turn it OFF: it is OFF after reload and the text is NOT deleted', async () => {
            await plugins.reload();
            await plugins.openTab(plugins.tabs.privacy);
            await plugins.switchOff(plugins.enabled_switch);
            await plugins.saveAndCheck(plugins.Save_btn);
            await plugins.reload();
            await plugins.openTab(plugins.tabs.privacy);
            await plugins.assertSwitch(plugins.enabled_switch, false);
            // SEEN on stg: turning it OFF DELETES the text (privacy_policy_content = null).
            // soft: the error is saved but the test continues, so the policy is turned ON again below
            await expect.soft(plugins.privacyEditor, 'the policy text must NOT be deleted when the policy is turned OFF')
                .toContainText(text);
        });

        await test.step('turn it ON again (with the text, so the merchant is not left with an empty policy)', async () => {
            await plugins.setPrivacyPolicy(text);
            await plugins.saveAndCheck(plugins.Save_btn);
            await plugins.reload();
            await plugins.assertPrivacyPolicy(text);
        });
    });
});
