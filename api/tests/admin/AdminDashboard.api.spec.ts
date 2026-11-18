// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > الأدمن > لوحة التحكم (requirements/API.md)

// مجموعة تستات لوحة التحكم، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - admin dashboard', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/users/dashboard/stats/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/users/dashboard/stats/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/users/dashboard/newest-merchants/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/users/dashboard/newest-merchants/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/users/dashboard/app-requests/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/users/dashboard/app-requests/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/payments/dashboard/revenue/?period=weekly returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/payments/dashboard/revenue/?period=weekly');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });
});
