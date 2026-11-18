// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب data من testData/adminNotifications.ts
import data from '../../testData/adminNotifications';

// admin > إدارة الإشعارات (requirements/AdminNotificationsPage.md = UC-9)
// الإشعار بيتبعت لتاجر التست بس، والإشعارات التانية محمية

// notification = data.notification
const notification = data.notification;

//===================إرسال إشعار والتجربة عليه===================
test.describe('Admin - notifications: send and test it', { tag: '@adminNotifications' }, () => {

    // إرسال إشعار لتاجر التست
    test('[Positive] send a notification', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // بيبعت إشعار (يملى الفورم ويدوس إرسال) ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await notifications.sendNotification(notification);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();
        // بيتأكد إن رسالة "تم الإرسال" ظهرت
        await notifications.assertSent();
    });

    // مينفعش تبعت أكتر من إشعار كل 30 ثانية
    test('[Negative] business rule: a second notification in less than 30 seconds is rejected', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // بيبعت إشعار (يملى الفورم ويدوس إرسال) ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await notifications.sendNotification(notification);
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok()).toBeFalsy();
    });

    // البحث بالعنوان بيظهر الإشعار
    test('[Positive] search by title shows the notification', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // بيفتح الصفحة
        await notifications.open();
        // بيكتب في البحث ويستنى النتيجة
        await notifications.search(notification.title);
    });

    // تاجر التست بيلاقي الإشعار في أيقونة الإشعارات
    test('[Positive] the merchant sees the notification in the bell', async ({ testMerchantPO }) => {
        // بيتأكد إن الإشعار وصل في الجرس
        await testMerchantPO.getMerchantAppPage().assertNewNotification(notification.title);
    });

    // عرض الإشعار: العنوان والمحتوى والمستلم
    test('[Positive] view: the details show the notification data', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // بيدوّر على الإشعار ويفتح صفه
        await notifications.openNotification(notification.title);
        // بيدوس على الأيقونة دي
        await notifications.clickIcon('عرض الإشعار');
        // بيتأكد إن الصفحة فيه النص notification.title
        await expect(notifications.main).toContainText(notification.title);
        // بيتأكد إن الصفحة فيه النص notification.content
        await expect(notifications.main).toContainText(notification.content);
        // بيتأكد إن الصفحة فيه النص notification.recipient
        await expect(notifications.main).toContainText(notification.recipient);
    });

    // نسخ الإشعار: الفورم بتتفتح بنفس البيانات (من غير إرسال)
    test('[Positive] copy: the form opens with the same data', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // بيدوّر على الإشعار ويفتح صفه
        await notifications.openNotification(notification.title);
        // بيدوس على الأيقونة دي
        await notifications.clickIcon('نسخ الإشعار');
        // بيتأكد إن خانة title فيه القيمة notification.title
        await expect(notifications.title_tb).toHaveValue(notification.title);
        // بيتأكد إن خانة content فيه القيمة notification.content
        await expect(notifications.content_tb).toHaveValue(notification.content);
    });

    // إعادة الإرسال بتعمل إشعار جديد برقم جديد
    test('[Positive] resend: a new notification with a new number', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // قاعدة الـ 30 ثانية
        await notifications.page.waitForTimeout(31000);
        // بيدوّر على الإشعار ويفتح صفه
        await notifications.openNotification(notification.title);
        // بيقرا رقم الإشعار، وبيحفظ النتيجة في oldNumber
        const oldNumber = await notifications.getNumber();

        // بيعيد إرسال الإشعار، وبيحفظ النتيجة في response
        const response = await notifications.resendNotification(notification.title);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();

        // بيدوّر على الإشعار ويفتح صفه
        await notifications.openNotification(notification.title);
        // بيتأكد إن بيقرا رقم الإشعار مش بيساوي oldNumber
        expect(await notifications.getNumber()).not.toBe(oldNumber);
    });

    // حذف الإشعارين (الأصلي واللي اتعاد إرساله): مش بيظهروا في الجدول
    test('[Positive] delete: the notification is not in the table', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // بيتأكد إن بيمسح الإشعار (notification.title) ok )).toBeTruthy(
        expect((await notifications.deleteNotification(notification.title)).ok()).toBeTruthy();
        // بيتأكد إن بيمسح الإشعار (notification.title) ok )).toBeTruthy(
        expect((await notifications.deleteNotification(notification.title)).ok()).toBeTruthy();
        // بيتأكد إنه مش موجود في الجدول
        await notifications.assertNotInTable(notification.title);
    });

    // الحذف من جدول الأدمن ما بيمسحش الإشعار من عند التاجر
    test('[Positive] business rule: after delete, the merchant still has the notification', async ({ testMerchantPO }) => {
        // بيتأكد إن الإشعار وصل في الجرس
        await testMerchantPO.getMerchantAppPage().assertNewNotification(notification.title);
    });
});

//===================القايمة والفلتر (من غير أي تغيير)===================
test.describe('Admin - notifications: list and filter', { tag: '@adminNotifications' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of data.columns) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            // بيجيب صفحة الإشعارات من متصفح الأدمن
            const notifications = adminPO.getAdminNotificationsPage();

            // بيفتح الصفحة
            await notifications.open();
            // بيتأكد إن العمود ده موجود في الجدول
            await notifications.assertColumn(column);
        });
    }

    // Data-Driven: كل صف فيه أيقونات عرض / إعادة إرسال / نسخ / حذف
    for (const icon of data.rowButtons) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] every notification has the icon "${icon}"`, async ({ adminPO }) => {
            // بيجيب صفحة الإشعارات من متصفح الأدمن
            const notifications = adminPO.getAdminNotificationsPage();

            // بيفتح الصفحة
            await notifications.open();
            // بيتأكد إن الأيقونة دي موجودة
            await notifications.assertIcon(icon);
        });
    }

    // Data-Driven: فلتر نوع المستلمين بيعرض النوع ده بس
    for (const type of data.recipientTypes) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] filter by "${type}" shows only this type`, async ({ adminPO }) => {
            // بيجيب صفحة الإشعارات من متصفح الأدمن
            const notifications = adminPO.getAdminNotificationsPage();

            // بيفتح الصفحة
            await notifications.open();
            // بيفلتر بالنوع ده
            await notifications.filterByType(type);
            // بيتأكد إن كل الصفوف من النوع ده بس
            await notifications.assertOnlyType(type);
        });
    }

    // الفورم فاضية: زرار الإرسال مقفول
    test('[Negative] the send button is disabled when the form is empty', async ({ adminPO }) => {
        // بيجيب صفحة الإشعارات من متصفح الأدمن
        const notifications = adminPO.getAdminNotificationsPage();

        // بيفتح الصفحة
        await notifications.open();
        // بيدوس على زرار add
        await notifications.add_btn.click();
        // بيتأكد إن زرار send مقفول
        await expect(notifications.send_btn).toBeDisabled();
    });
});
