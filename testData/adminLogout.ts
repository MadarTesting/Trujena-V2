// data for admin > تسجيل الخروج (requirements/AdminLogoutPage.md = UC-14)
export default {
    // نص نافذة التأكيد (SEEN on stg)
    question: 'هل أنت متأكد من تسجيل الخروج؟',

    // الرسايل (من الريكوايرمنت)
    successMessage: 'تم تسجيل الخروج بنجاح',
    errorMessage: 'حدث خطأ أثناء تسجيل الخروج، يرجى المحاولة مرة أخرى',

    // الصفحة اللي بنبدأ منها (عشان نتأكد إن "الرجوع" بيرجع لنفس الصفحة)
    startPage: '/customers',

    // Data-Driven: مكانين لزرار الخروج (القايمة الجانبية / صفحة الملف الشخصي)
    places: [
        { name: 'the side bar', page: '/customers' },
        { name: 'the profile page', page: '/profile' },
    ],

    // Data-Driven: صفحات جوه لوحة التحكم، بعد الخروج لازم تفتح صفحة الدخول
    insidePages: ['/home', '/customers', '/orders', '/profile'],
};
