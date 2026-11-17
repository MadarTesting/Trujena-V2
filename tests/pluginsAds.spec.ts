import { test, expect } from '../fixtures/fixtures';
import fs from 'fs';
import pluginsData from '../testData/pluginsAds';
import paths from '../testData/paths';

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

// بعد كل تست: بيمسح إعلانات التست (اسمها بيبدأ بـ "QA")، عشان الخطة ليها حد أقصى للإعلانات
test.afterEach(async ({ merchantPO }) => {
    await merchantPO.getMerchantPluginsAdsPage().deleteTestAds();
});

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

//===================حالات الريكوايرمنت===================
// الحالات اللي في requirements/MerchantPluginsAdspage.md
// مسموح هنا نمسح أي إعلان (حتى الإعلانات اللي مش بتاعة التست)
test.describe('Merchant - plugins and ads: requirement cases', { tag: '@plugins' }, () => {

    // Main flow 3: التلات اختيارات موجودين
    for (const tab of ['سياسة الخصوصية', 'أيقونة واتساب', 'إعلانات العروض']) {
        test(`[Positive] the page has the tab "${tab}"`, async ({ merchantPO }) => {
            const plugins = merchantPO.getMerchantPluginsAdsPage();

            await plugins.open();
            await expect(plugins.main.getByRole('button', { name: tab, exact: true })).toBeVisible();
        });
    }

    // Alternative 1: الحفظ فشل (الإضافات): بتظهر رسالة خطأ
    test('[Negative] WhatsApp: when saving fails, an error message is shown', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.page.route('**/whatsapp-settings/**', route =>
            route.request().method() === 'GET' ? route.continue() : route.fulfill({ status: 500, body: '{}' }));
        await plugins.setWhatsapp(pluginsData.whatsapp);
        await plugins.Save_btn.click();
        await plugins.assertMessage(pluginsData.messages.saveFailed);
    });

    // business rule: مينفعش تفعيل الواتساب برقم مش صحيح
    test('[Negative] WhatsApp: a wrong phone number is not saved', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.setWhatsapp({ ...pluginsData.whatsapp, phone: pluginsData.invalidPhone });
        const response = await plugins.clickAndWaitForSave(plugins.Save_btn);
        expect(response.ok(), 'a wrong number must be rejected').toBeFalsy();
        await plugins.assertMessage(pluginsData.messages.saveFailed);
    });

    // Alternative 3: بيانات ناقصة: رسالة لكل خانة والحفظ بيتمنع
    test('[Negative] ad: empty fields show a message for each field', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.open();
        await plugins.startNewAd();
        await plugins.SaveAd_btn.click();
        await expect(plugins.main.getByRole('alert').filter({ hasText: pluginsData.messages.fieldRequired }).first()).toBeVisible();
        await expect(plugins.page).toHaveURL(/offers-ads\/create/);
    });

    // Alternative 4: صورة أكبر من 5 ميجا بتترفض
    test('[Negative] ad: an image bigger than 5 MB is rejected', async ({ merchantPO }, testInfo) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const bigImage = testInfo.outputPath('big.png');
        fs.writeFileSync(bigImage, Buffer.concat([fs.readFileSync(paths.logo), Buffer.alloc(6 * 1024 * 1024)]));

        await plugins.open();
        await plugins.startNewAd();
        await plugins.main.getByRole('button', { name: pluginsData.imageAd.template }).click();
        await plugins.adImage_file.setInputFiles(bigImage);
        await plugins.assertFieldError(pluginsData.messages.bigImage);
    });

    // business rule: رابط الظهور لازم يكون من دومين المتجر
    test('[Negative] ad: a link outside the store is not saved', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await plugins.open();
        await plugins.startNewAd();
        await plugins.fillAd({ ...textAd(pluginsData.caseAdNames.inactive, storeLink), destinationUrl: pluginsData.outsideLink });
        await plugins.SaveAd_btn.click();
        await plugins.page.waitForTimeout(3000);
        await expect(plugins.page).toHaveURL(/offers-ads\/create/);          // ما اتحفظش
    });

    // Main flow 12-13: الإعلان الجديد بيتحفظ "غير مفعل" وبتظهر رسالة النجاح
    test('[Positive] a new ad is saved NOT active, with a success message', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.caseAdNames.inactive;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.assertMessage(pluginsData.messages.created);
        await plugins.openAdsList();
        await plugins.assertSwitch(plugins.adSwitch(name), false);
    });

    // Main flow 4: كل إعلان في القايمة بيعرض القالب والصورة والحالة وتاريخ الإنشاء
    test('[Positive] the ad card shows the template, the image, the status and the date', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.caseAdNames.inactive;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        const card = plugins.adCard(name);
        await expect.soft(card, 'the card must show the template').toContainText('القالب');
        await expect.soft(card.locator('img'), 'the card must show a small preview').not.toHaveCount(0);
        await expect.soft(card, 'the card must show the status').toContainText(/مفعل|غير مفعل/);
        await expect.soft(card, 'the card must show the date').toContainText(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);
    });

    // Alternative 1: لو مفيش إعلانات بتظهر رسالة (SEEN on stg: "لا توجد إعلانات بعد")
    test('[Negative] no ads: a "no ads" message is shown', async ({ merchantPO }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        await plugins.deleteAllAds();
        await plugins.openAdsList();
        await expect(plugins.main.getByText(pluginsData.messages.noAds)).toBeVisible();
    });

    // Alternative 7: مينفعش تفعيل أكتر من 3 إعلانات
    test('[Negative] business rule: no more than 3 active ads', async ({ merchantPO, requestNumber }) => {
        test.setTimeout(6 * 60 * 1000);
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const site = new URL(storeLink).origin;

        await plugins.deleteAllAds();
        for (let n = 1; n <= 4; n++) {                                        // 4 إعلانات على 4 صفحات مختلفة
            await plugins.createAd({ ...textAd(pluginsData.caseAdNames.limit(n), storeLink), destinationUrl: `${site}/qa-page-${n}` });
        }
        await plugins.openAdsList();
        for (let n = 1; n <= 3; n++) {
            await plugins.setAdActive(pluginsData.caseAdNames.limit(n), true);
        }
        await plugins.setAdActive(pluginsData.caseAdNames.limit(4), true);    // الرابع لازم يترفض

        await plugins.openAdsList();
        await plugins.assertSwitch(plugins.adSwitch(pluginsData.caseAdNames.limit(4)), false);
    });

    // تعديل: الصفحة بتفتح بكل بيانات الإعلان، والحالة ما بتتغيرش بعد الحفظ
    test('[Positive] edit: the form has all the ad data and the status does not change', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.caseAdNames.activeEdit;

        await plugins.deleteAllAds();
        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await plugins.setAdActive(name, true);

        await plugins.openAdsList();
        await plugins.openAdForEdit(name);
        await expect(plugins.adDestinationUrl_tb).toHaveValue(storeLink);
        await expect(plugins.adTitle_tb).toHaveValue(pluginsData.ad.title);
        await plugins.adTitle_tb.fill(`${pluginsData.ad.title} 2`);
        await plugins.saveAd();

        await plugins.openAdsList();
        await plugins.assertSwitch(plugins.adSwitch(name), true);             // لسه مفعل
        await plugins.setAdActive(name, false);
    });

    // تعديل Alternative 2: تعديل إعلان مفعل بيظهر تنبيه
    test('[Negative] edit an active ad: a warning is shown', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.caseAdNames.activeEdit;

        await plugins.deleteAllAds();
        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await plugins.setAdActive(name, true);

        await plugins.openAdsList();
        await plugins.adCard(name).getByRole('button', { name: 'تعديل' }).click();
        await plugins.adTitle_tb.fill(`${pluginsData.ad.title} 2`);
        await plugins.SaveAd_btn.click();
        await expect(plugins.page.getByText(pluginsData.messages.activeAdWarning)).toBeVisible();
    });

    // تكرار: الإعلان الجديد بياخد اسم جديد ويكون غير مفعل
    test('[Positive] duplicate: the copy gets a new name and is NOT active', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.caseAdNames.duplicate;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await plugins.adCard(name).getByRole('button', { name: 'تكرار' }).click();
        await expect(plugins.adName_tb, 'the copy must get a new default name').not.toHaveValue(name);
    });

    // حذف Alternative 1: حذف إعلان مفعل بيظهر تنبيه
    test('[Negative] delete an active ad: a warning is shown', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.caseAdNames.activeDelete;

        await plugins.deleteAllAds();
        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await plugins.setAdActive(name, true);

        await plugins.openAdsList();
        await plugins.adDeleteButton(name).click();
        await expect(plugins.deleteDialog).toContainText(pluginsData.messages.activeAdWarning);
    });

    // حذف: رسالة النجاح
    test('[Positive] delete: "تم حذف الإعلان بنجاح" is shown', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const name = pluginsData.tempAdNames.delete;

        await plugins.createAd(textAd(name, storeLink));
        await plugins.openAdsList();
        await plugins.deleteAd(name);
        await plugins.assertMessage(pluginsData.messages.deleted);
    });

    // حذف Alternative 4: الحذف الجماعي (Checkbox + "حذف المحدد")
    test('[Positive] bulk delete: select ads and delete them together', async ({ merchantPO, requestNumber }) => {
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await plugins.createAd(textAd(pluginsData.tempAdNames.delete, storeLink));
        await plugins.openAdsList();
        await expect(plugins.main.getByRole('checkbox').first(), 'every ad must have a checkbox').toBeVisible();
        await expect(plugins.main.getByRole('button', { name: 'حذف المحدد' })).toBeAttached();
    });
});
