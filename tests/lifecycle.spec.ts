import { test as base, expect, openWindow, closeWindow } from '../fixtures/fixtures';
import { LoginPage } from '../pages/auth/LoginPage';
import { POManager } from '../pages/POManager';
import statuses from '../testData/statuses';
import actions from '../testData/actions';
import configData from '../testData/config';
import paths from '../testData/paths';
import stores from '../testData/stores';
import reviewData from '../testData/review';
import lifecycleData from '../testData/lifecycle';

// IMPORTANT:
// - كل run الأدمن بيضيف تاجر QA جديد من "إدارة العملاء"، وطلبه بيبدأ "جديد"
//   فتقدر تشغّل الملف كل مرة من غير ما تعمل طلب بإيدك
// - التستات بتغيّر طلبات تجار التست بس (الطلبات التانية محمية: utils/customerGuard.ts)
// - all tests use the SAME request, so they run one by one (serial)
// - NO data is deleted (تجار QA بيفضلوا موجودين على staging)

const customer = lifecycleData.journeyCustomer;

//===================Fixtures===================
// merchantPO = تاجر التست (بيدخل بالإيميل والباسورد بتوعه، مش بجلسة التاجر المحفوظة)
// requestNumber = رقم طلب تاجر التست (من إدارة الطلبات عند الأدمن)
const test = base.extend({
    merchantPO: async ({ browser }, use, testInfo) => {
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
        const login = new LoginPage(page);
        await login.open();
        await login.login(customer.email, customer.password);
        await login.assertLoggedIn();

        await use(new POManager(page));

        await closeWindow(context, page, testInfo, 'lifecycle-merchant');
    },

    requestNumber: async ({ adminPO }, use) => {
        const requestNumber = await adminPO.getAdminRequestPage().findRequestNumber(customer.name);
        console.log(`request under test: ${requestNumber} (${customer.name})`);
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
        const response = await adminPO.getAdminAddCustomerPage().addCustomer(customer);
        expect(response.ok(), await response.text()).toBeTruthy();

        const admin = adminPO.getAdminRequestPage();
        await admin.openTestRequest(await admin.findRequestNumber(customer.name));
        await admin.assertStatus(statuses.admin.new);
    });

    // التاجر ما يقدرش يعمل طلب تاني والطلب الأول لسه مفتوح
    test('[Positive] merchant cannot create a second request while one is open', async ({ merchantPO }) => {
        await merchantPO.getMerchantAppPage().assertCreateRequestDisabled();
    });

    // الطلب الجديد: يظهر زرار المرحلة الجاية بس ومفيش رفض
    test('[Negative] new request: only "go to review" is shown and NO reject', async ({ adminPO, requestNumber }) => {
        const admin = adminPO.getAdminRequestPage();

        await admin.openTestRequest(requestNumber);
        await admin.assertStatus(statuses.admin.new);
        await admin.assertOnlyNextStage(actions.toReview);   // statuses move in order
        await admin.assertRejectHidden();                    // reject only from "قيد المراجعة"
    });

    //-------------------the full journey (new -> edit once -> published)-------------------
    // الرحلة كاملة من طلب جديد لحد "تم النشر"
    test('[Positive] full journey: new request to published', { tag: '@smoke' }, async ({ adminPO, merchantPO, requestNumber }) => {
        const admin = adminPO.getAdminRequestPage();
        const merchant = merchantPO.getMerchantAppPage();
        const review = merchantPO.getMerchantReviewPage();

        await test.step('0. Admin opens the request of the new merchant', async () => {
            await admin.openTestRequest(requestNumber);      // الحماية: التغيير مسموح على الطلب ده بس
            await admin.assertStatus(statuses.admin.new);
        });

        await test.step('1. Admin moves the request to "قيد المراجعة"', async () => {
            await admin.goToNextStage(actions.toReview);
            await admin.assertStatus(statuses.admin.review);
            await admin.assertRejectVisible();
        });

        await test.step('1. Merchant (إدارة التطبيق): table + details = "قيد المراجعة"', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.review);
        });

        await test.step('2. Admin moves the request to "جاري الإعداد"', async () => {
            await admin.goToNextStage(actions.toPreparing);
            await admin.assertStatus(statuses.admin.preparing);
        });

        await test.step('2. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.preparing);
        });

        await test.step('3. Admin saves the app configuration -> "قيد التنفيذ" automatically', async () => {
            // SEEN on stg: "حفظ البيانات" moves the request to "قيد التنفيذ", there is no other button
            await adminPO.getAdminConfigPage().fillAndSave(configData.valid);
            await admin.assertStatus(statuses.admin.inProgress);
        });

        await test.step('3. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.inProgress);
        });

        await test.step('4. Admin uploads the first version (APK) -> "جاهز للمراجعة"', async () => {
            await admin.uploadBuildAndSendToReview(paths.apk);
            await admin.assertStatus(statuses.admin.readyForReview);
        });

        await test.step('4. Merchant (إدارة التطبيق): status + can download and ask for an edit', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.readyForReview);
            await review.open();
            await review.assertDownloadAvailable();
            await review.assertApproveButtonVisible();
            await review.assertEditButtonVisible();
        });

        await test.step('5. Merchant asks for an edit (only one time)', async () => {
            await review.requestEdit(reviewData.editNotes);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.editRequested);
        });

        await test.step('5. Admin sees "طلب تعديل"', async () => {
            await admin.refresh();
            await admin.assertStatus(statuses.admin.editRequested);
        });

        await test.step('6. Admin sends the request back to "قيد التنفيذ"', async () => {
            await admin.goToNextStage(actions.editToInProgress);
            await admin.assertStatus(statuses.admin.inProgress);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.inProgress);
        });

        await test.step('7. Admin uploads the second version (AAB) -> "جاهز للمراجعة"', async () => {
            await admin.uploadBuildAndSendToReview(paths.aab);
            await admin.assertStatus(statuses.admin.readyForReview);
        });

        await test.step('7. Merchant: second version has NO edit button, only approve', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.readyForReview);
            await review.open();
            await review.assertEditButtonHidden();
            await review.assertApproveButtonVisible();
            await review.approve();
        });

        await test.step('8. After approve: admin "في انتظار النشر", merchant "قيد النشر"', async () => {
            await admin.refresh();
            await admin.assertStatus(statuses.admin.awaitingPublish);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        await test.step('9. Admin starts publishing -> "قيد النشر"', async () => {
            await admin.goToNextStage(actions.toPublishing);
            await admin.assertStatus(statuses.admin.publishing);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        await test.step('10. Only the Google Play link: still "قيد النشر"', async () => {
            await adminPO.getAdminPublishPage().addGooglePlayLink(stores.googlePlay);
            await admin.refresh();
            await admin.assertStatus(statuses.admin.publishing);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        await test.step('11. Both links: "تم النشر" automatically', async () => {
            await adminPO.getAdminPublishPage().addAppStoreLink(stores.appStore);
            await admin.refresh();
            await admin.assertStatus(statuses.admin.published);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.published);
            await merchant.assertStoreLinks(requestNumber, stores.googlePlay, stores.appStore);
        });
    });
});

//===================رفض الطلب (تاجر تاني جديد)===================
// الرفض بيقفل الطلب، فبيتعمل على طلب تاجر تاني جديد مخصوص له
test.describe('Request rejection', { tag: '@lifecycle' }, () => {
    test('[Positive] admin rejects from "قيد المراجعة" and merchant sees the reason', async ({ adminPO, browser }, testInfo) => {
        const rejectCustomer = lifecycleData.rejectCustomer;
        const admin = adminPO.getAdminRequestPage();

        const response = await adminPO.getAdminAddCustomerPage().addCustomer(rejectCustomer);
        expect(response.ok(), await response.text()).toBeTruthy();
        const requestNumber = await admin.findRequestNumber(rejectCustomer.name);

        await admin.openTestRequest(requestNumber);
        await admin.goToNextStage(actions.toReview);
        await admin.reject(reviewData.rejectReason);
        await admin.assertStatus(statuses.admin.rejected);

        // التاجر بتاع الرفض بيدخل بحسابه ويشوف الحالة
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
        try {
            const login = new LoginPage(page);
            await login.open();
            await login.login(rejectCustomer.email, rejectCustomer.password);
            await login.assertLoggedIn();
            await new POManager(page).getMerchantAppPage().assertRequestStatus(requestNumber, statuses.merchant.rejected);
        } finally {
            await closeWindow(context, page, testInfo, 'reject-merchant');
        }
    });
});
