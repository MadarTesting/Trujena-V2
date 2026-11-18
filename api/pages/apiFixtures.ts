// بيجيب من Playwright: test (عشان نعمل منه test جديد) و request (عشان نبعت طلبات API) و expect
import { test as base, request, expect, type APIRequestContext } from '@playwright/test';
// بيجيب الإيميلات والباسوردات (من ملف .env)
import users from '../../testData/users';

// عنوان السيرفر (من الـ Swagger). كل الروابط في التستات بتتحط بعده
const API_URL = 'https://server.stg.trujena.com';

// بيعمل login ويرجّع رد السيرفر (فيه التوكن)
export async function login(email: string, password: string) {
    // بيفتح API جديد على السيرفر
    const api = await request.newContext({ baseURL: API_URL });
    // بيبعت الإيميل والباسورد لرابط الـ login
    const response = await api.post('/api/v2/users/auth/login/', { data: { email, password } });
    // بيرجّع الرد كله (response) والبيانات اللي جواه (body)
    return { response, body: await response.json() };
}

// بيفتح API، ولو فيه توكن بيتبعت مع كل طلب لوحده
export async function openApi(token = '') {
    return await request.newContext({
        // عنوان السيرفر: التستات بتكتب الرابط القصير بس
        baseURL: API_URL,
        // لو فيه توكن: بيتحط في Authorization مع كل طلب. لو مفيش: من غير توكن
        extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });
}

// الـ fixtures = حاجات جاهزة التست بياخدها بالاسم: async ({ adminApi }) => ...
export const test = base.extend<{ adminApi: APIRequestContext; merchantApi: APIRequestContext; guestApi: APIRequestContext }>({
    // adminApi = API داخل بحساب الأدمن
    adminApi: async ({}, use) => {
        // بيعمل login بحساب الأدمن
        const { body } = await login(users.admin.email, users.admin.password);
        // بيدّي التست API بتوكن الأدمن
        await use(await openApi(body.data.tokens.access_token));
    },

    // merchantApi = API داخل بحساب التاجر
    merchantApi: async ({}, use) => {
        // بيعمل login بحساب التاجر
        const { body } = await login(users.merchant.email, users.merchant.password);
        // بيدّي التست API بتوكن التاجر
        await use(await openApi(body.data.tokens.access_token));
    },

    // guestApi = API من غير login (عشان نجرب إن السيرفر بيرفض: 401)
    guestApi: async ({}, use) => {
        await use(await openApi());
    },
});

// بيصدّر expect عشان التستات تاخده من هنا مع test
export { expect };
