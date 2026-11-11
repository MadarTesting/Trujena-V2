export default {
    merchant: {
        email: process.env.MERCHANT_EMAIL ?? '',
        password: process.env.MERCHANT_PASSWORD ?? '',
    },
    admin: {
        email: process.env.ADMIN_EMAIL ?? '',
        password: process.env.ADMIN_PASSWORD ?? '',
    },
    // تاجر التست (QA Customer 853019 edited): اتعمل من تستات إدارة العملاء، والإشعارات بتتبعتله
    testMerchant: {
        email: 'qa.customer.853019@test.com',
        password: 'Aa@12345678',
    },

    // wrong login data. email = null means: use the real email of the role
    // the server rejects these (the login button is enabled and clicked)
    wrongLogin: [
        { title: 'wrong password', email: null as string | null, password: 'Wrong@12345' },
        { title: 'email not registered', email: 'nobody@test.com', password: 'Wrong@12345' },
    ],

    // the form itself blocks these: the login button stays DISABLED (SEEN on stg)
    invalidForm: [
        { title: 'empty email', email: '', password: 'Wrong@12345' },
        { title: 'empty password', email: null as string | null, password: '' },
        { title: 'wrong email format', email: 'not-an-email', password: 'Wrong@12345' },
    ],
};
