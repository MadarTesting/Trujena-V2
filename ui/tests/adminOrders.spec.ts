// بيجيب test و expect و openWindow و closeWindow من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect, openWindow, closeWindow } from '../../fixtures/fixtures';
// بيجيب type Browser و type TestInfo من @playwright/test
import { type Browser, type TestInfo } from '@playwright/test';
// بيجيب LoginPage من pages/auth/LoginPage
import { LoginPage } from '../pages/auth/LoginPage';
// بيجيب MerchantAppPage من pages/merchant/MerchantAppPage
import { MerchantAppPage } from '../pages/merchant/MerchantAppPage';
// بيجيب MerchantReviewPage من pages/merchant/MerchantReviewPage
import { MerchantReviewPage } from '../pages/merchant/MerchantReviewPage';
// بيجيب ordersData من testData/orders.ts
import ordersData from '../../testData/orders';
// بيجيب configData من testData/config.ts
import configData from '../../testData/config';
// بيجيب reviewData من testData/review.ts
import reviewData from '../../testData/review';
// بيجيب stores من testData/stores.ts
import stores from '../../testData/stores';

// admin > إدارة الطلبات (requirements/AdminCustomersManagement.md = UC-6)
// كل run بيضيف عميلين QA جداد لوحده: واحد للرحلة (جديد -> تم النشر) وواحد للرفض
// IMPORTANT: الطلبات التانية محمية: التغيير مسموح على طلبات عملاء التست بس

// journeyCustomer = ordersData.journeyCustomer
const journeyCustomer = ordersData.journeyCustomer;
// rejectCustomer = ordersData.rejectCustomer
const rejectCustomer = ordersData.rejectCustomer;

// بيدخل كتاجر (عميل التست) في متصفح جديد
async function openMerchant(browser: Browser, testInfo: TestInfo, customer: { email: string; password: string }) {
    // بيستخدم openWindow وبياخد منها context, page 
    const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
    // بيعمل صفحة Login على المتصفح ده
    const login = new LoginPage(page);
    // بيفتح الصفحة
    await login.open();
    // بيكتب الإيميل والباسورد ويدوس دخول
    await login.login(customer.email, customer.password);
    // بيتأكد إن الدخول نجح
    await login.assertLoggedIn();
    // بيرجّع النتيجة
    return { context, page };
}

// التاجر بيراجع التطبيق: يطلب تعديل أو يوافق
async function merchantReview(browser: Browser, testInfo: TestInfo, requestNumber: string, approve: boolean) {
    // بيستخدم openMerchant وبياخد منها context, page 
    const { context, page } = await openMerchant(browser, testInfo, journeyCustomer);
    // try / finally: اللي في finally بيتنفذ دايمًا (حتى لو حاجة فشلت)
    try {
        // بيفتح تفاصيل الطلب
        await new MerchantAppPage(page).openRequestDetails(requestNumber);
        // بيعمل صفحة مراجعة التطبيق على المتصفح ده
        const review = new MerchantReviewPage(page);
        // بيفتح الصفحة
        await review.open();
        // لو الشرط ده صح: approve) await review.approve(
        if (approve) await review.approve();
        else await review.requestEdit(reviewData.editNotes);
        // بيستنى 2000 ميلي ثانية
        await page.waitForTimeout(2000);
    // finally = بيتنفذ دايمًا (بيقفل / بينضّف)
    } finally {
        // بينادي على الدالة closeWindow
        await closeWindow(context, page, testInfo, 'merchant');
    }
}

//===================رحلة الطلب (عميل جديد كل run)===================
test.describe('Admin - orders: the journey of a new request', { tag: '@orders' }, () => {

    // إضافة عميل جديد للرحلة، وطلبه بيظهر "جديد"
    test('[Positive] add a customer for the journey: its request is "جديد"', async ({ adminPO }) => {
        // بيضيف عميل جديد (الـ 3 خطوات) ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(journeyCustomer);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), await response.text()).toBeTruthy();

        // بيجيب صفحة الطلبات من متصفح الأدمن
        const admin = adminPO.getAdminRequestPage();
        // بيفتح الطلب ده ويسمح بالتغيير عليه هو بس
        await admin.openTestRequest(await admin.findRequestNumber(journeyCustomer.name));
        // بيتأكد إن حالة الطلب هي دي
        await admin.assertStatus('جديد');
    });

    // Data-Driven: كل خطوة في ordersData.journey = تست، وبيشتغل بس لو الطلب في حالة "from"
    for (const step of ordersData.journey) {
        // تست جديد
        test(step.title, async ({ adminPO, browser }, testInfo) => {
            // بيجيب صفحة الطلبات من متصفح الأدمن
            const admin = adminPO.getAdminRequestPage();
            // بيدوّر على رقم الطلب بتاع العميل ده، وبيحفظ النتيجة في requestNumber
            const requestNumber = await admin.findRequestNumber(journeyCustomer.name);

            // من أيقونة العرض
            await admin.openTestRequest(requestNumber);
            // بيقرا الحالة الحالية، وبيحفظ النتيجة في status
            const status = await admin.getStatus();
            // بيعمل skip للتست لو الشرط ده صح
            test.skip(status !== step.from, `the request is "${status}", this step needs "${step.from}"`);
            // لو الشرط ده صح: step.afterEdit !== undefined) test.skip(await admin.hasEditRequest() !
            if (step.afterEdit !== undefined) test.skip(await admin.hasEditRequest() !== step.afterEdit, 'this step is for the other version (before / after the edit request)');

            // بيختار الخطوة حسب نوعها
            switch (step.do) {
                // الخطوة "checkOnlyNext"
                case 'checkOnlyNext':           // الحالات بالتسلسل: زرار واحد بس ومفيش رفض
                    await admin.assertOnlyNextStage(step.button!);
                    // بيتأكد إن زرار الرفض مش ظاهر
                    await admin.assertRejectHidden();
                    break;
                // الخطوة "next"
                case 'next':                    // زرار المرحلة اللي بعدها
                    await admin.goToNextStage(step.button!);
                    break;
                // الخطوة "checkRejectEmpty"
                case 'checkRejectEmpty':        // الرفض من غير سبب: زرار التأكيد مقفول، وبعدين إلغاء
                    await admin.reject_btn.click();
                    // بيتأكد إن زرار confirmReject مقفول
                    await expect(admin.confirmReject_btn).toBeDisabled();
                    // بيدوس على زرار cancelReject
                    await admin.cancelReject_btn.click();
                    break;
                // الخطوة "checkEmptyConfig"
                case 'checkEmptyConfig':        // حفظ التهيئة فاضية
                    await adminPO.getAdminConfigPage().save();
                    break;
                // الخطوة "config"
                case 'config':                  // بيانات التهيئة
                    await adminPO.getAdminConfigPage().fillAndSave(configData.valid);
                    break;
                // الخطوة "checkBadFile"
                case 'checkBadFile':            // ملف مش APK / AAB: بيترفض والحالة ما بتتغيرش
                    await admin.uploadBuildAndSendToReview(step.file!);
                    break;
                // الخطوة "upload"
                case 'upload':                  // رفع APK / AAB
                    await admin.uploadBuildAndSendToReview(step.file!);
                    break;
                // الخطوة "merchantEdit"
                case 'merchantEdit':            // التاجر بيطلب تعديل
                    await merchantReview(browser, testInfo, requestNumber, false);
                    break;
                // الخطوة "merchantApprove"
                case 'merchantApprove':         // التاجر بيوافق
                    await merchantReview(browser, testInfo, requestNumber, true);
                    break;
                // الخطوة "googlePlay"
                case 'googlePlay':              // رابط Google Play بس
                    await adminPO.getAdminPublishPage().addGooglePlayLink(stores.googlePlay);
                    break;
                // الخطوة "appStore"
                case 'appStore':                // رابط App Store
                    await adminPO.getAdminPublishPage().addAppStoreLink(stores.appStore);
                    break;
            }

            // بيستنى لحد ما الحالة تبقى دي
            await admin.waitForStatus(step.to);
        });
    }
});

//===================القايمة والبحث والفلتر (من غير أي تغيير)===================
test.describe('Admin - orders: list, search and filter', { tag: '@orders' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of ordersData.columns) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            // بيجيب صفحة الطلبات من متصفح الأدمن
            const orders = adminPO.getAdminRequestPage();

            // بيفتح الصفحة
            await orders.open();
            // بيتأكد إن عمود في الجدول (column) عدده 1
            await expect(orders.header(column)).toHaveCount(1);
        });
    }

    // Data-Driven: كل صف فيه أزرار الإجراءات اللي في الريكوايرمنت
    for (const button of ordersData.rowButtons) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] every request has the button "${button}"`, async ({ adminPO }) => {
            // بيجيب صفحة الطلبات من متصفح الأدمن
            const orders = adminPO.getAdminRequestPage();

            // بيفتح الصفحة
            await orders.open();
            // بيتأكد إن زرار في صف معين (button) ظاهر
            await expect(orders.rowButton(button)).toBeVisible();
        });
    }

    // البحث باسم العميل بيظهر طلبه
    test('[Positive] search by the customer name shows the request', async ({ adminPO }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const orders = adminPO.getAdminRequestPage();

        // بيفتح الصفحة
        await orders.open();
        // بيكتب في البحث ويستنى النتيجة
        await orders.search(journeyCustomer.name);
        // بيتأكد إن أول صفوف الطلبات فيه النص journeyCustomer.name
        await expect(orders.requestRows.first()).toContainText(journeyCustomer.name);
    });

    // البحث برقم الطلب بيظهر الطلب ده بس
    test('[Positive] search by the request number shows the request', async ({ adminPO }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const orders = adminPO.getAdminRequestPage();
        // بيدوّر على رقم الطلب بتاع العميل ده، وبيحفظ النتيجة في requestNumber
        const requestNumber = await orders.findRequestNumber(journeyCustomer.name);

        // بيفتح الصفحة
        await orders.open();
        // بيكتب في البحث ويستنى النتيجة
        await orders.search(requestNumber);
        // بيتأكد إن صفوف الطلبات عدده 1
        await expect(orders.requestRows).toHaveCount(1);
        // بيتأكد إن أول صفوف الطلبات فيه النص requestNumber
        await expect(orders.requestRows.first()).toContainText(requestNumber);
    });

    // البحث بحاجة مش موجودة: رسالة "لا توجد طلبات حاليا"
    test('[Negative] search with an unknown text shows "لا توجد طلبات حاليا"', async ({ adminPO }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const orders = adminPO.getAdminRequestPage();

        // بيفتح الصفحة
        await orders.open();
        // بيكتب في البحث ويستنى النتيجة
        await orders.search(ordersData.unknownSearch);
        // بيتأكد إن نص في الصفحة (ordersData.emptyMessage) ظاهر
        await expect(orders.text(ordersData.emptyMessage)).toBeVisible();
    });

    // Data-Driven: فلتر حالة الطلب بيعرض الطلبات اللي في الحالة دي بس
    for (const status of ordersData.filterStatuses) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] filter by status "${status}" shows only these requests`, async ({ adminPO }) => {
            // بيجيب صفحة الطلبات من متصفح الأدمن
            const orders = adminPO.getAdminRequestPage();

            // بيفتح الصفحة
            await orders.open();
            // بيفلتر بالحالة دي
            await orders.filterByStatus(status);
            // statusCells = await orders.statusCells.allInnerTexts()
            const statusCells = await orders.statusCells.allInnerTexts();
            // Data-Driven: بيلف على statusCells، وبيعمل الكود اللي جوه لكل cell
            for (const cell of statusCells) expect(cell.trim()).toBe(status);
        });
    }

    // فلتر التاريخ: النهارده بيعرض طلبات النهارده بس (طلب عميل التست منهم)
    test('[Positive] filter by date (today) shows only the requests of today', async ({ adminPO }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const orders = adminPO.getAdminRequestPage();

        // بيفتح الصفحة
        await orders.open();
        // بيفلتر بيوم معين
        await orders.filterByDay(ordersData.requestDay);
        // dates = await orders.dateCells.allInnerTexts()
        const dates = await orders.dateCells.allInnerTexts();
        // Data-Driven: بيلف على dates، وبيعمل الكود اللي جوه لكل date
        for (const date of dates) expect(date).toContain(ordersData.requestDate);
    });

    // فلتر الحالة فيه كل الحالات اللي في الريكوايرمنت
    test('[Positive] the status filter has all the statuses of the requirement', async ({ adminPO }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const orders = adminPO.getAdminRequestPage();

        // بيفتح الصفحة
        await orders.open();
        // بيدوس على قايمة statusFilter
        await orders.statusFilter_cmb.click();
        // Data-Driven: بيلف على ordersData.allStatuses، وبيعمل الكود اللي جوه لكل status
        for (const status of ordersData.allStatuses) {
            // بيتأكد إن اختيار في القايمة (status) ظاهر (soft: لو فشل التست يكمّل)
            await expect.soft(orders.option(status)).toBeVisible();
        }
    });

    // أيقونة العرض بتفتح تفاصيل الطلب: بيانات الطلب والمرفقات والحالة وسجل التحديثات
    test('[Positive] view: the request page has the details, the files, the status and the updates log', async ({ adminPO }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const orders = adminPO.getAdminRequestPage();

        // بيفتح الطلب ده ويسمح بالتغيير عليه هو بس
        await orders.openTestRequest(await orders.findRequestNumber(journeyCustomer.name));
        // Data-Driven: بيلف على ordersData.detailsSections، وبيعمل الكود اللي جوه لكل section
        for (const section of ordersData.detailsSections) {
            // بيتأكد إن orders.text(section first )).toBeVisible(
            await expect(orders.text(section).first()).toBeVisible();
        }
        // after the journey the log must not be empty
        await expect(orders.text('لا توجد نشاطات')).toHaveCount(0);
    });
});

//===================رفض الطلب (عميل جديد كل run)===================
// الرفض بيقفل الطلب، فبنعمل عميل QA جديد مخصوص للرفض
test.describe('Admin - orders: reject a request (new test customer)', { tag: '@orders' }, () => {

    // إضافة عميل جديد للرفض، وطلبه بيظهر "جديد"
    test('[Positive] add a customer for the reject test: its request is "جديد"', async ({ adminPO }) => {
        // بيضيف عميل جديد (الـ 3 خطوات) ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(rejectCustomer);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), await response.text()).toBeTruthy();

        // بيجيب صفحة الطلبات من متصفح الأدمن
        const admin = adminPO.getAdminRequestPage();
        // بيفتح الطلب ده ويسمح بالتغيير عليه هو بس
        await admin.openTestRequest(await admin.findRequestNumber(rejectCustomer.name));
        // بيتأكد إن حالة الطلب هي دي
        await admin.assertStatus('جديد');
    });

    // الأدمن بيحوّل الطلب لقيد المراجعة وبيرفضه بسبب: الحالة "مرفوض"
    test('[Positive] reject with a reason: the status is "مرفوض"', async ({ adminPO }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const admin = adminPO.getAdminRequestPage();

        // بيفتح الطلب ده ويسمح بالتغيير عليه هو بس
        await admin.openTestRequest(await admin.findRequestNumber(rejectCustomer.name));
        // لو الشرط ده صح: await admin.getStatus() === 'جديد'
        if (await admin.getStatus() === 'جديد') {
            // بيدوس زرار المرحلة اللي بعدها
            await admin.goToNextStage(ordersData.toReviewButton);
            // بيستنى لحد ما الحالة تبقى دي
            await admin.waitForStatus('قيد المراجعة');
        }
        // بيرفض الطلب بالسبب ده
        await admin.reject(reviewData.rejectReason);
        // بيستنى لحد ما الحالة تبقى دي
        await admin.waitForStatus('مرفوض');
        // مفيش مرحلة بعد الرفض
        await expect(admin.nextStage_btns).toHaveCount(0);
    });

    // التاجر بيشوف الحالة "مرفوض" وسبب الرفض في تفاصيل الطلب
    test('[Positive] the merchant sees "مرفوض" and the reject reason', async ({ adminPO, browser }, testInfo) => {
        // بيدوّر على رقم الطلب بتاع العميل ده، وبيحفظ النتيجة في requestNumber
        const requestNumber = await adminPO.getAdminRequestPage().findRequestNumber(rejectCustomer.name);
        // بيستخدم openMerchant وبياخد منها context, page 
        const { context, page } = await openMerchant(browser, testInfo, rejectCustomer);
        // try / finally: اللي في finally بيتنفذ دايمًا (حتى لو حاجة فشلت)
        try {
            // بيعمل صفحة إدارة التطبيق على المتصفح ده
            const merchantApp = new MerchantAppPage(page);
            // بيتأكد إن الحالة في تفاصيل الطلب هي دي
            await merchantApp.assertStatusInDetails(requestNumber, 'مرفوض');
            // بيتأكد إن نص في الصفحة (reviewData.rejectReason) ظاهر
            await expect(merchantApp.text(reviewData.rejectReason)).toBeVisible();
        // finally = بيتنفذ دايمًا (بيقفل / بينضّف)
        } finally {
            // بينادي على الدالة closeWindow
            await closeWindow(context, page, testInfo, 'merchant');
        }
    });
});
