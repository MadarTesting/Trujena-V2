import paths from './paths';

// data for رحلة الطلب (tests/lifecycle.spec.ts)
// كل run الأدمن بيضيف عملاء QA جداد من "إدارة العملاء"، وكل عميل بيتعمله طلب "جديد" لوحده
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);     // رقم مختلف كل run (من global setup)

const customer = (prefix: string, whatsappEnd: string) => ({
    name: `QA ${prefix} ${runId}`,
    email: `qa.${prefix.toLowerCase()}.${runId}@test.com`,
    storeName: `QA ${prefix} Store ${runId}`,
    whatsapp: `5${runId}${whatsappEnd}`,
    password: 'Aa@12345678',
    storeLink: 'https://demostore.salla.sa/',
    logo: paths.logo,
    plan: 'الخطة الأساسية - اشتراك سنوي',
});

export default {
    // التاجر بتاع الرحلة كاملة (جديد -> تم النشر)
    journeyCustomer: customer('Lifecycle', '78'),
    // تاجر تاني لتست الرفض (الرفض بيقفل الطلب، فمحتاج طلب لوحده)
    rejectCustomer: customer('LcReject', '90'),
};
