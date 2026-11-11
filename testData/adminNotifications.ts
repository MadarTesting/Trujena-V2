// data for admin > إدارة الإشعارات (requirements/AdminNotificationsPage.md = UC-9)
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run (من global setup)

export default {
    // الإشعار اللي بيتبعت للتاجر بتاع التست بس (اسمه مش متكرر، عشان ما يوصلش لحد تاني)
    notification: {
        type: 'العملاء',
        recipient: 'QA Customer 853019 edited',
        title: `QA Notification ${runId}`,
        content: `QA: test notification ${runId}`,
    },


    // أعمدة الجدول (من الريكوايرمنت). the site uses "تاريخ الارسال" for "تاريخ ووقت الارسال"
    columns: ['عنوان الإشعار', 'محتوى الإشعار', 'نوع المستلمين', 'اسم المرسل', 'تاريخ الارسال', 'الإجراءات'],
    // أيقونات كل صف (SEEN on stg: aria-label)
    rowButtons: ['عرض الإشعار', 'إعادة إرسال', 'نسخ الإشعار', 'حذف الإشعار'],
    // Data-Driven: فلتر نوع المستلمين
    recipientTypes: ['العملاء', 'المستخدمون الإداريون'],
};
