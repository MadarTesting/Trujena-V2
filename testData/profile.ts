import paths from './paths';

// data for merchant > الملف الشخصي
const runId = Date.now().toString().slice(-6);

export default {
    // the account data of the merchant in .env (SEEN on stg, api: users/profile)
    // ⚠️ لو غيّرت حساب التاجر في .env، غيّر البيانات دي كمان
    // (الحساب ده رقم الهاتف فاضي، فمش بيتشيك عليه)
    account: {
        name: 'youssef',
        email: process.env.MERCHANT_EMAIL ?? '',
        storeName: 'store22',
        whatsapp: '+201227203834',
    },

    // edit profile (the test puts the old name back at the end)
    newName: `QA Merchant ${runId}`,
    image: paths.logo,                    // JPG / PNG up to 5MB

    // Data-Driven: wrong names (the save button is disabled + the error is shown, SEEN on stg)
    wrongNames: [
        { title: 'empty name', name: '', error: 'يجب أن يكون الاسم 2 أحرف على الأقل' },
        { title: 'name with 1 letter', name: 'a', error: 'يجب أن يكون الاسم 2 أحرف على الأقل' },
    ],

    // change password: the rules shown under the field (SEEN on stg)
    passwordRules: {
        length: 'يجب أن تكون 8-64 حرفاً',
        chars: 'يجب أن تحتوي على رقم وحرف كبير وحرف صغير ورمز',
        match: 'يجب أن تكون كلمات المرور متطابقة',
    },
    validNewPassword: `Qa@${runId}Xy`,    // follows all the rules
    wrongCurrentPassword: 'Wrong@12345',

    // Data-Driven: wrong new passwords (the save button stays disabled, they are NEVER saved)
    wrongNewPasswords: [
        { title: 'shorter than 8', newPassword: 'Ab@1', confirm: 'Ab@1' },
        { title: 'longer than 64', newPassword: `Aa@1${'x'.repeat(61)}`, confirm: `Aa@1${'x'.repeat(61)}` },
        { title: 'no number', newPassword: 'Abcdefg@', confirm: 'Abcdefg@' },
        { title: 'no capital letter', newPassword: 'abcdef1@', confirm: 'abcdef1@' },
        { title: 'no small letter', newPassword: 'ABCDEF1@', confirm: 'ABCDEF1@' },
        { title: 'no symbol', newPassword: 'Abcdefg1', confirm: 'Abcdefg1' },
        { title: 'confirm is not the same', newPassword: `Qa@${runId}Xy`, confirm: `Qa@${runId}Zz` },
    ],
};
