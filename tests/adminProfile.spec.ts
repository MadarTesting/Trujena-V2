import { test, expect } from '../fixtures/fixtures';
import data from '../testData/adminProfile';
import users from '../testData/users';

// admin > الملف الشخصي (requirements/AdminProfilePage.md = UC-13)
// ⚠️ read only: مفيش ولا تست بيحفظ حاجة (والصفحة بتقفل أي طلب غير GET)

//===================الشريط العلوي وصفحة الملف الشخصي===================
test.describe('Admin - profile: view', { tag: '@adminProfile' }, () => {

    // الشريط العلوي فيه الصورة والاسم والدور
    test('[Positive] the top bar shows the avatar, the name and the role', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        await expect(profile.topBarProfile.locator('[data-slot="avatar"]')).toBeVisible();
        await expect(profile.topBarName_lbl).not.toBeEmpty();
        await expect(profile.topBarProfile).toContainText(data.role);
    });

    // Main flow: الصفحة بتعرض الاسم والإيميل والدور
    test('[Positive] the profile page shows the name, the email and the role', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        const name = await profile.topBarName();
        for (const text of [...data.accountLabels, name, users.admin.email, data.role]) {
            await profile.assertPageHas(text);
        }
    });

    // زرار تسجيل الخروج موجود في القايمة الجانبية كمان
    test('[Positive] the side bar has "تسجيل الخروج"', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        await expect(profile.sideLogout_lnk).toBeVisible();
    });

    // Alternative 1: الإيميل مفعّل، فرسالة "يرجى تأكيد البريد" مش بتظهر
    test('[Positive] Alternative 1: a verified email shows no warning', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        await expect(profile.page.getByText(data.verifyEmailWarning)).toHaveCount(0);
    });
});

//===================النوافذ (بتتفتح وبتتقفل من غير حفظ)===================
test.describe('Admin - profile: popups', { tag: '@adminProfile' }, () => {

    // Data-Driven: كل زرار بيفتح النافذة بتاعته، و"الرجوع" بيقفلها
    for (const popup of data.popups) {
        test(`[Positive] "${popup.button}" opens its popup and "الرجوع" closes it`, async ({ adminPO }) => {
            const profile = adminPO.getAdminProfilePage();

            await profile.open();
            await profile.openPopup(popup.button, popup.title);
            await profile.closePopup();
        });
    }

    // نافذة التعديل فيها الاسم الحالي ورفع الصورة
    test('[Positive] edit profile: the name is filled and the image upload is there', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        const name = await profile.topBarName();
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        await expect(profile.fullName_tb).toHaveValue(name);
        await expect(profile.profileImage_file).toBeAttached();
        await profile.closePopup();
    });

    // business rule: الإيميل مش بيتغيّر من الملف الشخصي (مفيش خانة إيميل)
    test('[Negative] business rule: the email cannot be changed from the profile', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        await expect(profile.popup.locator('input[type="email"], input[name*="email" i]')).toHaveCount(0);
        await profile.closePopup();
    });

    // الاسم الفاضي: رسالة خطأ وزرار الحفظ مقفول (من غير حفظ)
    test('[Negative] edit profile: an empty name shows an error and save is disabled', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        await profile.fullName_tb.fill('');
        await profile.assertPopupHas(data.nameRequiredError);
        await expect(profile.saveProfile_btn).toBeDisabled();
        await profile.closePopup();
    });

    // Data-Driven: شروط الباسورد ظاهرة في نافذة تغيير كلمة المرور
    for (const rule of data.passwordRules) {
        test(`[Positive] change password: the rule "${rule}" is shown`, async ({ adminPO }) => {
            const profile = adminPO.getAdminProfilePage();

            await profile.open();
            await profile.openPopup(data.popups[1].button, data.popups[1].title);
            await profile.assertPopupHas(rule);
            await profile.closePopup();
        });
    }

    // الرجوع من غير حفظ: الاسم زي ما هو
    test('[Positive] closing the edit popup does not change the name', async ({ adminPO }) => {
        const profile = adminPO.getAdminProfilePage();

        await profile.open();
        const name = await profile.topBarName();
        await profile.openPopup(data.popups[0].button, data.popups[0].title);
        await profile.fullName_tb.fill(`${name} not saved`);
        await profile.closePopup();
        await profile.page.reload();
        await expect(profile.topBarName_lbl).toHaveText(name);
    });
});
