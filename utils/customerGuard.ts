import type { Page } from '@playwright/test';

// حماية العملاء الموجودين: بيمنع أي طلب بيحفظ أو بيعدل أو بيمسح في الأدمن
// ما عدا اللي التست سمح بيه: إضافة عميل جديد، أو التعديل على العميل بتاع التست (بالـ id بتاعه)
export const allowed = {
    create: false,      // يسمح بإضافة عميل جديد
    id: '',             // id العميل بتاع التست (التعديل والمسح مسموحين عليه هو بس)
};

// بيركّب الحماية على الصفحة
export async function protectCustomers(page: Page) {
    await page.route('**/api/v2/admin/**', route => {
        const request = route.request();
        const url = request.url();
        if (request.method() === 'GET') return route.continue();
        if (allowed.create && request.method() === 'POST' && !/\/\d+\//.test(url)) return route.continue();
        if (allowed.id && url.includes(`/${allowed.id}/`)) return route.continue();
        console.log(`BLOCKED (to protect the other customers): ${request.method()} ${url}`);
        return route.abort();
    });
}
