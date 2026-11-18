// بيجيب test و expect من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect } from '../../fixtures/fixtures';
// بيجيب data من testData/adminProfile.ts
import data from '../../testData/adminProfile';
// بيجيب users من testData/users.ts
import users from '../../testData/users';

// admin > الملف الشخصي (requirements/AdminProfilePage.md = UC-13)
// ⚠️ read only: مفيش ولا تست بيحفظ حاجة (والصفحة بتقفل أي طلب غير GET)

//===================الشريط العلوي وصفحة الملف الشخصي===================
test.describe('Admin - profile: view', { tag: '@adminProfile' }, () => {

    // الشريط العلوي فيه الصورة والاسم والدور
    test('[Positive] the top bar shows the avatar, the name and the role', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيتأكد إن الصورة ظاهر
        await expect(profile.avatar).toBeVisible();
        // بيتأكد إن نص topBarName مش فاضي
        await expect(profile.topBarName_lbl).not.toBeEmpty();
        // بيتأكد إن الشريط العلوي فيه النص data.role
        await expect(profile.topBarProfile).toContainText(data.role);
    });

    // Main flow: الصفحة بتعرض الاسم والإيميل والدور
    test('[Positive] the profile page shows the name, the email and the role', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيقرا الاسم اللي في الشريط العلوي، وبيحفظ النتيجة في name
        const name = await profile.topBarName();
        for (const text of [...data.accountLabels, name, users.admin.email, data.role]) {
            // بيتأكد إن الصفحة فيها النص ده
            await profile.assertPageHas(text);
        }
    });

    // زرار تسجيل الخروج موجود في القايمة الجانبية كمان
    test('[Positive] the side bar has "تسجيل الخروج"', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيتأكد إن لينك sideLogout ظاهر
        await expect(profile.sideLogout_lnk).toBeVisible();
    });

    // Alternative 1: الإيميل مفعّل، فرسالة "يرجى تأكيد البريد" مش بتظهر
    test('[Positive] Alternative 1: a verified email shows no warning', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيتأكد إن نص في الصفحة (data.verifyEmailWarning) مش موجود
        await expect(profile.text(data.verifyEmailWarning)).toHaveCount(0);
    });
});

//===================النوافذ (بتتفتح وبتتقفل من غير حفظ)===================
test.describe('Admin - profile: popups', { tag: '@adminProfile' }, () => {

    // Data-Driven: كل زرار بيفتح النافذة بتاعته، و"الرجوع" بيقفلها
    for (const popup of data.popups) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] "${popup.button}" opens its popup and "الرجوع" closes it`, async ({ adminPO }) => {
            // بيجيب صفحة الملف الشخصي من متصفح الأدمن
            const profile = adminPO.getAdminProfilePage();

            // بيفتح الصفحة
            await profile.open();
            // بيفتح النافذة (popup)
            await profile.openPopup(popup.button, popup.title);
            // بيقفل النافذة (الرجوع)
            await profile.closePopup();
        });
    }

    // نافذة التعديل فيها الاسم الحالي ورفع الصورة
    test('[Positive] edit profile: the name is filled and the image upload is there', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيقرا الاسم اللي في الشريط العلوي، وبيحفظ النتيجة في name
        const name = await profile.topBarName();
        // بيفتح النافذة (popup)
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        // بيتأكد إن خانة fullName فيه القيمة name
        await expect(profile.fullName_tb).toHaveValue(name);
        // بيتأكد إن رفع الملف profileImage موجود في الصفحة
        await expect(profile.profileImage_file).toBeAttached();
        // بيقفل النافذة (الرجوع)
        await profile.closePopup();
    });

    // business rule: الإيميل مش بيتغيّر من الملف الشخصي (مفيش خانة إيميل)
    test('[Negative] business rule: the email cannot be changed from the profile', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح النافذة (popup)
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        // بيتأكد إن خانة popupEmail مش موجود
        await expect(profile.popupEmail_tb).toHaveCount(0);
        // بيقفل النافذة (الرجوع)
        await profile.closePopup();
    });

    // الاسم الفاضي: رسالة خطأ وزرار الحفظ مقفول (من غير حفظ)
    test('[Negative] edit profile: an empty name shows an error and save is disabled', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح النافذة (popup)
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        // بيكتب '' في خانة fullName
        await profile.fullName_tb.fill('');
        // بيتأكد إن النافذة فيها النص ده
        await profile.assertPopupHas(data.nameRequiredError);
        // بيتأكد إن زرار saveProfile مقفول
        await expect(profile.saveProfile_btn).toBeDisabled();
        // بيقفل النافذة (الرجوع)
        await profile.closePopup();
    });

    // Data-Driven: شروط الباسورد ظاهرة في نافذة تغيير كلمة المرور
    for (const rule of data.passwordRules) {
        // التست ده بياخد: adminPO = متصفح الأدمن
        test(`[Positive] change password: the rule "${rule}" is shown`, async ({ adminPO }) => {
            // بيجيب صفحة الملف الشخصي من متصفح الأدمن
            const profile = adminPO.getAdminProfilePage();

            // بيفتح الصفحة
            await profile.open();
            // بيفتح النافذة (popup)
            await profile.openPopup(data.popups[1].button, data.popups[1].title);
            // بيتأكد إن النافذة فيها النص ده
            await profile.assertPopupHas(rule);
            // بيقفل النافذة (الرجوع)
            await profile.closePopup();
        });
    }

    // الرجوع من غير حفظ: الاسم زي ما هو
    test('[Positive] closing the edit popup does not change the name', async ({ adminPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح الأدمن
        const profile = adminPO.getAdminProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيقرا الاسم اللي في الشريط العلوي، وبيحفظ النتيجة في name
        const name = await profile.topBarName();
        // بيفتح النافذة (popup)
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        // بيكتب `${name} not saved` في خانة fullName
        await profile.fullName_tb.fill(`${name} not saved`);
        // بيقفل النافذة (الرجوع)
        await profile.closePopup();
        // بيعمل reload للصفحة
        await profile.page.reload();
        // بيتأكد إن نص topBarName النص بتاعه name
        await expect(profile.topBarName_lbl).toHaveText(name);
    });
});
