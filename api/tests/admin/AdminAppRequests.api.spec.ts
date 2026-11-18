// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > الأدمن > طلبات التطبيقات (requirements/API.md)

// مجموعة تستات طلبات التطبيقات، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - admin appRequests', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/app-requests/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/app-requests/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/app-requests/?status=new returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/app-requests/?status=new');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/app-requests/statuses/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/app-requests/statuses/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Negative] GET /api/v2/admin/app-requests/TRG-0000000000000-qaapi/ returns 404', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/app-requests/TRG-0000000000000-qaapi/');

        // بيتأكد إن رقم الرد 404 (يعني الحاجة دي مش موجودة)
        expect(response.status()).toBe(404);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Negative] POST /api/v2/admin/app-requests/TRG-0000000000000-qaapi/accept/ returns 404', async ({ adminApi }) => {
        // بيبعت طلب POST على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.post('/api/v2/admin/app-requests/TRG-0000000000000-qaapi/accept/');

        // بيتأكد إن رقم الرد 404 (يعني الحاجة دي مش موجودة)
        expect(response.status()).toBe(404);
    });
});
