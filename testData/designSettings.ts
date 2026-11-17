// data for merchant > إعدادات التصميم (requirements/MerchantDesignSetting.md = UC-7)
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run

// لون من رقم الـ run (عشان يبقى مختلف كل مرة)، مثلا "#3A1F9C"
function color(offset: number) {
    const value = (Number(runId) * 7919 + offset * 104729) % 0xffffff;
    return `#${value.toString(16).padStart(6, '0').toUpperCase()}`;
}

export default {
    // الأقسام اللي في الريكوايرمنت
    tabs: ['صفحة البداية', 'الصفحات الترحيبية', 'الألوان', 'شريط التنقل والأيقونات', 'القائمة الجانبية'],

    // التصميم الأول
    colors: { backgroundColor: color(1), iconsColor: color(2) },
    // آخر تصميم (بيتحفظ بعد الأول، وهو اللي لازم يظهر)
    lastColors: { backgroundColor: color(3), iconsColor: color(4) },
    // المعاينة (مش بتتحفظ)
    previewColors: { backgroundColor: '#FF0000', iconsColor: '#00FF00' },

    // الأيقونات (مطلوبة عشان الحفظ يشتغل)
    icons: [
        { picker: 0, key: 'mainFeatureIcons.icon1', name: `QA Icon ${runId}` },
        { picker: 1, key: 'secondaryFeatureIcons.salla', name: `QA Cart ${runId}` },
    ],

    // لينك من برا دومين المتجر (بيترفض)
    outsideStoreLink: 'https://example.com/qa-page',
};
