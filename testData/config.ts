import paths from './paths';

// a unique number for every run, so the data is easy to find later
const runId = Date.now().toString().slice(-6);

export type AppConfig = {
    appName: string;
    packageName: string;
    bundleId: string;
    appIcon: string;
    merchantEmail: string;
    oneSignalEmail: string;
    oneSignalPassword: string;
    oneSignalAppId: string;
    oneSignalApiKey: string;
    privacyPolicy: string;
};

// BA answer: there are no rules for this data, so any demo data is OK
const valid: AppConfig = {
    appName: `Trujina QA ${runId}`,
    packageName: `com.trujina.qa${runId}`,
    bundleId: `com.trujina.qa${runId}`,
    appIcon: paths.icon,
    merchantEmail: `qa${runId}@test.com`,
    oneSignalEmail: 'onesignal.qa@test.com',
    oneSignalPassword: 'OneSignal@123',
    oneSignalAppId: '00000000-0000-4000-8000-000000000001',
    oneSignalApiKey: 'qa-onesignal-api-key',
    privacyPolicy: 'https://example.com/privacy',
};

export default { valid };
