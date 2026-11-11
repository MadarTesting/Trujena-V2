// all the page paths and file paths are here, in ONE place
export default {
    // saved sessions (created by global setup)
    merchantState: 'playwright/.auth/merchant.json',
    adminState: 'playwright/.auth/admin.json',

    // page paths (added after the base url)
    loginPath: '/auth',
    merchantHomePath: '/home',              // merchant > الصفحة الرئيسية (dashboard)
    merchantAppPath: '/app-management',     // merchant > إدارة التطبيق
    designSettingsPath: '/design-settings', // merchant > إعدادات التصميم
    pluginsAdsPath: '/plugins-and-ads',     // merchant > الإضافات والإعلانات
    createAdPath: '/plugins-and-ads/offers-ads/create',  // merchant > إضافة إعلان جديد
    notificationsPath: '/notification-management',       // merchant > إدارة الإشعارات
    supportPath: '/customer-support',                    // merchant > الدعم والتواصل
    subscriptionPath: '/my-subscription',                // merchant > اشتراكي
    profilePath: '/profile',                             // merchant > الملف الشخصي
    createNotificationPath: '/notification-management/create-notification',  // merchant > إضافة إشعار جديد
    adminRequestsPath: '/orders',           // admin > إدارة الطلبات
    adminHomePath: '/home',                 // admin > الصفحة الرئيسية
    adminCustomersPath: '/customers',       // admin > إدارة العملاء
    adminCreateCustomerPath: '/customers/create',  // admin > إضافة عميل جديد

    // files used in upload tests (they are in testData/files)
    icon: 'testData/files/icon.png',
    logo: 'testData/files/logo.png',
    apk: 'testData/files/app.apk',
    aab: 'testData/files/app.aab',
    badFile: 'testData/files/bad.txt',
};
