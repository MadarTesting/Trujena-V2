// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > التاجر > لوحة التحكم (requirements/API.md)

// مجموعة تستات لوحة التحكم، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - merchant dashboard', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/auth/dashboard/stats/ returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/auth/dashboard/stats/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/auth/dashboard/app-users/?period=weekly returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/auth/dashboard/app-users/?period=weekly');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Positive] GET /api/v2/merchant/auth/dashboard/app-downloads/?period=weekly returns 200', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/merchant/auth/dashboard/app-downloads/?period=weekly');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });
});
