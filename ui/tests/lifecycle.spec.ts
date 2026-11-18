// بيجيب test as base و expect و openWindow و closeWindow من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test as base, expect, openWindow, closeWindow } from '../../fixtures/fixtures';
// بيجيب LoginPage من pages/auth/LoginPage
import { LoginPage } from '../pages/auth/LoginPage';
// بيجيب POManager من pages/POManager
import { POManager } from '../pages/POManager';
// بيجيب statuses من testData/statuses.ts
import statuses from '../../testData/statuses';
// بيجيب actions من testData/actions.ts
import actions from '../../testData/actions';
// بيجيب configData من testData/config.ts
import configData from '../../testData/config';
// بيجيب paths من testData/paths.ts
import paths from '../../testData/paths';
// بيجيب stores من testData/stores.ts
import stores from '../../testData/stores';
// بيجيب reviewData من testData/review.ts
import reviewData from '../../testData/review';
// بيجيب lifecycleData من testData/lifecycle.ts
import lifecycleData from '../../testData/lifecycle';

// IMPORTANT:
// - كل run الأدمن بيضيف تاجر QA جديد من "إدارة العملاء"، وطلبه بيبدأ "جديد"
//   فتقدر تشغّل الملف كل مرة من غير ما تعمل طلب بإيدك
// - التستات بتغيّر طلبات تجار التست بس (الطلبات التانية محمية: utils/customerGuard.ts)
// - all tests use the SAME request, so they run one by one (serial)
// - NO data is deleted (تجار QA بيفضلوا موجودين على staging)

// customer = lifecycleData.journeyCustomer
const customer = lifecycleData.journeyCustomer;

//===================Fixtures===================
// merchantPO = تاجر التست (بيدخل بالإيميل والباسورد بتوعه، مش بجلسة التاجر المحفوظة)
// requestNumber = رقم طلب تاجر التست (من إدارة الطلبات عند الأدمن)
const test = base.extend({
    // fixture اسمه merchantPO
    merchantPO: async ({ browser }, use, testInfo) => {
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

        // use = التست بيشتغل هنا (بياخد الحاجة دي)
        await use(new POManager(page));

        // بينادي على الدالة closeWindow
        await closeWindow(context, page, testInfo, 'lifecycle-merchant');
    },

    // fixture اسمه requestNumber
    requestNumber: async ({ adminPO }, use) => {
        // بيدوّر على رقم الطلب بتاع العميل ده، وبيحفظ النتيجة في requestNumber
        const requestNumber = await adminPO.getAdminRequestPage().findRequestNumber(customer.name);
        // بيطبع في الترمنال
        console.log(`request under test: ${requestNumber} (${customer.name})`);
        // use = التست بيشتغل هنا (بياخد الحاجة دي)
        await use(requestNumber);
    },
});

//===================Test Cases===================
// رحلة الطلب: الأدمن بيغيّر الحالة والتاجر بيتأكد منها
test.describe('Request journey - admin changes the status, merchant checks it', { tag: '@lifecycle' }, () => {
    // لو إضافة التاجر فشلت، باقي الرحلة بتتعمل skip (التستات بالترتيب على نفس الطلب)
    test.describe.configure({ mode: 'serial' });

    // الأدمن بيضيف تاجر جديد من إدارة العملاء، وطلبه بيظهر "جديد"
    test('[Positive] admin adds a new merchant: its request is "جديد"', async ({ adminPO }) => {
        // بيضيف عميل جديد (الـ 3 خطوات) ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(customer);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), await response.text()).toBeTruthy();

        // بيجيب صفحة الطلبات من متصفح الأدمن
        const admin = adminPO.getAdminRequestPage();
        // بيفتح الطلب ده ويسمح بالتغيير عليه هو بس
        await admin.openTestRequest(await admin.findRequestNumber(customer.name));
        // بيتأكد إن حالة الطلب هي دي
        await admin.assertStatus(statuses.admin.new);
    });

    // التاجر ما يقدرش يعمل طلب تاني والطلب الأول لسه مفتوح
    test('[Positive] merchant cannot create a second request while one is open', async ({ merchantPO }) => {
        // بيتأكد إن زرار "إنشاء طلب" مقفول
        await merchantPO.getMerchantAppPage().assertCreateRequestDisabled();
    });

    // الطلب الجديد: يظهر زرار المرحلة الجاية بس ومفيش رفض
    test('[Negative] new request: only "go to review" is shown and NO reject', async ({ adminPO, requestNumber }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const admin = adminPO.getAdminRequestPage();

        // بيفتح الطلب ده ويسمح بالتغيير عليه هو بس
        await admin.openTestRequest(requestNumber);
        // بيتأكد إن حالة الطلب هي دي
        await admin.assertStatus(statuses.admin.new);
        // statuses move in order
        await admin.assertOnlyNextStage(actions.toReview);
        // reject only from "قيد المراجعة"
        await admin.assertRejectHidden();
    });

    //-------------------the full journey (new -> edit once -> published)-------------------
    // الرحلة كاملة من طلب جديد لحد "تم النشر"
    test('[Positive] full journey: new request to published', { tag: '@smoke' }, async ({ adminPO, merchantPO, requestNumber }) => {
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const admin = adminPO.getAdminRequestPage();
        // بيجيب صفحة إدارة التطبيق من متصفح التاجر
        const merchant = merchantPO.getMerchantAppPage();
        // بيجيب صفحة مراجعة التطبيق من متصفح التاجر
        const review = merchantPO.getMerchantReviewPage();

        // خطوة في التقرير: 0. Admin opens the request of the new merchant
        await test.step('0. Admin opens the request of the new merchant', async () => {
            // الحماية: التغيير مسموح على الطلب ده بس
            await admin.openTestRequest(requestNumber);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.new);
        });

        // خطوة في التقرير: 1. Admin moves the request to "قيد المراجعة"
        await test.step('1. Admin moves the request to "قيد المراجعة"', async () => {
            // بيدوس زرار المرحلة اللي بعدها
            await admin.goToNextStage(actions.toReview);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.review);
            // بيتأكد إن زرار الرفض ظاهر
            await admin.assertRejectVisible();
        });

        // خطوة في التقرير: 1. Merchant (إدارة التطبيق): table + details = "قيد المراجعة"
        await test.step('1. Merchant (إدارة التطبيق): table + details = "قيد المراجعة"', async () => {
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.review);
        });

        // خطوة في التقرير: 2. Admin moves the request to "جاري الإعداد"
        await test.step('2. Admin moves the request to "جاري الإعداد"', async () => {
            // بيدوس زرار المرحلة اللي بعدها
            await admin.goToNextStage(actions.toPreparing);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.preparing);
        });

        // خطوة في التقرير: 2. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"
        await test.step('2. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"', async () => {
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.preparing);
        });

        // خطوة في التقرير: 3. Admin saves the app configuration -> "قيد التنفيذ" automatically
        await test.step('3. Admin saves the app configuration -> "قيد التنفيذ" automatically', async () => {
            // SEEN on stg: "حفظ البيانات" moves the request to "قيد التنفيذ", there is no other button
            await adminPO.getAdminConfigPage().fillAndSave(configData.valid);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.inProgress);
        });

        // خطوة في التقرير: 3. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"
        await test.step('3. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"', async () => {
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.inProgress);
        });

        // خطوة في التقرير: 4. Admin uploads the first version (APK) -> "جاهز للمراجعة"
        await test.step('4. Admin uploads the first version (APK) -> "جاهز للمراجعة"', async () => {
            // بيرفع ملف التطبيق ويبعته للمراجعة
            await admin.uploadBuildAndSendToReview(paths.apk);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.readyForReview);
        });

        // خطوة في التقرير: 4. Merchant (إدارة التطبيق): status + can download and ask for an edit
        await test.step('4. Merchant (إدارة التطبيق): status + can download and ask for an edit', async () => {
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.readyForReview);
            // بيفتح الصفحة
            await review.open();
            // بيتأكد إن تحميل التطبيق متاح
            await review.assertDownloadAvailable();
            // بيتأكد إن زرار الموافقة ظاهر
            await review.assertApproveButtonVisible();
            // بيتأكد إن زرار طلب التعديل ظاهر
            await review.assertEditButtonVisible();
        });

        // خطوة في التقرير: 5. Merchant asks for an edit (only one time)
        await test.step('5. Merchant asks for an edit (only one time)', async () => {
            // بيطلب تعديل بالملاحظات دي
            await review.requestEdit(reviewData.editNotes);
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.editRequested);
        });

        // خطوة في التقرير: 5. Admin sees "طلب تعديل"
        await test.step('5. Admin sees "طلب تعديل"', async () => {
            // بيعمل refresh للصفحة
            await admin.refresh();
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.editRequested);
        });

        // خطوة في التقرير: 6. Admin sends the request back to "قيد التنفيذ"
        await test.step('6. Admin sends the request back to "قيد التنفيذ"', async () => {
            // بيدوس زرار المرحلة اللي بعدها
            await admin.goToNextStage(actions.editToInProgress);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.inProgress);
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.inProgress);
        });

        // خطوة في التقرير: 7. Admin uploads the second version (AAB) -> "جاهز للمراجعة"
        await test.step('7. Admin uploads the second version (AAB) -> "جاهز للمراجعة"', async () => {
            // بيرفع ملف التطبيق ويبعته للمراجعة
            await admin.uploadBuildAndSendToReview(paths.aab);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.readyForReview);
        });

        // خطوة في التقرير: 7. Merchant: second version has NO edit button, only approve
        await test.step('7. Merchant: second version has NO edit button, only approve', async () => {
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.readyForReview);
            // بيفتح الصفحة
            await review.open();
            // بيتأكد إن زرار طلب التعديل مش ظاهر
            await review.assertEditButtonHidden();
            // بيتأكد إن زرار الموافقة ظاهر
            await review.assertApproveButtonVisible();
            // بيوافق على التطبيق
            await review.approve();
        });

        // خطوة في التقرير: 8. After approve: admin "في انتظار النشر", merchant "قيد النشر"
        await test.step('8. After approve: admin "في انتظار النشر", merchant "قيد النشر"', async () => {
            // بيعمل refresh للصفحة
            await admin.refresh();
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.awaitingPublish);
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        // خطوة في التقرير: 9. Admin starts publishing -> "قيد النشر"
        await test.step('9. Admin starts publishing -> "قيد النشر"', async () => {
            // بيدوس زرار المرحلة اللي بعدها
            await admin.goToNextStage(actions.toPublishing);
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.publishing);
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        // خطوة في التقرير: 10. Only the Google Play link: still "قيد النشر"
        await test.step('10. Only the Google Play link: still "قيد النشر"', async () => {
            // بيضيف رابط Google Play
            await adminPO.getAdminPublishPage().addGooglePlayLink(stores.googlePlay);
            // بيعمل refresh للصفحة
            await admin.refresh();
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.publishing);
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        // خطوة في التقرير: 11. Both links: "تم النشر" automatically
        await test.step('11. Both links: "تم النشر" automatically', async () => {
            // بيضيف رابط App Store
            await adminPO.getAdminPublishPage().addAppStoreLink(stores.appStore);
            // بيعمل refresh للصفحة
            await admin.refresh();
            // بيتأكد إن حالة الطلب هي دي
            await admin.assertStatus(statuses.admin.published);
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.published);
            // بيتأكد إن روابط المتاجر ظاهرة للتاجر
            await merchant.assertStoreLinks(requestNumber, stores.googlePlay, stores.appStore);
        });
    });
});

//===================رفض الطلب (تاجر تاني جديد)===================
// الرفض بيقفل الطلب، فبيتعمل على طلب تاجر تاني جديد مخصوص له
test.describe('Request rejection', { tag: '@lifecycle' }, () => {
    // التست ده بياخد: adminPO = متصفح الأدمن، browser
    test('[Positive] admin rejects from "قيد المراجعة" and merchant sees the reason', async ({ adminPO, browser }, testInfo) => {
        // rejectCustomer = lifecycleData.rejectCustomer
        const rejectCustomer = lifecycleData.rejectCustomer;
        // بيجيب صفحة الطلبات من متصفح الأدمن
        const admin = adminPO.getAdminRequestPage();

        // بيضيف عميل جديد (الـ 3 خطوات) ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(rejectCustomer);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), await response.text()).toBeTruthy();
        // بيدوّر على رقم الطلب بتاع العميل ده، وبيحفظ النتيجة في requestNumber
        const requestNumber = await admin.findRequestNumber(rejectCustomer.name);

        // بيفتح الطلب ده ويسمح بالتغيير عليه هو بس
        await admin.openTestRequest(requestNumber);
        // بيدوس زرار المرحلة اللي بعدها
        await admin.goToNextStage(actions.toReview);
        // بيرفض الطلب بالسبب ده
        await admin.reject(reviewData.rejectReason);
        // بيتأكد إن حالة الطلب هي دي
        await admin.assertStatus(statuses.admin.rejected);

        // التاجر بتاع الرفض بيدخل بحسابه ويشوف الحالة
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
        // try / finally: اللي في finally بيتنفذ دايمًا (حتى لو حاجة فشلت)
        try {
            // بيعمل صفحة Login على المتصفح ده
            const login = new LoginPage(page);
            // بيفتح الصفحة
            await login.open();
            // بيكتب الإيميل والباسورد ويدوس دخول
            await login.login(rejectCustomer.email, rejectCustomer.password);
            // بيتأكد إن الدخول نجح
            await login.assertLoggedIn();
            // بيتأكد إن حالة الطلب عند التاجر (الجدول + التفاصيل) هي دي
            await new POManager(page).getMerchantAppPage().assertRequestStatus(requestNumber, statuses.merchant.rejected);
        // finally = بيتنفذ دايمًا (بيقفل / بينضّف)
        } finally {
            // بينادي على الدالة closeWindow
            await closeWindow(context, page, testInfo, 'reject-merchant');
        }
    });
});
