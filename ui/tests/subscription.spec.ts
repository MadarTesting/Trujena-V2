// بيجيب test من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test } from '../../fixtures/fixtures';
// بيجيب subscriptionData من testData/subscription.ts
import subscriptionData from '../../testData/subscription';

// merchant > اشتراكي (the page only shows data, nothing is changed)

//===================Test Cases===================
// تستات صفحة اشتراكي
test.describe('Merchant - my subscription', { tag: '@subscription' }, () => {

    // الصفحة بتعرض كل بيانات الاشتراك
    test('[Positive] the page shows all the subscription data', async ({ merchantPO }) => {
        // بيجيب صفحة الاشتراك من متصفح التاجر
        const subscription = merchantPO.getMerchantSubscriptionPage();

        // بيفتح الصفحة
        await subscription.open();
        // بيتأكد إن كل بيانات الاشتراك ظاهرة
        await subscription.assertAllDataShown();
    });

    // الاشتراك نشط
    test('[Positive] the subscription is active', async ({ merchantPO }) => {
        // بيجيب صفحة الاشتراك من متصفح التاجر
        const subscription = merchantPO.getMerchantSubscriptionPage();

        // بيفتح الصفحة
        await subscription.open();
        // بيتأكد إن حالة الطلب هي دي
        await subscription.assertStatus(subscriptionData.status.active);
    });

    // الأيام المتبقية = تاريخ الانتهاء - النهارده
    test('[Positive] the remaining days are correct (end date - today)', async ({ merchantPO }) => {
        // بيجيب صفحة الاشتراك من متصفح التاجر
        const subscription = merchantPO.getMerchantSubscriptionPage();

        // بيفتح الصفحة
        await subscription.open();
        // بيتأكد إن الأيام المتبقية صح
        await subscription.assertRemainingDays();
    });

    // مفيش زرار تجديد (التجديد من الدعم بس)
    test('[Negative] there is no renew button (renew only by the support team)', async ({ merchantPO }) => {
        // بيجيب صفحة الاشتراك من متصفح التاجر
        const subscription = merchantPO.getMerchantSubscriptionPage();

        // بيفتح الصفحة
        await subscription.open();
        // بيتأكد إن مفيش زرار تجديد
        await subscription.assertNoRenewButton();
    });

    // the last test: print the subscription data in the terminal
    // بيطبع بيانات الاشتراك في التيرمنال
    test('[Info] print the subscription data', async ({ merchantPO }) => {
        // بيجيب صفحة الاشتراك من متصفح التاجر
        const subscription = merchantPO.getMerchantSubscriptionPage();

        // بيفتح الصفحة
        await subscription.open();
        // بيطبع بيانات الاشتراك
        await subscription.printData();
    });
});
