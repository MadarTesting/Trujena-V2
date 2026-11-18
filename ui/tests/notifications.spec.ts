// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب notificationData من testData/notifications.ts
import notificationData from '../../testData/notifications';

// merchant > إدارة الإشعارات
// the merchant is already logged in (global setup), every test starts from the dashboard
// IMPORTANT: these tests ADD drafts (nothing is deleted, the website deletes drafts after 30 days)
// the tests do not depend on each other, so if one fails the others still run

//===================Test Cases===================
// تستات إدارة الإشعارات (من غير إرسال حقيقي)
test.describe('Merchant - notifications management', { tag: '@notifications' }, () => {

    // الصفحة فيها المرسلة والمسودات وزرار الإضافة
    test('[Positive] the page has the sent list, the drafts and the add button', async ({ merchantPO }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();

        // بيفتح الصفحة
        await notifications.open();
        // بيتأكد إن زرار addNotification ظاهر
        await expect(notifications.addNotification_btn).toBeVisible();
        // بيفتح التاب ده
        await notifications.openTab(notifications.tabs.sent);
        // بيتأكد إن أول صفوف الجدول ظاهر
        await expect(notifications.rows.first()).toBeVisible();
        // بيفتح التاب ده
        await notifications.openTab(notifications.tabs.drafts);
        // business rule: 30 days
        await expect(notifications.draftsAutoDelete_msg).toBeVisible();
    });

    // زرار الإرسال مقفول لحد ما الخانات المطلوبة تتملي
    test('[Negative] send is disabled until the required fields are filled', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس "إضافة إشعار"
        await notifications.startNewNotification();
        // business rule: 1 every 4 hours
        await expect(notifications.fourHoursRule_msg).toBeVisible();
        // بيتأكد إن زرار الإرسال مقفول
        await notifications.assertSendDisabled();

        // بيملى فورم الإشعار
        await notifications.fillNotification({ ...notificationData.draft, destination: storeLink });
        // we do NOT click it here
        await notifications.assertSendEnabled();
    });

    // مينفعش تحفظ مسودة من غير عنوان
    test('[Negative] cannot save a draft without a title', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس "إضافة إشعار"
        await notifications.startNewNotification();
        // بيملى فورم الإشعار
        await notifications.fillNotification({ ...notificationData.draft, title: '', destination: storeLink });
        // بيدوس على زرار SaveDraft
        await notifications.SaveDraft_btn.click();

        // بيتأكد إن رسالة الخطأ دي ظهرت تحت الخانة
        await notifications.assertFieldError(notificationData.errors.titleMinLength);
        // still on the create page
        await expect(notifications.page).toHaveURL(/create-notification/);
    });

    // المعاينة بتعرض العنوان والنص
    test('[Positive] the preview shows the title and the text', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس "إضافة إشعار"
        await notifications.startNewNotification();
        // بيملى فورم الإشعار
        await notifications.fillNotification({ ...notificationData.draft, destination: storeLink });
        // بيتأكد إن المعاينة فيها العنوان والنص
        await notifications.assertPreview(notificationData.draft.title, notificationData.draft.message);
    });

    // حفظ مسودة: بتظهر في المسودات ومش في المرسلة
    test('[Positive] save as draft: it is in the drafts and NOT in the sent list', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // data = notificationData.draft
        const data = notificationData.draft;

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس "إضافة إشعار"
        await notifications.startNewNotification();
        // بيملى فورم الإشعار
        await notifications.fillNotification({ ...data, destination: storeLink });
        // بيحفظ كمسودة ويستنى رد السيرفر
        await notifications.saveDraft();

        // بيفتح الصفحة
        await notifications.open();
        // بيتأكد إنه موجود في القايمة دي
        await notifications.assertInList(notifications.tabs.drafts, data.title, data.validity);
        // بيتأكد إنه مش موجود في القايمة دي
        await notifications.assertNotInList(notifications.tabs.sent, data.title);
    });

    // حفظ مسودة فيها صورة
    test('[Positive] save a draft with an image (SVG/PNG)', async ({ merchantPO, requestNumber }) => {
        // بيدّي التست وقت أطول (4 * 60 * 1000 ميلي ثانية)
        test.setTimeout(4 * 60 * 1000);
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // data = notificationData.draftWithImage
        const data = notificationData.draftWithImage;

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس "إضافة إشعار"
        await notifications.startNewNotification();
        // بيملى فورم الإشعار
        await notifications.fillNotification({ ...data, destination: storeLink });

        // SEEN on stg: with an image the save is very slow (about 50s), we wait up to 2 minutes
        const start = Date.now();
        // بيحفظ كمسودة ويستنى رد السيرفر
        await notifications.saveDraft(120000);
        // seconds = Math.round((Date.now() - start) / 1000)
        const seconds = Math.round((Date.now() - start) / 1000);
        test.info().annotations.push({ type: 'save time with image', description: `${seconds} seconds` });
        // بيطبع في الترمنال
        console.log(`save draft with image took ${seconds} seconds`);

        // بيفتح الصفحة
        await notifications.open();
        // بيتأكد إنه موجود في القايمة دي
        await notifications.assertInList(notifications.tabs.drafts, data.title, data.validity);
    });

    // Alternative 1: the draft can be edited and saved again
    // تعديل مسودة (العنوان والمدة) وحفظها تاني
    test('[Positive] edit a draft: change the title and the validity and save again', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // data = داتا التست مع تغيير بسيط
        const data = { ...notificationData.draft, title: `${notificationData.draft.title} للتعديل` };
        // edited = notificationData.editedDraft
        const edited = notificationData.editedDraft;

        // خطوة في التقرير: create a draft to edit
        await test.step('create a draft to edit', async () => {
            // بيفتح الصفحة
            await notifications.open();
            // بيدوس "إضافة إشعار"
            await notifications.startNewNotification();
            // بيملى فورم الإشعار
            await notifications.fillNotification({ ...data, destination: storeLink });
            // بيحفظ كمسودة ويستنى رد السيرفر
            await notifications.saveDraft();
        });

        // خطوة في التقرير: open the draft, change it and save again
        await test.step('open the draft, change it and save again', async () => {
            // بيفتح الصفحة
            await notifications.open();
            // بيفتح المسودة دي
            await notifications.openDraft(data.title);
            // بيكتب edited.title في خانة title
            await notifications.title_tb.fill(edited.title);
            // بيختار اختيار (radio) (edited.validity)
            await notifications.radio(edited.validity).check({ force: true });
            // بيحفظ كمسودة ويستنى رد السيرفر
            await notifications.saveDraft();
        });

        // خطوة في التقرير: the drafts list has the new title and validity (and not the old title)
        await test.step('the drafts list has the new title and validity (and not the old title)', async () => {
            // بيفتح الصفحة
            await notifications.open();
            // بيتأكد إنه موجود في القايمة دي
            await notifications.assertInList(notifications.tabs.drafts, edited.title, edited.validity);
            // بيتأكد إنه مش موجود في القايمة دي
            await notifications.assertNotInList(notifications.tabs.drafts, data.title);
        });
    });
});

//===================Send===================
// IMPORTANT: "إرسال الإشعار" بيبعت push notification حقيقي لكل مستخدمين تطبيق التاجر،
// والموقع بيسمح بإشعار واحد بس كل 4 ساعات:
// - لو فيه إشعار اتبعت من أقل من 4 ساعات، تست "إرسال الآن" بيتعمله skip (مش fail)
// - التستين التانيين بيشتغلوا دايمًا
// تستات الإرسال الحقيقي
test.describe('Merchant - notifications management: send', { tag: '@notifications' }, () => {

    // إرسال الآن: الإشعار بيظهر في المرسلة
    test('[Positive] send now: it is in the sent list and NOT in the drafts', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // data = notificationData.sent
        const data = notificationData.sent;

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس "إضافة إشعار"
        await notifications.startNewNotification();
        // بيملى فورم الإشعار
        await notifications.fillNotification({ ...data, destination: storeLink });
        // بيدوس إرسال ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await notifications.send();
        // قاعدة الـ 4 ساعات: فيه إشعار اتبعت قريب، فمينفعش نبعت دلوقتي
        test.skip(!response.ok() && /4/.test(await response.text()),
            `a notification was sent less than 4 hours ago: ${await response.text()}`);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), `send failed with status ${response.status()}: ${await response.text()}`).toBeTruthy();

        // بيفتح الصفحة
        await notifications.open();
        // بيتأكد إنه موجود في القايمة دي
        await notifications.assertInList(notifications.tabs.sent, data.title, data.validity);
        // بيتأكد إنه مش موجود في القايمة دي
        await notifications.assertNotInList(notifications.tabs.drafts, data.title);
    });

    // إشعار تاني قبل 4 ساعات بيترفض
    test('[Negative] business rule: a second notification in less than 4 hours is rejected', async ({ merchantPO, requestNumber }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();
        // بيقرا رابط المتجر بتاع الطلب، وبيحفظ النتيجة في storeLink
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        // data = داتا التست مع تغيير بسيط
        const data = { ...notificationData.sent, title: `${notificationData.sent.title} الثاني` };

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس "إضافة إشعار"
        await notifications.startNewNotification();
        // بيملى فورم الإشعار
        await notifications.fillNotification({ ...data, destination: storeLink });
        // بيدوس إرسال ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await notifications.send();
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok(), 'the second notification must be rejected').toBeFalsy();

        // بيفتح الصفحة
        await notifications.open();
        // بيتأكد إنه مش موجود في القايمة دي
        await notifications.assertNotInList(notifications.tabs.sent, data.title);
    });

    // الإشعار المرسل مينفعش يتعدل أو يتمسح (أول إشعار في "المرسلة")
    test('[Negative] business rule: a sent notification cannot be edited or deleted', async ({ merchantPO }) => {
        // بيجيب صفحة إدارة الإشعارات من متصفح التاجر
        const notifications = merchantPO.getMerchantNotificationsPage();

        // بيفتح الصفحة
        await notifications.open();
        // بيفتح التاب ده
        await notifications.openTab(notifications.tabs.sent);
        // بيتأكد إن أول صفوف الجدول مش فيه النص notificationData.emptyListText
        await expect(notifications.rows.first(), 'there is no sent notification to check').not.toContainText(notificationData.emptyListText);
        // بيتأكد إن أيقونة الحذف مش موجود
        await expect(notifications.deleteIcon()).toHaveCount(0);
    });
});
