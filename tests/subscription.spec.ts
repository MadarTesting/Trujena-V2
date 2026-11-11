import { test } from '../fixtures/fixtures';
import subscriptionData from '../testData/subscription';

// merchant > اشتراكي (the page only shows data, nothing is changed)

//===================Test Cases===================
// تستات صفحة اشتراكي
test.describe('Merchant - my subscription', { tag: '@subscription' }, () => {

    // الصفحة بتعرض كل بيانات الاشتراك
    test('[Positive] the page shows all the subscription data', async ({ merchantPO }) => {
        const subscription = merchantPO.getMerchantSubscriptionPage();

        await subscription.open();
        await subscription.assertAllDataShown();
    });

    // الاشتراك نشط
    test('[Positive] the subscription is active', async ({ merchantPO }) => {
        const subscription = merchantPO.getMerchantSubscriptionPage();

        await subscription.open();
        await subscription.assertStatus(subscriptionData.status.active);
    });

    // الأيام المتبقية = تاريخ الانتهاء - النهارده
    test('[Positive] the remaining days are correct (end date - today)', async ({ merchantPO }) => {
        const subscription = merchantPO.getMerchantSubscriptionPage();

        await subscription.open();
        await subscription.assertRemainingDays();
    });

    // مفيش زرار تجديد (التجديد من الدعم بس)
    test('[Negative] there is no renew button (renew only by the support team)', async ({ merchantPO }) => {
        const subscription = merchantPO.getMerchantSubscriptionPage();

        await subscription.open();
        await subscription.assertNoRenewButton();
    });

    // the last test: print the subscription data in the terminal
    // بيطبع بيانات الاشتراك في التيرمنال
    test('[Info] print the subscription data', async ({ merchantPO }) => {
        const subscription = merchantPO.getMerchantSubscriptionPage();

        await subscription.open();
        await subscription.printData();
    });
});
