// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > التاجر > طلب التطبيق (requirements/API.md)

// مجموعة تستات طلب التطبيق، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - merchant appRequest', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/app-request/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/app-request/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Negative] GET /api/v2/merchant/app-request/TRG-0000000000000-qaapi/ returns 404', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/app-request/TRG-0000000000000-qaapi/');

        // بيتأكد إن رقم الرد 404 (يعني الحاجة دي مش موجودة)
        expect(response.status()).toBe(404);
    });
});
