import { test } from '../fixtures/fixtures';
import statuses from '../testData/statuses';
import actions from '../testData/actions';
import configData from '../testData/config';
import paths from '../testData/paths';
import stores from '../testData/stores';
import reviewData from '../testData/review';

// IMPORTANT:
// - all tests use the SAME request of the merchant, so they run one by one (serial)
// - the full journey starts from the CURRENT status of the request (see resumeFrom below)
// - after a full run the request is "تم النشر", you need a new request to run it again
// - NO data is deleted
test.describe.configure({ mode: 'serial' });

//===================Resume===================
// current admin status -> the first journey step to run.
// so a request that already moved (for example "قيد المراجعة") continues from where it is.
// "قيد التنفيذ" and "جاهز للمراجعة" come TWO times (before and after the edit request),
// so we use a different map when the request already has an edit request ("ملاحظات العميل" on the admin page)
const resumeBeforeEdit: Record<string, number> = {
    [statuses.admin.new]: 1,
    [statuses.admin.review]: 2,
    [statuses.admin.preparing]: 4,
    [statuses.admin.inProgress]: 6,
    [statuses.admin.readyForReview]: 8,
};
const resumeAfterEdit: Record<string, number> = {
    [statuses.admin.editRequested]: 10,
    [statuses.admin.inProgress]: 12,
    [statuses.admin.readyForReview]: 13,
    [statuses.admin.awaitingPublish]: 14,
    [statuses.admin.publishing]: 16,
};

//===================Test Cases===================
// رحلة الطلب: الأدمن بيغيّر الحالة والتاجر بيتأكد منها
test.describe('Request journey - admin changes the status, merchant checks it', { tag: '@lifecycle' }, () => {

    // التاجر ما يقدرش يعمل طلب تاني والطلب الأول لسه مفتوح
    test('[Positive] merchant cannot create a second request while one is open', async ({ merchantPO }) => {
        await merchantPO.getMerchantAppPage().assertCreateRequestDisabled();
    });

    // الطلب الجديد: يظهر زرار المرحلة الجاية بس ومفيش رفض
    test('[Negative] new request: only "go to review" is shown and NO reject', async ({ adminPO, requestNumber }) => {
        const admin = adminPO.getAdminRequestPage();

        await admin.openRequestByNumber(requestNumber);
        const current = await admin.getStatus();
        test.skip(current !== statuses.admin.new, `the request is "${current}", this test needs a "${statuses.admin.new}" request`);

        await admin.assertStatus(statuses.admin.new);
        await admin.assertOnlyNextStage(actions.toReview);   // statuses move in order
        await admin.assertRejectHidden();                    // reject only from "قيد المراجعة"
    });

    //-------------------the full journey (new -> edit once -> published)-------------------
    // الرحلة كاملة من طلب جديد لحد "تم النشر" (بتكمل من الحالة الحالية)
    test('[Positive] full journey: new request to published', { tag: '@smoke' }, async ({ adminPO, merchantPO, requestNumber }) => {
        const admin = adminPO.getAdminRequestPage();
        const merchant = merchantPO.getMerchantAppPage();
        const review = merchantPO.getMerchantReviewPage();

        let startAt = 1;
        await test.step('0. Admin opens the request and reads the current status', async () => {
            await admin.openRequestByNumber(requestNumber);
            const current = await admin.getStatus();
            const editDone = await admin.hasEditRequest();
            const resumeFrom = editDone ? resumeAfterEdit : resumeBeforeEdit;
            test.skip(!(current in resumeFrom), `the request is "${current}", the journey can not continue from it - a new request is needed`);
            startAt = resumeFrom[current];
            console.log(`current status: "${current}" (edit request done: ${editDone}) -> the journey starts from step ${startAt}`);
        });
        // run the step only if the request did not pass it yet
        const run = (step: number) => step >= startAt;

        if (run(1)) await test.step('1. Admin moves the request to "قيد المراجعة"', async () => {
            await admin.goToNextStage(actions.toReview);
            await admin.assertStatus(statuses.admin.review);
            await admin.assertRejectVisible();
        });

        if (run(2)) await test.step('1. Merchant (إدارة التطبيق): table + details = "قيد المراجعة"', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.review);
        });

        if (run(3)) await test.step('2. Admin moves the request to "جاري الإعداد"', async () => {
            await admin.goToNextStage(actions.toPreparing);
            await admin.assertStatus(statuses.admin.preparing);
        });

        if (run(4)) await test.step('2. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.preparing);
        });

        if (run(5)) await test.step('3. Admin saves the app configuration -> "قيد التنفيذ" automatically', async () => {
            // SEEN on stg: "حفظ البيانات" moves the request to "قيد التنفيذ", there is no other button
            await adminPO.getAdminConfigPage().fillAndSave(configData.valid);
            await admin.assertStatus(statuses.admin.inProgress);
        });

        if (run(6)) await test.step('3. Merchant (إدارة التطبيق): table + details = "قيد التنفيذ"', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.inProgress);
        });

        if (run(7)) await test.step('4. Admin uploads the first version (APK) -> "جاهز للمراجعة"', async () => {
            await admin.uploadBuildAndSendToReview(paths.apk);
            await admin.assertStatus(statuses.admin.readyForReview);
        });

        if (run(8)) await test.step('4. Merchant (إدارة التطبيق): status + can download and ask for an edit', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.readyForReview);
            await review.open();
            await review.assertDownloadAvailable();
            await review.assertApproveButtonVisible();
            await review.assertEditButtonVisible();
        });

        if (run(9)) await test.step('5. Merchant asks for an edit (only one time)', async () => {
            await review.requestEdit(reviewData.editNotes);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.editRequested);
        });

        if (run(10)) await test.step('5. Admin sees "طلب تعديل"', async () => {
            await admin.refresh();
            await admin.assertStatus(statuses.admin.editRequested);
        });

        if (run(11)) await test.step('6. Admin sends the request back to "قيد التنفيذ"', async () => {
            await admin.goToNextStage(actions.editToInProgress);
            await admin.assertStatus(statuses.admin.inProgress);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.inProgress);
        });

        if (run(12)) await test.step('7. Admin uploads the second version (AAB) -> "جاهز للمراجعة"', async () => {
            await admin.uploadBuildAndSendToReview(paths.aab);
            await admin.assertStatus(statuses.admin.readyForReview);
        });

        if (run(13)) await test.step('7. Merchant: second version has NO edit button, only approve', async () => {
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.readyForReview);
            await review.open();
            await review.assertEditButtonHidden();
            await review.assertApproveButtonVisible();
            await review.approve();
        });

        if (run(14)) await test.step('8. After approve: admin "في انتظار النشر", merchant "قيد النشر"', async () => {
            await admin.refresh();
            await admin.assertStatus(statuses.admin.awaitingPublish);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        if (run(15)) await test.step('9. Admin starts publishing -> "قيد النشر"', async () => {
            await admin.goToNextStage(actions.toPublishing);
            await admin.assertStatus(statuses.admin.publishing);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        if (run(16)) await test.step('10. Only the Google Play link: still "قيد النشر"', async () => {
            await adminPO.getAdminPublishPage().addGooglePlayLink(stores.googlePlay);
            await admin.refresh();
            await admin.assertStatus(statuses.admin.publishing);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.publishing);
        });

        if (run(17)) await test.step('11. Both links: "تم النشر" automatically', async () => {
            await adminPO.getAdminPublishPage().addAppStoreLink(stores.appStore);
            await admin.refresh();
            await admin.assertStatus(statuses.admin.published);
            await merchant.assertRequestStatus(requestNumber, statuses.merchant.published);
            await merchant.assertStoreLinks(requestNumber, stores.googlePlay, stores.appStore);
        });
    });
});

//===================Needs another request===================
// reject ends the request, so it can NOT run on the same request as the full journey
// رفض الطلب (مقفول لأنه محتاج طلب تاني)
test.describe('Request rejection', { tag: '@lifecycle' }, () => {
    test.fixme('[Positive] admin rejects from "قيد المراجعة" and merchant sees the reason', async ({ adminPO, merchantPO, requestNumber }) => {
        const admin = adminPO.getAdminRequestPage();
        const merchant = merchantPO.getMerchantAppPage();

        await admin.openRequestByNumber(requestNumber);
        await admin.goToNextStage(actions.toReview);
        await admin.reject(reviewData.rejectReason);
        await admin.assertStatus(statuses.admin.rejected);
        await merchant.assertRequestStatus(requestNumber, statuses.merchant.rejected);
    });
});
