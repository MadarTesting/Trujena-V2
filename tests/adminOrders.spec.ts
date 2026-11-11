import { test, expect, openWindow, closeWindow } from '../fixtures/fixtures';
import { type Browser, type TestInfo } from '@playwright/test';
import { LoginPage } from '../pages/auth/LoginPage';
import { MerchantAppPage } from '../pages/merchant/MerchantAppPage';
import { MerchantReviewPage } from '../pages/merchant/MerchantReviewPage';
import ordersData from '../testData/orders';
import configData from '../testData/config';
import reviewData from '../testData/review';
import stores from '../testData/stores';

// admin > إدارة الطلبات (requirements/AdminCustomersManagement.md = UC-6)
// كل run بيضيف عميلين QA جداد لوحده: واحد للرحلة (جديد -> تم النشر) وواحد للرفض
// IMPORTANT: الطلبات التانية محمية: التغيير مسموح على طلبات عملاء التست بس

const journeyCustomer = ordersData.journeyCustomer;
const rejectCustomer = ordersData.rejectCustomer;

// بيدخل كتاجر (عميل التست) في متصفح جديد
async function openMerchant(browser: Browser, testInfo: TestInfo, customer: { email: string; password: string }) {
    const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
    const login = new LoginPage(page);
    await login.open();
    await login.login(customer.email, customer.password);
    await login.assertLoggedIn();
    return { context, page };
}

// التاجر بيراجع التطبيق: يطلب تعديل أو يوافق
async function merchantReview(browser: Browser, testInfo: TestInfo, requestNumber: string, approve: boolean) {
    const { context, page } = await openMerchant(browser, testInfo, journeyCustomer);
    try {
        await new MerchantAppPage(page).openRequestDetails(requestNumber);
        const review = new MerchantReviewPage(page);
        await review.open();
        if (approve) await review.approve();
        else await review.requestEdit(reviewData.editNotes);
        await page.waitForTimeout(2000);
    } finally {
        await closeWindow(context, page, testInfo, 'merchant');
    }
}

//===================رحلة الطلب (عميل جديد كل run)===================
test.describe('Admin - orders: the journey of a new request', { tag: '@orders' }, () => {

    // إضافة عميل جديد للرحلة، وطلبه بيظهر "جديد"
    test('[Positive] add a customer for the journey: its request is "جديد"', async ({ adminPO }) => {
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(journeyCustomer);
        expect(response.ok(), await response.text()).toBeTruthy();

        const admin = adminPO.getAdminRequestPage();
        await admin.openTestRequest(await admin.findRequestNumber(journeyCustomer.name));
        await admin.assertStatus('جديد');
    });

    // Data-Driven: كل خطوة في ordersData.journey = تست، وبيشتغل بس لو الطلب في حالة "from"
    for (const step of ordersData.journey) {
        test(step.title, async ({ adminPO, browser }, testInfo) => {
            const admin = adminPO.getAdminRequestPage();
            const requestNumber = await admin.findRequestNumber(journeyCustomer.name);

            await admin.openTestRequest(requestNumber);                 // من أيقونة العرض
            const status = await admin.getStatus();
            test.skip(status !== step.from, `the request is "${status}", this step needs "${step.from}"`);
            if (step.afterEdit !== undefined) test.skip(await admin.hasEditRequest() !== step.afterEdit, 'this step is for the other version (before / after the edit request)');

            switch (step.do) {
                case 'checkOnlyNext':           // الحالات بالتسلسل: زرار واحد بس ومفيش رفض
                    await admin.assertOnlyNextStage(step.button!);
                    await admin.assertRejectHidden();
                    break;
                case 'next':                    // زرار المرحلة اللي بعدها
                    await admin.goToNextStage(step.button!);
                    break;
                case 'checkRejectEmpty':        // الرفض من غير سبب: زرار التأكيد مقفول، وبعدين إلغاء
                    await admin.reject_btn.click();
                    await expect(admin.confirmReject_btn).toBeDisabled();
                    await admin.cancelReject_btn.click();
                    break;
                case 'checkEmptyConfig':        // حفظ التهيئة فاضية
                    await adminPO.getAdminConfigPage().save();
                    break;
                case 'config':                  // بيانات التهيئة
                    await adminPO.getAdminConfigPage().fillAndSave(configData.valid);
                    break;
                case 'checkBadFile':            // ملف مش APK / AAB: بيترفض والحالة ما بتتغيرش
                    await admin.uploadBuildAndSendToReview(step.file!);
                    break;
                case 'upload':                  // رفع APK / AAB
                    await admin.uploadBuildAndSendToReview(step.file!);
                    break;
                case 'merchantEdit':            // التاجر بيطلب تعديل
                    await merchantReview(browser, testInfo, requestNumber, false);
                    break;
                case 'merchantApprove':         // التاجر بيوافق
                    await merchantReview(browser, testInfo, requestNumber, true);
                    break;
                case 'googlePlay':              // رابط Google Play بس
                    await adminPO.getAdminPublishPage().addGooglePlayLink(stores.googlePlay);
                    break;
                case 'appStore':                // رابط App Store
                    await adminPO.getAdminPublishPage().addAppStoreLink(stores.appStore);
                    break;
            }

            await admin.waitForStatus(step.to);
        });
    }
});

//===================القايمة والبحث والفلتر (من غير أي تغيير)===================
test.describe('Admin - orders: list, search and filter', { tag: '@orders' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of ordersData.columns) {
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            const orders = adminPO.getAdminRequestPage();

            await orders.open();
            await expect(orders.headers.filter({ hasText: column })).toHaveCount(1);
        });
    }

    // Data-Driven: كل صف فيه أزرار الإجراءات اللي في الريكوايرمنت
    for (const button of ordersData.rowButtons) {
        test(`[Positive] every request has the button "${button}"`, async ({ adminPO }) => {
            const orders = adminPO.getAdminRequestPage();

            await orders.open();
            await expect(orders.requestRows.first().getByRole('button', { name: button })).toBeVisible();
        });
    }

    // البحث باسم العميل بيظهر طلبه
    test('[Positive] search by the customer name shows the request', async ({ adminPO }) => {
        const orders = adminPO.getAdminRequestPage();

        await orders.open();
        await orders.search(journeyCustomer.name);
        await expect(orders.requestRows.first()).toContainText(journeyCustomer.name);
    });

    // البحث برقم الطلب بيظهر الطلب ده بس
    test('[Positive] search by the request number shows the request', async ({ adminPO }) => {
        const orders = adminPO.getAdminRequestPage();
        const requestNumber = await orders.findRequestNumber(journeyCustomer.name);

        await orders.open();
        await orders.search(requestNumber);
        await expect(orders.requestRows).toHaveCount(1);
        await expect(orders.requestRows.first()).toContainText(requestNumber);
    });

    // البحث بحاجة مش موجودة: رسالة "لا توجد طلبات حاليا"
    test('[Negative] search with an unknown text shows "لا توجد طلبات حاليا"', async ({ adminPO }) => {
        const orders = adminPO.getAdminRequestPage();

        await orders.open();
        await orders.search(ordersData.unknownSearch);
        await expect(orders.page.locator('main').getByText(ordersData.emptyMessage)).toBeVisible();
    });

    // Data-Driven: فلتر حالة الطلب بيعرض الطلبات اللي في الحالة دي بس
    for (const status of ordersData.filterStatuses) {
        test(`[Positive] filter by status "${status}" shows only these requests`, async ({ adminPO }) => {
            const orders = adminPO.getAdminRequestPage();

            await orders.open();
            await orders.filterByStatus(status);
            const statusCells = await orders.requestRows.locator('td:nth-child(5)').allInnerTexts();
            for (const cell of statusCells) expect(cell.trim()).toBe(status);
        });
    }

    // فلتر التاريخ: النهارده بيعرض طلبات النهارده بس (طلب عميل التست منهم)
    test('[Positive] filter by date (today) shows only the requests of today', async ({ adminPO }) => {
        const orders = adminPO.getAdminRequestPage();

        await orders.open();
        await orders.filterByDay(ordersData.requestDay);
        const dates = await orders.requestRows.locator('td:nth-child(4)').allInnerTexts();
        for (const date of dates) expect(date).toContain(ordersData.requestDate);
    });

    // فلتر الحالة فيه كل الحالات اللي في الريكوايرمنت
    test('[Positive] the status filter has all the statuses of the requirement', async ({ adminPO }) => {
        const orders = adminPO.getAdminRequestPage();

        await orders.open();
        await orders.page.locator('main').getByRole('combobox').filter({ hasText: 'حالة الطلب' }).click();
        for (const status of ordersData.allStatuses) {
            await expect.soft(orders.page.getByRole('option', { name: status, exact: true })).toBeVisible();
        }
    });

    // أيقونة العرض بتفتح تفاصيل الطلب: بيانات الطلب والمرفقات والحالة وسجل التحديثات
    test('[Positive] view: the request page has the details, the files, the status and the updates log', async ({ adminPO }) => {
        const orders = adminPO.getAdminRequestPage();

        await orders.openTestRequest(await orders.findRequestNumber(journeyCustomer.name));
        for (const section of ordersData.detailsSections) {
            await expect(orders.page.locator('main').getByText(section).first()).toBeVisible();
        }
        // after the journey the log must not be empty
        await expect(orders.page.locator('main').getByText('لا توجد نشاطات')).toHaveCount(0);
    });
});

//===================رفض الطلب (عميل جديد كل run)===================
// الرفض بيقفل الطلب، فبنعمل عميل QA جديد مخصوص للرفض
test.describe('Admin - orders: reject a request (new test customer)', { tag: '@orders' }, () => {

    // إضافة عميل جديد للرفض، وطلبه بيظهر "جديد"
    test('[Positive] add a customer for the reject test: its request is "جديد"', async ({ adminPO }) => {
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(rejectCustomer);
        expect(response.ok(), await response.text()).toBeTruthy();

        const admin = adminPO.getAdminRequestPage();
        await admin.openTestRequest(await admin.findRequestNumber(rejectCustomer.name));
        await admin.assertStatus('جديد');
    });

    // الأدمن بيحوّل الطلب لقيد المراجعة وبيرفضه بسبب: الحالة "مرفوض"
    test('[Positive] reject with a reason: the status is "مرفوض"', async ({ adminPO }) => {
        const admin = adminPO.getAdminRequestPage();

        await admin.openTestRequest(await admin.findRequestNumber(rejectCustomer.name));
        if (await admin.getStatus() === 'جديد') {
            await admin.goToNextStage(ordersData.toReviewButton);
            await admin.waitForStatus('قيد المراجعة');
        }
        await admin.reject(reviewData.rejectReason);
        await admin.waitForStatus('مرفوض');
        await expect(admin.nextStage_btns).toHaveCount(0);           // مفيش مرحلة بعد الرفض
    });

    // التاجر بيشوف الحالة "مرفوض" وسبب الرفض في تفاصيل الطلب
    test('[Positive] the merchant sees "مرفوض" and the reject reason', async ({ adminPO, browser }, testInfo) => {
        const requestNumber = await adminPO.getAdminRequestPage().findRequestNumber(rejectCustomer.name);
        const { context, page } = await openMerchant(browser, testInfo, rejectCustomer);
        try {
            await new MerchantAppPage(page).assertStatusInDetails(requestNumber, 'مرفوض');
            await expect(page.locator('main').getByText(reviewData.rejectReason)).toBeVisible();
        } finally {
            await closeWindow(context, page, testInfo, 'merchant');
        }
    });
});
