import { test, expect } from '../fixtures/fixtures';
import notificationData from '../testData/notifications';

// merchant > إدارة الإشعارات
// the merchant is already logged in (global setup), every test starts from the dashboard
// IMPORTANT: these tests ADD drafts (nothing is deleted, the website deletes drafts after 30 days)
// the tests do not depend on each other, so if one fails the others still run

//===================Test Cases===================
// تستات إدارة الإشعارات (من غير إرسال حقيقي)
test.describe('Merchant - notifications management', { tag: '@notifications' }, () => {

    // الصفحة فيها المرسلة والمسودات وزرار الإضافة
    test('[Positive] the page has the sent list, the drafts and the add button', async ({ merchantPO }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();

        await notifications.open();
        await expect(notifications.addNotification_btn).toBeVisible();
        await notifications.openTab(notifications.tabs.sent);
        await expect(notifications.rows.first()).toBeVisible();
        await notifications.openTab(notifications.tabs.drafts);
        await expect(notifications.draftsAutoDelete_msg).toBeVisible();     // business rule: 30 days
    });

    // زرار الإرسال مقفول لحد ما الخانات المطلوبة تتملي
    test('[Negative] send is disabled until the required fields are filled', async ({ merchantPO, requestNumber }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await notifications.open();
        await notifications.startNewNotification();
        await expect(notifications.fourHoursRule_msg).toBeVisible();        // business rule: 1 every 4 hours
        await notifications.assertSendDisabled();

        await notifications.fillNotification({ ...notificationData.draft, destination: storeLink });
        await notifications.assertSendEnabled();                             // we do NOT click it here
    });

    // مينفعش تحفظ مسودة من غير عنوان
    test('[Negative] cannot save a draft without a title', async ({ merchantPO, requestNumber }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await notifications.open();
        await notifications.startNewNotification();
        await notifications.fillNotification({ ...notificationData.draft, title: '', destination: storeLink });
        await notifications.SaveDraft_btn.click();

        await notifications.assertFieldError(notificationData.errors.titleMinLength);
        await expect(notifications.page).toHaveURL(/create-notification/);   // still on the create page
    });

    // المعاينة بتعرض العنوان والنص
    test('[Positive] the preview shows the title and the text', async ({ merchantPO, requestNumber }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await notifications.open();
        await notifications.startNewNotification();
        await notifications.fillNotification({ ...notificationData.draft, destination: storeLink });
        await notifications.assertPreview(notificationData.draft.title, notificationData.draft.message);
    });

    // حفظ مسودة: بتظهر في المسودات ومش في المرسلة
    test('[Positive] save as draft: it is in the drafts and NOT in the sent list', async ({ merchantPO, requestNumber }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const data = notificationData.draft;

        await notifications.open();
        await notifications.startNewNotification();
        await notifications.fillNotification({ ...data, destination: storeLink });
        await notifications.saveDraft();

        await notifications.open();
        await notifications.assertInList(notifications.tabs.drafts, data.title, data.validity);
        await notifications.assertNotInList(notifications.tabs.sent, data.title);
    });

    // حفظ مسودة فيها صورة
    test('[Positive] save a draft with an image (SVG/PNG)', async ({ merchantPO, requestNumber }) => {
        test.setTimeout(4 * 60 * 1000);
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const data = notificationData.draftWithImage;

        await notifications.open();
        await notifications.startNewNotification();
        await notifications.fillNotification({ ...data, destination: storeLink });

        // SEEN on stg: with an image the save is very slow (about 50s), we wait up to 2 minutes
        const start = Date.now();
        await notifications.saveDraft(120000);
        const seconds = Math.round((Date.now() - start) / 1000);
        test.info().annotations.push({ type: 'save time with image', description: `${seconds} seconds` });
        console.log(`save draft with image took ${seconds} seconds`);

        await notifications.open();
        await notifications.assertInList(notifications.tabs.drafts, data.title, data.validity);
    });

    // Alternative 1: the draft can be edited and saved again
    // تعديل مسودة (العنوان والمدة) وحفظها تاني
    test('[Positive] edit a draft: change the title and the validity and save again', async ({ merchantPO, requestNumber }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const data = { ...notificationData.draft, title: `${notificationData.draft.title} للتعديل` };
        const edited = notificationData.editedDraft;

        await test.step('create a draft to edit', async () => {
            await notifications.open();
            await notifications.startNewNotification();
            await notifications.fillNotification({ ...data, destination: storeLink });
            await notifications.saveDraft();
        });

        await test.step('open the draft, change it and save again', async () => {
            await notifications.open();
            await notifications.openDraft(data.title);
            await notifications.title_tb.fill(edited.title);
            await notifications.main.getByRole('radio', { name: edited.validity }).check({ force: true });
            await notifications.saveDraft();
        });

        await test.step('the drafts list has the new title and validity (and not the old title)', async () => {
            await notifications.open();
            await notifications.assertInList(notifications.tabs.drafts, edited.title, edited.validity);
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
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const data = notificationData.sent;

        await notifications.open();
        await notifications.startNewNotification();
        await notifications.fillNotification({ ...data, destination: storeLink });
        const response = await notifications.send();
        // قاعدة الـ 4 ساعات: فيه إشعار اتبعت قريب، فمينفعش نبعت دلوقتي
        test.skip(!response.ok() && /4/.test(await response.text()),
            `a notification was sent less than 4 hours ago: ${await response.text()}`);
        expect(response.ok(), `send failed with status ${response.status()}: ${await response.text()}`).toBeTruthy();

        await notifications.open();
        await notifications.assertInList(notifications.tabs.sent, data.title, data.validity);
        await notifications.assertNotInList(notifications.tabs.drafts, data.title);
    });

    // إشعار تاني قبل 4 ساعات بيترفض
    test('[Negative] business rule: a second notification in less than 4 hours is rejected', async ({ merchantPO, requestNumber }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const data = { ...notificationData.sent, title: `${notificationData.sent.title} الثاني` };

        await notifications.open();
        await notifications.startNewNotification();
        await notifications.fillNotification({ ...data, destination: storeLink });
        const response = await notifications.send();
        expect(response.ok(), 'the second notification must be rejected').toBeFalsy();

        await notifications.open();
        await notifications.assertNotInList(notifications.tabs.sent, data.title);
    });

    // الإشعار المرسل مينفعش يتعدل أو يتمسح (أول إشعار في "المرسلة")
    test('[Negative] business rule: a sent notification cannot be edited or deleted', async ({ merchantPO }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();

        await notifications.open();
        await notifications.openTab(notifications.tabs.sent);
        await expect(notifications.rows.first(), 'there is no sent notification to check').not.toContainText(notificationData.emptyListText);
        await expect(notifications.rows.first().locator('button:has(svg[class*="text-red"])')).toHaveCount(0);
    });
});
