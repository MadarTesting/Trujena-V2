// data for admin > الدعم والتواصل (requirements/AdminSupportPage.md = UC-10)
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run (من global setup)

export default {
    // رسالة الدعم اللي التاجر بيبعتها (التستات بتغيّر حالة الرسالة دي بس)
    message: {
        name: `QA Support ${runId}`,
        phone: '501234567',                         // +966 is already selected on the merchant site
        email: `qa.support.${runId}@test.com`,
        type: 'استفسار',
        message: `QA رسالة دعم للأدمن ${runId}`,
    },

    // الحالات (SEEN on stg: "جديد"، الريكوايرمنت بتقول "جديدة")
    newStatus: 'جديد',
    viewedStatus: 'تم الاطلاع',

    // أعمدة الجدول (من الريكوايرمنت). SEEN on stg: "تاريخ الارسال" من غير همزة
    columns: ['رقم الرسالة', 'اسم المستخدم', 'رقم الهاتف', 'نوع الرسالة', 'تاريخ الارسال', 'الحالة'],
    // بيانات صفحة التفاصيل (من الريكوايرمنت)
    detailsLabels: ['رقم الرسالة', 'اسم المستخدم', 'البريد الإلكتروني', 'رقم الهاتف', 'نوع الرسالة', 'محتوى الرسالة', 'تاريخ الارسال', 'الحالة'],

    // Data-Driven: الفلاتر (العمود رقم كام في الجدول)
    typeFilter: { name: 'نوع الرسالة', column: 4, options: ['استفسار', 'مشكلة'] },
    statusFilter: { name: 'الحالة', column: 6, options: ['جديد', 'تم الاطلاع'] },

    // التابين (حسب مصدر الرسالة)
    tabs: ['رسائل الدعم الفني', 'رسائل تواصل معنا'],

    unknownSearch: 'zzzz-no-such-user',
};
