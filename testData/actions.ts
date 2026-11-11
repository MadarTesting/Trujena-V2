// the texts of the admin "next stage" buttons (in the request details page)
// SEEN on stg = checked on the real website
// ADJUST      = not seen yet (no request was in that status), please check the text
export default {
    toReview: 'الانتقال إلى قيد المراجعة',                    // SEEN (status: جديد)
    toPreparing: 'الانتقال إلى الإعداد',                      // SEEN (status: قيد المراجعة)
    reject: 'رفض الطلب',                                      // SEEN (status: قيد المراجعة)
    saveConfig: 'حفظ البيانات',                               // SEEN (status: جاري الإعداد)
    // NOTE: there is NO button from "جاري الإعداد": "حفظ البيانات" moves the request to "قيد التنفيذ" (SEEN on stg)
    uploadAndReady: 'رفع الملف والانتقال إلى جاهز للمراجعة',   // SEEN (status: قيد التنفيذ)
    editToInProgress: 'إعادة التحويل إلى قيد التنفيذ',          // SEEN (status: طلب تعديل)
    toPublishing: 'بدء إجراءات النشر',                         // SEEN (status: في انتظار النشر)
};
