// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > التاجر > إعدادات التطبيق (requirements/API.md)

// مجموعة تستات إعدادات التطبيق، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - merchant appConfig', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/app-config/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/app-config/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/app-config/icons/?category=coffee returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/app-config/icons/?category=coffee');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/app-config/privacy-policy/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/app-config/privacy-policy/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/app-config/whatsapp-settings/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/app-config/whatsapp-settings/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ guestApi }) = API جاهز من غير توكن (من غير login)
    test('[Negative] GET /api/v2/merchant/app-config/ (no token) returns 401', async ({ guestApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await guestApi.get('/api/v2/merchant/app-config/');

        // بيتأكد إن رقم الرد 401 (يعني لازم تعمل login الأول)
        expect(response.status()).toBe(401);
    });
});
