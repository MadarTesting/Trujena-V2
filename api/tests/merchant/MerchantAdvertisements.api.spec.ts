// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > التاجر > الإعلانات (requirements/API.md)

// مجموعة تستات الإعلانات، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - merchant advertisements', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/advertisements/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/advertisements/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Negative] GET /api/v2/merchant/advertisements/999999999/ returns 404', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/advertisements/999999999/');

        // بيتأكد إن رقم الرد 404 (يعني الحاجة دي مش موجودة)
        expect(response.status()).toBe(404);
    });
});
