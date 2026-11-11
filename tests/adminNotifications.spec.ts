import { test, expect } from '../fixtures/fixtures';
import data from '../testData/adminNotifications';

// admin > إدارة الإشعارات (requirements/AdminNotificationsPage.md = UC-9)
// الإشعار بيتبعت لتاجر التست بس، والإشعارات التانية محمية

const notification = data.notification;

//===================إرسال إشعار والتجربة عليه===================
test.describe('Admin - notifications: send and test it', { tag: '@adminNotifications' }, () => {

    // إرسال إشعار لتاجر التست
    test('[Positive] send a notification', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        const response = await notifications.sendNotification(notification);
        expect(response.ok()).toBeTruthy();
        await notifications.assertSent();
    });

    // مينفعش تبعت أكتر من إشعار كل 30 ثانية
    test('[Negative] business rule: a second notification in less than 30 seconds is rejected', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        const response = await notifications.sendNotification(notification);
        expect(response.ok()).toBeFalsy();
    });

    // البحث بالعنوان بيظهر الإشعار
    test('[Positive] search by title shows the notification', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        await notifications.open();
        await notifications.search(notification.title);
    });

    // تاجر التست بيلاقي الإشعار في أيقونة الإشعارات
    test('[Positive] the merchant sees the notification in the bell', async ({ testMerchantPO }) => {
        await testMerchantPO.getMerchantAppPage().assertNewNotification(notification.title);
    });

    // عرض الإشعار: العنوان والمحتوى والمستلم
    test('[Positive] view: the details show the notification data', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        await notifications.openNotification(notification.title);
        await notifications.clickIcon('عرض الإشعار');
        await expect(notifications.page.locator('main')).toContainText(notification.title);
        await expect(notifications.page.locator('main')).toContainText(notification.content);
        await expect(notifications.page.locator('main')).toContainText(notification.recipient);
    });

    // نسخ الإشعار: الفورم بتتفتح بنفس البيانات (من غير إرسال)
    test('[Positive] copy: the form opens with the same data', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        await notifications.openNotification(notification.title);
        await notifications.clickIcon('نسخ الإشعار');
        await expect(notifications.title_tb).toHaveValue(notification.title);
        await expect(notifications.content_tb).toHaveValue(notification.content);
    });

    // إعادة الإرسال بتعمل إشعار جديد برقم جديد
    test('[Positive] resend: a new notification with a new number', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        await notifications.page.waitForTimeout(31000);                  // قاعدة الـ 30 ثانية
        await notifications.openNotification(notification.title);
        const oldNumber = await notifications.getNumber();

        const response = await notifications.resendNotification(notification.title);
        expect(response.ok()).toBeTruthy();

        await notifications.openNotification(notification.title);
        expect(await notifications.getNumber()).not.toBe(oldNumber);
    });

    // حذف الإشعارين (الأصلي واللي اتعاد إرساله): مش بيظهروا في الجدول
    test('[Positive] delete: the notification is not in the table', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        expect((await notifications.deleteNotification(notification.title)).ok()).toBeTruthy();
        expect((await notifications.deleteNotification(notification.title)).ok()).toBeTruthy();
        await notifications.assertNotInTable(notification.title);
    });

    // الحذف من جدول الأدمن ما بيمسحش الإشعار من عند التاجر
    test('[Positive] business rule: after delete, the merchant still has the notification', async ({ testMerchantPO }) => {
        await testMerchantPO.getMerchantAppPage().assertNewNotification(notification.title);
    });
});

//===================القايمة والفلتر (من غير أي تغيير)===================
test.describe('Admin - notifications: list and filter', { tag: '@adminNotifications' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of data.columns) {
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            const notifications = adminPO.getAdminNotificationsPage();

            await notifications.open();
            await notifications.assertColumn(column);
        });
    }

    // Data-Driven: كل صف فيه أيقونات عرض / إعادة إرسال / نسخ / حذف
    for (const icon of data.rowButtons) {
        test(`[Positive] every notification has the icon "${icon}"`, async ({ adminPO }) => {
            const notifications = adminPO.getAdminNotificationsPage();

            await notifications.open();
            await notifications.assertIcon(icon);
        });
    }

    // Data-Driven: فلتر نوع المستلمين بيعرض النوع ده بس
    for (const type of data.recipientTypes) {
        test(`[Positive] filter by "${type}" shows only this type`, async ({ adminPO }) => {
            const notifications = adminPO.getAdminNotificationsPage();

            await notifications.open();
            await notifications.filterByType(type);
            await notifications.assertOnlyType(type);
        });
    }

    // الفورم فاضية: زرار الإرسال مقفول
    test('[Negative] the send button is disabled when the form is empty', async ({ adminPO }) => {
        const notifications = adminPO.getAdminNotificationsPage();

        await notifications.open();
        await notifications.add_btn.click();
        await expect(notifications.send_btn).toBeDisabled();
    });
});
