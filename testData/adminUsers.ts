// data for admin > إدارة المستخدمين (requirements/AdminUsersPage.md = UC-4)
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run (من global setup)

export default {
    // مستخدم التست (التستات بتعدل وتمسح فيه هو بس، المستخدمين التانيين محميين)
    user: {
        name: `QA User ${runId}`,
        email: `qa.user.${runId}@test.com`,
        password: 'Aa@12345678',
        role: 'test admin',
        status: 'نشط',
    },
    editedName: `QA User ${runId} edited`,
    newPassword: 'Bb@12345678',

    myName: 'Yousef test0',                        // حساب الأدمن اللي داخل (users.admin)
    myEmail: 'yousef@test.com',
    activeStatus: 'نشط',
    inactiveStatus: 'غير نشط',

    // أعمدة الجدول (من الريكوايرمنت). SEEN on stg: "دور المستخدم" و"الحالة"
    columns: ['الاسم', 'البريد الإلكتروني', 'دور المستخدم', 'الحالة', 'تاريخ الإضافة', 'الإجراءات'],
    // بيانات صفحة العرض اللي الريكوايرمنت طالبها ومش موجودة في الفورم
    viewExtras: ['تاريخ الإضافة', 'آخر تسجيل دخول', 'سجل النشاطات'],

    // Data-Driven: باسوردات ضعيفة ورسالة كل واحدة
    weakPasswords: [
        { password: 'Aa@1', message: 'يجب أن تكون 8 حرفاً على الأقل' },
        { password: 'abcdefgh', message: 'يجب أن تحتوي على رقم وحرف كبير وحرف صغير ورمز' },
        { password: 'Abcdefg1', message: 'يجب أن تحتوي على رقم وحرف كبير وحرف صغير ورمز' },
    ],
    mismatchMessage: 'يجب ان تكون كلمة المرور متطابقة',

    // Data-Driven: الفلاتر (العمود رقم كام في الجدول)
    roleFilter: { id: 'user-role-filter', column: 4, options: ['SUPER_USER', 'Eman_Role', 'test admin'] },
    statusFilter: { id: 'user-status-filter', column: 6, options: ['نشط', 'غير نشط'] },

    unknownSearch: 'zzzz-no-such-user',

    // رسايل الريكوايرمنت
    messages: {
        empty: 'لا توجد بيانات حاليا',
        loadFailed: 'تعذر تحميل قائمة المستخدمين، يرجى المحاولة لاحقا',
        duplicateEmail: 'البريد الإلكتروني مستخدم بالفعل',
        saveFailed: 'تعذر حفظ البيانات، يرجى المحاولة لاحقا',
        deactivate: 'هل أنت متأكد من تعطيل هذا المستخدم؟',
        delete: 'هل أنت متأكد من حذف هذا المستخدم؟',
        deleteMyself: 'لا يمكنك حذف حسابك الحالي',
    },
};
