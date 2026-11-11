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
        saveFailed: 'تعذر حفظ التغييرات، يرجى المحاولة لاحقا',
        duplicate: 'هذا الدور موجود بالفعل',
        noPermission: 'يجب تحديد صلاحية واحدة على الأقل',
        superAdmin: 'لا يمكن تعديل أو حذف دور Super Admin',
    },
};
