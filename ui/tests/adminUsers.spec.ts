// بيجيب test و expect و openWindow و closeWindow من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect, openWindow, closeWindow } from '../../fixtures/fixtures';
import type { Browser, TestInfo } from '@playwright/test';
// بيجيب LoginPage من pages/auth/LoginPage
import { LoginPage } from '../pages/auth/LoginPage';
// بيجيب data من testData/adminUsers.ts
import data from '../../testData/adminUsers';

// admin > إدارة المستخدمين (requirements/AdminUsersPage.md = UC-4)
// بيعمل مستخدم تست جديد كل run ويجرب عليه السيناريوهات وفي الآخر بيمسحه
// المستخدمين الموجودين محميين: مفيش أي تغيير بيتبعت عليهم

// user = data.user
const user = data.user;
// رقم مستخدم التست (بيتقرا قبل الحذف، وبيتدوّر عليه في سجل النشاطات)
let userId = '';

// بيحاول يعمل دخول على لوحة الأدمن بمستخدم التست في متصفح جديد، ويرجّع اتعمل ولا لا
async function canLogin(browser: Browser, testInfo: TestInfo, email: string, password: string) {
    // بيستخدم openWindow وبياخد منها context, page 
    const { context, page } = await openWindow(browser, testInfo, process.env.ADMIN_URL);
    // بيعمل صفحة Login على المتصفح ده
    const login = new LoginPage(page);
    // بيفتح الصفحة
    await login.open();
    // بيكتب الإيميل والباسورد ويدوس دخول
    await login.login(email, password);
    // loggedIn = القيمة دي
    const loggedIn = await page.waitForURL(/\/home/, { timeout: 15000 }).then(() => true, () => false);
    // بينادي على الدالة closeWindow
    await closeWindow(context, page, testInfo, 'qa-user');
    // بيرجّع النتيجة
    return loggedIn;
}

//===================مستخدم التست: إضافة وتعديل وتعطيل وحذف===================
test.describe('Admin - users: the test user', { tag: '@adminUsers' }, () => {

    // إضافة مستخدم جديد: بيظهر في الجدول ببياناته
    test('[Positive] add a new user', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيضيف مستخدم ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await users.addUser(user);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();
        // بيتأكد إن صف المستخدم فيه البيانات دي
        await users.assertUserRow(user, [user.name, user.role, data.activeStatus]);
    });

    // Alternative 3: الإيميل مستخدم قبل كده: بيترفض
    test('[Negative] a duplicate email is rejected', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيضيف مستخدم ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await users.addUser({ ...user, name: `${user.name} copy` });
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok()).toBeFalsy();
        // بيتأكد إن الرسالة دي ظهرت
        await users.assertMessage(data.messages.duplicateEmail);
    });

    // Data-Driven: باسورد ضعيف: بتظهر الرسالة وزرار الإضافة مقفول
    for (const weak of data.weakPasswords) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Negative] a weak password "${weak.password}" cannot be saved`, async ({ adminPO }) => {
            // بيجيب صفحة المستخدمين من متصفح الأدمن
            const users = adminPO.getAdminUsersPage();

            // بيفتح فورم الإضافة
            await users.openAddForm();
            // بيملى بيانات المستخدم
            await users.fillUser({ ...user, password: weak.password });
            // بيتأكد إن الرسالة دي ظهرت
            await users.assertMessage(weak.message);
            // بيتأكد إن زرار AddUser مقفول
            await expect(users.AddUser_btn).toBeDisabled();
        });
    }

    // تأكيد الباسورد مختلف
    test('[Negative] the confirm password does not match', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيفتح فورم الإضافة
        await users.openAddForm();
        // بيملى بيانات المستخدم
        await users.fillUser(user);
        // بيكتب الباسورد وتأكيده
        await users.fillPassword(user.password, data.newPassword);
        // بيتأكد إن الرسالة دي ظهرت
        await users.assertMessage(data.mismatchMessage);
        // بيتأكد إن زرار AddUser مقفول
        await expect(users.AddUser_btn).toBeDisabled();
    });

    // Alternative 4: الحفظ فشل: بتظهر رسالة خطأ
    test('[Negative] when saving fails, an error message is shown', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيفتح فورم الإضافة
        await users.openAddForm();
        // بيخلّي السيرفر يرجّع error
        await users.makeServerFail('SAVE');
        // بيملى بيانات المستخدم
        await users.fillUser({ ...user, email: `fail.${user.email}` });
        // بيدوس الزرار ويستنى رد السيرفر
        await users.clickAndGetResponse(users.AddUser_btn);
        // بيتأكد إن الرسالة دي ظهرت
        await users.assertMessage(data.messages.saveFailed);
    });

    // المستخدم الجديد يقدر يعمل دخول
    test('[Positive] the new user can login', async ({ browser }, testInfo) => {
        // بيتأكد إن الـ login نجح بالبيانات دي
        expect(await canLogin(browser, testInfo, user.email, user.password)).toBeTruthy();
    });

    // عرض المستخدم: الاسم والإيميل والدور والحالة
    test('[Positive] view: the details show the user data', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيفتح تفاصيل المستخدم
        await users.openView(user);
        // بيتأكد إن خانة name فيه القيمة user.name
        await expect(users.name_tb).toHaveValue(user.name);
        // بيتأكد إن خانة email فيه القيمة user.email
        await expect(users.email_tb).toHaveValue(user.email);
        // بيتأكد إن قايمة role فيه النص user.role
        await expect(users.role_cmb).toContainText(user.role);
    });

    // Data-Driven: صفحة العرض لازم فيها تاريخ الإضافة وآخر دخول وسجل النشاطات
    for (const extra of data.viewExtras) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] view: the details show "${extra}"`, async ({ adminPO }) => {
            // بيجيب صفحة المستخدمين من متصفح الأدمن
            const users = adminPO.getAdminUsersPage();

            // بيفتح تفاصيل المستخدم
            await users.openView(user);
            // بيتأكد إن الصفحة فيه النص extra
            await expect(users.main).toContainText(extra);
        });
    }

    // تعديل الاسم: الجدول بيعرض الاسم الجديد
    test('[Positive] edit the name', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيفتح صفحة التعديل
        await users.openEdit(user);
        // بيكتب data.editedName في خانة name
        await users.name_tb.fill(data.editedName);
        // بيدوس الزرار ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await users.clickAndGetResponse(users.SaveChanges_btn);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();
        // بيتأكد إن صف المستخدم فيه البيانات دي
        await users.assertUserRow(user, [data.editedName]);
    });

    // تغيير الباسورد: الجديد بيشتغل والقديم لا
    test('[Positive] change the password: the new one works, the old one does not', async ({ adminPO, browser }, testInfo) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيغيّر باسورد المستخدم، وبيحفظ النتيجة في response
        const response = await users.changePassword(user, data.newPassword);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();
        // بيتأكد إن الـ login نجح بالبيانات دي
        expect(await canLogin(browser, testInfo, user.email, data.newPassword), 'the new password must work').toBeTruthy();
        // بيتأكد إن الـ login فشل بالبيانات دي
        expect(await canLogin(browser, testInfo, user.email, user.password), 'the old password must not work').toBeFalsy();
    });

    // Alternative 5: التعطيل بيطلب تأكيد، وبعده الحالة "غير نشط"
    test('[Positive] deactivate the user (with a confirmation message)', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيفتح صفحة التعديل
        await users.openEdit(user);
        // بيختار الحالة
        await users.chooseStatus(data.inactiveStatus);
        // بيدوس الزرار ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await users.clickAndGetResponse(users.SaveChanges_btn);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();
        // بيتأكد إن صف المستخدم فيه البيانات دي
        await users.assertUserRow(user, [data.inactiveStatus]);
        // بيتأكد إن users.text(data.messages.deactivate count ), 'no confirmation message before deactivate').toBeGreaterThan(0 (soft: لو فشل التست يكمّل)
        expect.soft(await users.text(data.messages.deactivate).count(), 'no confirmation message before deactivate').toBeGreaterThan(0);
    });

    // business rule: المستخدم المعطل مايقدرش يعمل دخول
    test('[Negative] business rule: a deactivated user cannot login', async ({ browser }, testInfo) => {
        // بيتأكد إن الـ login فشل بالبيانات دي
        expect(await canLogin(browser, testInfo, user.email, data.newPassword)).toBeFalsy();
    });

    // Alternative 6: رسالة الحذف وزرار التراجع (المستخدم بيفضل موجود)
    test('[Negative] delete then "تراجع": the user is not deleted', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيدوّر على مستخدم التست
        await users.findTestUser(user);
        // بيدوس حذف
        await users.clickDelete(user.email);
        // بيتأكد إن النافذة فيه النص data.messages.delete (soft: لو فشل التست يكمّل)
        await expect.soft(users.dialog).toContainText(data.messages.delete);
        // بيدوس على زرار cancel
        await users.cancel_btn.click();
        // بيتأكد إن صف المستخدم فيه البيانات دي
        await users.assertUserRow(user, [data.editedName]);
    });

    // حذف مستخدم التست: بيختفي من الجدول
    test('[Positive] delete the user', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // عشان نلاقيه في سجل النشاطات بعد الحذف
        userId = await users.getTestUserId(user);
        // بيمسح المستخدم، وبيحفظ النتيجة في response
        const response = await users.deleteUser(user);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok()).toBeTruthy();

        // بيفتح الصفحة
        await users.open();
        // بيكتب في البحث ويستنى النتيجة
        await users.search(user.name);
        // بيتأكد إن صف في الجدول (user.email) مش موجود
        await expect(users.row(user.email)).toHaveCount(0);
    });

    // business rule: عمليات المستخدم بتفضل في سجل النشاطات بعد حذفه
    // SEEN on stg: السجل بيكتب رقم المستخدم مش اسمه: "تم حذف المسؤول (المُعرّف: 105)" و "تم تحديث المسؤول (المُعرّف: 105)"
    test('[Positive] business rule: the activity log keeps the user operations after delete', async ({ adminPO }) => {
        // بيتأكد إن userId مش بيساوي ''
        expect(userId, 'the delete test did not run, so the user number is not known').not.toBe('');
        // بيجيب صفحة سجل النشاطات من متصفح الأدمن
        const log = adminPO.getAdminActivityLogPage();

        // بيفتح الصفحة
        await log.open();
        for (const operation of ['حذف المسؤول', 'تحديث المسؤول']) {
            // بيتأكد من النتيجة
            await expect(log.activity(new RegExp(`${operation}.*: ${userId}\\)`)),
                `the log must have "${operation}" for user ${userId}`).toBeVisible();
        }
    });
});

//===================القايمة والبحث والفلاتر (من غير أي تغيير)===================
test.describe('Admin - users: list, search and filters', { tag: '@adminUsers' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of data.columns) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            // بيجيب صفحة المستخدمين من متصفح الأدمن
            const users = adminPO.getAdminUsersPage();

            // بيفتح الصفحة
            await users.open();
            // بيتأكد إن العمود ده موجود في الجدول
            await users.assertColumn(column);
        });
    }

    // Data-Driven: فلتر الدور والحالة بيعرضوا القيمة دي بس
    for (const filter of [data.roleFilter, data.statusFilter]) {
        // Data-Driven: بيلف على filter.options، وبيعمل الكود اللي جوه لكل option
        for (const option of filter.options) {
            // التست ده بياخد: adminPO = متصفح الأدمن
            test(`[Positive] filter by "${option}" shows only this value`, async ({ adminPO }) => {
                // بيجيب صفحة المستخدمين من متصفح الأدمن
                const users = adminPO.getAdminUsersPage();

                // بيفتح الصفحة
                await users.open();
                // بيختار الفلتر ده
                await users.filter(filter.id, option);
                // بيتأكد إن كل الصفوف فيها القيمة دي بس
                await users.assertOnly(filter.column, option);
            });
        }
    }

    // Alternative 1: بحث مالوش نتيجة
    test('[Negative] an unknown name shows "لا توجد بيانات حاليا"', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيفتح الصفحة
        await users.open();
        // بيكتب في البحث ويستنى النتيجة
        await users.search(data.unknownSearch);
        // بيتأكد إن الرسالة دي ظهرت
        await users.assertMessage(data.messages.empty);
    });

    // Alternative 2: تحميل القايمة فشل
    test('[Negative] when loading fails, an error message is shown', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيخلّي السيرفر يرجّع error
        await users.makeServerFail('GET');
        // بيفتح الصفحة دي بالرابط
        await users.page.goto('/users-management');
        // بيتأكد إن الرسالة دي ظهرت
        await users.assertMessage(data.messages.loadFailed);
    });

    // Alternative 7: مينفعش الأدمن يمسح حسابه (الحذف مش بيتأكد، والحماية بتمنعه كمان)
    test('[Negative] business rule: the admin cannot delete his own account', async ({ adminPO }) => {
        // بيجيب صفحة المستخدمين من متصفح الأدمن
        const users = adminPO.getAdminUsersPage();

        // بيفتح الصفحة
        await users.open();
        // بيكتب في البحث ويستنى النتيجة
        await users.search(data.myName);
        // بيدوس حذف
        await users.clickDelete(data.myEmail);
        // بيتأكد إن الرسالة دي ظهرت
        await users.assertMessage(data.messages.deleteMyself);
    });
});
