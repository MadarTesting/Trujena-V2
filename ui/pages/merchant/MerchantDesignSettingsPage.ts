import { expect, type Locator, type Page, type Response } from '@playwright/test';
import paths from '../../../testData/paths';

// merchant > إعدادات التصميم (design of the merchant app, with a live preview)
// tabs: صفحة البداية / الألوان / الصفحات الترحيبية / شريط التنقل والأيقونات / القائمة الجانبية
// صفحة إعدادات التصميم عند التاجر
export class MerchantDesignSettingsPage {
    //===================Locators===================
    readonly page: Page;
    readonly main: Locator;
    readonly designSettings_lnk: Locator;
    readonly Save_btn: Locator;
    readonly defaultDesign_btn: Locator;
    readonly splashImage_file: Locator;
    readonly toast: Locator;
    readonly previewStart_btn: Locator;

    //===================Variables===================
    readonly savedMessage: string = 'تم حفظ التغييرات بنجاح';     // SEEN on stg
    readonly failedMessage: string = 'فشل في حفظ التغييرات';      // SEEN on stg

    readonly tabs = {
        splash: 'صفحة البداية',
        colors: 'الألوان',
        welcomePages: 'الصفحات الترحيبية',
        navigation: 'شريط التنقل والأيقونات',
        sideMenu: 'القائمة الجانبية',
    };

    readonly colorLabels = {
        background: 'لون الخلفية',
        icons: 'لون الأيقونات',
    };

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg: the phone preview has its own <main>, so we use the main of the page only
        this.main = page.locator('main[data-slot="sidebar-inset"]');
        this.designSettings_lnk = page.getByRole('link', { name: 'إعدادات التصميم' }).filter({ visible: true }).first();
        this.Save_btn = this.main.getByRole('button', { name: 'حفظ التغييرات' });
        this.defaultDesign_btn = this.main.getByRole('button', { name: 'التصميم الافتراضي' });
        this.splashImage_file = this.main.locator('input[type="file"][accept*="image"]');
        // SEEN on stg: the messages after save are toasts (sonner)
        this.toast = page.locator('[data-sonner-toast]').last();
        // SEEN on stg: the "معاينة مباشرة" phone has a "بدء" button:
        // its background = "لون الخلفية" and its text = "لون الأيقونات" (it changes before save)
        this.previewStart_btn = page.getByText('بدء', { exact: true }).filter({ visible: true }).first();
    }

    //===================Methods===================
    //-------------------Locators with a value-------------------
    // the color field = the hex text box after its label (SEEN on stg: no id / name)
    // خانة لون باسمها
    colorInput(label: string): Locator {
        return this.main.getByText(label, { exact: true }).locator('xpath=following::input[@type="text"][1]');
    }

    // عنوان صفحة الترحيب
    welcomeTitle(pageNumber: number): Locator {
        return this.main.locator(`#page${pageNumber}Title-input`);
    }

    // النص الفرعي لصفحة الترحيب
    welcomeSubtitle(pageNumber: number): Locator {
        return this.main.locator(`#page${pageNumber}Subtitle-input`);
    }

    // navigation icons (tab "شريط التنقل والأيقونات"), key = the field name on the website (SEEN on stg):
    // 'mainFeatureIcons.icon1' = الأيقونة الأولى, 'secondaryFeatureIcons.salla' = السلة
    // اسم الأيقونة
    iconName(iconKey: string): Locator {
        return this.main.locator(`[id="${iconKey}.name-input"]`);
    }

    // لينك الأيقونة
    iconLink(iconKey: string): Locator {
        return this.main.locator(`[id="${iconKey}.link-input"]`);
    }

    // the "شكل الأيقونة" button that opens the icons library (0 = first icon on the page)
    // زرار اختيار الأيقونة
    iconPicker(index: number): Locator {
        return this.main.locator('label:text-is("شكل الأيقونة") + button').nth(index);
    }

    // sections start from 0 on the website (القسم 1 = index 0)
    // اسم قسم في القايمة الجانبية
    sideMenuName(index: number): Locator {
        return this.main.locator(`[id="sideMenuSections.${index}.name-input"]`);
    }

    // لينك قسم في القايمة الجانبية
    sideMenuLink(index: number): Locator {
        return this.main.locator(`[id="sideMenuSections.${index}.link-input"]`);
    }

    //-------------------Actions-------------------
    // from the dashboard: click "إعدادات التصميم" in the side bar
    // بيفتح صفحة إعدادات التصميم
    async open() {
        await this.page.goto(paths.merchantHomePath);
        await this.designSettings_lnk.click();
        await expect(this.page).toHaveURL(new RegExp(paths.designSettingsPath));
        await expect(this.Save_btn).toBeVisible();
    }

    // بيفتح تاب
    async openTab(tabName: string) {
        await this.main.getByRole('button', { name: tabName, exact: true }).click();
    }

    // بيغيّر لون
    async setColor(label: string, hex: string) {
        const input = this.colorInput(label);
        await input.fill(hex);
        await input.press('Tab');
    }

    // بيرفع صورة صفحة البداية
    async uploadSplashImage(filePath: string) {
        await this.splashImage_file.setInputFiles(filePath);
    }

    // بيكتب عنوان ونص صفحة الترحيب
    async setWelcomeTexts(pageNumber: number, title: string, subtitle: string) {
        await this.welcomeTitle(pageNumber).fill(title);
        await this.welcomeSubtitle(pageNumber).fill(subtitle);
    }

    // choose the first icon in the library, then fill its name and page link
    // بيختار أيقونة ويكتب اسمها ولينكها
    async setIcon(pickerIndex: number, iconKey: string, name: string, link: string) {
        await this.iconPicker(pickerIndex).click();
        await this.page.getByRole('dialog').getByRole('button', { name: /^أيقونة #/ }).first().click();
        await this.page.keyboard.press('Escape');
        await this.iconName(iconKey).fill(name);
        await this.iconLink(iconKey).fill(link);
    }

    // SEEN on stg: the default sections have links like https://example2.com that the server rejects,
    // so before saving, ALL the section links must be on the store domain
    // بيحط نفس اللينك لكل أقسام القايمة الجانبية
    async setAllSideMenuLinks(link: string) {
        const links = this.main.locator('[id^="sideMenuSections."][id$=".link-input"]');
        for (const input of await links.all()) {
            await input.fill(link);
        }
    }

    // بيكتب اسم ولينك قسم في القايمة الجانبية
    async setSideMenuSection(index: number, name: string, link: string) {
        await this.sideMenuName(index).fill(name);
        await this.sideMenuLink(index).fill(link);
    }

    // click "حفظ التغييرات" and wait for the server to answer (SEEN on stg: PATCH api/v2/merchant/app-config/)
    // if nothing is sent in 15s, a field error (like "اللون مطلوب") blocked the save
    // بيدوس حفظ ويستنى رد السيرفر
    async clickSave(): Promise<Response> {
        const saved = this.page.waitForResponse(response =>
            response.url().includes('/app-config') && response.request().method() !== 'GET', { timeout: 15000 });
        await this.Save_btn.click();
        return await saved.catch(async () => {
            const errors = await this.main.getByRole('alert').allInnerTexts();
            throw new Error(`"حفظ التغييرات" did not send anything to the server. Errors on the page: ${JSON.stringify(errors)}`);
        });
    }

    // save and check it is accepted.
    // SEEN on stg: the save is SCHEDULED: "سيتم حفظ التغييرات خلال 5 دقائق"
    // بيحفظ ويتأكد إن الحفظ نجح
    async save() {
        const response = await this.clickSave();
        if (!response.ok()) {
            throw new Error(`save failed with status ${response.status()}: ${await response.text()}`);
        }
        await expect(this.toast).toContainText(this.savedMessage);
        return response;
    }

    // Alternative 1: السيرفر يرجع error في الحفظ (من غير ما حاجة تتحفظ)
    async makeSaveFail() {
        await this.page.route('**/app-config/**', route =>
            route.request().method() === 'GET' ? route.continue() : route.fulfill({ status: 500, body: '{}' }));
    }

    // بيملى كل الخانات المطلوبة للحفظ (الألوان + الأيقونات + لينكات القايمة الجانبية)
    async fillRequired(colors: { backgroundColor: string; iconsColor: string },
        icons: { picker: number; key: string; name: string }[], storeLink: string) {
        await this.openTab(this.tabs.colors);
        await this.setColor(this.colorLabels.background, colors.backgroundColor);
        await this.setColor(this.colorLabels.icons, colors.iconsColor);
        await this.openTab(this.tabs.navigation);
        for (const icon of icons) {
            await this.setIcon(icon.picker, icon.key, icon.name, storeLink);
        }
        await this.openTab(this.tabs.sideMenu);
        await this.setAllSideMenuLinks(storeLink);     // the default links (example2.com) are rejected
    }

    // بيعمل reload للصفحة
    async reload() {
        await this.page.reload();
        await expect(this.Save_btn).toBeVisible();
    }

    //-------------------Assertions-------------------
    // بيتأكد إن الحفظ فشل
    async assertSaveFailed() {
        await expect(this.toast).toContainText(this.failedMessage);
    }

    // المعاينة المباشرة: زرار "بدء" بياخد لون الخلفية ولون الأيقونات
    async assertPreviewColors(backgroundHex: string, iconsHex: string) {
        // SEEN on stg: "بدء" is a <p> inside the button box: the box has the background, the text has the icons color
        await expect(this.previewStart_btn.locator('..')).toHaveCSS('background-color', hexToRgb(backgroundHex));
        await expect(this.previewStart_btn).toHaveCSS('color', hexToRgb(iconsHex));
    }

    // بيتأكد من اللون
    async assertColor(label: string, hex: string) {
        await expect(this.colorInput(label)).toHaveValue(new RegExp(`^${hex}$`, 'i'));
    }

    // بيتأكد من نصوص صفحة الترحيب
    async assertWelcomeTexts(pageNumber: number, title: string, subtitle: string) {
        await expect(this.welcomeTitle(pageNumber)).toHaveValue(title);
        await expect(this.welcomeSubtitle(pageNumber)).toHaveValue(subtitle);
    }

    // بيتأكد من الأيقونة واسمها ولينكها
    async assertIcon(iconKey: string, name: string, link: string) {
        await expect(this.iconName(iconKey)).toHaveValue(name);
        await expect(this.iconLink(iconKey)).toHaveValue(link);
    }

    // بيتأكد من قسم القايمة الجانبية
    async assertSideMenuSection(index: number, name: string, link: string) {
        await expect(this.sideMenuName(index)).toHaveValue(name);
        await expect(this.sideMenuLink(index)).toHaveValue(link);
    }
}

// "#FF0000" -> "rgb(255, 0, 0)" (زي ما المتصفح بيكتب اللون)
function hexToRgb(hex: string) {
    const value = parseInt(hex.replace('#', ''), 16);
    return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}
