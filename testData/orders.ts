import actions from './actions';
import paths from './paths';

// data for admin > إدارة الطلبات (requirements/AdminCustomersManagement.md = UC-6)
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run (من global setup)
const today = new Date();

export default {
    // عميل QA جديد كل run: طلبه بيمشي في كل الحالات من "جديد" لـ "تم النشر"
    journeyCustomer: {
        name: `QA Journey ${runId}`,
        email: `qa.journey.${runId}@test.com`,
        storeName: `QA Journey Store ${runId}`,
        whatsapp: `5${runId}56`,
        password: 'Aa@12345678',
        storeLink: 'https://demostore.salla.sa/',
        logo: paths.logo,
        plan: 'الخطة الأساسية - اشتراك سنوي',
    },

    // عميل QA جديد مخصوص لتست الرفض (الرفض بيقفل الطلب)
    rejectCustomer: {
        name: `QA Reject ${runId}`,
        email: `qa.reject.${runId}@test.com`,
        storeName: `QA Reject Store ${runId}`,
        whatsapp: `5${runId}34`,
        password: 'Aa@12345678',
        storeLink: 'https://demostore.salla.sa/',
        logo: paths.logo,
        plan: 'الخطة الأساسية - اشتراك سنوي',
    },
    toReviewButton: actions.toReview,

    // أعمدة الجدول (من الريكوايرمنت). the site uses "حالة التطبيق" for "حالة الطلب"
    columns: ['رقم الطلب', 'اسم العميل', 'خطة الاشتراك', 'تاريخ الطلب', 'حالة التطبيق', 'الإجراءات'],
    // زرار العرض في كل صف (التعديل والدخول للوحة التاجر موجودين في صفحة إدارة العملاء)
    rowButtons: ['عرض الطلب'],

    // Data-Driven: فلتر حالة الطلب
    filterStatuses: ['جديد', 'قيد المراجعة', 'تم النشر'],
    // كل الحالات اللي في الريكوايرمنت لازم تبقى في الفلتر
    allStatuses: ['جديد', 'قيد المراجعة', 'جاري الإعداد', 'قيد التنفيذ', 'جاهز للمراجعة', 'طلب تعديل',
        'في انتظار النشر', 'قيد النشر', 'تم النشر', 'مرفوض', 'تعذر النشر'],

    // فلتر التاريخ: النهارده (طلب عميل التست اتعمل النهارده)، وشكل التاريخ في الجدول dd-mm-yyyy
    requestDay: String(today.getDate()),
    requestDate: `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`,

    // أقسام صفحة تفاصيل الطلب (من الريكوايرمنت)
    detailsSections: ['حالة الطلب الحالية', 'تفاصيل الطلب', 'مرفقات الطلب', 'سجل التحديثات'],

    // البحث
    unknownSearch: 'zzzz_no_order_qa',
    emptyMessage: 'لا توجد طلبات حاليا',                                   // Alternative 1

    // Data-Driven: رحلة الطلب. كل سطر = تست، وبيشتغل بس لو الطلب في حالة "from"
    // do: next = زرار المرحلة اللي بعدها / config = بيانات التهيئة / upload = رفع ملف
    //     merchantEdit / merchantApprove = التاجر بيراجع / googlePlay / appStore = روابط المتاجر
    //     check... = تشيك من غير ما الحالة تتغير
    // afterEdit: true / false = الخطوة دي قبل ولا بعد طلب التعديل (عشان "قيد التنفيذ" و"جاهز للمراجعة" بييجوا مرتين)
    journey: [
        { title: '[Negative] "جديد": only the next stage button, no reject', from: 'جديد', do: 'checkOnlyNext', button: actions.toReview, to: 'جديد' },
        { title: '[Positive] "جديد" -> "قيد المراجعة"', from: 'جديد', do: 'next', button: actions.toReview, to: 'قيد المراجعة' },
        { title: '[Negative] reject without a reason can not be confirmed', from: 'قيد المراجعة', do: 'checkRejectEmpty', to: 'قيد المراجعة' },
        { title: '[Positive] "قيد المراجعة" -> accept -> "جاري الإعداد"', from: 'قيد المراجعة', do: 'next', button: actions.toPreparing, to: 'جاري الإعداد' },
        { title: '[Negative] the configuration can not be saved empty', from: 'جاري الإعداد', do: 'checkEmptyConfig', to: 'جاري الإعداد' },
        { title: '[Positive] save the configuration -> "قيد التنفيذ"', from: 'جاري الإعداد', do: 'config', to: 'قيد التنفيذ' },
        { title: '[Negative] upload a file that is not APK / AAB', from: 'قيد التنفيذ', do: 'checkBadFile', file: paths.badFile, to: 'قيد التنفيذ' },
        { title: '[Positive] upload the APK -> "جاهز للمراجعة"', from: 'قيد التنفيذ', do: 'upload', file: paths.apk, afterEdit: false, to: 'جاهز للمراجعة' },
        { title: '[Positive] the merchant asks for an edit -> "طلب تعديل"', from: 'جاهز للمراجعة', do: 'merchantEdit', afterEdit: false, to: 'طلب تعديل' },
        { title: '[Positive] "طلب تعديل" -> "قيد التنفيذ"', from: 'طلب تعديل', do: 'next', button: actions.editToInProgress, to: 'قيد التنفيذ' },
        { title: '[Positive] upload the new AAB -> "جاهز للمراجعة"', from: 'قيد التنفيذ', do: 'upload', file: paths.aab, afterEdit: true, to: 'جاهز للمراجعة' },
        { title: '[Positive] the merchant approves -> "في انتظار النشر"', from: 'جاهز للمراجعة', do: 'merchantApprove', afterEdit: true, to: 'في انتظار النشر' },
        { title: '[Positive] "في انتظار النشر" -> "قيد النشر"', from: 'في انتظار النشر', do: 'next', button: actions.toPublishing, to: 'قيد النشر' },
        { title: '[Positive] only the Google Play link: still "قيد النشر"', from: 'قيد النشر', do: 'googlePlay', to: 'قيد النشر' },
        { title: '[Positive] the App Store link too: "تم النشر"', from: 'قيد النشر', do: 'appStore', to: 'تم النشر' },
    ],
};
