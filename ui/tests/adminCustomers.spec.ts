// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب customersData من testData/customers.ts
import customersData from '../../testData/customers';

// admin > إدارة العملاء (requirements/AdminCustomersPage.md)
// IMPORTANT: NO customer is added, changed or deleted. The tests only look, and press "تراجع" / leave without saving.

//===================العملاء الفعليين===================
// تستات جدول العملاء الفعليين
test.describe('Admin - customers: actual customers', { tag: '@customers' }, () => {

    // الصفحة بتتفتح من القايمة الجانبية وفيها التابين وزرار الإضافة
    test('[Positive] the page opens from the side menu with the 2 tabs and the add button', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيتأكد إن زرار actualTab ظاهر
        await expect(customers.actualTab_btn).toBeVisible();
        // بيتأكد إن زرار leadsTab ظاهر
        await expect(customers.leadsTab_btn).toBeVisible();
        // بيتأكد إن زرار addCustomer ظاهر
        await expect(customers.addCustomer_btn).toBeVisible();
    });

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of customersData.actualColumns) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            // بيجيب صفحة إدارة العملاء من متصفح الأدمن
            const customers = adminPO.getAdminCustomersPage();

            // بيفتح الصفحة
            await customers.open();
            // بيتأكد إن عمود في الجدول (column) عدده 1
            await expect(customers.header(column)).toHaveCount(1);
        });
    }

    // كل صف فيه أزرار عرض وتعديل وحذف و switch لوحة التاجر
    test('[Positive] every customer has view, edit, delete and the dashboard switch', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // Data-Driven: بيلف على customersData.rowButtons، وبيعمل الكود اللي جوه لكل name
        for (const name of customersData.rowButtons) {
            // بيتأكد إن زرار في أول صف (name) ظاهر
            await expect(customers.firstRowButton(name)).toBeVisible();
        }
        // بيتأكد إن switch لوحة التاجر في الصف (customers.rows.first()) ظاهر
        await expect(customers.dashboardSwitch(customers.rows.first())).toBeVisible();
    });

    // البحث باسم عميل بيظهره
    test('[Positive] search by name shows the customer', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيقرا خلية من أول صف، وبيحفظ النتيجة في name
        const name = await customers.firstRowCell(2);
        // بيكتب في البحث ويستنى النتيجة
        await customers.search(name);
        // بيتأكد إن أول صفوف الجدول فيه النص name
        await expect(customers.rows.first()).toContainText(name);
    });

    // البحث باسم مش موجود: مفيش صفوف وتظهر رسالة الريكوايرمنت
    test('[Negative] search with an unknown name shows "no data" message', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيكتب في البحث ويستنى النتيجة
        await customers.search(customersData.unknownName);
        // بيتأكد إن صفوف الجدول مش موجود
        await expect(customers.rows).toHaveCount(0);
        // بيتأكد إن نص في الصفحة (customersData.emptyMessage) ظاهر
        await expect(customers.text(customersData.emptyMessage)).toBeVisible();
    });

    // Data-Driven: كل فلتر بيعرض العملاء اللي بيطابقوه بس
    for (const data of customersData.filters) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] filter "${data.filter}" = "${data.option}" shows only the matching customers`, async ({ adminPO }) => {
            // بيجيب صفحة إدارة العملاء من متصفح الأدمن
            const customers = adminPO.getAdminCustomersPage();
            // بيفتح الصفحة
            await customers.open();
            // بيختار الفلتر والاختيار ده
            await customers.chooseFilter(data.filter, data.option);
            // بيتأكد إن كل الصفوف في العمود ده فيها النص
            await customers.assertColumnHas(data.column, data.option);
        });
    }

    // Data-Driven: فلتر حالة الاشتراك فيه كل الحالات اللي في الريكوايرمنت
    for (const status of customersData.subscriptionStatuses) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the subscription status filter has "${status}"`, async ({ adminPO }) => {
            // بيجيب صفحة إدارة العملاء من متصفح الأدمن
            const customers = adminPO.getAdminCustomersPage();

            // بيفتح الصفحة
            await customers.open();
            // بيدوس على قايمة subscriptionFilter
            await customers.subscriptionFilter_cmb.click();
            // بيتأكد إن اختيار في القايمة (status) ظاهر
            await expect(customers.option(status)).toBeVisible();
        });
    }
});

//===================تفاصيل / تعديل / حذف (من غير أي تغيير)===================
// تستات عرض وتعديل وحذف العميل من غير ما يتغير حاجة
test.describe('Admin - customers: view, edit and delete (nothing is changed)', { tag: '@customers' }, () => {

    // "عرض التفاصيل" بيفتح بيانات نفس العميل والخانات للقراءة بس
    test('[Positive] view: the details page shows the same customer (read only)', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيقرا خلية من أول صف، وبيحفظ النتيجة في name
        const name = await customers.firstRowCell(2);
        // بيقرا خلية من أول صف، وبيحفظ النتيجة في email
        const email = await customers.firstRowCell(3);
        // بيدوس على زرار في أول صف ('عرض التفاصيل')
        await customers.firstRowButton('عرض التفاصيل').click();

        // بيتأكد إن الصفحة الرابط بقى /\/customers\/\d+$/
        await expect(customers.page).toHaveURL(/\/customers\/\d+$/);
        // بيتأكد إن خانة name فيه القيمة name
        await expect(customers.name_tb).toHaveValue(name);
        // بيتأكد إن خانة email فيه القيمة email
        await expect(customers.email_tb).toHaveValue(email);
        // بيتأكد إن خانة name مش ينفع يتعدل
        await expect(customers.name_tb).not.toBeEditable();
        // Data-Driven: بيلف على customersData.detailsSections، وبيعمل الكود اللي جوه لكل section
        for (const section of customersData.detailsSections) {
            // بيتأكد إن قسم في الصفحة (section) ظاهر
            await expect(customers.section(section)).toBeVisible();
        }
    });

    // "تعديل" بيفتح الخانات للتعديل وفيه زرار الحفظ (من غير ما نحفظ)
    test('[Positive] edit: the fields can be changed and there is a save button (NOT saved)', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيقرا خلية من أول صف، وبيحفظ النتيجة في name
        const name = await customers.firstRowCell(2);
        // بيدوس على زرار في أول صف ('تعديل بيانات العميل')
        await customers.firstRowButton('تعديل بيانات العميل').click();

        // بيتأكد إن الصفحة الرابط بقى /edit=true/
        await expect(customers.page).toHaveURL(/edit=true/);
        // بيتأكد إن خانة name فيه القيمة name
        await expect(customers.name_tb).toHaveValue(name);
        // بيتأكد إن خانة name ينفع يتعدل
        await expect(customers.name_tb).toBeEditable();
        // بيتأكد إن زرار save ظاهر
        await expect(customers.save_btn).toBeVisible();
        // we leave the page without saving
    });

    // "حذف" بيفتح نافذة تأكيد، و"تراجع" ما بيمسحش العميل
    test('[Negative] delete and press "تراجع": the customer is NOT deleted', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيقرا خلية من أول صف، وبيحفظ النتيجة في name
        const name = await customers.firstRowCell(2);
        // بيدوس على زرار في أول صف ('حذف العميل')
        await customers.firstRowButton('حذف العميل').click();
        // بيتأكد إن نافذة الحذف فيه النص 'هل أنت متأكد من حذف العميل؟'
        await expect(customers.deleteDialog).toContainText('هل أنت متأكد من حذف العميل؟');

        // بيدوس على زرار cancelDelete
        await customers.cancelDelete_btn.click();
        // بيتأكد إن نافذة الحذف مش ظاهر
        await expect(customers.deleteDialog).toBeHidden();
        // بيعمل reload للصفحة
        await customers.page.reload();
        // بيتأكد إن صف في الجدول (name) عدده 1
        await expect(customers.row(name)).toHaveCount(1);
    });
});

//===================العملاء المحتملين (Leads)===================
// تستات جدول العملاء المحتملين
test.describe('Admin - customers: leads', { tag: '@customers' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في جدول المحتملين
    for (const column of customersData.leadsColumns) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the leads table has the column "${column}"`, async ({ adminPO }) => {
            // بيجيب صفحة إدارة العملاء من متصفح الأدمن
            const customers = adminPO.getAdminCustomersPage();

            // بيفتح الصفحة
            await customers.open();
            // بيفتح تاب العملاء المحتملين
            await customers.openLeads();
            // بيتأكد إن عمود في الجدول (column) عدده 1
            await expect(customers.header(column)).toHaveCount(1);
        });
    }
});

//===================إضافة عميل (من غير حفظ)===================
// تستات فورم إضافة عميل جديد من غير ما نحفظ
test.describe('Admin - customers: add form (nothing is saved)', { tag: '@customers' }, () => {

    // الفورم فيها 3 خطوات وكل الخانات، و"التالي" مقفول وهي فاضية
    test('[Negative] the add form has 3 steps and "التالي" is disabled when it is empty', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيفتح فورم الإضافة
        await customers.openAddForm();
        // Data-Driven: بيلف على customersData.addSteps، وبيعمل الكود اللي جوه لكل step
        for (const step of customersData.addSteps) {
            // بيتأكد إن خطوة في الفورم (step) ظاهر
            await expect(customers.step(step)).toBeVisible();
        }
        // Data-Driven: بيلف على customersData.addFields، وبيعمل الكود اللي جوه لكل field
        for (const field of customersData.addFields) {
            // بيتأكد إن خانة في الفورم (field) ظاهر
            await expect(customers.field(field)).toBeVisible();
        }
        // بيتأكد إن زرار next مقفول
        await expect(customers.next_btn).toBeDisabled();
    });

    // Data-Driven: داتا غلط بتظهر رسالة خطأ
    for (const data of customersData.wrongAddData) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Negative] add form: ${data.title} shows an error`, async ({ adminPO }) => {
            // بيجيب صفحة إدارة العملاء من متصفح الأدمن
            const customers = adminPO.getAdminCustomersPage();

            // بيفتح الصفحة
            await customers.open();
            // بيفتح فورم الإضافة
            await customers.openAddForm();
            // بيكتب data.value في خانة في الفورم (data.field)
            await customers.field(data.field).fill(data.value);
            // بيدوس Tab (بيخرج من الخانة)
            await customers.field(data.field).press('Tab');
            // بيتأكد إن نص في الصفحة (data.error) ظاهر
            await expect(customers.text(data.error)).toBeVisible();
            // بيدوس "التالي" ويتأكد إن الفورم ما اتحركتش
            await customers.assertNextDoesNotMove();
        });
    }

    // باسورد وتأكيده مختلفين بيظهر خطأ
    test('[Negative] add form: password and confirm are not the same', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيفتح الصفحة
        await customers.open();
        // بيفتح فورم الإضافة
        await customers.openAddForm();
        // بيكتب customersData.passwords.password في خانة password
        await customers.password_tb.fill(customersData.passwords.password);
        // بيكتب customersData.passwords.confirm في خانة confirmPassword
        await customers.confirmPassword_tb.fill(customersData.passwords.confirm);
        // بيدوس Tab (بيخرج من الخانة)
        await customers.confirmPassword_tb.press('Tab');
        // بيتأكد إن نص في الصفحة (customersData.passwords.error) ظاهر
        await expect(customers.text(customersData.passwords.error)).toBeVisible();
        // بيدوس "التالي" ويتأكد إن الفورم ما اتحركتش
        await customers.assertNextDoesNotMove();
    });
});

// إضافة عميل والتعديل والمسح وقفل لوحة التاجر: في tests/adminAddCustomer.spec.ts (على عميل QA جديد بس)
