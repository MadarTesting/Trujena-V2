import paths from './paths';

// data for admin > إدارة العملاء (requirements/AdminCustomersPage.md)
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run (من global setup)

export default {
    // عميل التست الجديد (التستات بتعدل وتمسح فيه هو بس)
    newCustomer: {
        name: `QA Customer ${runId}`,
        email: `qa.customer.${runId}@test.com`,
        storeName: `QA Store ${runId}`,
        whatsapp: `5${runId}12`,
        password: 'Aa@12345678',
        storeLink: 'https://demostore.salla.sa/',
        logo: paths.logo,
        plan: 'الخطة الأساسية - اشتراك سنوي',
    },

    // Data-Driven: التعديلات اللي بتتجرب على عميل التست (كل سطر = تست)
    edits: [
        { title: 'customer name', field: '#name-input', value: `QA Customer ${runId} edited` },
        { title: 'store name', field: '#storeName-input', value: `QA Store ${runId} edited` },
    ],
    updateToast: 'تم تحديث البيانات بنجاح',        // from the requirement

    // أعمدة جدول العملاء الفعليين (من الريكوايرمنت)
    // the site uses "باقة الاشتراك" for "خطة الاشتراك" and "حالة التطبيق" for "حالة الطلب" (same meaning)
    actualColumns: ['الرقم التسلسلي', 'الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'رقم الواتساب',
        'اسم المتجر', 'باقة الاشتراك', 'حالة الاشتراك', 'حالة التطبيق', 'الإجراءات'],

    // أعمدة جدول العملاء المحتملين (من الريكوايرمنت)
    leadsColumns: ['الرقم التسلسلي', 'الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'رقم الواتساب', 'اسم المتجر', 'حالة العميل'],

    // أزرار الإجراءات في كل صف (SEEN on stg: aria-label)
    rowButtons: ['عرض التفاصيل', 'تعديل بيانات العميل', 'حذف العميل'],

    // حالات الاشتراك (من الريكوايرمنت). the site uses "نشط" for "فعال"
    subscriptionStatuses: ['نشط', 'منتهي', 'قريب الانتهاء'],

    // Data-Driven: كل فلتر واختيار، ورقم العمود اللي المفروض يتغير
    filters: [
        { filter: 'باقة الاشتراك', option: 'الخطة الاحترافية', column: 6 },
        { filter: 'حالة الاشتراك', option: 'منتهي', column: 7 },
        { filter: 'حالة التطبيق', option: 'تم النشر', column: 8 },
    ],

    // البحث
    unknownName: 'zzzz_no_customer_qa',
    emptyMessage: 'لا توجد بيانات حاليا',      // from the requirement

    // أقسام صفحة تفاصيل العميل
    detailsSections: ['بيانات الحساب', 'بيانات المتجر', 'بيانات التهيئة', 'بيانات الاشتراك'],

    // فورم إضافة عميل: الخطوات والخانات المطلوبة
    addSteps: ['بيانات الحساب', 'بيانات المتجر', 'بيانات الاشتراك'],
    addFields: ['#name-input', '#email-input', '#storeName-input', '#phone-tel', '#whatsapp-tel', '#password-password', '#confirmPassword-password'],

    // Data-Driven: داتا غلط في فورم الإضافة (SEEN on stg) - nothing is saved
    wrongAddData: [
        { title: 'name with 1 letter', field: '#name-input', value: 'a', error: 'يجب أن يكون الاسم حرفين على الأقل' },
        { title: 'wrong email format', field: '#email-input', value: 'wrong-email', error: 'البريد الإلكتروني غير صالح' },
    ],
    passwords: { password: 'Aa@12345', confirm: 'Aa@99999', error: 'كلمتا المرور غير متطابقتين' },
};
