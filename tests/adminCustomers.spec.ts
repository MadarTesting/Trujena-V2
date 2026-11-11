import { test, expect } from '../fixtures/fixtures';
import customersData from '../testData/customers';

// admin > إدارة العملاء (requirements/AdminCustomersPage.md)
// IMPORTANT: NO customer is added, changed or deleted. The tests only look, and press "تراجع" / leave without saving.

//===================العملاء الفعليين===================
// تستات جدول العملاء الفعليين
test.describe('Admin - customers: actual customers', { tag: '@customers' }, () => {

    // الصفحة بتتفتح من القايمة الجانبية وفيها التابين وزرار الإضافة
    test('[Positive] the page opens from the side menu with the 2 tabs and the add button', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        await expect(customers.actualTab_btn).toBeVisible();
        await expect(customers.leadsTab_btn).toBeVisible();
        await expect(customers.addCustomer_btn).toBeVisible();
    });

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of customersData.actualColumns) {
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            const customers = adminPO.getAdminCustomersPage();

            await customers.open();
            await expect(customers.headers.filter({ hasText: column })).toHaveCount(1);
        });
    }

    // كل صف فيه أزرار عرض وتعديل وحذف و switch لوحة التاجر
    test('[Positive] every customer has view, edit, delete and the dashboard switch', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        for (const name of customersData.rowButtons) {
            await expect(customers.firstRowButton(name)).toBeVisible();
        }
        await expect(customers.rows.first().getByRole('switch', { name: 'تفعيل لوحة التاجر' })).toBeVisible();
    });

    // البحث باسم عميل بيظهره
    test('[Positive] search by name shows the customer', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        const name = await customers.firstRowCell(2);
        await customers.search(name);
        await expect(customers.rows.first()).toContainText(name);
    });

    // البحث باسم مش موجود: مفيش صفوف وتظهر رسالة الريكوايرمنت
    test('[Negative] search with an unknown name shows "no data" message', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        await customers.search(customersData.unknownName);
        await expect(customers.rows).toHaveCount(0);
        await expect(customers.main.getByText(customersData.emptyMessage)).toBeVisible();
    });

    // Data-Driven: كل فلتر بيعرض العملاء اللي بيطابقوه بس
    for (const data of customersData.filters) {
        test(`[Positive] filter "${data.filter}" = "${data.option}" shows only the matching customers`, async ({ adminPO }) => {
            const customers = adminPO.getAdminCustomersPage();

            await customers.open();
            await customers.chooseFilter(data.filter, data.option);
            await customers.assertColumnHas(data.column, data.option);
        });
    }

    // Data-Driven: فلتر حالة الاشتراك فيه كل الحالات اللي في الريكوايرمنت
    for (const status of customersData.subscriptionStatuses) {
        test(`[Positive] the subscription status filter has "${status}"`, async ({ adminPO }) => {
            const customers = adminPO.getAdminCustomersPage();

            await customers.open();
            await customers.main.getByRole('combobox').filter({ hasText: 'حالة الاشتراك' }).click();
            await expect(customers.page.getByRole('option', { name: status, exact: true })).toBeVisible();
        });
    }
});

//===================تفاصيل / تعديل / حذف (من غير أي تغيير)===================
// تستات عرض وتعديل وحذف العميل من غير ما يتغير حاجة
test.describe('Admin - customers: view, edit and delete (nothing is changed)', { tag: '@customers' }, () => {

    // "عرض التفاصيل" بيفتح بيانات نفس العميل والخانات للقراءة بس
    test('[Positive] view: the details page shows the same customer (read only)', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        const name = await customers.firstRowCell(2);
        const email = await customers.firstRowCell(3);
        await customers.firstRowButton('عرض التفاصيل').click();

        await expect(customers.page).toHaveURL(/\/customers\/\d+$/);
        await expect(customers.main.locator('#name-input')).toHaveValue(name);
        await expect(customers.main.locator('#email-input')).toHaveValue(email);
        await expect(customers.main.locator('#name-input')).not.toBeEditable();
        for (const section of customersData.detailsSections) {
            await expect(customers.main.getByRole('button', { name: section })).toBeVisible();
        }
    });

    // "تعديل" بيفتح الخانات للتعديل وفيه زرار الحفظ (من غير ما نحفظ)
    test('[Positive] edit: the fields can be changed and there is a save button (NOT saved)', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        const name = await customers.firstRowCell(2);
        await customers.firstRowButton('تعديل بيانات العميل').click();

        await expect(customers.page).toHaveURL(/edit=true/);
        await expect(customers.main.locator('#name-input')).toHaveValue(name);
        await expect(customers.main.locator('#name-input')).toBeEditable();
        await expect(customers.main.getByRole('button', { name: 'حفظ التغييرات' })).toBeVisible();
        // we leave the page without saving
    });

    // "حذف" بيفتح نافذة تأكيد، و"تراجع" ما بيمسحش العميل
    test('[Negative] delete and press "تراجع": the customer is NOT deleted', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        const name = await customers.firstRowCell(2);
        await customers.firstRowButton('حذف العميل').click();
        await expect(customers.deleteDialog).toContainText('هل أنت متأكد من حذف العميل؟');

        await customers.cancelDelete_btn.click();
        await expect(customers.deleteDialog).toBeHidden();
        await customers.page.reload();
        await expect(customers.rows.filter({ hasText: name })).toHaveCount(1);
    });
});

//===================العملاء المحتملين (Leads)===================
// تستات جدول العملاء المحتملين
test.describe('Admin - customers: leads', { tag: '@customers' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في جدول المحتملين
    for (const column of customersData.leadsColumns) {
        test(`[Positive] the leads table has the column "${column}"`, async ({ adminPO }) => {
            const customers = adminPO.getAdminCustomersPage();

            await customers.open();
            await customers.openLeads();
            await expect(customers.headers.filter({ hasText: column })).toHaveCount(1);
        });
    }
});

//===================إضافة عميل (من غير حفظ)===================
// تستات فورم إضافة عميل جديد من غير ما نحفظ
test.describe('Admin - customers: add form (nothing is saved)', { tag: '@customers' }, () => {

    // الفورم فيها 3 خطوات وكل الخانات، و"التالي" مقفول وهي فاضية
    test('[Negative] the add form has 3 steps and "التالي" is disabled when it is empty', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        await customers.openAddForm();
        for (const step of customersData.addSteps) {
            await expect(customers.main.getByText(step, { exact: true }).first()).toBeVisible();
        }
        for (const field of customersData.addFields) {
            await expect(customers.main.locator(field)).toBeVisible();
        }
        await expect(customers.next_btn).toBeDisabled();
    });

    // Data-Driven: داتا غلط بتظهر رسالة خطأ
    for (const data of customersData.wrongAddData) {
        test(`[Negative] add form: ${data.title} shows an error`, async ({ adminPO }) => {
            const customers = adminPO.getAdminCustomersPage();

            await customers.open();
            await customers.openAddForm();
            await customers.main.locator(data.field).fill(data.value);
            await customers.main.locator(data.field).press('Tab');
            await expect(customers.main.getByText(data.error)).toBeVisible();
            await customers.assertNextDoesNotMove();
        });
    }

    // باسورد وتأكيده مختلفين بيظهر خطأ
    test('[Negative] add form: password and confirm are not the same', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.open();
        await customers.openAddForm();
        await customers.main.locator('#password-password').fill(customersData.passwords.password);
        await customers.main.locator('#confirmPassword-password').fill(customersData.passwords.confirm);
        await customers.main.locator('#confirmPassword-password').press('Tab');
        await expect(customers.main.getByText(customersData.passwords.error)).toBeVisible();
        await customers.assertNextDoesNotMove();
    });
});

// إضافة عميل والتعديل والمسح وقفل لوحة التاجر: في tests/adminAddCustomer.spec.ts (على عميل QA جديد بس)
