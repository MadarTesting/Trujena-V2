// بيجيب test و expect، ومعاهم login (بيعمل دخول) و openApi (بيفتح API بتوكن)
import { test, expect, login, openApi } from '../../pages/apiFixtures';
// بيجيب الإيميلات والباسوردات (من ملف .env)
import users from '../../../testData/users';

// API > تسجيل الدخول والخروج والملف الشخصي (requirements/API.md)

// مجموعة تستات الدخول، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - login', { tag: '@api' }, () => {

    // تست: الأدمن بيعمل login صح
    test('[Positive] admin login returns a token', async () => {
        // بيعمل login بإيميل وباسورد الأدمن، وبياخد الرد (response) والبيانات (body)
        const { response, body } = await login(users.admin.email, users.admin.password);

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
        // بيتأكد إن السيرفر رجّع توكن
        expect(body.data.tokens.access_token).toBeTruthy();
        // بيتأكد إن نوع الحساب admin
        expect(body.data.user.account_type).toBe('admin');
    });

    // تست: التاجر بيعمل login صح
    test('[Positive] merchant login returns a token', async () => {
        // بيعمل login بإيميل وباسورد التاجر
        const { response, body } = await login(users.merchant.email, users.merchant.password);

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
        // بيتأكد إن السيرفر رجّع توكن
        expect(body.data.tokens.access_token).toBeTruthy();
        // بيتأكد إن نوع الحساب merchant
        expect(body.data.user.account_type).toBe('merchant');
    });

    // تست: إيميل مش متسجل (إيميل وهمي عشان الحساب الحقيقي ما يتقفلش من المحاولات الغلط)
    test('[Negative] login with an email that is not registered returns 401', async () => {
        // بيعمل login بإيميل مش موجود
        const { response } = await login('nobody.qa.api@test.com', 'Wrong@12345');

        // بيتأكد إن رقم الرد 401 (يعني البيانات غلط)
        expect(response.status()).toBe(401);
    });

    // تست: الملف الشخصي بيرجّع بيانات الحساب اللي داخل
    test('[Positive] GET /api/v2/users/profile/ returns the logged in user', async ({ adminApi }) => {
        // بيطلب الملف الشخصي بحساب الأدمن
        const response = await adminApi.get('/api/v2/users/profile/');
        // بيقرا البيانات اللي في الرد (JSON)
        const body = await response.json();

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
        // بيتأكد إن الإيميل هو إيميل الأدمن
        expect(body.data.email).toBe(users.admin.email);
    });

    // تست: الملف الشخصي من غير login
    test('[Negative] GET /api/v2/users/profile/ (no token) returns 401', async ({ guestApi }) => {
        // بيطلب الملف الشخصي من غير توكن
        const response = await guestApi.get('/api/v2/users/profile/');

        // بيتأكد إن رقم الرد 401 (يعني لازم تعمل login الأول)
        expect(response.status()).toBe(401);
    });

    // تست: بعد الـ logout التوكن ما يشتغلش (على جلسة جديدة عشان الجلسات التانية ما تتقفلش)
    test('[Positive] after logout the token does not work', async () => {
        // بيعمل login جديد بحساب التاجر
        const { body } = await login(users.merchant.email, users.merchant.password);
        // بيفتح API بالتوكن الجديد
        const api = await openApi(body.data.tokens.access_token);

        // بيعمل logout (بيبعت الـ refresh token)
        const logout = await api.post('/api/v2/users/auth/logout/', { data: { refresh_token: body.data.tokens.refresh_token } });
        // بيتأكد إن الـ logout نجح (200)
        expect(logout.status()).toBe(200);

        // بيجرب نفس التوكن تاني
        const profile = await api.get('/api/v2/users/profile/');
        // بيتأكد إنه اترفض بـ 401 (يعني التوكن اتقفل)
        expect(profile.status()).toBe(401);
    });
});
