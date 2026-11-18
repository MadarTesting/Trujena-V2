// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب customersData من testData/customers.ts
import customersData from '../../testData/customers';

// admin > إدارة العملاء: إضافة عميل QA جديد وتجربة السيناريوهات عليه هو بس
// IMPORTANT: العملاء التانيين محميين (utils/customerGuard.ts): أي تغيير عليهم بيتمنع

// customer = customersData.newCustomer
const customer = customersData.newCustomer;

// مجموعة تستات: Admin - add a customer and test it
test.describe('Admin - add a customer and test it', { tag: '@customers' }, () => {

    // إضافة عميل جديد بالـ 3 خطوات، ويظهر في القايمة
    test('[Positive] add a new customer: it is in the list', async ({ adminPO }) => {
        // بيضيف عميل جديد (الـ 3 خطوات) ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(customer);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), await response.text()).toBeTruthy();

        // بيدوّر على عميل التست ويسمح بالتغيير عليه هو بس، وبيحفظ النتيجة في row
        const row = await adminPO.getAdminCustomersPage().openTestCustomer(customer.name);
        // بيتأكد إن row فيه النص customer.email
        await expect(row).toContainText(customer.email);
    });

    // تفاصيل العميل فيها نفس الداتا اللي اتكتبت
    test('[Positive] view: the details show the data we entered', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيدوّر على عميل التست ويسمح بالتغيير عليه هو بس، وبيحفظ النتيجة في row
        const row = await customers.openTestCustomer(customer.name);
        // بيدوس "عرض التفاصيل"
        await customers.viewDetails(row);
        // بيتأكد إن خانة email فيه القيمة customer.email
        await expect(customers.email_tb).toHaveValue(customer.email);
    });

    // Data-Driven: كل تعديل في customersData.edits بيتحفظ وتظهر رسالة النجاح
    for (const data of customersData.edits) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] edit the ${data.title}: it is saved`, async ({ adminPO }) => {
            // بيجيب صفحة إدارة العملاء من متصفح الأدمن
            const customers = adminPO.getAdminCustomersPage();

            // بيعدّل خانة في عميل التست ويحفظ، وبيحفظ النتيجة في response
            const response = await customers.editTestCustomer(customer.name, data.field, data.value);
            // بيتأكد إن السيرفر رد بنجاح
            expect(response.ok(), await response.text()).toBeTruthy();
            // بيتأكد إن رسالة في الصفحة (customersData.updateToast) ظاهر (soft: لو فشل التست يكمّل)
            await expect.soft(customers.toast(customersData.updateToast)).toBeVisible();
            // بيتأكد إن بيدوّر على عميل التست ويسمح بالتغيير عليه هو بس (customer.name) فيه النص data.value
            await expect(await customers.openTestCustomer(customer.name)).toContainText(data.value);
        });
    }

    // قفل لوحة التاجر مفعل افتراضيًا
    test('[Positive] the merchant dashboard switch is ON by default', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيدوّر على عميل التست ويسمح بالتغيير عليه هو بس، وبيحفظ النتيجة في row
        const row = await customers.openTestCustomer(customer.name);
        // بيتأكد إن switch لوحة التاجر في الصف (row) متعلّم عليه
        await expect(customers.dashboardSwitch(row)).toBeChecked();
    });

    // مينفعش تغيّر قفل لوحة التاجر قبل روابط المتاجر (العميل الجديد مالوش روابط)
    test('[Negative] business rule: the dashboard switch can not change before the store links', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيدوس على switch لوحة التاجر بتاع عميل التست
        await customers.clickTestDashboardSwitch(customer.name);
        // بيدوّر على عميل التست ويسمح بالتغيير عليه هو بس، وبيحفظ النتيجة في row
        const row = await customers.openTestCustomer(customer.name);
        // بيتأكد إن switch لوحة التاجر في الصف (row) متعلّم عليه
        await expect(customers.dashboardSwitch(row)).toBeChecked();
    });

    // مينفعش تمسح عميل عنده اشتراك فعال
    test('[Negative] business rule: a customer with an active subscription can not be deleted', async ({ adminPO }) => {
        // بيمسح عميل التست، وبيحفظ النتيجة في response
        const response = await adminPO.getAdminCustomersPage().deleteTestCustomer(customer.name);
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok()).toBeFalsy();
    });

    // بعد إلغاء الاشتراك العميل بيتمسح (وده بينضّف عميل التست)
    test('[Positive] after the subscription is cancelled, the customer can be deleted', async ({ adminPO }) => {
        // بيجيب صفحة إدارة العملاء من متصفح الأدمن
        const customers = adminPO.getAdminCustomersPage();

        // بيلغي اشتراك عميل التست، وبيحفظ النتيجة في cancelled
        const cancelled = await customers.cancelTestSubscription(customer.name);
        // بيتأكد إن السيرفر رد بنجاح
        expect(cancelled.ok(), await cancelled.text()).toBeTruthy();
        // بيمسح عميل التست، وبيحفظ النتيجة في deleted
        const deleted = await customers.deleteTestCustomer(customer.name);
        // بيتأكد إن السيرفر رد بنجاح
        expect(deleted.ok(), await deleted.text()).toBeTruthy();
    });
});
