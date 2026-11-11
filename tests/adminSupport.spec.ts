import { test, expect } from '../fixtures/fixtures';
import data from '../testData/adminSupport';

// admin > الدعم والتواصل (requirements/AdminSupportPage.md = UC-10)
// التاجر بيبعت رسالة دعم جديدة كل run، والأدمن بيغيّر حالة الرسالة دي بس (الرسايل التانية محمية)

// ⚠️ ملاحظة مهمة: التاجر مسموحله رسالة واحدة كل 5 دقايق.
// لو شغلت الملف تاني قبل ما الـ 5 دقايق تعدّي، الإرسال بيفشل وكل التستات اللي بعده بتفشل معاه.
// نفس القاعدة بتنطبق لو شغلت support.spec.ts قبله. الحل: استنى 5 دقايق وشغّل تاني.
const fiveMinutesNote = 'ملاحظة مهمة: التاجر مسموحله رسالة واحدة كل 5 دقايق. '
    + 'لو شغلت الملف تاني قبل ما الـ 5 دقايق تعدّي، الإرسال بيفشل وكل التستات اللي بعده بتفشل معاه. '
    + 'نفس القاعدة بتنطبق لو شغلت support.spec.ts قبله. الحل: استنى 5 دقايق وشغّل تاني';

const message = data.message;

//===================رسالة التست: من التاجر للأدمن===================
// بيشتغلوا بالترتيب (workers: 1)، ولو تست فشل اللي بعده بيكمل
test.describe('Admin - support: a message from the merchant', { tag: '@adminSupport' }, () => {

    // التاجر بيبعت رسالة دعم (مسموح رسالة واحدة كل 5 دقايق)
    test('[Positive] the merchant sends a support message', async ({ merchantPO }) => {
        const support = merchantPO.getMerchantSupportPage();

        await support.open();
        await support.fillRequest(message);
        const response = await support.send();
        expect(response.ok(), `${fiveMinutesNote} (status ${response.status()})`).toBeTruthy();
    });

    // الرسالة بتظهر عند الأدمن في الجدول بحالة "جديد"
    test('[Positive] the admin sees the message as new', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.open();
        await support.search(message.name);
        await expect(support.rows.first(), `الرسالة مش موجودة. ${fiveMinutesNote}`).toContainText(message.name);
        for (const text of [message.name, message.phone, message.type, data.newStatus]) {
            await support.assertFirstRowHas(text);
        }
    });

    // business rule: الرسالة بتتصنف حسب مصدرها (مش موجودة في رسائل تواصل معنا)
    test('[Positive] business rule: the message is not in "رسائل تواصل معنا"', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.open();
        await support.openTab(data.tabs[1]);
        await support.search(message.name);
        await support.assertEmpty();
    });

    // عرض الرسالة: كل البيانات موجودة
    test('[Positive] view: the details show all the message data', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.openMessage(message.name);
        for (const text of [...data.detailsLabels, message.name, message.email, message.phone, message.type, message.message]) {
            await support.assertDetailsHave(text);
        }
        await support.assertStatus(data.newStatus);
    });

    // business rule: عرض بس (مفيش رد على الرسالة)
    test('[Negative] business rule: the admin cannot reply (view only)', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.openMessage(message.name);
        await expect(support.details.locator('textarea')).toHaveCount(0);
        await expect(support.details.getByRole('button', { name: /رد|إرسال/ })).toHaveCount(0);
    });

    // من غير ما الحالة تتغير: زرار الحفظ مقفول
    test('[Negative] save is disabled when the status is not changed', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.openMessage(message.name);
        await expect(support.Save_btn).toBeDisabled();
    });

    // Alternative 2: الحفظ فشل: بتظهر رسالة خطأ والحالة ما بتتغيرش
    test('[Negative] when saving fails, an error message is shown', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.openMessage(message.name);
        await support.makeSaveFail();
        await support.markAsViewed();
        await support.assertSaveError();
        await support.assertStatus(data.newStatus);
    });

    // تغيير الحالة لـ "تم الاطلاع"
    test('[Positive] change the status to "تم الاطلاع"', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.openMessage(message.name);
        await support.markAsViewed();
        await support.assertStatus(data.viewedStatus);
    });

    // Post condition: الحالة الجديدة بتظهر في الجدول
    test('[Positive] post condition: the table shows "تم الاطلاع"', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.open();
        await support.search(message.name);
        await support.assertFirstRowHas(data.viewedStatus);
    });
});

//===================القايمة والبحث والفلاتر (من غير أي تغيير)===================
test.describe('Admin - support: list, search and filters', { tag: '@adminSupport' }, () => {

    // Data-Driven: كل عمود في الريكوايرمنت لازم يكون في الجدول
    for (const column of data.columns) {
        test(`[Positive] the table has the column "${column}"`, async ({ adminPO }) => {
            const support = adminPO.getAdminSupportPage();

            await support.open();
            await support.assertColumn(column);
        });
    }

    // Data-Driven: التابين بيفتحوا
    for (const tab of data.tabs) {
        test(`[Positive] the tab "${tab}" opens`, async ({ adminPO }) => {
            const support = adminPO.getAdminSupportPage();

            await support.open();
            await support.openTab(tab);
            await expect(support.rows.first().or(support.empty_msg)).toBeVisible();
        });
    }

    // Data-Driven: فلتر النوع والحالة بيعرضوا القيمة دي بس
    for (const filter of [data.typeFilter, data.statusFilter]) {
        for (const option of filter.options) {
            test(`[Positive] filter "${filter.name}" by "${option}" shows only this value`, async ({ adminPO }) => {
                const support = adminPO.getAdminSupportPage();

                await support.open();
                await support.filter(filter.name, option);
                await support.assertOnly(filter.column, option);
            });
        }
    }

    // Alternative 1: بحث مالوش نتيجة: "لا توجد رسائل حاليا"
    test('[Negative] an unknown name shows "لا توجد رسائل حاليا"', async ({ adminPO }) => {
        const support = adminPO.getAdminSupportPage();

        await support.open();
        await support.search(data.unknownSearch);
        await support.assertEmpty();
    });
});
