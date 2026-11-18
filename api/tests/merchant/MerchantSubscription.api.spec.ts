// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > التاجر > الاشتراك (requirements/API.md)

// مجموعة تستات الاشتراك، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - merchant subscription', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/subscription/details/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/subscription/details/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/subscription/packages/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/subscription/packages/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });
});
