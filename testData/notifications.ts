import paths from './paths';

// data for merchant > إدارة الإشعارات
// a unique number for every run, so every notification is easy to find in the lists
const runId = Date.now().toString().slice(-6);

export default {
    // the link (destination) is added in the test from the store link of the merchant
    // SEEN on stg: save WITHOUT image = less than 1 second, WITH image (6 KB png) = about 50 seconds or more,
    // so the main draft has no image, and the image has its own test
    draft: {
        title: `QA مسودة ${runId}`,
        message: `QA نص إشعار للاختبار ${runId}`,
        validity: '3 أيام',
    },
    draftWithImage: {
        title: `QA مسودة بصورة ${runId}`,
        message: `QA إشعار بصورة ${runId}`,
        image: paths.icon,                 // PNG (the website accepts SVG or PNG, max 2MB)
        validity: '24 ساعة',
    },
    // the new title after editing the draft (Alternative 1)
    editedDraft: {
        title: `QA مسودة معدلة ${runId}`,
        validity: '7 أيام',
    },
    sent: {
        title: `QA إشعار مرسل ${runId}`,
        message: `QA عرض خاص للاختبار ${runId}`,
        validity: '24 ساعة',
    },
    emptyListText: 'لا توجد بيانات متاحة',       // SEEN on stg: the table row when the list is empty
    errors: {
        // SEEN on stg: an EMPTY title shows the min length message (not "required")
        titleMinLength: 'عنوان الإشعار يجب أن يكون 5 أحرف على الأقل',
    },
};
