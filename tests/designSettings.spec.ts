import { test } from '../fixtures/fixtures';
import designData from '../testData/designSettings';

// merchant > إعدادات التصميم
// the merchant is already logged in (global setup), every test starts from the dashboard
// IMPORTANT: these tests CHANGE the design of the merchant app (nothing is deleted)
//
// SEEN on stg:
// - "حفظ التغييرات" saves ALL the tabs together, and checks ALL the required fields
//   (the 2 colors in "الألوان" and the icons in "شريط التنقل والأيقونات")
// - the save is SCHEDULED: "سيتم حفظ التغييرات خلال 5 دقائق"
//   so we change everything and save ONE time, then we wait until the new values are shown
// - links must be the store link of the merchant
test.describe.configure({ mode: 'serial' });

//===================Test Cases===================
// تستات صفحة إعدادات التصميم عند التاجر
test.describe('Merchant - design settings', { tag: '@design' }, () => {

    // بيحط لينك من برا المتجر ويتأكد إن السيرفر رفضه
    test('[Negative] a link outside the store is rejected', async ({ merchantPO, requestNumber }) => {
        const design = merchantPO.getMerchantDesignSettingsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await design.open();
        // the required fields are filled, so only the bad link can stop the save
        await design.openTab(design.tabs.colors);
        await design.setColor(design.colorLabels.background, designData.colors.backgroundColor);
        await design.setColor(design.colorLabels.icons, designData.colors.iconsColor);
        await design.openTab(design.tabs.navigation);
        await design.setIcon(0, designData.icons[0].key, designData.icons[0].name, designData.outsideStoreLink);
        await design.setIcon(1, designData.icons[1].key, designData.icons[1].name, storeLink);

        const response = await design.clickSave();
        test.expect(response.status()).toBe(400);
        await design.assertSaveFailed();
    });

    // بيغيّر كل تابات التصميم ويحفظ مرة واحدة
    test('[Positive] change all the tabs and save', async ({ merchantPO, requestNumber }) => {
        const design = merchantPO.getMerchantDesignSettingsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await design.open();

        await test.step('صفحة البداية: background color', async () => {
            await design.openTab(design.tabs.splash);
            await design.setColor(design.colorLabels.background, designData.splash.backgroundColor);
        });

        await test.step('الألوان: background + icons colors', async () => {
            await design.openTab(design.tabs.colors);
            await design.setColor(design.colorLabels.background, designData.colors.backgroundColor);
            await design.setColor(design.colorLabels.icons, designData.colors.iconsColor);
        });

        await test.step('الصفحات الترحيبية: texts of page 1', async () => {
            await design.openTab(design.tabs.welcomePages);
            await design.setWelcomeTexts(1, designData.welcomePage1.title, designData.welcomePage1.subtitle);
        });

        await test.step('شريط التنقل والأيقونات: icon + name + link', async () => {
            await design.openTab(design.tabs.navigation);
            for (const icon of designData.icons) {
                await design.setIcon(icon.picker, icon.key, icon.name, storeLink);
            }
        });

        await test.step('القائمة الجانبية: section 1 name + all the links on the store', async () => {
            await design.openTab(design.tabs.sideMenu);
            await design.setAllSideMenuLinks(storeLink);     // the default links (example2.com) are rejected
            await design.setSideMenuSection(0, designData.sideMenuSection1.name, storeLink);
        });

        await test.step('حفظ التغييرات: "تم حفظ التغييرات بنجاح"', async () => {
            await design.save();
        });
    });

    // بيعمل reload ويتأكد إن التصميم اللي اتحفظ ظاهر
    test('[Positive] the saved design is shown after reload (saved within 5 minutes)', async ({ merchantPO, requestNumber }) => {
        test.setTimeout(8 * 60 * 1000);
        const design = merchantPO.getMerchantDesignSettingsPage();
        const storeLink = await merchantPO.getMerchantAppPage().getStoreLink(requestNumber);

        await design.open();
        // reload every 30 seconds until ALL the new values are shown (max 6 minutes)
        await test.expect(async () => {
            await design.reload();
            await design.openTab(design.tabs.splash);
            await design.assertColor(design.colorLabels.background, designData.splash.backgroundColor);
            await design.openTab(design.tabs.colors);
            await design.assertColor(design.colorLabels.background, designData.colors.backgroundColor);
            await design.assertColor(design.colorLabels.icons, designData.colors.iconsColor);
            await design.openTab(design.tabs.welcomePages);
            await design.assertWelcomeTexts(1, designData.welcomePage1.title, designData.welcomePage1.subtitle);
            await design.openTab(design.tabs.navigation);
            for (const icon of designData.icons) {
                await design.assertIcon(icon.key, icon.name, storeLink);
            }
            await design.openTab(design.tabs.sideMenu);
            await design.assertSideMenuSection(0, designData.sideMenuSection1.name, storeLink);
        }).toPass({ timeout: 6 * 60 * 1000, intervals: [30 * 1000] });
    });
});
