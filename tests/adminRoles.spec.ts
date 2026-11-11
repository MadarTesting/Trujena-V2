import { test, expect } from '../fixtures/fixtures';
import data from '../testData/roles';

// admin > الأدوار والصلاحيات (requirements/AdminRolesPage.md = UC-11)
// بيعمل دور تست جديد كل run ويجرب عليه السيناريوهات وفي الآخر بيمسحه
// الأدوار اللي موجودة محمية: مفيش أي تغيير بيتبعت عليها

const role = data.role;

//===================دور التست: إضافة وتعديل وحذف===================
test.describe('Admin - roles: the test role', { tag: '@adminRoles' }, () => {

    // إضافة دور جديد: بيظهر في الجدول بحالة "نشط"
    test('[Positive] add a new role', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        const response = await roles.addRole(role.name, data.activeStatus, role.permission);
        expect(response.ok()).toBeTruthy();

        await roles.open();
        await roles.assertRole(role.name, data.activeStatus);
    });

    // Alternative 2: اسم الدور مكرر: بيترفض
    test('[Negative] a duplicate role name is rejected', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        const response = await roles.addRole(role.name, data.activeStatus, role.permission);
        expect(response.ok()).toBeFalsy();
        await roles.assertMessage(data.messages.duplicate);
    });

    // Alternative 3: من غير صلاحية: مينفعش يتحفظ
    test('[Negative] a role without permissions cannot be saved', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        await roles.openAddForm();
        await roles.fillRole(role.name, data.activeStatus, role.permission);
        await roles.permission(role.permission).click();          // بيشيل الصلاحية تاني
        await expect(roles.AddRole_btn).toBeDisabled();
        await roles.assertMessage(data.messages.noPermission);
    });

    // Alternative 1: الحفظ فشل: بتظهر رسالة خطأ
    test('[Negative] when saving fails, an error message is shown', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        await roles.openAddForm();
        await roles.makeSaveFail();
        await roles.fillRole(`${role.name} fail`, data.activeStatus, role.permission);
        await roles.clickAndGetResponse(roles.AddRole_btn);
        await roles.assertMessage(data.messages.saveFailed);
    });

    // صفحة التعديل بتعرض بيانات الدور الحالية
    test('[Positive] edit: the page shows the current role data', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        await roles.openEdit(role.name);
        await expect(roles.name_tb).toHaveValue(role.name);
        await expect(roles.permission(role.permission)).toHaveAttribute('aria-checked', 'true');
    });

    // تعديل الاسم وتعطيل الدور: الجدول بيعرض الاسم الجديد و"غير نشط"
    test('[Positive] edit the name and deactivate the role', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        await roles.openEdit(role.name);
        await roles.name_tb.fill(data.editedName);
        await roles.chooseStatus(data.inactiveStatus);
        const response = await roles.clickAndGetResponse(roles.SaveChanges_btn);
        expect(response.ok()).toBeTruthy();

        await roles.open();
        await roles.assertRole(data.editedName, data.inactiveStatus);
    });

    // تفعيل الدور تاني
    test('[Positive] activate the role again', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        await roles.openEdit(data.editedName);
        await roles.chooseStatus(data.activeStatus);
        const response = await roles.clickAndGetResponse(roles.SaveChanges_btn);
        expect(response.ok()).toBeTruthy();

        await roles.open();
        await roles.assertRole(data.editedName, data.activeStatus);
    });

    // business rule: الإضافة والتعديل بيتسجلوا في سجل النشاطات
    test('[Positive] business rule: the role changes are in the activity log', async ({ adminPO }) => {
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        await expect(log.main).toContainText(role.name);
    });

    // حذف دور التست: بيختفي من الجدول
    test('[Positive] delete the role', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        const response = await roles.deleteRole(data.editedName);
        expect(response.ok()).toBeTruthy();

        await roles.open();
        await roles.assertNotInTable(data.editedName);
    });
});

//===================السوبر أدمن والقايمة (من غير أي تغيير)===================
test.describe('Admin - roles: super admin and list', { tag: '@adminRoles' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of data.columns) {
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            const roles = adminPO.getAdminRolesPage();

            await roles.open();
            await roles.assertColumn(column);
        });
    }

    // Alternative 6: مينفعش تعديل السوبر أدمن (الحفظ مش بيتدّاس)
    test('[Negative] business rule: the super admin role cannot be edited', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        await roles.open();
        await roles.rowButton(data.superAdmin, 'تعديل').click();
        await expect(roles.name_tb).toBeDisabled();
    });

    // Alternative 6: مينفعش حذف السوبر أدمن (الحذف مش بيتأكد، والحماية بتمنعه كمان)
    test('[Negative] business rule: the super admin role cannot be deleted', async ({ adminPO }) => {
        const roles = adminPO.getAdminRolesPage();

        await roles.open();
        await roles.rowButton(data.superAdmin, 'حذف').click();
        await roles.assertMessage(data.messages.superAdmin);
        await expect(roles.confirmDelete_btn).toHaveCount(0);
    });
});
