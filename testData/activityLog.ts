// data for admin > سجل النشاطات (requirements/AdminActivityLogPage.md = UC-12)
const today = new Date();
const day = today.getDate();
const month = today.getMonth() + 1;
const year = today.getFullYear();

export default {
    adminName: 'Yousef test0',                   // الأدمن اللي بيعمل التستات (users.admin)

    // Data-Driven: أنواع الإجراءات في الفلتر (SEEN on stg)
    actionTypes: ['عملية إضافة', 'عملية حذف', 'عملية تعديل', 'عملية تسجيل دخول', 'عملية تغيير حالة', 'إخفاء عناصر', 'تحديث إعدادات التطبيق'],

    // Data-Driven: عمليات التستات بتعملها كل run، فلازم تكون متسجلة
    // (تسجيل دخول الأدمن، وتغيير حالة رسالة الدعم / الطلب)
    mustBeLogged: ['عملية إضافة', 'عملية تسجيل دخول', 'عملية تغيير حالة'],

    // عميل التست اللي بندخله بالأدمن مود (التاجر ده بس)
    adminModeCustomer: 'QA Customer 853019 edited',

    // عملية إضافة عميل من إدارة العملاء: لازم يظهر اسم الموديول
    // (SEEN on stg: الـ API بيرجع module = "Admin Merchant Management" بس الصفحة مش بتعرضه)
    customerActivity: { text: 'تم إنشاء التاجر', module: 'إدارة العملاء' },

    // تاريخ النهارده: زي ما بيظهر في السجل (11-11-2026)، وزي ما هو في زرار التقويم
    todayText: `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
    todayButton: `${day}‏/${month}‏/${year}`,

    unknownSearch: 'zzzz-no-such-user',
};
