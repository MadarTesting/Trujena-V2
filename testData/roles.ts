// data for admin > الأدوار والصلاحيات (requirements/AdminRolesPage.md = UC-11)
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run (من global setup)

export default {
    // دور التست (التستات بتعدل وتمسح فيه هو بس، الأدوار التانية محمية)
    role: {
        name: `QA Role ${runId}`,
        permission: 'View Dashboard',
    },
    editedName: `QA Role ${runId} edited`,

    superAdmin: 'SUPER_USER',                       // الدور الأساسي (ممنوع تعديله أو حذفه)
    activeStatus: 'نشط',
    inactiveStatus: 'غير نشط',

    // أعمدة الجدول (من الريكوايرمنت). SEEN on stg: "الحالة" بدل "حالة الدور"
    columns: ['الرقم التسلسلي', 'اسم الدور', 'الحالة', 'الإجراءات'],

    // رسايل الريكوايرمنت
    messages: {
        // SEEN on stg: "حدث خطأ أثناء إضافة الدور" (الريكوايرمنت بتقول "تعذر حفظ التغييرات، يرجى المحاولة لاحقا")
        saveFailed: 'حدث خطأ أثناء إضافة الدور',
        duplicate: 'هذا الدور موجود بالفعل',
        // SEEN on stg: "هذا الحقل مطلوب" تحت الصلاحيات (الريكوايرمنت بتقول "يجب تحديد صلاحية واحدة على الأقل")
        noPermission: 'هذا الحقل مطلوب',
        superAdmin: 'لا يمكن تعديل أو حذف دور Super Admin',
    },
};
