// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب supportData من testData/support.ts
import supportData from '../../testData/support';

// merchant > الدعم والتواصل (requirements/MerchantSupportPage.md)
// the merchant is already logged in (global setup), every test starts from the dashboard
// SEEN on stg: نوع الطلب عند التاجر "استفسار / شكوى" (الريكوايرمنت: "استفسار / مشكلة")

//===================Test Cases===================
// تستات الدعم والتواصل (من غير إرسال)
test.describe('Merchant - support', { tag: '@support' }, () => {

    // الصفحة فيها الفورم ونوعين الطلب وقاعدة الـ 5 دقايق
    test('[Positive] the page has the form, the 2 request types and the 5 minutes rule', async ({ merchantPO }) => {
        // بيجيب صفحة الدعم والتواصل من متصفح التاجر
        const support = merchantPO.getMerchantSupportPage();

        // بيفتح الصفحة
        await support.open();
        // business rule: 1 every 5 minutes
        await expect(support.fiveMinutesRule_msg).toBeVisible();
        for (const field of [support.name_tb, support.phone_tb, support.email_tb, support.message_tb]) {
            // بيتأكد إن field ظاهر
            await expect(field).toBeVisible();
        }
        // default
        await expect(support.type(support.types.inquiry)).toBeChecked();
        // بيتأكد إن نوع الطلب (radio) (support.types.complaint) ظاهر
        await expect(support.type(support.types.complaint)).toBeVisible();
    });

    // business rule: name, phone and email are filled with the registration data
    // الاسم والهاتف والإيميل بيتملوا من بيانات التسجيل
    test('[Positive] name, phone and email are filled with the registration data', async ({ merchantPO }) => {
        // بيجيب صفحة الدعم والتواصل من متصفح التاجر
        const support = merchantPO.getMerchantSupportPage();

        // the registration data of the merchant (from the profile api the website loads)
        const profileResponse = support.page.waitForResponse(r => r.url().includes('/users/profile/'));
        // بيفتح الصفحة
        await support.open();
        // profile = (await (await profileResponse).json()).data
        const profile = (await (await profileResponse).json()).data;

        // بيتأكد إن الاسم والهاتف والإيميل متملّيين ببيانات التسجيل
        await support.assertPrefilled({
            name: profile.name,
            email: profile.email,
            phoneDigits: String(profile.phone_number).replace(/\D/g, '').replace(/^966/, ''),
        });
    });

    // زرار الإرسال مقفول لحد ما كل الخانات تتملي
    test('[Negative] send is disabled until all the fields are filled', async ({ merchantPO }) => {
        // بيجيب صفحة الدعم والتواصل من متصفح التاجر
        const support = merchantPO.getMerchantSupportPage();

        // بيفتح الصفحة
        await support.open();
        // بيملى فورم الدعم
        await support.fillRequest({ ...supportData.request, message: '' });
        // the message is empty
        await support.assertSendDisabled();

        // بيكتب supportData.request.message في خانة message
        await support.message_tb.fill(supportData.request.message);
        // we do NOT click it here
        await support.assertSendEnabled();
    });

    // إيميل بشكل غلط مينفعش يتبعت
    test('[Negative] a wrong email format cannot be sent', async ({ merchantPO }) => {
        // بيجيب صفحة الدعم والتواصل من متصفح التاجر
        const support = merchantPO.getMerchantSupportPage();

        // بيفتح الصفحة
        await support.open();
        // بيملى فورم الدعم
        await support.fillRequest({ ...supportData.request, email: supportData.invalidEmail });
        // بيتأكد إن زرار الإرسال مقفول
        await support.assertSendDisabled();
    });
});

//===================Send===================
// IMPORTANT: these tests SEND a real support request to the admin ("طلبات الدعم الفني"),
// and the website allows only 1 request every 5 minutes (the first test waits by itself if needed)
// إرسال طلب دعم حقيقي
test.describe('Merchant - support: send', { tag: '@support' }, () => {
    // التستات دي بتشتغل بالترتيب، ولو واحد فشل الباقي بيتعمله skip
    test.describe.configure({ mode: 'serial' });

    // إرسال طلب: بتظهر رسالة إن الطلب وصل
    test('[Positive] send a request: the merchant is told it is received', async ({ merchantPO }) => {
        // لو فيه رسالة من أقل من 5 دقايق، بيستنى لحد 6 دقايق
        test.setTimeout(8 * 60000);
        // بيجيب صفحة الدعم والتواصل من متصفح التاجر
        const support = merchantPO.getMerchantSupportPage();

        // بيبعت رسالة الدعم (ولو قاعدة الـ 5 دقايق مانعة، بيستنى ويبعت تاني)، وبيحفظ النتيجة في response
        const response = await support.sendWhenAllowed(supportData.request);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), `send failed with status ${response.status()}: ${await response.text()}`).toBeTruthy();
        // post condition: the merchant is told
        await expect(support.toast).toBeVisible();
    });

    // طلب تاني قبل 5 دقايق بيترفض
    test('[Negative] business rule: a second request in less than 5 minutes is rejected', async ({ merchantPO }) => {
        // بيجيب صفحة الدعم والتواصل من متصفح التاجر
        const support = merchantPO.getMerchantSupportPage();

        // بيفتح الصفحة
        await support.open();
        // بيملى فورم الدعم
        await support.fillRequest({ ...supportData.request, ...supportData.secondRequest });
        // بيدوس إرسال ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await support.send();
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok(), 'the second request must be rejected').toBeFalsy();
    });

    // Main flow 5: الطلب بيوصل للأدمن في "طلبات الدعم الفني" بالبيانات اللي التاجر غيّرها
    // business rule: الاسم والإيميل والهاتف متعبيين من التسجيل، والتاجر غيّرهم (والأدمن بيشوف الجديد)
    test('[Positive] the admin sees the request with the data the merchant wrote', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();
        // request = supportData.request
        const request = supportData.request;

        // بيفتح الصفحة
        await support.open();
        // بيكتب في البحث ويستنى النتيجة
        await support.search(request.name);
        for (const text of [request.name, request.phone, request.type]) {
            // بيتأكد إن أول صف فيه النص ده
            await support.assertFirstRowHas(text);
        }
    });
});
