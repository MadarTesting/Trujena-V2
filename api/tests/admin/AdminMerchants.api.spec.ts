// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > الأدمن > العملاء (requirements/API.md)

// مجموعة تستات العملاء، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - admin merchants', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/merchants/active/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/merchants/active/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/merchants/active/?subscription_status=active returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/merchants/active/?subscription_status=active');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/merchants/leads/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/merchants/leads/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Negative] GET /api/v2/admin/merchants/999999999/ returns 404', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/merchants/999999999/');

        // بيتأكد إن رقم الرد 404 (يعني الحاجة دي مش موجودة)
        expect(response.status()).toBe(404);
    });
});
