// data for merchant > إعدادات التصميم
// a unique number for every run, so the new values are always different from the saved ones
const runId = Date.now().toString().slice(-6);

// a color from the run number, for example "#3A1F9C" (always 6 hex digits)
function colorFromRun(offset: number): string {
    const value = (Number(runId) * 7919 + offset * 104729) % 0xffffff;
    return `#${value.toString(16).padStart(6, '0').toUpperCase()}`;
}

export default {
    splash: {
        backgroundColor: colorFromRun(1),
    },
    colors: {
        backgroundColor: colorFromRun(2),
        iconsColor: colorFromRun(3),
    },
    // tab "شريط التنقل والأيقونات" (all fields are required to save the page)
    // SEEN on stg: the link must be the store link of the merchant ("رابط المتجر"),
    // other links are rejected: "يجب أن يشير الرابط إلى نطاق رابط التطبيق"
    // so the test reads the store link and uses it as the link
    icons: [
        { picker: 0, key: 'mainFeatureIcons.icon1', name: `QA Icon ${runId}` },
        { picker: 1, key: 'secondaryFeatureIcons.salla', name: `QA Cart ${runId}` },
    ],
    welcomePage1: {
        title: `QA عنوان ${runId}`,
        subtitle: `QA عنوان فرعي ${runId}`,
    },
    sideMenuSection1: {
        name: `QA Section ${runId}`,
    },
    // negative: a link that is NOT on the store domain
    outsideStoreLink: 'https://example.com/qa-page',
};
