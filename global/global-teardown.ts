import fs from 'fs';

//===================Runs once after all tests===================
// بيشتغل مرة واحدة بعد كل التستات: بيمسح الجلسات المحفوظة
async function globalTeardown() {
    // delete the saved logins only
    // IMPORTANT: we NEVER delete any data from the admin side
    fs.rmSync('playwright/.auth', { recursive: true, force: true });

    console.log('Global teardown: saved sessions deleted');
}

export default globalTeardown;
