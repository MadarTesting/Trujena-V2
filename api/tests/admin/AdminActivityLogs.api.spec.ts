// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > الأدمن > سجل النشاطات (requirements/API.md)

// مجموعة تستات سجل النشاطات، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - admin activityLogs', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/activity-logs/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/activity-logs/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/activity-logs/?action_type=login returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/activity-logs/?action_type=login');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/activity-logs/action-types/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/activity-logs/action-types/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ guestApi }) = API جاهز من غير توكن (من غير login)
    test('[Negative] GET /api/v2/admin/activity-logs/ (no token) returns 401', async ({ guestApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await guestApi.get('/api/v2/admin/activity-logs/');

        // بيتأكد إن رقم الرد 401 (يعني لازم تعمل login الأول)
        expect(response.status()).toBe(401);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ merchantApi }) = API جاهز بحساب التاجر
    test('[Negative] GET /api/v2/admin/activity-logs/ (merchant token) returns 403', async ({ merchantApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await merchantApi.get('/api/v2/admin/activity-logs/');

        // بيتأكد إن رقم الرد 403 (يعني الحساب ده مش مسموحله)
        expect(response.status()).toBe(403);
    });
});
