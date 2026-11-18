// بيجيب test و expect من الـ fixtures (فيهم adminPO = متصفح الأدمن جاهز وداخل)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب داتا الأدوار من testData/roles.ts (اسم دور التست، الحالات، الأعمدة، الرسايل)
import data from '../../testData/roles';

// admin > الأدوار والصلاحيات (requirements/AdminRolesPage.md = UC-11)
// بيعمل دور تست جديد كل run ويجرب عليه السيناريوهات وفي الآخر بيمسحه
// الأدوار اللي موجودة محمية: مفيش أي تغيير بيتبعت عليها

// دور التست (الاسم = "QA Role" + رقم الـ run، والصلاحية "View Dashboard")
const role = data.role;

//===================دور التست: إضافة وتعديل وحذف===================
// مجموعة تستات دور التست، والـ tag @adminRoles عشان تقدر تشغّلهم لوحدهم
test.describe('Admin - roles: the test role', { tag: '@adminRoles' }, () => {

    // إضافة دور جديد: بيظهر في الجدول بحالة "نشط"
    // ({ adminPO }) = متصفح الأدمن جاهز وداخل بحسابه
    test('[Positive] add a new role', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار من الـ POManager
        const roles = adminPO.getAdminRolesPage();

        // بيضيف الدور (يفتح الفورم، يملى الاسم والحالة والصلاحية، ويحفظ) وبيرجّع رد السيرفر
        const response = await roles.addRole(role.name, data.activeStatus, role.permission);
        // بيتأكد إن السيرفر رد بنجاح (status من 200 لـ 299)
        expect(response.ok()).toBeTruthy();

        // بيفتح صفحة الأدوار تاني
        await roles.open();
        // بيتأكد إن الدور موجود في الجدول وحالته "نشط"
        await roles.assertRole(role.name, data.activeStatus);
    });

    // Alternative 2: اسم الدور مكرر: بيترفض
    test('[Negative] a duplicate role name is rejected', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيضيف دور بنفس الاسم اللي اتعمل في التست اللي قبله
        const response = await roles.addRole(role.name, data.activeStatus, role.permission);
        // بيتأكد إن السيرفر رفض (مش ok)
        expect(response.ok()).toBeFalsy();
        // بيتأكد إن رسالة "هذا الدور موجود بالفعل" ظهرت
        await roles.assertMessage(data.messages.duplicate);
    });

    // Alternative 3: من غير صلاحية: مينفعش يتحفظ
    test('[Negative] a role without permissions cannot be saved', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيفتح فورم إضافة دور جديد
        await roles.openAddForm();
        // بيملى الاسم والحالة وبيختار الصلاحية
        await roles.fillRole(role.name, data.activeStatus, role.permission);
        // بيدوس على الصلاحية تاني عشان يشيلها (كده الدور من غير صلاحيات)
        await roles.permission(role.permission).click();
        // بيتأكد إن زرار الإضافة مقفول
        await expect(roles.AddRole_btn).toBeDisabled();
        // بيتأكد إن رسالة "هذا الحقل مطلوب" ظهرت
        await roles.assertMessage(data.messages.noPermission);
    });

    // Alternative 1: الحفظ فشل: بتظهر رسالة خطأ
    test('[Negative] when saving fails, an error message is shown', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيفتح فورم إضافة دور جديد
        await roles.openAddForm();
        // بيخلّي السيرفر يرجّع error في الحفظ (مفيش حاجة بتتحفظ فعلًا)
        await roles.makeSaveFail();
        // بيملى الفورم باسم مختلف
        await roles.fillRole(`${role.name} fail`, data.activeStatus, role.permission);
        // بيدوس "إضافة" ويستنى رد السيرفر
        await roles.clickAndGetResponse(roles.AddRole_btn);
        // بيتأكد إن رسالة "حدث خطأ أثناء إضافة الدور" ظهرت
        await roles.assertMessage(data.messages.saveFailed);
    });

    // صفحة التعديل بتعرض بيانات الدور الحالية
    test('[Positive] edit: the page shows the current role data', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيفتح صفحة تعديل دور التست
        await roles.openEdit(role.name);
        // بيتأكد إن خانة الاسم فيها اسم الدور
        await expect(roles.name_tb).toHaveValue(role.name);
        // بيتأكد إن الصلاحية متعلّم عليها (aria-checked = true)
        await expect(roles.permission(role.permission)).toHaveAttribute('aria-checked', 'true');
    });

    // تعديل الاسم وتعطيل الدور: الجدول بيعرض الاسم الجديد و"غير نشط"
    test('[Positive] edit the name and deactivate the role', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيفتح صفحة تعديل دور التست
        await roles.openEdit(role.name);
        // بيكتب الاسم الجديد
        await roles.name_tb.fill(data.editedName);
        // بيختار الحالة "غير نشط"
        await roles.chooseStatus(data.inactiveStatus);
        // بيدوس "حفظ التغييرات" ويستنى رد السيرفر
        const response = await roles.clickAndGetResponse(roles.SaveChanges_btn);
        // بيتأكد إن الحفظ نجح
        expect(response.ok()).toBeTruthy();

        // بيفتح صفحة الأدوار تاني
        await roles.open();
        // بيتأكد إن الجدول فيه الاسم الجديد وحالته "غير نشط"
        await roles.assertRole(data.editedName, data.inactiveStatus);
    });

    // تفعيل الدور تاني
    test('[Positive] activate the role again', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيفتح صفحة تعديل الدور (بالاسم الجديد)
        await roles.openEdit(data.editedName);
        // بيختار الحالة "نشط"
        await roles.chooseStatus(data.activeStatus);
        // بيدوس "حفظ التغييرات" ويستنى رد السيرفر
        const response = await roles.clickAndGetResponse(roles.SaveChanges_btn);
        // بيتأكد إن الحفظ نجح
        expect(response.ok()).toBeTruthy();

        // بيفتح صفحة الأدوار تاني
        await roles.open();
        // بيتأكد إن الدور حالته "نشط"
        await roles.assertRole(data.editedName, data.activeStatus);
    });

    // business rule: الإضافة والتعديل بيتسجلوا في سجل النشاطات
    test('[Positive] business rule: the role changes are in the activity log', async ({ adminPO }) => {
        // بيجيب صفحة سجل النشاطات
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح سجل النشاطات
        await log.open();
        // بيتأكد إن اسم دور التست موجود في السجل
        await expect(log.main).toContainText(role.name);
    });

    // حذف دور التست: بيختفي من الجدول
    test('[Positive] delete the role', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيمسح دور التست (يدوس حذف ويأكد) وبيرجّع رد السيرفر
        const response = await roles.deleteRole(data.editedName);
        // بيتأكد إن المسح نجح
        expect(response.ok()).toBeTruthy();

        // بيفتح صفحة الأدوار تاني
        await roles.open();
        // بيتأكد إن الدور مش موجود في الجدول
        await roles.assertNotInTable(data.editedName);
    });
});

//===================السوبر أدمن والقايمة (من غير أي تغيير)===================
// مجموعة تستات الجدول والسوبر أدمن (بتقرا بس)
test.describe('Admin - roles: super admin and list', { tag: '@adminRoles' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    // الـ for بيعمل تست لكل عمود في data.columns (4 أعمدة = 4 تستات)
    for (const column of data.columns) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            // بيجيب صفحة الأدوار
            const roles = adminPO.getAdminRolesPage();

            // بيفتح صفحة الأدوار
            await roles.open();
            // بيتأكد إن العمود ده موجود في الجدول
            await roles.assertColumn(column);
        });
    }

    // Alternative 6: مينفعش تعديل السوبر أدمن (الحفظ مش بيتدّاس)
    test('[Negative] business rule: the super admin role cannot be edited', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيفتح صفحة الأدوار
        await roles.open();
        // بيدوس "تعديل" في صف السوبر أدمن
        await roles.rowButton(data.superAdmin, 'تعديل').click();
        // بيتأكد إن خانة الاسم مقفولة (مينفعش يتعدل)
        await expect(roles.name_tb).toBeDisabled();
    });

    // Alternative 6: مينفعش حذف السوبر أدمن (الحذف مش بيتأكد، والحماية بتمنعه كمان)
    test('[Negative] business rule: the super admin role cannot be deleted', async ({ adminPO }) => {
        // بيجيب صفحة الأدوار
        const roles = adminPO.getAdminRolesPage();

        // بيفتح صفحة الأدوار
        await roles.open();
        // بيدوس "حذف" في صف السوبر أدمن
        await roles.rowButton(data.superAdmin, 'حذف').click();
        // بيتأكد إن رسالة "لا يمكن تعديل أو حذف دور Super Admin" ظهرت
        await roles.assertMessage(data.messages.superAdmin);
        // بيتأكد إن زرار تأكيد الحذف مش موجود
        await expect(roles.confirmDelete_btn).toHaveCount(0);
    });
});
