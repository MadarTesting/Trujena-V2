// data for merchant > تسجيل الخروج (UC-18)
export default {
    // the text in the confirm popup
    question: 'هل أنت متأكد من تسجيل الخروج؟',

    // the page we start from before logout
    startPage: '/design-settings',

    // Data-Driven: inside pages, after logout they must open the login page
    insidePages: ['/home', '/app-management', '/design-settings', '/plugins-and-ads',
        '/notification-management', '/customer-support', '/my-subscription', '/profile'],
};
