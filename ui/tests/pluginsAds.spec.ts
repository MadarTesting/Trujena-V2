// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب fs من fs.ts
import fs from 'fs';
// بيجيب pluginsData من testData/pluginsAds.ts
import pluginsData from '../../testData/pluginsAds';
// بيجيب paths من testData/paths.ts
import paths from '../../testData/paths';

// merchant > الإضافات والإعلانات
// the merchant is already logged in (global setup), every test starts from the dashboard
// IMPORTANT: these tests ADD ads and CHANGE the WhatsApp icon and the privacy policy.
// Only the ads created BY the tests are deleted. Ads that are turned ON are turned OFF again at the end.
// the tests do not depend on each other, so if one fails the others still run

//===================Helper===================
// a full text ad (القالب1) with a given name, on the store link of the merchant
function textAd(name: string, storeLink: string) {
    // بيرجّع النتيجة
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
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيدوس "إضافة إعلان"
        await plugins.startNewAd();
        // بيكتب '' في خانة adName
        await plugins.adName_tb.fill('');
        // بيدوس على زرار SaveAd
        await plugins.SaveAd_btn.click();

        // بيتأكد إن رسالة الخطأ دي ظهرت تحت الخانة
        await plugins.assertFieldError(pluginsData.errors.required);
        // still on the create page
        await test.expect(plugins.page).toHaveURL(/offers-ads\/create/);
    });

    // إضافة إعلان جديد وظهوره في القايمة
    test('[Positive] ad: add a new ad and see it in the list', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await plugins.open();
        // بيدوس "إضافة إعلان"
        await plugins.startNewAd();
        // بيملى فورم الإعلان
        await plugins.fillAd({ ...pluginsData.ad, destinationUrl: storeLink, buttonUrl: storeLink });
        // بيحفظ الإعلان
        await plugins.saveAd();

        // بيعمل reload للصفحة
        await plugins.reload();
        // بيتأكد إن الإعلان في القايمة
        await plugins.assertAdInList(pluginsData.ad.name);
    });

    //-------------------أيقونة واتساب-------------------
    // مينفعش تحفظ الواتساب من غير رقم
    test('[Negative] WhatsApp: cannot save without a phone number', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيشغّل أيقونة الواتساب ويملى بياناتها
        await plugins.setWhatsapp({ ...pluginsData.whatsapp, phone: '' });
        // بيدوس على زرار Save
        await plugins.Save_btn.click();

        // بيتأكد إن رسالة الخطأ دي ظهرت تحت الخانة
        await plugins.assertFieldError(pluginsData.errors.required);
    });

    // تشغيل أيقونة الواتساب وملء البيانات والحفظ
    test('[Positive] WhatsApp: turn on the icon, fill the data and save', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيشغّل أيقونة الواتساب ويملى بياناتها
        await plugins.setWhatsapp(pluginsData.whatsapp);
        // بيدوس حفظ ويتأكد إن الحفظ نجح
        await plugins.saveAndCheck(plugins.Save_btn);

        // بيعمل reload للصفحة
        await plugins.reload();
        // بيتأكد إن بيانات الواتساب اتحفظت
        await plugins.assertWhatsapp(pluginsData.whatsapp);
    });

    //-------------------سياسة الخصوصية-------------------
    // تشغيل سياسة الخصوصية وكتابة النص والحفظ
    test('[Positive] privacy policy: turn it on, write the text and save', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيشغّل سياسة الخصوصية ويكتب النص
        await plugins.setPrivacyPolicy(pluginsData.privacyPolicy.text);
        // بيدوس حفظ ويتأكد إن الحفظ نجح
        await plugins.saveAndCheck(plugins.Save_btn);

        // بيعمل reload للصفحة
        await plugins.reload();
        // بيتأكد إن سياسة الخصوصية اتحفظت
        await plugins.assertPrivacyPolicy(pluginsData.privacyPolicy.text);
    });
});

//===================إعلانات العروض: more cases===================
// حالات تانية للإعلانات
test.describe('Merchant - plugins and ads: more ad cases', { tag: '@plugins' }, () => {

    // إعلان بصورة (قالب 2) بحجم الصفحة كلها
    test('[Positive] ad template 2 (image), full page size, shown on open', async ({ merchantPO, requestNumber }) => {
        // بيدّي التست وقت أطول (5 * 60 * 1000 ميلي ثانية)
        test.setTimeout(5 * 60 * 1000);
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // ad = داتا التست مع تغيير بسيط
        const ad = { ...pluginsData.imageAd, destinationUrl: storeLink, buttonUrl: storeLink };

        // SEEN on stg: the image upload is slow, we wait up to 2 minutes
        await plugins.createAd(ad, 120000);
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن كارت الإعلان (ad.name) ظاهر
        await expect(plugins.adCard(ad.name)).toBeVisible();
    });

    // إعلان بصورة وعنوان (قالب 3)
    test('[Positive] ad template 3 (image + header title)', async ({ merchantPO, requestNumber }) => {
        // بيدّي التست وقت أطول (5 * 60 * 1000 ميلي ثانية)
        test.setTimeout(5 * 60 * 1000);
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // ad = داتا التست مع تغيير بسيط
        const ad = { ...pluginsData.headerAd, destinationUrl: storeLink, buttonUrl: storeLink };

        // SEEN on stg: the image upload is slow, we wait up to 2 minutes
        await plugins.createAd(ad, 120000);
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن كارت الإعلان (ad.name) ظاهر
        await expect(plugins.adCard(ad.name)).toBeVisible();
    });

    // تعديل اسم إعلان
    test('[Positive] edit an ad: the new name is saved', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // oldName = `${pluginsData.ad.name} edit`
        const oldName = `${pluginsData.ad.name} edit`;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(oldName, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيفتح الإعلان للتعديل
        await plugins.openAdForEdit(oldName);
        // بيكتب pluginsData.editedAdName في خانة adName
        await plugins.adName_tb.fill(pluginsData.editedAdName);
        // بيحفظ الإعلان
        await plugins.saveAd();

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن كارت الإعلان (pluginsData.editedAdName) ظاهر
        await expect(plugins.adCard(pluginsData.editedAdName)).toBeVisible();
        // بيتأكد إن كارت الإعلان (oldName) مش موجود
        await expect(plugins.adCard(oldName)).toHaveCount(0);
    });

    // تكرار إعلان: عدد الإعلانات بيزيد واحد
    test('[Positive] duplicate an ad: one more ad in the list', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.tempAdNames.duplicate
        const name = pluginsData.tempAdNames.duplicate;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // wait for the list before counting
        await expect(plugins.adCard(name)).toBeVisible();
        // before = await plugins.adCards.count()
        const before = await plugins.adCards.count();
        // بيكرر الإعلان
        await plugins.duplicateAd(name);

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن كروت الإعلانات عدده before + 1
        await expect(plugins.adCards).toHaveCount(before + 1);
    });

    // مسح إعلان ثم "الرجوع": الإعلان ما بيتمسحش
    test('[Negative] delete an ad and press "الرجوع": the ad is NOT deleted', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.tempAdNames.deleteCancel
        const name = pluginsData.tempAdNames.deleteCancel;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيدوس حذف وبعدين "الرجوع" (من غير ما يمسح)
        await plugins.deleteAd(name, false);

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن كارت الإعلان (name) ظاهر
        await expect(plugins.adCard(name)).toBeVisible();
    });

    // مسح إعلان: مش بيظهر بعد reload
    test('[Positive] delete an ad: it is not in the list after reload', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.tempAdNames.delete
        const name = pluginsData.tempAdNames.delete;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيمسح الإعلان
        await plugins.deleteAd(name);

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن كارت الإعلان (name) مش موجود
        await expect(plugins.adCard(name)).toHaveCount(0);
    });

    // تشغيل وإيقاف إعلان من الـ switch بتاعه
    test('[Positive] turn an ad ON and OFF from its switch (saved after reload)', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.tempAdNames.activate
        const name = pluginsData.tempAdNames.activate;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();

        // خطوة في التقرير: turn it ON
        await test.step('turn it ON', async () => {
            // بيشغّل / يقفل الإعلان من الـ switch، وبيحفظ النتيجة في response
            const response = await plugins.setAdActive(name, true);
            // بيتأكد إن السيرفر رد بنجاح
            expect(response?.ok(), `turn on failed: ${await response?.text()}`).toBeTruthy();
            // بيفتح قايمة الإعلانات
            await plugins.openAdsList();
            // بيتأكد إن الـ switch مفتوح / مقفول
            await plugins.assertSwitch(plugins.adSwitch(name), true);
        });

        // خطوة في التقرير: turn it OFF again (so it is not shown in the app)
        await test.step('turn it OFF again (so it is not shown in the app)', async () => {
            // بيشغّل / يقفل الإعلان من الـ switch
            await plugins.setAdActive(name, false);
            // بيفتح قايمة الإعلانات
            await plugins.openAdsList();
            // بيتأكد إن الـ switch مفتوح / مقفول
            await plugins.assertSwitch(plugins.adSwitch(name), false);
        });
    });

    // business rule on the page: "يمكنك إضافة إعلان واحد فقط لكل صفحة داخل التطبيق"
    // إعلان واحد بس شغال لنفس الصفحة
    test('[Negative] business rule: only ONE active ad for the same page', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const { samePage1, samePage2 } = pluginsData.tempAdNames;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(samePage1, storeLink));
        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(samePage2, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();

        // try / finally: اللي في finally بيتنفذ دايمًا (حتى لو حاجة فشلت)
        try {
            // بيشغّل / يقفل الإعلان من الـ switch
            await plugins.setAdActive(samePage1, true);
            // بيفتح قايمة الإعلانات
            await plugins.openAdsList();
            // بيشغّل / يقفل الإعلان من الـ switch
            await plugins.setAdActive(samePage2, true);

            // the 2 ads are on the same page, so they must NOT be ON together
            await plugins.openAdsList();
            // switch الإعلان، وبيحفظ النتيجة في first
            const first = await plugins.adSwitch(samePage1).getAttribute('aria-checked');
            // switch الإعلان، وبيحفظ النتيجة في second
            const second = await plugins.adSwitch(samePage2).getAttribute('aria-checked');
            // بيتأكد إن first === 'true' && second === 'true' غلط (false)
            expect(first === 'true' && second === 'true', 'two ads are ON for the same page').toBeFalsy();
        // finally = بيتنفذ دايمًا (بيقفل / بينضّف)
        } finally {
            // clean: turn both OFF
            await plugins.openAdsList();
            // بيشغّل / يقفل الإعلان من الـ switch
            await plugins.setAdActive(samePage1, false);
            // بيشغّل / يقفل الإعلان من الـ switch
            await plugins.setAdActive(samePage2, false);
        }
    });
});

//===================أيقونة واتساب: more cases===================
// حالات تانية للواتساب
test.describe('Merchant - plugins and ads: more WhatsApp cases', { tag: '@plugins' }, () => {
    // they change the same settings
    test.describe.configure({ mode: 'serial' });

    // الواتساب مع الحركة: المسافات بتختفي والشكل بيتحفظ
    test('[Positive] WhatsApp with movement ON: the paddings are hidden and the shape is saved', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // data = داتا التست مع تغيير بسيط
        const data = { ...pluginsData.whatsapp, movement: true, shape: pluginsData.whatsappWithMovement.shape };

        // بيفتح الصفحة
        await plugins.open();
        // بيشغّل أيقونة الواتساب ويملى بياناتها
        await plugins.setWhatsapp(data);
        // SEEN on stg: hidden when movement is ON
        await expect(plugins.whatsappRightPadding_tb).toBeHidden();
        // بيتأكد إن خانة whatsappBottomPadding مش ظاهر
        await expect(plugins.whatsappBottomPadding_tb).toBeHidden();
        // the preview shows the new shape
        await plugins.assertWhatsappShape(data.shape);
        // بيدوس حفظ ويتأكد إن الحفظ نجح
        await plugins.saveAndCheck(plugins.Save_btn);

        // بيعمل reload للصفحة
        await plugins.reload();
        // بيتأكد إن بيانات الواتساب اتحفظت
        await plugins.assertWhatsapp(data);
        // بيتأكد إن شكل أيقونة الواتساب هو ده
        await plugins.assertWhatsappShape(data.shape);
    });

    // إيقاف أيقونة الواتساب وتشغيلها تاني
    test('[Positive] turn the WhatsApp icon OFF, then ON again', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيفتح التاب ده
        await plugins.openTab(plugins.tabs.whatsapp);
        // بيقفل الـ switch
        await plugins.switchOff(plugins.enabled_switch);
        // بيدوس حفظ ويتأكد إن الحفظ نجح
        await plugins.saveAndCheck(plugins.Save_btn);
        // بيعمل reload للصفحة
        await plugins.reload();
        // بيفتح التاب ده
        await plugins.openTab(plugins.tabs.whatsapp);
        // بيتأكد إن الـ switch مفتوح / مقفول
        await plugins.assertSwitch(plugins.enabled_switch, false);

        // turn it ON again (with new data, so the save button is enabled)
        await plugins.setWhatsapp(pluginsData.whatsapp);
        // بيدوس حفظ ويتأكد إن الحفظ نجح
        await plugins.saveAndCheck(plugins.Save_btn);
        // بيعمل reload للصفحة
        await plugins.reload();
        // بيتأكد إن بيانات الواتساب اتحفظت
        await plugins.assertWhatsapp(pluginsData.whatsapp);
    });
});

//===================سياسة الخصوصية: more cases===================
// حالات تانية لسياسة الخصوصية
test.describe('Merchant - plugins and ads: more privacy policy cases', { tag: '@plugins' }, () => {
    // they change the same settings
    test.describe.configure({ mode: 'serial' });

    // التنسيق (Bold / Italic / Underline) بيتحفظ
    test('[Positive] privacy policy formatting: Bold, Italic and Underline are saved', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيشغّل سياسة الخصوصية ويكتب النص
        await plugins.setPrivacyPolicy(pluginsData.privacyPolicy.text);
        // Data-Driven: بيلف على pluginsData.privacyFormats، وبيعمل الكود اللي جوه لكل format
        for (const format of pluginsData.privacyFormats) {
            // بيكتب كلمة بتنسيق (Bold / Italic / Underline)
            await plugins.addFormattedWord(format.word, format.button);
        }
        // بيدوس حفظ ويتأكد إن الحفظ نجح
        await plugins.saveAndCheck(plugins.Save_btn);

        // بيعمل reload للصفحة
        await plugins.reload();
        // بيفتح التاب ده
        await plugins.openTab(plugins.tabs.privacy);
        // Data-Driven: بيلف على pluginsData.privacyFormats، وبيعمل الكود اللي جوه لكل format
        for (const format of pluginsData.privacyFormats) {
            // بيتأكد إن التنسيق اتحفظ
            await plugins.assertFormattedWord(format.word, format.tag);
        }
    });

    // إيقاف سياسة الخصوصية: النص المفروض يفضل موجود
    test('[Positive] turn the privacy policy OFF (the text is kept), then ON again', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // text = pluginsData.privacyPolicy.text
        const text = pluginsData.privacyPolicy.text;

        // خطوة في التقرير: start from a known text (ON)
        await test.step('start from a known text (ON)', async () => {
            // بيفتح الصفحة
            await plugins.open();
            // بيشغّل سياسة الخصوصية ويكتب النص
            await plugins.setPrivacyPolicy(text);
            // بيدوس حفظ ويتأكد إن الحفظ نجح
            await plugins.saveAndCheck(plugins.Save_btn);
        });

        // خطوة في التقرير: turn it OFF: it is OFF after reload and the text is NOT deleted
        await test.step('turn it OFF: it is OFF after reload and the text is NOT deleted', async () => {
            // بيعمل reload للصفحة
            await plugins.reload();
            // بيفتح التاب ده
            await plugins.openTab(plugins.tabs.privacy);
            // بيقفل الـ switch
            await plugins.switchOff(plugins.enabled_switch);
            // بيدوس حفظ ويتأكد إن الحفظ نجح
            await plugins.saveAndCheck(plugins.Save_btn);
            // بيعمل reload للصفحة
            await plugins.reload();
            // بيفتح التاب ده
            await plugins.openTab(plugins.tabs.privacy);
            // بيتأكد إن الـ switch مفتوح / مقفول
            await plugins.assertSwitch(plugins.enabled_switch, false);
            // SEEN on stg: turning it OFF DELETES the text (privacy_policy_content = null).
            // soft: the error is saved but the test continues, so the policy is turned ON again below
            await expect.soft(plugins.privacyEditor, 'the policy text must NOT be deleted when the policy is turned OFF')
                .toContainText(text);
        });

        // خطوة في التقرير: turn it ON again (with the text, so the merchant is not left with an empty policy)
        await test.step('turn it ON again (with the text, so the merchant is not left with an empty policy)', async () => {
            // بيشغّل سياسة الخصوصية ويكتب النص
            await plugins.setPrivacyPolicy(text);
            // بيدوس حفظ ويتأكد إن الحفظ نجح
            await plugins.saveAndCheck(plugins.Save_btn);
            // بيعمل reload للصفحة
            await plugins.reload();
            // بيتأكد إن سياسة الخصوصية اتحفظت
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
        // التست ده بياخد: merchantPO = متصفح التاجر
        test(`[Positive] the page has the tab "${tab}"`, async ({ merchantPO }) => {
            // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
            const plugins = merchantPO.getMerchantPluginsAdsPage();

            // بيفتح الصفحة
            await plugins.open();
            // بيتأكد إن تاب في الصفحة (tab) ظاهر
            await expect(plugins.tab(tab)).toBeVisible();
        });
    }

    // Alternative 1: الحفظ فشل (الإضافات): بتظهر رسالة خطأ
    test('[Negative] WhatsApp: when saving fails, an error message is shown', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        await plugins.page.route('**/whatsapp-settings/**', route =>
            route.request().method() === 'GET' ? route.continue() : route.fulfill({ status: 500, body: '{}' }));
        // بيشغّل أيقونة الواتساب ويملى بياناتها
        await plugins.setWhatsapp(pluginsData.whatsapp);
        // بيدوس على زرار Save
        await plugins.Save_btn.click();
        // بيتأكد إن الرسالة دي ظهرت
        await plugins.assertMessage(pluginsData.messages.saveFailed);
    });

    // business rule: مينفعش تفعيل الواتساب برقم مش صحيح
    test('[Negative] WhatsApp: a wrong phone number is not saved', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيشغّل أيقونة الواتساب ويملى بياناتها
        await plugins.setWhatsapp({ ...pluginsData.whatsapp, phone: pluginsData.invalidPhone });
        // بيدوس حفظ ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await plugins.clickAndWaitForSave(plugins.Save_btn);
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok(), 'a wrong number must be rejected').toBeFalsy();
        // بيتأكد إن الرسالة دي ظهرت
        await plugins.assertMessage(pluginsData.messages.saveFailed);
    });

    // Alternative 3: بيانات ناقصة: رسالة لكل خانة والحفظ بيتمنع
    test('[Negative] ad: empty fields show a message for each field', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيفتح الصفحة
        await plugins.open();
        // بيدوس "إضافة إعلان"
        await plugins.startNewAd();
        // بيدوس على زرار SaveAd
        await plugins.SaveAd_btn.click();
        // بيتأكد إن رسالة خطأ تحت الخانة (pluginsData.messages.fieldRequired) ظاهر
        await expect(plugins.fieldMessage(pluginsData.messages.fieldRequired)).toBeVisible();
        // بيتأكد إن الصفحة الرابط بقى /offers-ads\/create/
        await expect(plugins.page).toHaveURL(/offers-ads\/create/);
    });

    // Alternative 4: صورة أكبر من 5 ميجا بتترفض
    test('[Negative] ad: an image bigger than 5 MB is rejected', async ({ merchantPO }, testInfo) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // bigImage = testInfo.outputPath('big.png')
        const bigImage = testInfo.outputPath('big.png');
        fs.writeFileSync(bigImage, Buffer.concat([fs.readFileSync(paths.logo), Buffer.alloc(6 * 1024 * 1024)]));

        // بيفتح الصفحة
        await plugins.open();
        // بيدوس "إضافة إعلان"
        await plugins.startNewAd();
        // بيدوس على زرار القالب (pluginsData.imageAd.template)
        await plugins.templateButton(pluginsData.imageAd.template).click();
        // بيرفع الملف ده
        await plugins.adImage_file.setInputFiles(bigImage);
        // بيتأكد إن رسالة الخطأ دي ظهرت تحت الخانة
        await plugins.assertFieldError(pluginsData.messages.bigImage);
    });

    // business rule: رابط الظهور لازم يكون من دومين المتجر
    test('[Negative] ad: a link outside the store is not saved', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await plugins.open();
        // بيدوس "إضافة إعلان"
        await plugins.startNewAd();
        // بيملى فورم الإعلان
        await plugins.fillAd({ ...textAd(pluginsData.caseAdNames.inactive, storeLink), destinationUrl: pluginsData.outsideLink });
        // بيدوس على زرار SaveAd
        await plugins.SaveAd_btn.click();
        // بيستنى 3000 ميلي ثانية
        await plugins.page.waitForTimeout(3000);
        // ما اتحفظش
        await expect(plugins.page).toHaveURL(/offers-ads\/create/);
    });

    // Main flow 12-13: الإعلان الجديد بيتحفظ "غير مفعل" وبتظهر رسالة النجاح
    test('[Positive] a new ad is saved NOT active, with a success message', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.caseAdNames.inactive
        const name = pluginsData.caseAdNames.inactive;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيتأكد إن الرسالة دي ظهرت
        await plugins.assertMessage(pluginsData.messages.created);
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن الـ switch مفتوح / مقفول
        await plugins.assertSwitch(plugins.adSwitch(name), false);
    });

    // Main flow 4: كل إعلان في القايمة بيعرض القالب والصورة والحالة وتاريخ الإنشاء
    test('[Positive] the ad card shows the template, the image, the status and the date', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.caseAdNames.inactive
        const name = pluginsData.caseAdNames.inactive;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // card = plugins.adCard(name)
        const card = plugins.adCard(name);
        // بيتأكد إن card فيه النص 'القالب' (soft: لو فشل التست يكمّل)
        await expect.soft(card, 'the card must show the template').toContainText('القالب');
        // بيتأكد إن صورة الإعلان (name) موجود (soft: لو فشل التست يكمّل)
        await expect.soft(plugins.adImage(name), 'the card must show a small preview').not.toHaveCount(0);
        // بيتأكد إن card فيه النص /مفعل|غير مفعل/ (soft: لو فشل التست يكمّل)
        await expect.soft(card, 'the card must show the status').toContainText(/مفعل|غير مفعل/);
        // بيتأكد إن card فيه النص /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/ (soft: لو فشل التست يكمّل)
        await expect.soft(card, 'the card must show the date').toContainText(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);
    });

    // Alternative 1: لو مفيش إعلانات بتظهر رسالة (SEEN on stg: "لا توجد إعلانات بعد")
    test('[Negative] no ads: a "no ads" message is shown', async ({ merchantPO }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();

        // بيمسح كل الإعلانات
        await plugins.deleteAllAds();
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن نص في الصفحة (pluginsData.messages.noAds) ظاهر
        await expect(plugins.text(pluginsData.messages.noAds)).toBeVisible();
    });

    // Alternative 7: مينفعش تفعيل أكتر من 3 إعلانات
    test('[Negative] business rule: no more than 3 active ads', async ({ merchantPO, requestNumber }) => {
        // بيدّي التست وقت أطول (6 * 60 * 1000 ميلي ثانية)
        test.setTimeout(6 * 60 * 1000);
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // site = new URL(storeLink).origin
        const site = new URL(storeLink).origin;

        // بيمسح كل الإعلانات
        await plugins.deleteAllAds();
        // 4 إعلانات على 4 صفحات مختلفة
        for (let n = 1; n <= 4; n++) {
            // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
            await plugins.createAd({ ...textAd(pluginsData.caseAdNames.limit(n), storeLink), destinationUrl: `${site}/qa-page-${n}` });
        }
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيكرر الكود اللي جوه كذا مرة
        for (let n = 1; n <= 3; n++) {
            // بيشغّل / يقفل الإعلان من الـ switch
            await plugins.setAdActive(pluginsData.caseAdNames.limit(n), true);
        }
        // الرابع لازم يترفض
        await plugins.setAdActive(pluginsData.caseAdNames.limit(4), true);

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن الـ switch مفتوح / مقفول
        await plugins.assertSwitch(plugins.adSwitch(pluginsData.caseAdNames.limit(4)), false);
    });

    // تعديل: الصفحة بتفتح بكل بيانات الإعلان، والحالة ما بتتغيرش بعد الحفظ
    test('[Positive] edit: the form has all the ad data and the status does not change', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.caseAdNames.activeEdit
        const name = pluginsData.caseAdNames.activeEdit;

        // بيمسح كل الإعلانات
        await plugins.deleteAllAds();
        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيشغّل / يقفل الإعلان من الـ switch
        await plugins.setAdActive(name, true);

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيفتح الإعلان للتعديل
        await plugins.openAdForEdit(name);
        // بيتأكد إن خانة adDestinationUrl فيه القيمة storeLink
        await expect(plugins.adDestinationUrl_tb).toHaveValue(storeLink);
        // بيتأكد إن خانة adTitle فيه القيمة pluginsData.ad.title
        await expect(plugins.adTitle_tb).toHaveValue(pluginsData.ad.title);
        // بيكتب `${pluginsData.ad.title} 2` في خانة adTitle
        await plugins.adTitle_tb.fill(`${pluginsData.ad.title} 2`);
        // بيحفظ الإعلان
        await plugins.saveAd();

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // لسه مفعل
        await plugins.assertSwitch(plugins.adSwitch(name), true);
        // بيشغّل / يقفل الإعلان من الـ switch
        await plugins.setAdActive(name, false);
    });

    // تعديل Alternative 2: تعديل إعلان مفعل بيظهر تنبيه
    test('[Negative] edit an active ad: a warning is shown', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.caseAdNames.activeEdit
        const name = pluginsData.caseAdNames.activeEdit;

        // بيمسح كل الإعلانات
        await plugins.deleteAllAds();
        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيشغّل / يقفل الإعلان من الـ switch
        await plugins.setAdActive(name, true);

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيدوس على زرار تعديل الإعلان (name)
        await plugins.adEdit_btn(name).click();
        // بيكتب `${pluginsData.ad.title} 2` في خانة adTitle
        await plugins.adTitle_tb.fill(`${pluginsData.ad.title} 2`);
        // بيدوس على زرار SaveAd
        await plugins.SaveAd_btn.click();
        // بيتأكد إن رسالة في الصفحة (pluginsData.messages.activeAdWarning) ظاهر
        await expect(plugins.toast(pluginsData.messages.activeAdWarning)).toBeVisible();
    });

    // تكرار: الإعلان الجديد بياخد اسم جديد ويكون غير مفعل
    test('[Positive] duplicate: the copy gets a new name and is NOT active', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.caseAdNames.duplicate
        const name = pluginsData.caseAdNames.duplicate;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيدوس على زرار تكرار الإعلان (name)
        await plugins.adDuplicate_btn(name).click();
        // بيتأكد إن خانة adName مش فيه القيمة name
        await expect(plugins.adName_tb, 'the copy must get a new default name').not.toHaveValue(name);
    });

    // حذف Alternative 1: حذف إعلان مفعل بيظهر تنبيه
    test('[Negative] delete an active ad: a warning is shown', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.caseAdNames.activeDelete
        const name = pluginsData.caseAdNames.activeDelete;

        // بيمسح كل الإعلانات
        await plugins.deleteAllAds();
        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيشغّل / يقفل الإعلان من الـ switch
        await plugins.setAdActive(name, true);

        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيدوس على زرار حذف الإعلان (name)
        await plugins.adDeleteButton(name).click();
        // بيتأكد إن نافذة الحذف فيه النص pluginsData.messages.activeAdWarning
        await expect(plugins.deleteDialog).toContainText(pluginsData.messages.activeAdWarning);
    });

    // حذف: رسالة النجاح
    test('[Positive] delete: "تم حذف الإعلان بنجاح" is shown', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // name = pluginsData.tempAdNames.delete
        const name = pluginsData.tempAdNames.delete;

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(name, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيمسح الإعلان
        await plugins.deleteAd(name);
        // بيتأكد إن الرسالة دي ظهرت
        await plugins.assertMessage(pluginsData.messages.deleted);
    });

    // حذف Alternative 4: الحذف الجماعي (Checkbox + "حذف المحدد")
    test('[Positive] bulk delete: select ads and delete them together', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة الإضافات والإعلانات من متصفح التاجر
        const plugins = merchantPO.getMerchantPluginsAdsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيعمل إعلان كامل (يفتح الفورم ويملاه ويحفظ)
        await plugins.createAd(textAd(pluginsData.tempAdNames.delete, storeLink));
        // بيفتح قايمة الإعلانات
        await plugins.openAdsList();
        // بيتأكد إن checkbox الإعلان ظاهر
        await expect(plugins.adCheckbox(), 'every ad must have a checkbox').toBeVisible();
        // بيتأكد إن زرار "حذف المحدد" موجود في الصفحة
        await expect(plugins.deleteSelected_btn()).toBeAttached();
    });
});
