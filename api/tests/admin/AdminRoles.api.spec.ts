// بيجيب test و expect من apiFixtures (فيه adminApi و merchantApi و guestApi جاهزين)
import { test, expect } from '../../pages/apiFixtures';

// API > الأدمن > الأدوار والصلاحيات (requirements/API.md)
// دور QA بيتعمل ويتمسح في نفس التست (الأدوار التانية ما بتتلمسش)

// اسم دور التست، وفيه رقم الـ run عشان كل run يبقى ليه اسم جديد
const roleName = `QA API Role ${process.env.RUN_ID ?? Date.now().toString().slice(-6)}`;

// مجموعة تستات الأدوار، والـ tag @api عشان تقدر تشغّلهم لوحدهم
test.describe('API - admin roles', { tag: '@api' }, () => {

    // تست: السيناريو الصح: قايمة الأدوار بترجع
    test('[Positive] GET /api/v2/admin/roles/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس) بحساب الأدمن، وبيحفظ رد السيرفر
        const response = await adminApi.get('/api/v2/admin/roles/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: السيناريو الصح: قايمة الصلاحيات بترجع
    test('[Positive] GET /api/v2/admin/roles/permissions/ returns 200', async ({ adminApi }) => {
        // بيبعت طلب GET (قراءة بس)، وبيحفظ رد السيرفر
        const response = await adminApi.get('/api/v2/admin/roles/permissions/');

        // بيتأكد إن رقم الرد 200 (يعني نجح)
        expect(response.status()).toBe(200);
    });

    // تست: سيناريو غلط: دور مش موجود
    test('[Negative] GET /api/v2/admin/roles/999999999/ returns 404', async ({ adminApi }) => {
        // بيطلب دور برقم مش موجود
        const response = await adminApi.get('/api/v2/admin/roles/999999999/');

        // بيتأكد إن رقم الرد 404 (يعني مش موجود)
        expect(response.status()).toBe(404);
    });

    // تست: إضافة دور ← نفس الاسم تاني (409) ← تعديل ← مسح
    test('[Positive] add a role, the same name again is rejected, edit it, delete it', async ({ adminApi }) => {
        // بيجيب قايمة الصلاحيات (الدور لازم يبقى فيه صلاحية واحدة على الأقل)
        const permissions = await (await adminApi.get('/api/v2/admin/roles/permissions/')).json();
        // بيجهز بيانات الدور: الاسم + نشط + أول صلاحية في القايمة
        const role = { name: roleName, status: 'active', permission_codenames: [permissions.data[0].permissions[0].codename] };

        // بيضيف الدور (POST)
        const add = await adminApi.post('/api/v2/admin/roles/', { data: role });
        // بيتأكد إن رقم الرد 201 (يعني اتعمل)
        expect(add.status()).toBe(201);
        // بياخد رقم الدور الجديد من الرد (عشان يعدّله ويمسحه)
        const id = (await add.json()).data.id;

        // try / finally = اللي في finally بيتنفذ دايمًا، حتى لو حاجة فشلت (عشان الدور يتمسح)
        try {
            // بيضيف دور بنفس الاسم تاني
            const duplicate = await adminApi.post('/api/v2/admin/roles/', { data: role });
            // بيتأكد إنه اترفض بـ 409 (يعني الاسم موجود قبل كده)
            // expect.soft = لو فشل يكمّل باقي الخطوات
            expect.soft(duplicate.status(), 'the same name again').toBe(409);

            // بيعدّل الدور ويخليه غير نشط (PATCH)
            const edit = await adminApi.patch(`/api/v2/admin/roles/${id}/`, { data: { status: 'inactive' } });
            // بيتأكد إن التعديل نجح (200)
            expect.soft(edit.status(), 'edit').toBe(200);
        } finally {
            // بيمسح الدور (DELETE)، وده بيحصل دايمًا
            const remove = await adminApi.delete(`/api/v2/admin/roles/${id}/`);
            // بيتأكد إن المسح نجح (200)
            expect(remove.status(), 'delete').toBe(200);
        }
    });
});
