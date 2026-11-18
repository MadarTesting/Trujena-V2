// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب data من testData/adminSupport.ts
import data from '../../testData/adminSupport';

// admin > الدعم والتواصل (requirements/AdminSupportPage.md = UC-10)
// التاجر بيبعت رسالة دعم جديدة كل run، والأدمن بيغيّر حالة الرسالة دي بس (الرسايل التانية محمية)

// ملاحظة: التاجر مسموحله رسالة واحدة كل 5 دقايق.
// لو فيه رسالة اتبعتت من أقل من 5 دقايق (run قبله أو support.spec.ts)، أول تست بيستنى ويحاول تاني كل دقيقة
// (لحد 6 دقايق)، فالـ run بياخد وقت أطول بس ما بيفشلش
const fiveMinutesNote = 'التاجر مسموحله رسالة واحدة كل 5 دقايق، والإرسال فشل حتى بعد الانتظار. '
    + 'بص على رد السيرفر في الـ API تحت التست';

// message = data.message
const message = data.message;

//===================رسالة التست: من التاجر للأدمن===================
// بيشتغلوا بالترتيب (workers: 1)، ولو تست فشل اللي بعده بيكمل
test.describe('Admin - support: a message from the merchant', { tag: '@adminSupport' }, () => {

    // التاجر بيبعت رسالة دعم (مسموح رسالة واحدة كل 5 دقايق: لو اترفضت بيستنى ويحاول تاني)
    test('[Positive] the merchant sends a support message', async ({ merchantPO }) => {
        // ممكن يستنى لحد 6 دقايق
        test.setTimeout(8 * 60000);
        // بيجيب صفحة الدعم والتواصل من متصفح التاجر
        const support = merchantPO.getMerchantSupportPage();

        // بيبعت رسالة الدعم (ولو قاعدة الـ 5 دقايق مانعة، بيستنى ويبعت تاني)، وبيحفظ النتيجة في response
        const response = await support.sendWhenAllowed(message);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), `${fiveMinutesNote} (status ${response.status()})`).toBeTruthy();
    });

    // الرسالة بتظهر عند الأدمن في الجدول بحالة "جديد"
    test('[Positive] the admin sees the message as new', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيفتح الصفحة
        await support.open();
        // بيكتب في البحث ويستنى النتيجة
        await support.search(message.name);
        // بيتأكد إن أول صفوف الجدول فيه النص message.name
        await expect(support.rows.first(), `الرسالة مش موجودة. ${fiveMinutesNote}`).toContainText(message.name);
        for (const text of [message.name, message.phone, message.type, data.newStatus]) {
            // بيتأكد إن أول صف فيه النص ده
            await support.assertFirstRowHas(text);
        }
    });

    // business rule: الرسالة بتتصنف حسب مصدرها (مش موجودة في رسائل تواصل معنا)
    test('[Positive] business rule: the message is not in "رسائل تواصل معنا"', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيفتح الصفحة
        await support.open();
        // بيفتح التاب ده
        await support.openTab(data.tabs[1]);
        // بيكتب في البحث ويستنى النتيجة
        await support.search(message.name);
        // بيتأكد إن رسالة "مفيش داتا" ظاهرة
        await support.assertEmpty();
    });

    // عرض الرسالة: كل البيانات موجودة
    test('[Positive] view: the details show all the message data', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيدوّر على الرسالة ويفتح تفاصيلها
        await support.openMessage(message.name);
        for (const text of [...data.detailsLabels, message.name, message.email, message.phone, message.type, message.message]) {
            // بيتأكد إن التفاصيل فيها النص ده
            await support.assertDetailsHave(text);
        }
        // بيتأكد إن حالة الطلب هي دي
        await support.assertStatus(data.newStatus);
    });

    // business rule: عرض بس (مفيش رد على الرسالة)
    test('[Negative] business rule: the admin cannot reply (view only)', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيدوّر على الرسالة ويفتح تفاصيلها
        await support.openMessage(message.name);
        // بيتأكد إن خانة reply مش موجود
        await expect(support.reply_tb).toHaveCount(0);
        // بيتأكد إن زرار reply مش موجود
        await expect(support.reply_btn).toHaveCount(0);
    });

    // من غير ما الحالة تتغير: زرار الحفظ مقفول
    test('[Negative] save is disabled when the status is not changed', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيدوّر على الرسالة ويفتح تفاصيلها
        await support.openMessage(message.name);
        // بيتأكد إن زرار Save مقفول
        await expect(support.Save_btn).toBeDisabled();
    });

    // Alternative 2: الحفظ فشل: بتظهر رسالة خطأ والحالة ما بتتغيرش
    test('[Negative] when saving fails, an error message is shown', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيدوّر على الرسالة ويفتح تفاصيلها
        await support.openMessage(message.name);
        // بيخلّي السيرفر يرجّع error في الحفظ (مفيش حاجة بتتحفظ)
        await support.makeSaveFail();
        // بيغيّر الحالة لـ "تم الاطلاع" ويحفظ
        await support.markAsViewed();
        // بيتأكد إن رسالة خطأ الحفظ ظهرت
        await support.assertSaveError();
        // بيتأكد إن حالة الطلب هي دي
        await support.assertStatus(data.newStatus);
    });

    // تغيير الحالة لـ "تم الاطلاع"
    test('[Positive] change the status to "تم الاطلاع"', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيدوّر على الرسالة ويفتح تفاصيلها
        await support.openMessage(message.name);
        // بيغيّر الحالة لـ "تم الاطلاع" ويحفظ
        await support.markAsViewed();
        // بيتأكد إن حالة الطلب هي دي
        await support.assertStatus(data.viewedStatus);
    });

    // Post condition: الحالة الجديدة بتظهر في الجدول
    test('[Positive] post condition: the table shows "تم الاطلاع"', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيفتح الصفحة
        await support.open();
        // بيكتب في البحث ويستنى النتيجة
        await support.search(message.name);
        // بيتأكد إن أول صف فيه النص ده
        await support.assertFirstRowHas(data.viewedStatus);
    });
});

//===================القايمة والبحث والفلاتر (من غير أي تغيير)===================
test.describe('Admin - support: list, search and filters', { tag: '@adminSupport' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of data.columns) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            // بيجيب صفحة الدعم من متصفح الأدمن
            const support = adminPO.getAdminSupportPage();

            // بيفتح الصفحة
            await support.open();
            // بيتأكد إن العمود ده موجود في الجدول
            await support.assertColumn(column);
        });
    }

    // Data-Driven: التابين بيفتحوا
    for (const tab of data.tabs) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] the tab "${tab}" opens`, async ({ adminPO }) => {
            // بيجيب صفحة الدعم من متصفح الأدمن
            const support = adminPO.getAdminSupportPage();

            // بيفتح الصفحة
            await support.open();
            // بيفتح التاب ده
            await support.openTab(tab);
            // بيتأكد إن support.rows.first( or support.empty_msg)).toBeVisible(
            await expect(support.rows.first().or(support.empty_msg)).toBeVisible();
        });
    }

    // Data-Driven: فلتر النوع والحالة بيعرضوا القيمة دي بس
    for (const filter of [data.typeFilter, data.statusFilter]) {
        // Data-Driven: بيلف على filter.options، وبيعمل الكود اللي جوه لكل option
        for (const option of filter.options) {
            // التست ده بياخد: adminPO = متصفح الأدمن
            test(`[Positive] filter "${filter.name}" by "${option}" shows only this value`, async ({ adminPO }) => {
                // بيجيب صفحة الدعم من متصفح الأدمن
                const support = adminPO.getAdminSupportPage();

                // بيفتح الصفحة
                await support.open();
                // بيختار الفلتر ده
                await support.filter(filter.name, option);
                // بيتأكد إن كل الصفوف فيها القيمة دي بس
                await support.assertOnly(filter.column, option);
            });
        }
    }

    // Alternative 1: بحث مالوش نتيجة: "لا توجد رسائل حاليا"
    test('[Negative] an unknown name shows "لا توجد رسائل حاليا"', async ({ adminPO }) => {
        // بيجيب صفحة الدعم من متصفح الأدمن
        const support = adminPO.getAdminSupportPage();

        // بيفتح الصفحة
        await support.open();
        // بيكتب في البحث ويستنى النتيجة
        await support.search(data.unknownSearch);
        // بيتأكد إن رسالة "مفيش داتا" ظاهرة
        await support.assertEmpty();
    });
});
