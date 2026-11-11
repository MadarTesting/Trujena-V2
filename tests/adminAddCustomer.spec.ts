import { test, expect } from '../fixtures/fixtures';
import customersData from '../testData/customers';

// admin > إدارة العملاء: إضافة عميل QA جديد وتجربة السيناريوهات عليه هو بس
// IMPORTANT: العملاء التانيين محميين (utils/customerGuard.ts): أي تغيير عليهم بيتمنع

const customer = customersData.newCustomer;

test.describe('Admin - add a customer and test it', { tag: '@customers' }, () => {

    // إضافة عميل جديد بالـ 3 خطوات، ويظهر في القايمة
    test('[Positive] add a new customer: it is in the list', async ({ adminPO }) => {
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(customer);
        expect(response.ok(), await response.text()).toBeTruthy();

        const row = await adminPO.getAdminCustomersPage().openTestCustomer(customer.name);
        await expect(row).toContainText(customer.email);
    });

    // تفاصيل العميل فيها نفس الداتا اللي اتكتبت
    test('[Positive] view: the details show the data we entered', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        const row = await customers.openTestCustomer(customer.name);
        await row.getByRole('button', { name: 'عرض التفاصيل' }).click();
        await expect(customers.main.locator('#email-input')).toHaveValue(customer.email);
    });

    // Data-Driven: كل تعديل في customersData.edits بيتحفظ وتظهر رسالة النجاح
    for (const data of customersData.edits) {
        test(`[Positive] edit the ${data.title}: it is saved`, async ({ adminPO }) => {
            const customers = adminPO.getAdminCustomersPage();

            const response = await customers.editTestCustomer(customer.name, data.field, data.value);
            expect(response.ok(), await response.text()).toBeTruthy();
            await expect.soft(customers.page.getByText(customersData.updateToast)).toBeVisible();
            await expect(await customers.openTestCustomer(customer.name)).toContainText(data.value);
        });
    }

    // قفل لوحة التاجر مفعل افتراضيًا
    test('[Positive] the merchant dashboard switch is ON by default', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        const row = await customers.openTestCustomer(customer.name);
        await expect(customers.dashboardSwitch(row)).toBeChecked();
    });

    // مينفعش تغيّر قفل لوحة التاجر قبل روابط المتاجر (العميل الجديد مالوش روابط)
    test('[Negative] business rule: the dashboard switch can not change before the store links', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        await customers.clickTestDashboardSwitch(customer.name);
        const row = await customers.openTestCustomer(customer.name);
        await expect(customers.dashboardSwitch(row)).toBeChecked();
    });

    // مينفعش تمسح عميل عنده اشتراك فعال
    test('[Negative] business rule: a customer with an active subscription can not be deleted', async ({ adminPO }) => {
        const response = await adminPO.getAdminCustomersPage().deleteTestCustomer(customer.name);
        expect(response.ok()).toBeFalsy();
    });

    // بعد إلغاء الاشتراك العميل بيتمسح (وده بينضّف عميل التست)
    test('[Positive] after the subscription is cancelled, the customer can be deleted', async ({ adminPO }) => {
        const customers = adminPO.getAdminCustomersPage();

        const cancelled = await customers.cancelTestSubscription(customer.name);
        expect(cancelled.ok(), await cancelled.text()).toBeTruthy();
        const deleted = await customers.deleteTestCustomer(customer.name);
        expect(deleted.ok(), await deleted.text()).toBeTruthy();
    });
});
