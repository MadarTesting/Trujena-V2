// data for merchant > الدعم والتواصل (requirements/MerchantSupportPage.md)
// a unique number for every run, so every request is easy to find on the admin side
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-6);

export default {
    // a valid request (the merchant can change the prefilled name / phone / email)
    request: {
        name: `QA Support ${runId}`,
        phone: '501234567',               // +966 is already selected on the website
        email: `qa.support.${runId}@test.com`,
        type: 'استفسار',                  // or 'شكوى'
        message: `QA رسالة اختبار للدعم الفني ${runId}`,
    },
    // a second request in less than 5 minutes (must be rejected)
    secondRequest: {
        type: 'شكوى',
        message: `QA طلب ثاني خلال 5 دقائق ${runId}`,
    },
    invalidEmail: 'not-an-email',
};
