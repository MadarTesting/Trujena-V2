import { test, expect } from '../fixtures/fixtures';
import data from '../testData/activityLog';

// admin > سجل النشاطات (requirements/AdminActivityLogPage.md = UC-12)
// الصفحة عرض بس: التستات بتقرا بس ومش بتغير أي حاجة

//===================عرض السجل===================
test.describe('Admin - activity log: view', { tag: '@adminActivityLog' }, () => {

    // السجل بيفتح وفيه نشاطات (اسم المستخدم + التاريخ)
    test('[Positive] the log opens and shows the activities', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await log.assertHasActivities();
        await expect(log.dates.first()).toBeVisible();
    });

    // كل نشاط لازم يبين اسم الموديول (مثلاً إضافة عميل = إدارة العملاء)
    test('[Positive] business rule: every activity shows the module name', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await log.assertActivityHas(data.customerActivity.text, data.customerActivity.module);
    });

    // business rule: مينفعش تعديل أو حذف أي نشاط
    test('[Negative] business rule: no edit or delete for the activities', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await expect(log.main.getByRole('button', { name: /حذف|تعديل|delete|edit/i })).toHaveCount(0);
    });

    // Data-Driven: العمليات اللي التستات بتعملها كل run لازم تكون متسجلة
    for (const type of data.mustBeLogged) {
        test(`[Positive] business rule: "${type}" is logged`, async ({ adminPO }) => {
            const log = adminPO.getAdminActivityLogPage();

            await log.open();
            await log.filterByType(type);
            await log.assertHasActivities();
        });
    }

    // الأدمن بيدخل لوحة عميل التست بالأدمن مود (من أيقونة إدارة العملاء)، والدخول ده لازم يتسجل في السجل
    test('[Positive] business rule: entering Admin Mode is logged', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();
        const customers = adminPO.getAdminCustomersPage();

        // عدد نشاطات النهارده قبل الأدمن مود
        await log.open();
        await log.filterByDay(data.todayButton);
        const before = await log.countActivities();

        // الدخول بالأدمن مود
        const response = await customers.openAdminMode(data.adminModeCustomer);
        expect(response.ok()).toBeTruthy();

        // لازم يظهر نشاط جديد
        await log.open();
        await log.filterByDay(data.todayButton);
        expect(await log.countActivities(), 'entering Admin Mode was not logged').toBeGreaterThan(before);
    });

    // Alternative 1: فشل الاتصال بتظهر رسالة خطأ
    test('[Negative] when loading fails, an error message is shown', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.makeLoadFail();
        await log.open();
        await log.assertLoadError();
    });
});

//===================البحث والفلاتر===================
test.describe('Admin - activity log: search and filters', { tag: '@adminActivityLog' }, () => {

    // البحث باسم المستخدم بيعرض نشاطاته هو بس
    test('[Positive] search by user name shows only his activities', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await log.search(data.adminName);
        await log.assertHasActivities();
        await log.assertOnlyUser(data.adminName);
    });

    // بحث مالوش نتيجة: "لا توجد نشاطات"
    test('[Negative] an unknown name shows "لا توجد نشاطات"', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await log.search(data.unknownSearch);
        await log.assertEmpty();
    });

    // Data-Driven: فلتر نوع الإجراء بيعرض النوع ده بس
    for (const type of data.actionTypes) {
        test(`[Positive] filter by "${type}" shows only this type`, async ({ adminPO }) => {
            const log = adminPO.getAdminActivityLogPage();

            await log.open();
            await log.filterByType(type);
            await log.assertOnlyType(type, data.actionTypes);
        });
    }

    // فلتر المشرف بيعرض نشاطاته هو بس
    test('[Positive] filter by admin shows only his activities', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await log.filterByAdmin(data.adminName);
        await log.assertHasActivities();
        await log.assertOnlyUser(data.adminName);
    });

    // فلتر التاريخ (النهارده) بيعرض نشاطات النهارده بس
    test('[Positive] filter by date shows only this day', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await log.filterByDay(data.todayButton);
        await log.assertOnlyDate(data.todayText);
    });
});
