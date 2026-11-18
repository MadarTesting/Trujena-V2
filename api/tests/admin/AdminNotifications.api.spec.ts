// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > الأدمن > الإشعارات (requirements/API.md)

// مجموعة تستات الإشعارات، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - admin notifications', { tag: '@api' }, () => {

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/admin/notifications/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/notifications/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: المفروض ينجح
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Positive] GET /api/v2/users/list-users/?account_type=merchant returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/users/list-users/?account_type=merchant');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Negative] GET /api/v2/admin/notifications/999999999/ returns 404', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.get('/api/v2/admin/notifications/999999999/');

        // بيتأكد إن رقم الرد 404 (يعني الحاجة دي مش موجودة)
        expect(response.status()).toBe(404);
    });

    // تست: سيناريو غلط عن قصد: المفروض السيرفر يرفضه
    // ({ adminApi }) = API جاهز بحساب الأدمن
    test('[Negative] DELETE /api/v2/admin/notifications/999999999/ returns 404', async ({ adminApi }) => {
        // بيبعت طلب DELETE على الرابط ده، وبيحفظ رد السيرفر في response
        const response = await adminApi.delete('/api/v2/admin/notifications/999999999/');

        // بيتأكد إن رقم الرد 404 (يعني الحاجة دي مش موجودة)
        expect(response.status()).toBe(404);
    });
});
