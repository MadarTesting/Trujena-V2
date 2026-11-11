import paths from './paths';

// data for merchant > الإضافات والإعلانات
// a unique number for every run, so every run adds a new ad and new values
const runId = Date.now().toString().slice(-6);

export default {
    // إعلانات العروض > إضافة إعلان (the texts are the labels on the website, SEEN on stg)
    // the links (destinationUrl / buttonUrl) are added in the test from the store link of the merchant
    ad: {
        template: 'القالب1 : إعلان نصي',
        name: `QA Ad ${runId}`,
        size: 'إعلان صغير',               // or 'إعلان بحجم الصفحة'
        backgroundColor: '#1E3A5F',
        timing: 'بعد عدد ثواني',          // or 'عند فتح الصفحة'
        delaySeconds: '3',
        title: `QA عرض ${runId}`,
        description: `QA خصم خاص للاختبار ${runId}`,
        buttonText: 'تسوق الآن',
        buttonColor: '#E5E83A',
    },

    // أيقونة واتساب (the country code +966 is already selected on the website)
    // SEEN on stg: "حفظ التغييرات" stays DISABLED when nothing changed,
    // so the phone and the paddings are different in every run
    whatsapp: {
        phone: `50${runId}0`,             // 9 digits, for example 501234560
        shape: 2,                         // شكل الأيقونة style2
        movement: false,                  // تفعيل الحركة (when ON the paddings are hidden, SEEN on stg)
        rightPadding: String(10 + (Number(runId) % 40)),    // 10..49, used only when movement is OFF
        bottomPadding: String(50 + (Number(runId) % 40)),   // 50..89
    },

    // سياسة الخصوصية: the new text of the policy
    privacyPolicy: {
        text: `QA سياسة الخصوصية ${runId}: نحن نحافظ على بياناتك ولا نشاركها مع أي طرف آخر.`,
    },

    // ---------- more ads (the other templates / sizes / timings) ----------
    // القالب2: image only (no title, no description), full page, on open
    imageAd: {
        template: 'القالب2 : إعلان بصورة',
        name: `QA Image Ad ${runId}`,
        size: 'إعلان بحجم الصفحة',
        backgroundColor: '#FFFFFF',
        timing: 'عند فتح الصفحة',
        image: paths.logo,                // .png (the website accepts .png .jpg .jpeg)
        buttonText: 'اطلب الآن',
        buttonColor: '#617D66',
    },
    // القالب الثالث: image + header title
    headerAd: {
        template: 'القالب الثالث: إعلان بصورة مع ترويسة',
        name: `QA Header Ad ${runId}`,
        size: 'إعلان صغير',
        backgroundColor: '#0A2540',
        timing: 'عند فتح الصفحة',
        title: `QA ترويسة ${runId}`,
        image: paths.logo,
        buttonText: 'شاهد العرض',
        buttonColor: '#E5E83A',
    },
    // the new name after editing an ad
    editedAdName: `QA Ad Edited ${runId}`,
    // names of the ads that are created only to be duplicated / deleted / turned on
    tempAdNames: {
        duplicate: `QA Dup Ad ${runId}`,
        deleteCancel: `QA Keep Ad ${runId}`,
        delete: `QA Delete Ad ${runId}`,
        activate: `QA Active Ad ${runId}`,
        samePage1: `QA Page Ad A ${runId}`,
        samePage2: `QA Page Ad B ${runId}`,
    },

    // ---------- WhatsApp ----------
    whatsappWithMovement: {
        shape: 4,                         // شكل الأيقونة style4
    },

    // ---------- privacy policy formatting (toolbar button -> html tag) ----------
    privacyFormats: [
        { button: 'Bold', tag: 'strong', word: `QABOLD${runId}` },
        { button: 'Italic', tag: 'em', word: `QAITALIC${runId}` },
        { button: 'Underline', tag: 'u', word: `QAUNDER${runId}` },
    ],

    // negative: the required fields are empty
    errors: {
        required: 'مطلوب',               // ADJUST: part of the error text, the full text is not checked yet
    },
};
