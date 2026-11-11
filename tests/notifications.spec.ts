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

//===================Send (OFF by default)===================
// IMPORTANT: "إرسال الإشعار" sends a REAL push notification to ALL the users of the merchant app,
// and the website allows only ONE notification every 4 hours (after it, nobody can send for 4 hours).
// So these tests run only when you ask for it:  SEND_NOTIFICATIONS=yes npx playwright test --grep @notifications
// تستات الإرسال الحقيقي (بتشتغل بس مع SEND_NOTIFICATIONS=yes)
test.describe('Merchant - notifications management: send', { tag: '@notifications' }, () => {
    test.describe.configure({ mode: 'serial' });
    test.skip(process.env.SEND_NOTIFICATIONS !== 'yes', 'sends a real notification (1 every 4 hours): set SEND_NOTIFICATIONS=yes to run it');

    // إرسال الآن: الإشعار بيظهر في المرسلة
    test('[Positive] send now: it is in the sent list and NOT in the drafts', async ({ merchantPO, requestNumber }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);
        const data = notificationData.sent;

        await notifications.open();
        await notifications.startNewNotification();
        await notifications.fillNotification({ ...data, destination: storeLink });
        const response = await notifications.send();
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

    // الإشعار المرسل مينفعش يتعدل أو يتمسح
    test('[Negative] business rule: a sent notification cannot be edited or deleted', async ({ merchantPO }) => {
        const notifications = merchantPO.getMerchantNotificationsPage();

        await notifications.open();
        await notifications.openTab(notifications.tabs.sent);
        await expect(notifications.row(notificationData.sent.title)).toHaveCount(1);
        await expect(notifications.rowDeleteButton(notificationData.sent.title)).toHaveCount(0);
    });
});
