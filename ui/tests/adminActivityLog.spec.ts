// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب data من testData/activityLog.ts
import data from '../../testData/activityLog';

// admin > سجل النشاطات (requirements/AdminActivityLogPage.md = UC-12)
// الصفحة عرض بس: التستات بتقرا بس ومش بتغير أي حاجة

//===================عرض السجل===================
test.describe('Admin - activity log: view', { tag: '@adminActivityLog' }, () => {

    // السجل بيفتح وفيه نشاطات (اسم المستخدم + التاريخ)
    test('[Positive] the log opens and shows the activities', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        // بيتأكد إن فيه نشاطات
        await log.assertHasActivities();
        // بيتأكد إن أول التواريخ ظاهر
        await expect(log.dates.first()).toBeVisible();
    });

    // كل نشاط لازم يبين اسم الموديول (مثلاً إضافة عميل = إدارة العملاء)
    test('[Positive] business rule: every activity shows the module name', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        // بيتأكد إن النشاط فيه النص واسم الموديول
        await log.assertActivityHas(data.customerActivity.text, data.customerActivity.module);
    });

    // business rule: مينفعش تعديل أو حذف أي نشاط
    test('[Negative] business rule: no edit or delete for the activities', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        // بيتأكد إن زرار editDelete مش موجود
        await expect(log.editDelete_btn).toHaveCount(0);
    });

    // Data-Driven: العمليات اللي التستات بتعملها كل run لازم تكون متسجلة
    for (const type of data.mustBeLogged) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] business rule: "${type}" is logged`, async ({ adminPO }) => {
            // بيجيب صفحة سجل النشاطات من متصفح الأدمن
            const log = adminPO.getAdminActivityLogPage();

            // بيفتح الصفحة
            await log.open();
            // بيفلتر بالنوع ده
            await log.filterByType(type);
            // بيتأكد إن فيه نشاطات
            await log.assertHasActivities();
        });
    }

    // الأدمن بيدخل لوحة عميل التست بالأدمن مود (من أيقونة إدارة العملاء)، والدخول ده لازم يتسجل في السجل
    test('[Positive] business rule: entering Admin Mode is logged', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // عدد نشاطات النهارده قبل الأدمن مود
        await log.open();
        // بيفلتر بيوم معين
        await log.filterByDay(data.todayButton);
        // بيعد النشاطات، وبيحفظ النتيجة في before
        const before = await log.countActivities();

        // الدخول بالأدمن مود
        const response = await customers.openAdminMode(data.adminModeCustomer);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();

        // لازم يظهر نشاط جديد
        await log.open();
        // بيفلتر بيوم معين
        await log.filterByDay(data.todayButton);
        // بيتأكد إن بيعد النشاطات أكبر من before
        expect(await log.countActivities(), 'entering Admin Mode was not logged').toBeGreaterThan(before);
    });

    // Alternative 1: فشل الاتصال بتظهر رسالة خطأ
    test('[Negative] when loading fails, an error message is shown', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيخلّي تحميل الصفحة يفشل
        await log.makeLoadFail();
        // بيفتح الصفحة
        await log.open();
        // بيتأكد إن رسالة خطأ التحميل ظهرت
        await log.assertLoadError();
    });
});

//===================البحث والفلاتر===================
test.describe('Admin - activity log: search and filters', { tag: '@adminActivityLog' }, () => {

    // البحث باسم المستخدم بيعرض نشاطاته هو بس
    test('[Positive] search by user name shows only his activities', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        // بيكتب في البحث ويستنى النتيجة
        await log.search(data.adminName);
        // بيتأكد إن فيه نشاطات
        await log.assertHasActivities();
        // بيتأكد إن كل النشاطات بتاعة المستخدم ده بس
        await log.assertOnlyUser(data.adminName);
    });

    // بحث مالوش نتيجة: "لا توجد نشاطات"
    test('[Negative] an unknown name shows "لا توجد نشاطات"', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        // بيكتب في البحث ويستنى النتيجة
        await log.search(data.unknownSearch);
        // بيتأكد إن رسالة "مفيش داتا" ظاهرة
        await log.assertEmpty();
    });

    // Data-Driven: فلتر نوع الإجراء بيعرض النوع ده بس
    for (const type of data.actionTypes) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] filter by "${type}" shows only this type`, async ({ adminPO }) => {
            // بيجيب صفحة سجل النشاطات من متصفح الأدمن
            const log = adminPO.getAdminActivityLogPage();

            // بيفتح الصفحة
            await log.open();
            // بيفلتر بالنوع ده
            await log.filterByType(type);
            // بيتأكد إن كل الصفوف من النوع ده بس
            await log.assertOnlyType(type, data.actionTypes);
        });
    }

    // فلتر المشرف بيعرض نشاطاته هو بس
    test('[Positive] filter by admin shows only his activities', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        // بيفلتر بالأدمن ده
        await log.filterByAdmin(data.adminName);
        // بيتأكد إن فيه نشاطات
        await log.assertHasActivities();
        // بيتأكد إن كل النشاطات بتاعة المستخدم ده بس
        await log.assertOnlyUser(data.adminName);
    });

    // فلتر التاريخ (النهارده) بيعرض نشاطات النهارده بس
    test('[Positive] filter by date shows only this day', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        // بيفلتر بيوم معين
        await log.filterByDay(data.todayButton);
        // بيتأكد إن كل النشاطات في اليوم ده بس
        await log.assertOnlyDate(data.todayText);
    });
});
