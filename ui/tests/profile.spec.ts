// بيجيب test و expect و openWindow و closeWindow من الـ fixtures (فيهم adminPO و merchantPO جاهزين)
import { test, expect, openWindow, closeWindow } from '../../fixtures/fixtures';
// بيجيب LoginPage من pages/auth/LoginPage
import { LoginPage } from '../pages/auth/LoginPage';
// بيجيب MerchantProfilePage من pages/merchant/MerchantProfilePage
import { MerchantProfilePage } from '../pages/merchant/MerchantProfilePage';
// بيجيب users من testData/users.ts
import users from '../../testData/users';
// بيجيب paths من testData/paths.ts
import paths from '../../testData/paths';
// بيجيب profileData من testData/profile.ts
import profileData from '../../testData/profile';

// merchant > الملف الشخصي
// IMPORTANT: the edit name test puts the old name back. The password is NEVER changed
// (except the test at the end, it is OFF by default).

//===================Top bar===================
// الشريط العلوي (الصورة والاسم والمتجر)
test.describe('Merchant - profile: top bar', { tag: '@profile' }, () => {

    // الشريط العلوي بيعرض الصورة والاسم واسم المتجر
    test('[Positive] the top bar shows the avatar, the name and the store name', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيتأكد إن الشريط العلوي ظاهر
        await expect(profile.topBarProfile).toBeVisible();
        // بيتأكد إن الشريط العلوي فيه النص profileData.account.name
        await expect(profile.topBarProfile).toContainText(profileData.account.name);
        // بيتأكد إن الشريط العلوي فيه النص profileData.account.storeName
        await expect(profile.topBarProfile).toContainText(profileData.account.storeName);
    });

    // requirement (main flow 1-2): clicking the profile icon opens a menu with
    // the photo, the name, the email, the profile settings and the logout button
    // الضغط على أيقونة الملف الشخصي بيفتح قايمة (gap)
    test('[Positive] clicking the profile icon in the top bar opens the profile menu', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيدوس على الشريط العلوي
        await profile.topBarProfile.click();
        // menu = profile.menu()
        const menu = profile.menu();
        // بيتأكد إن menu ظاهر
        await expect(menu, 'a menu must open after clicking the profile icon').toBeVisible({ timeout: 5000 });
        // بيتأكد إن menu فيه النص profileData.account.name
        await expect(menu).toContainText(profileData.account.name);
        // بيتأكد إن menu فيه النص profileData.account.email
        await expect(menu).toContainText(profileData.account.email);
        // بيتأكد إن menu فيه النص 'تسجيل الخروج'
        await expect(menu).toContainText('تسجيل الخروج');
    });
});

//===================Profile page===================
// صفحة الملف الشخصي
test.describe('Merchant - profile: page', { tag: '@profile' }, () => {

    // الصفحة بتعرض بيانات الحساب والـ 3 أزرار
    test('[Positive] the profile page shows the account data and the 3 buttons', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيتأكد إن بيانات الحساب ظاهرة
        await profile.assertAccountData(profileData.account);
        // بيتأكد إن زرار editProfile ظاهر
        await expect(profile.editProfile_btn).toBeVisible();
        // بيتأكد إن زرار changePassword ظاهر
        await expect(profile.changePassword_btn).toBeVisible();
        // بيتأكد إن زرار logout ظاهر
        await expect(profile.logout_btn).toBeVisible();
    });
});

//===================Edit profile===================
// تعديل الملف الشخصي (الاسم والصورة)
test.describe('Merchant - profile: edit', { tag: '@profile' }, () => {
    // they change the same name
    test.describe.configure({ mode: 'serial' });

    // تغيير الاسم وبعدين بيرجّع الاسم القديم
    test('[Positive] change the name: it is saved and shown in the top bar', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // الاسم الحالي (بيرجع في الآخر)
        const oldName = (await profile.topBarName_lbl.innerText()).trim();
        // try / finally: اللي في finally بيتنفذ دايمًا (حتى لو حاجة فشلت)
        try {
            // بيكتب الاسم ويحفظ
            await profile.saveName(profileData.newName);
            // بيعمل reload للصفحة
            await profile.page.reload();
            // بيتأكد إن نص في الصفحة (profileData.newName) ظاهر
            await expect(profile.mainText(profileData.newName)).toBeVisible();
            // بيتأكد إن الاسم في الشريط العلوي هو ده
            await profile.assertTopBarName(profileData.newName);
        // finally = بيتنفذ دايمًا (بيقفل / بينضّف)
        } finally {
            // put the old name back
            await profile.open();
            // بيكتب الاسم ويحفظ
            await profile.saveName(oldName);
        }
    });

    // Data-Driven: one test for every row in profileData.wrongNames
    for (const data of profileData.wrongNames) {
        // اسم غلط (من الداتا): زرار الحفظ مقفول ويظهر خطأ
        test(`[Negative] wrong name (${data.title}) can not be saved`, async ({ merchantPO }) => {
            // بيجيب صفحة الملف الشخصي من متصفح التاجر
            const profile = merchantPO.getMerchantProfilePage();

            // بيفتح الصفحة
            await profile.open();
            // بيفتح نافذة تعديل الملف الشخصي
            await profile.openEditProfile();
            // بيكتب data.name في خانة fullName
            await profile.fullName_tb.fill(data.name);
            // بيتأكد إن رسالة خطأ في النافذة (data.error) ظاهر
            await expect(profile.popupError(data.error)).toBeVisible();
            // بيتأكد إن زرار saveProfile مقفول
            await expect(profile.saveProfile_btn).toBeDisabled();
        });
    }

    // "الرجوع" ما بيحفظش الاسم الجديد
    test('[Negative] "الرجوع" closes the popup and does NOT save the new name', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح نافذة تعديل الملف الشخصي
        await profile.openEditProfile();
        // بيكتب profileData.newName في خانة fullName
        await profile.fullName_tb.fill(profileData.newName);
        // بيقفل النافذة (الرجوع)
        await profile.closePopup();

        // بيعمل reload للصفحة
        await profile.page.reload();
        // بيتأكد إن الاسم في الشريط العلوي هو ده
        await profile.assertTopBarName(profileData.account.name);
    });

    // رفع صورة بروفايل وظهورها
    test('[Positive] upload a profile photo (JPG / PNG)', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح نافذة تعديل الملف الشخصي
        await profile.openEditProfile();
        // بيرفع الملف ده
        await profile.profileImage_file.setInputFiles(profileData.image);
        // بيدوس الزرار ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await profile.clickAndWaitForServer(profile.saveProfile_btn, 60000);
        // بيتأكد إن السيرفر رد بنجاح
        expect(response.ok(), `save photo failed: ${response.status()} ${await response.text()}`).toBeTruthy();

        // بيعمل reload للصفحة
        await profile.page.reload();
        // the profile page shows the new photo
        await expect(profile.uploadedImage()).toBeVisible();
        // SEEN on stg: the top bar still shows the first letter of the name, not the photo
        // soft: the error is saved, the test continues
        await expect.soft(profile.topBarImage(), 'the top bar must show the profile photo (not the letter)').toBeVisible();
    });
});

//===================Change password (nothing is changed)===================
// تغيير كلمة المرور (من غير ما تتغير فعلًا)
test.describe('Merchant - profile: change password', { tag: '@profile' }, () => {

    // النافذة فيها الـ 3 خانات وشروط الباسورد
    test('[Positive] the password popup shows the 3 fields and the password rules', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح نافذة تغيير الباسورد
        await profile.openChangePassword();
        // بيتأكد إن خانة currentPassword ظاهر
        await expect(profile.currentPassword_tb).toBeVisible();
        // بيتأكد إن خانة newPassword ظاهر
        await expect(profile.newPassword_tb).toBeVisible();
        // بيتأكد إن خانة confirmPassword ظاهر
        await expect(profile.confirmPassword_tb).toBeVisible();
        for (const rule of Object.values(profileData.passwordRules)) {
            // بيتأكد إن شرط الباسورد ده ظاهر
            await profile.assertPasswordRuleShown(rule);
        }
    });

    // Data-Driven: one test for every row in profileData.wrongNewPasswords
    for (const data of profileData.wrongNewPasswords) {
        // باسورد جديد غلط (من الداتا): زرار الحفظ مقفول
        test(`[Negative] new password ${data.title} can not be saved`, async ({ merchantPO }) => {
            // بيجيب صفحة الملف الشخصي من متصفح التاجر
            const profile = merchantPO.getMerchantProfilePage();

            // بيفتح الصفحة
            await profile.open();
            // بيفتح نافذة تغيير الباسورد
            await profile.openChangePassword();
            // بيكتب الباسورد الحالي والجديد والتأكيد
            await profile.fillPasswords(users.merchant.password, data.newPassword, data.confirm);
            // بيتأكد إن زرار savePassword مقفول
            await expect(profile.savePassword_btn).toBeDisabled();
        });
    }

    // كلمة المرور الحالية الغلط بتترفض
    test('[Negative] a wrong current password is rejected', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح نافذة تغيير الباسورد
        await profile.openChangePassword();
        // بيكتب الباسورد الحالي والجديد والتأكيد
        await profile.fillPasswords(profileData.wrongCurrentPassword, profileData.validNewPassword, profileData.validNewPassword);
        // بيدوس الزرار ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await profile.clickAndWaitForServer(profile.savePassword_btn);
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok(), 'the server must reject a wrong current password').toBeFalsy();
    });

    // "الرجوع" بيقفل نافذة الباسورد
    test('[Negative] "الرجوع" closes the password popup', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح نافذة تغيير الباسورد
        await profile.openChangePassword();
        // بيقفل النافذة (الرجوع)
        await profile.closePopup();
    });
});

//===================Logout===================
// تسجيل الخروج من صفحة الملف الشخصي
test.describe('Merchant - profile: logout', { tag: '@profile' }, () => {

    // "الرجوع" في نافذة الخروج والتاجر بيفضل داخل
    test('[Negative] logout and press "الرجوع": still logged in', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح نافذة الخروج
        await profile.openLogout();
        // بيقفل النافذة (الرجوع)
        await profile.closePopup();
        // بيعمل reload للصفحة
        await profile.page.reload();
        // بيتأكد إن الصفحة الرابط بقى new RegExp(paths.profilePath)
        await expect(profile.page).toHaveURL(new RegExp(paths.profilePath));
    });

    // a NEW login only for this test, so the saved session of the other tests is not closed
    // "تأكيد" بيخرج التاجر (بدخول جديد عشان الجلسة التانية ما تتقفلش)
    test('[Positive] logout: the login page opens and the dashboard needs login again', async ({ browser }, testInfo) => {
        // بيستخدم openWindow وبياخد منها context, page 
        const { context, page } = await openWindow(browser, testInfo, process.env.MERCHANT_URL);
        // بيعمل صفحة Login على المتصفح ده
        const loginPage = new LoginPage(page);
        // بيعمل صفحة الملف الشخصي على المتصفح ده
        const profile = new MerchantProfilePage(page);

        // try / finally: اللي في finally بيتنفذ دايمًا (حتى لو حاجة فشلت)
        try {
            // بيفتح الصفحة
            await loginPage.open();
            // بيكتب الإيميل والباسورد ويدوس دخول
            await loginPage.login(users.merchant.email, users.merchant.password);
            // بيتأكد إن الدخول نجح
            await loginPage.assertLoggedIn();

            // بيفتح الصفحة
            await profile.open();
            // بيفتح نافذة الخروج
            await profile.openLogout();
            // بيدوس على زرار confirmLogout
            await profile.confirmLogout_btn.click();
            // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
            await loginPage.assertLoginPageIsOpen();

            // بيفتح الصفحة دي بالرابط
            await page.goto(paths.profilePath);
            // بيتأكد إن صفحة الدخول مفتوحة (مش داخل)
            await loginPage.assertLoginPageIsOpen();
        // finally = بيتنفذ دايمًا (بيقفل / بينضّف)
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
    // بيعمل skip للتست لو الشرط ده صح
    test.skip(process.env.CHANGE_PASSWORD !== 'yes', 'can change the real password: set CHANGE_PASSWORD=yes to run it');

    // التست ده بياخد: merchantPO = متصفح التاجر
    test('[Negative] business rule: the password can not be changed before the email is verified', async ({ merchantPO }) => {
        // بيجيب صفحة الملف الشخصي من متصفح التاجر
        const profile = merchantPO.getMerchantProfilePage();

        // بيفتح الصفحة
        await profile.open();
        // بيفتح نافذة تغيير الباسورد
        await profile.openChangePassword();
        // بيكتب الباسورد الحالي والجديد والتأكيد
        await profile.fillPasswords(users.merchant.password, profileData.validNewPassword, profileData.validNewPassword);
        // بيدوس الزرار ويستنى رد السيرفر، وبيحفظ النتيجة في response
        const response = await profile.clickAndWaitForServer(profile.savePassword_btn);

        // لو الشرط ده صح: response.ok()
        if (response.ok()) {
            // the password was changed (the rule is broken): put the old password back
            await profile.open();
            // بيفتح نافذة تغيير الباسورد
            await profile.openChangePassword();
            // بيكتب الباسورد الحالي والجديد والتأكيد
            await profile.fillPasswords(profileData.validNewPassword, users.merchant.password, users.merchant.password);
            // بيدوس الزرار ويستنى رد السيرفر
            await profile.clickAndWaitForServer(profile.savePassword_btn);
        }
        // بيتأكد إن السيرفر رفض الطلب
        expect(response.ok(), 'the password was changed but the email is NOT verified').toBeFalsy();
    });
});
