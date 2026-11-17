import { test, expect, openWindow, closeWindow } from '../fixtures/fixtures';
import type { Browser, TestInfo } from '@playwright/test';
import { LoginPage } from '../pages/auth/LoginPage';
import data from '../testData/adminUsers';

// admin > إدارة المستخدمين (requirements/AdminUsersPage.md = UC-4)
// بيعمل مستخدم تست جديد كل run ويجرب عليه السيناريوهات وفي الآخر بيمسحه
// المستخدمين الموجودين محميين: مفيش أي تغيير بيتبعت عليهم

const user = data.user;
let userId = '';        // رقم مستخدم التست (بيتقرا قبل الحذف، وبيتدوّر عليه في سجل النشاطات)

// بيحاول يعمل دخول على لوحة الأدمن بمستخدم التست في متصفح جديد، ويرجّع اتعمل ولا لا
async function canLogin(browser: Browser, testInfo: TestInfo, email: string, password: string) {
    const { context, page } = await openWindow(browser, testInfo, process.env.ADMIN_URL);
    const login = new LoginPage(page);
    await login.open();
    await login.login(email, password);
    const loggedIn = await page.waitForURL(/\/home/, { timeout: 15000 }).then(() => true, () => false);
    await closeWindow(context, page, testInfo, 'qa-user');
    return loggedIn;
}

//===================مستخدم التست: إضافة وتعديل وتعطيل وحذف===================
test.describe('Admin - users: the test user', { tag: '@adminUsers' }, () => {

    // إضافة مستخدم جديد: بيظهر في الجدول ببياناته
    test('[Positive] add a new user', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        const response = await users.addUser(user);
        expect(response.ok()).toBeTruthy();
        await users.assertUserRow(user, [user.name, user.role, data.activeStatus]);
    });

    // Alternative 3: الإيميل مستخدم قبل كده: بيترفض
    test('[Negative] a duplicate email is rejected', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        const response = await users.addUser({ ...user, name: `${user.name} copy` });
        expect(response.ok()).toBeFalsy();
        await users.assertMessage(data.messages.duplicateEmail);
    });

    // Data-Driven: باسورد ضعيف: بتظهر الرسالة وزرار الإضافة مقفول
    for (const weak of data.weakPasswords) {
        test(`[Negative] a weak password "${weak.password}" cannot be saved`, async ({ adminPO }) => {
            const users = adminPO.getAdminUsersPage();

            await users.openAddForm();
            await users.fillUser({ ...user, password: weak.password });
            await users.assertMessage(weak.message);
            await expect(users.AddUser_btn).toBeDisabled();
        });
    }

    // تأكيد الباسورد مختلف
    test('[Negative] the confirm password does not match', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.openAddForm();
        await users.fillUser(user);
        await users.fillPassword(user.password, data.newPassword);
        await users.assertMessage(data.mismatchMessage);
        await expect(users.AddUser_btn).toBeDisabled();
    });

    // Alternative 4: الحفظ فشل: بتظهر رسالة خطأ
    test('[Negative] when saving fails, an error message is shown', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.openAddForm();
        await users.makeServerFail('SAVE');
        await users.fillUser({ ...user, email: `fail.${user.email}` });
        await users.clickAndGetResponse(users.AddUser_btn);
        await users.assertMessage(data.messages.saveFailed);
    });

    // المستخدم الجديد يقدر يعمل دخول
    test('[Positive] the new user can login', async ({ browser }, testInfo) => {
        expect(await canLogin(browser, testInfo, user.email, user.password)).toBeTruthy();
    });

    // عرض المستخدم: الاسم والإيميل والدور والحالة
    test('[Positive] view: the details show the user data', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.openView(user);
        await expect(users.name_tb).toHaveValue(user.name);
        await expect(users.email_tb).toHaveValue(user.email);
        await expect(users.role_cmb).toContainText(user.role);
    });

    // Data-Driven: صفحة العرض لازم فيها تاريخ الإضافة وآخر دخول وسجل النشاطات
    for (const extra of data.viewExtras) {
        test(`[Positive] view: the details show "${extra}"`, async ({ adminPO }) => {
            const users = adminPO.getAdminUsersPage();

            await users.openView(user);
            await expect(users.main).toContainText(extra);
        });
    }

    // تعديل الاسم: الجدول بيعرض الاسم الجديد
    test('[Positive] edit the name', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.openEdit(user);
        await users.name_tb.fill(data.editedName);
        const response = await users.clickAndGetResponse(users.SaveChanges_btn);
        expect(response.ok()).toBeTruthy();
        await users.assertUserRow(user, [data.editedName]);
    });

    // تغيير الباسورد: الجديد بيشتغل والقديم لا
    test('[Positive] change the password: the new one works, the old one does not', async ({ adminPO, browser }, testInfo) => {
        const users = adminPO.getAdminUsersPage();

        const response = await users.changePassword(user, data.newPassword);
        expect(response.ok()).toBeTruthy();
        expect(await canLogin(browser, testInfo, user.email, data.newPassword), 'the new password must work').toBeTruthy();
        expect(await canLogin(browser, testInfo, user.email, user.password), 'the old password must not work').toBeFalsy();
    });

    // Alternative 5: التعطيل بيطلب تأكيد، وبعده الحالة "غير نشط"
    test('[Positive] deactivate the user (with a confirmation message)', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.openEdit(user);
        await users.chooseStatus(data.inactiveStatus);
        const response = await users.clickAndGetResponse(users.SaveChanges_btn);
        expect(response.ok()).toBeTruthy();
        await users.assertUserRow(user, [data.inactiveStatus]);
        expect.soft(await users.page.getByText(data.messages.deactivate).count(), 'no confirmation message before deactivate').toBeGreaterThan(0);
    });

    // business rule: المستخدم المعطل مايقدرش يعمل دخول
    test('[Negative] business rule: a deactivated user cannot login', async ({ browser }, testInfo) => {
        expect(await canLogin(browser, testInfo, user.email, data.newPassword)).toBeFalsy();
    });

    // Alternative 6: رسالة الحذف وزرار التراجع (المستخدم بيفضل موجود)
    test('[Negative] delete then "تراجع": the user is not deleted', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.findTestUser(user);
        await users.clickDelete(user.email);
        await expect.soft(users.dialog).toContainText(data.messages.delete);
        await users.dialog.getByRole('button', { name: 'تراجع' }).click();
        await users.assertUserRow(user, [data.editedName]);
    });

    // حذف مستخدم التست: بيختفي من الجدول
    test('[Positive] delete the user', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        userId = await users.getTestUserId(user);                 // عشان نلاقيه في سجل النشاطات بعد الحذف
        const response = await users.deleteUser(user);
        expect(response.ok()).toBeTruthy();

        await users.open();
        await users.search(user.name);
        await expect(users.row(user.email)).toHaveCount(0);
    });

    // business rule: عمليات المستخدم بتفضل في سجل النشاطات بعد حذفه
    // SEEN on stg: السجل بيكتب رقم المستخدم مش اسمه: "تم حذف المسؤول (المُعرّف: 105)" و "تم تحديث المسؤول (المُعرّف: 105)"
    test('[Positive] business rule: the activity log keeps the user operations after delete', async ({ adminPO }) => {
        expect(userId, 'the delete test did not run, so the user number is not known').not.toBe('');
        const log = adminPO.getAdminActivityLogPage();

        await log.open();
        for (const operation of ['حذف المسؤول', 'تحديث المسؤول']) {
            await expect(log.main.getByText(new RegExp(`${operation}.*: ${userId}\\)`)).first(),
                `the log must have "${operation}" for user ${userId}`).toBeVisible();
        }
    });
});

//===================القايمة والبحث والفلاتر (من غير أي تغيير)===================
test.describe('Admin - users: list, search and filters', { tag: '@adminUsers' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of data.columns) {
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            const users = adminPO.getAdminUsersPage();

            await users.open();
            await users.assertColumn(column);
        });
    }

    // Data-Driven: فلتر الدور والحالة بيعرضوا القيمة دي بس
    for (const filter of [data.roleFilter, data.statusFilter]) {
        for (const option of filter.options) {
            test(`[Positive] filter by "${option}" shows only this value`, async ({ adminPO }) => {
                const users = adminPO.getAdminUsersPage();

                await users.open();
                await users.filter(filter.id, option);
                await users.assertOnly(filter.column, option);
            });
        }
    }

    // Alternative 1: بحث مالوش نتيجة
    test('[Negative] an unknown name shows "لا توجد بيانات حاليا"', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.open();
        await users.search(data.unknownSearch);
        await users.assertMessage(data.messages.empty);
    });

    // Alternative 2: تحميل القايمة فشل
    test('[Negative] when loading fails, an error message is shown', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.makeServerFail('GET');
        await users.page.goto('/users-management');
        await users.assertMessage(data.messages.loadFailed);
    });

    // Alternative 7: مينفعش الأدمن يمسح حسابه (الحذف مش بيتأكد، والحماية بتمنعه كمان)
    test('[Negative] business rule: the admin cannot delete his own account', async ({ adminPO }) => {
        const users = adminPO.getAdminUsersPage();

        await users.open();
        await users.search(data.myName);
        await users.clickDelete(data.myEmail);
        await users.assertMessage(data.messages.deleteMyself);
    });
});
