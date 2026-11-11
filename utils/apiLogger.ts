import type { Page, Response, TestInfo } from '@playwright/test';

// prints every API call that SENDS data (POST / PUT / PATCH / DELETE) in the terminal:
// the request, the status code, the payload and the preview (the response), each one in its own part.
// to turn it off: API_LOG=no

const SKIP_URLS = ['/api/auth/session', '/api/auth/_log'];   // the website calls them all the time
const SECRET_KEYS = /password|token|csrf/i;                  // never print passwords or tokens (payload)
const RESPONSE_SECRET_KEYS = /token|csrf/i;                 // the response: hide tokens only, so the error messages are shown
const MAX_LENGTH = 2000;                                     // a long text is cut after this

const ACTIONS: Record<string, string> = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };

// الـ APIs اللي اتسجلت لكل صفحة (عشان تتحط في التقرير لو التست فشل)
export type ApiCall = { status: number; text: string };
const savedCalls = new WeakMap<Page, ApiCall[]>();

// بيرجّع الـ APIs اللي اتسجلت للصفحة دي
export function apiCallsOf(page: Page): ApiCall[] {
    return savedCalls.get(page) ?? [];
}

//===================Start listening on a page===================
// بيسمع على كل API بيبعت داتا (أو رجع error) ويسجله ويطبعه
export function logApiCalls(page: Page) {
    const calls: ApiCall[] = [];
    savedCalls.set(page, calls);

    page.on('response', async response => {
        const request = response.request();
        const url = request.url();
        if (!url.includes('/api/') || SKIP_URLS.some(skip => url.includes(skip))) return;
        const isError = response.status() >= 400;
        if (request.method() === 'GET' && !isError) return;      // GET بيتسجل بس لو رجع error

        try {
            const text = await buildLog(response);
            calls.push({ status: response.status(), text });
            if (process.env.API_LOG !== 'no' && request.method() !== 'GET') console.log(text);
        } catch {
            // the page was closed before the response was read: nothing to save
        }
    });
}

//===================For the report (failed tests only)===================
// بيحدد الفشل Frontend ولا Backend، وبيحط كل الـ APIs (الـ payload والـ status والـ preview) في التقرير
// القاعدة: لو أي API رجع error (400 أو أكتر) = Backend، لو كلها نجحت = Frontend (مشكلة في الصفحة نفسها)
export async function attachFailureInfo(page: Page, testInfo: TestInfo, name: string) {
    const calls = apiCallsOf(page);
    const errors = calls.filter(call => call.status >= 400);
    const failureType = errors.length
        ? `BACKEND: the server returned an error (${errors.map(call => call.status).join(', ')})`
        : 'FRONTEND: all the API calls were OK, the problem is in the page (a text, a button or an element)';

    testInfo.annotations.push({ type: `Failure type (${name})`, description: failureType });
    await testInfo.attach(`${name}-api-calls`, {
        body: `${failureType}\n${calls.map(call => call.text).join('\n') || '\n(no API call sent data or returned an error)'}`,
        contentType: 'text/plain',
    });
}

//===================Build the text===================
// بيجهز النص المتقسم (REQUEST / STATUS / PAYLOAD / PREVIEW)
async function buildLog(response: Response) {
    const request = response.request();
    const method = request.method();
    const ok = response.ok() ? '✅' : '❌';
    const line = '─'.repeat(70);

    return [
        '',
        `┌${line}`,
        `│ API ${ACTIONS[method] ?? method}  ${ok}`,
        `├──── REQUEST ${'─'.repeat(57)}`,
        `│ METHOD : ${method}`,
        `│ URL    : ${request.url()}`,
        `├──── STATUS CODE ${'─'.repeat(53)}`,
        `│ ${response.status()} ${response.statusText()}`,
        `├──── PAYLOAD ${'─'.repeat(57)}`,
        ...addBorder(readPayload(request.postDataBuffer(), request.headers()['content-type'] ?? '')),
        `├──── PREVIEW (response) ${'─'.repeat(46)}`,
        ...addBorder(prettyText(await response.text(), RESPONSE_SECRET_KEYS)),
        `└${line}`,
    ].join('\n');
}

// the data the browser sent
// بيقرا الداتا اللي اتبعتت (والملفات بالاسم والحجم بس)
function readPayload(body: Buffer | null, contentType: string) {
    if (!body || body.length === 0) return '(empty)';
    const text = body.toString('utf8');

    // form with files: show the fields, and only the NAME + SIZE of the files
    if (contentType.includes('multipart/form-data')) {
        const boundary = contentType.split('boundary=')[1];
        const fields: Record<string, string> = {};
        for (const part of text.split(`--${boundary}`)) {
            const name = part.match(/name="([^"]+)"/)?.[1];
            if (!name) continue;
            const fileName = part.match(/filename="([^"]*)"/)?.[1];
            const value = part.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, '');
            fields[name] = fileName !== undefined ? `[file: ${fileName} (${Math.round(value.length / 1024)} KB)]` : value;
        }
        return JSON.stringify(hideSecrets(fields), null, 2);
    }

    // normal form
    if (contentType.includes('application/x-www-form-urlencoded')) {
        return JSON.stringify(hideSecrets(Object.fromEntries(new URLSearchParams(text))), null, 2);
    }

    return prettyText(text);
}

// JSON -> nice JSON (with the secrets hidden), other text -> as it is
// بيخلي الـ JSON منظم وبيقص النص الطويل
function prettyText(text: string, secretKeys = SECRET_KEYS) {
    if (!text) return '(empty)';
    let result = text;
    try {
        result = JSON.stringify(hideSecrets(JSON.parse(text), secretKeys), null, 2);
    } catch {
        // not JSON
    }
    return result.length > MAX_LENGTH ? `${result.slice(0, MAX_LENGTH)}\n... (cut, ${result.length} letters)` : result;
}

// بيخفي الباسوردات والتوكنز
function hideSecrets(data: any, secretKeys = SECRET_KEYS): any {
    if (Array.isArray(data)) return data.map(item => hideSecrets(item, secretKeys));
    if (data && typeof data === 'object') {
        return Object.fromEntries(Object.entries(data).map(([key, value]) =>
            [key, secretKeys.test(key) ? '******' : hideSecrets(value, secretKeys)]));
    }
    return data;
}

// بيحط الخط │ في أول كل سطر
function addBorder(text: string) {
    return text.split('\n').map(row => `│ ${row}`);
}
