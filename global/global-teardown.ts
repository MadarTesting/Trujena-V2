import fs from 'fs';

// بيشتغل مرة واحدة بعد كل التستات: بيمسح ملفات الجلسات بس (مش بيمسح أي داتا من الموقع)
export default async function globalTeardown() {
    fs.rmSync('playwright/.auth', { recursive: true, force: true });
}
