// the status names, written ONE time here (SRS V1 + BA answers)
export default {
    // what the ADMIN sees
    admin: {
        new: 'جديد',
        review: 'قيد المراجعة',
        rejected: 'مرفوض',
        preparing: 'جاري الإعداد',
        inProgress: 'قيد التنفيذ',
        readyForReview: 'جاهز للمراجعة',
        editRequested: 'طلب تعديل',
        awaitingPublish: 'في انتظار النشر',
        publishing: 'قيد النشر',
        publishFailed: 'تعذر النشر',
        published: 'تم النشر',
    },
    // what the MERCHANT sees (some names are different from the admin)
    merchant: {
        new: 'جديد',
        review: 'قيد المراجعة',
        rejected: 'مرفوض',
        preparing: 'قيد التنفيذ',      // SEEN on stg (accepted): admin "جاري الإعداد" = merchant "قيد التنفيذ"
        inProgress: 'قيد التنفيذ',
        readyForReview: 'جاهز للمراجعة',
        editRequested: 'طلب تعديل',
        publishing: 'قيد النشر',       // also for admin "في انتظار النشر" and "تعذر النشر"
        published: 'تم النشر',
    },
};
