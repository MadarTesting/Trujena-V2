import { test, expect } from '../fixtures/fixtures';
import supportData from '../testData/support';

// merchant > الدعم والتواصل
// the merchant is already logged in (global setup), every test starts from the dashboard

//===================Test Cases===================
// تستات الدعم والتواصل (من غير إرسال)
test.describe('Merchant - support', { tag: '@support' }, () => {

    // الصفحة فيها الفورم ونوعين الطلب وقاعدة الـ 5 دقايق
    test('[Positive] the page has the form, the 2 request types and the 5 minutes rule', async ({ merchantPO }) => {
        const support = merchantPO.getMerchantSupportPage();

        await support.open();
        await expect(support.fiveMinutesRule_msg).toBeVisible();             // business rule: 1 every 5 minutes
        for (const field of [support.name_tb, support.phone_tb, support.email_tb, support.message_tb]) {
            await expect(field).toBeVisible();
        }
        await expect(support.main.getByRole('radio', { name: support.types.inquiry })).toBeChecked();   // default
        await expect(support.main.getByRole('radio', { name: support.types.complaint })).toBeVisible();
    });

    // business rule: name, phone and email are filled with the registration data
    // الاسم والهاتف والإيميل بيتملوا من بيانات التسجيل
    test('[Positive] name, phone and email are filled with the registration data', async ({ merchantPO }) => {
        const support = merchantPO.getMerchantSupportPage();

        // the registration data of the merchant (from the profile api the website loads)
        const profileResponse = support.page.waitForResponse(r => r.url().includes('/users/profile/'));
        await support.open();
        const profile = (await (await profileResponse).json()).data;

        await support.assertPrefilled({
            name: profile.name,
            email: profile.email,
            phoneDigits: String(profile.phone_number).replace(/\D/g, '').replace(/^966/, ''),
        });
    });

    // زرار الإرسال مقفول لحد ما كل الخانات تتملي
    test('[Negative] send is disabled until all the fields are filled', async ({ merchantPO }) => {
        const support = merchantPO.getMerchantSupportPage();

        await support.open();
        await support.fillRequest({ ...supportData.request, message: '' });
        await support.assertSendDisabled();                                  // the message is empty

        await support.message_tb.fill(supportData.request.message);
        await support.assertSendEnabled();                                   // we do NOT click it here
    });

    // إيميل بشكل غلط مينفعش يتبعت
    test('[Negative] a wrong email format cannot be sent', async ({ merchantPO }) => {
        const support = merchantPO.getMerchantSupportPage();

        await support.open();
        await support.fillRequest({ ...supportData.request, email: supportData.invalidEmail });
        await support.assertSendDisabled();
    });
});

//===================Send===================
// IMPORTANT: these tests SEND a real support request to the admin ("طلبات الدعم الفني"),
// and the website allows only 1 request every 5 minutes, so wait 5 minutes before running them again
// إرسال طلب دعم حقيقي
test.describe('Merchant - support: send', { tag: '@support' }, () => {
    test.describe.configure({ mode: 'serial' });

    // إرسال طلب: بتظهر رسالة إن الطلب وصل
    test('[Positive] send a request: the merchant is told it is received', async ({ merchantPO }) => {
        const support = merchantPO.getMerchantSupportPage();

        await support.open();
        await support.fillRequest(supportData.request);
        const response = await support.send();
        expect(response.ok(), `send failed with status ${response.status()}: ${await response.text()}`).toBeTruthy();
        await expect(support.toast).toBeVisible();                           // post condition: the merchant is told
    });

    // طلب تاني قبل 5 دقايق بيترفض
    test('[Negative] business rule: a second request in less than 5 minutes is rejected', async ({ merchantPO }) => {
        const support = merchantPO.getMerchantSupportPage();

        await support.open();
        await support.fillRequest({ ...supportData.request, ...supportData.secondRequest });
        const response = await support.send();
        expect(response.ok(), 'the second request must be rejected').toBeFalsy();
    });

    // ADJUST: the admin page "طلبات الدعم الفني" was not seen yet (the admin login did not work on 10-11-2026)
    // الأدمن يشوف الطلب في "طلبات الدعم الفني" (مقفول)
    test.fixme('[Positive] the admin sees the request in "طلبات الدعم الفني"', async () => {});
});
