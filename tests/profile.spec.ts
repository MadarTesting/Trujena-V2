import { test, expect, openWindow, closeWindow } from '../fixtures/fixtures';
import { LoginPage } from '../pages/auth/LoginPage';
import { MerchantProfilePage } from '../pages/merchant/MerchantProfilePage';
import users from '../testData/users';
import paths from '../testData/paths';
import profileData from '../testData/profile';

// merchant > الملف الشخصي
// IMPORTANT: the edit name test puts the old name back. The password is NEVER changed
// (except the test at the end, it is OFF by default).

//===================Top bar===================
// الشريط العلوي (الصورة والاسم والمتجر)
test.describe('Merchant - profile: top bar', { tag: '@profile' }, () => {

    // الشريط العلوي بيعرض الصورة والاسم واسم المتجر
    test('[Positive] the top bar shows the avatar, the name and the store name', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await expect(profile.topBarProfile).toBeVisible();
        await expect(profile.topBarProfile).toContainText(profileData.account.name);
        await expect(profile.topBarProfile).toContainText(profileData.account.storeName);
    });

    // requirement (main flow 1-2): clicking the profile icon opens a menu with
    // the photo, the name, the email, the profile settings and the logout button
    // الضغط على أيقونة الملف الشخصي بيفتح قايمة (gap)
    test('[Positive] clicking the profile icon in the top bar opens the profile menu', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.topBarProfile.click();
        const menu = profile.page.locator('[role="menu"], [role="dialog"]').filter({ visible: true });
        await expect(menu, 'a menu must open after clicking the profile icon').toBeVisible({ timeout: 5000 });
        await expect(menu).toContainText(profileData.account.name);
        await expect(menu).toContainText(profileData.account.email);
        await expect(menu).toContainText('تسجيل الخروج');
    });
});

//===================Profile page===================
// صفحة الملف الشخصي
test.describe('Merchant - profile: page', { tag: '@profile' }, () => {

    // الصفحة بتعرض بيانات الحساب والـ 3 أزرار
    test('[Positive] the profile page shows the account data and the 3 buttons', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.assertAccountData(profileData.account);
        await expect(profile.editProfile_btn).toBeVisible();
        await expect(profile.changePassword_btn).toBeVisible();
        await expect(profile.logout_btn).toBeVisible();
    });
});

//===================Edit profile===================
// تعديل الملف الشخصي (الاسم والصورة)
test.describe('Merchant - profile: edit', { tag: '@profile' }, () => {
    test.describe.configure({ mode: 'serial' });     // they change the same name

    // تغيير الاسم وبعدين بيرجّع الاسم القديم
    test('[Positive] change the name: it is saved and shown in the top bar', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        const oldName = (await profile.topBarName_lbl.innerText()).trim();     // الاسم الحالي (بيرجع في الآخر)
        try {
            await profile.saveName(profileData.newName);
            await profile.page.reload();
            await expect(profile.page.locator('main').getByText(profileData.newName).filter({ visible: true }).first()).toBeVisible();
            await profile.assertTopBarName(profileData.newName);
        } finally {
            // put the old name back
            await profile.open();
            await profile.saveName(oldName);
        }
    });

    // Data-Driven: one test for every row in profileData.wrongNames
    for (const data of profileData.wrongNames) {
        // اسم غلط (من الداتا): زرار الحفظ مقفول ويظهر خطأ
        test(`[Negative] wrong name (${data.title}) can not be saved`, async ({ merchantPO }) => {
            const profile = merchantPO.getMerchantProfilePage();

            await profile.open();
            await profile.openEditProfile();
            await profile.fullName_tb.fill(data.name);
            await expect(profile.popup.getByRole('alert').filter({ hasText: data.error })).toBeVisible();
            await expect(profile.saveProfile_btn).toBeDisabled();
        });
    }

    // "الرجوع" ما بيحفظش الاسم الجديد
    test('[Negative] "الرجوع" closes the popup and does NOT save the new name', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.openEditProfile();
        await profile.fullName_tb.fill(profileData.newName);
        await profile.closePopup();

        await profile.page.reload();
        await profile.assertTopBarName(profileData.account.name);
    });

    // رفع صورة بروفايل وظهورها
    test('[Positive] upload a profile photo (JPG / PNG)', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.openEditProfile();
        await profile.profileImage_file.setInputFiles(profileData.image);
        const response = await profile.clickAndWaitForServer(profile.saveProfile_btn, 60000);
        expect(response.ok(), `save photo failed: ${response.status()} ${await response.text()}`).toBeTruthy();

        await profile.page.reload();
        // the profile page shows the new photo
        await expect(profile.page.getByRole('img', { name: 'Uploaded profile image' })).toBeVisible();
        // SEEN on stg: the top bar still shows the first letter of the name, not the photo
        // soft: the error is saved, the test continues
        await expect.soft(profile.topBarProfile.locator('img'), 'the top bar must show the profile photo (not the letter)').toBeVisible();
    });
});

//===================Change password (nothing is changed)===================
// تغيير كلمة المرور (من غير ما تتغير فعلًا)
test.describe('Merchant - profile: change password', { tag: '@profile' }, () => {

    // النافذة فيها الـ 3 خانات وشروط الباسورد
    test('[Positive] the password popup shows the 3 fields and the password rules', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.openChangePassword();
        await expect(profile.currentPassword_tb).toBeVisible();
        await expect(profile.newPassword_tb).toBeVisible();
        await expect(profile.confirmPassword_tb).toBeVisible();
        for (const rule of Object.values(profileData.passwordRules)) {
            await profile.assertPasswordRuleShown(rule);
        }
    });

    // Data-Driven: one test for every row in profileData.wrongNewPasswords
    for (const data of profileData.wrongNewPasswords) {
        // باسورد جديد غلط (من الداتا): زرار الحفظ مقفول
        test(`[Negative] new password ${data.title} can not be saved`, async ({ merchantPO }) => {
            const profile = merchantPO.getMerchantProfilePage();

            await profile.open();
            await profile.openChangePassword();
            await profile.fillPasswords(users.merchant.password, data.newPassword, data.confirm);
            await expect(profile.savePassword_btn).toBeDisabled();
        });
    }

    // كلمة المرور الحالية الغلط بتترفض
    test('[Negative] a wrong current password is rejected', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.openChangePassword();
        await profile.fillPasswords(profileData.wrongCurrentPassword, profileData.validNewPassword, profileData.validNewPassword);
        const response = await profile.clickAndWaitForServer(profile.savePassword_btn);
        expect(response.ok(), 'the server must reject a wrong current password').toBeFalsy();
    });

    // "الرجوع" بيقفل نافذة الباسورد
    test('[Negative] "الرجوع" closes the password popup', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.openChangePassword();
        await profile.closePopup();
    });
});

//===================Logout===================
// تسجيل الخروج من صفحة الملف الشخصي
test.describe('Merchant - profile: logout', { tag: '@profile' }, () => {

    // "الرجوع" في نافذة الخروج والتاجر بيفضل داخل
    test('[Negative] logout and press "الرجوع": still logged in', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.openLogout();
        await profile.closePopup();
        await profile.page.reload();
        await expect(profile.page).toHaveURL(new RegExp(paths.profilePath));
    });

    // a NEW login only for this test, so the saved session of the other tests is not closed
    // "تأكيد" بيخرج التاجر (بدخول جديد عشان الجلسة التانية ما تتقفلش)
    test('[Positive] logout: the login page opens and the dashboard needs login again', async ({ browser }, testInfo) => {
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
        const loginPage = new LoginPage(page);
        const profile = new MerchantProfilePage(page);

        try {
            await loginPage.open();
            await loginPage.login(users.merchant.email, users.merchant.password);
            await loginPage.assertLoggedIn();

            await profile.open();
            await profile.openLogout();
            await profile.confirmLogout_btn.click();
            await loginPage.assertLoginPageIsOpen();

            await page.goto(paths.profilePath);
            await loginPage.assertLoginPageIsOpen();
        } finally {
            // if the test failed: screenshot + video are attached to the report
            await closeWindow(context, page, testInfo, 'merchant');
        }
    });
});

//===================Business rule: email not verified (OFF by default)===================
// BR: the password can NOT be changed before the email is verified.
// This merchant has is_email_verified = false, so the change MUST be rejected.
// IMPORTANT: if the website accepts it, the password of the merchant in .env is CHANGED,
// so the test puts the old password back. Run it only when you ask: CHANGE_PASSWORD=yes
// مينفعش تغيّر الباسورد قبل تأكيد الإيميل (بيشتغل بس مع CHANGE_PASSWORD=yes)
test.describe('Merchant - profile: password rule', { tag: '@profile' }, () => {
    test.skip(process.env.CHANGE_PASSWORD !== 'yes', 'can change the real password: set CHANGE_PASSWORD=yes to run it');

    test('[Negative] business rule: the password can not be changed before the email is verified', async ({ merchantPO }) => {
        const profile = merchantPO.getMerchantProfilePage();

        await profile.open();
        await profile.openChangePassword();
        await profile.fillPasswords(users.merchant.password, profileData.validNewPassword, profileData.validNewPassword);
        const response = await profile.clickAndWaitForServer(profile.savePassword_btn);

        if (response.ok()) {
            // the password was changed (the rule is broken): put the old password back
            await profile.open();
            await profile.openChangePassword();
            await profile.fillPasswords(profileData.validNewPassword, users.merchant.password, users.merchant.password);
            await profile.clickAndWaitForServer(profile.savePassword_btn);
        }
        expect(response.ok(), 'the password was changed but the email is NOT verified').toBeFalsy();
    });
});
