import { expect, type Locator, type Page, type Response } from '@playwright/test';
import paths from '../../../testData/paths';

// merchant > الإضافات والإعلانات
// tabs: إعلانات العروض / أيقونة واتساب / سياسة الخصوصية
// صفحة الإضافات والإعلانات عند التاجر
export class MerchantPluginsAdsPage {
    //===================Locators===================
    readonly page: Page;
    readonly main: Locator;
    readonly pluginsAds_lnk: Locator;
    readonly toast: Locator;
    // shared ("أيقونة واتساب" + "سياسة الخصوصية")
    readonly Save_btn: Locator;
    readonly enabled_switch: Locator;
    // إعلانات العروض: the list
    readonly addAd_btn: Locator;
    readonly adCards: Locator;
    readonly deleteDialog: Locator;
    readonly adImage_file: Locator;
    readonly whatsappPreviewIcon: Locator;
    // إعلانات العروض: the create page (/plugins-and-ads/offers-ads/create)
    readonly adName_tb: Locator;
    readonly adDestinationUrl_tb: Locator;
    readonly adDelaySeconds_tb: Locator;
    readonly adTitle_tb: Locator;
    readonly adDescription_tb: Locator;
    readonly adButtonEnabled_switch: Locator;
    readonly adButtonText_tb: Locator;
    readonly adButtonUrl_tb: Locator;
    readonly SaveAd_btn: Locator;
    // أيقونة واتساب
    readonly whatsappPhone_tb: Locator;
    readonly whatsappMovement_switch: Locator;
    readonly whatsappRightPadding_tb: Locator;
    readonly whatsappBottomPadding_tb: Locator;
    // سياسة الخصوصية
    readonly privacyEditor: Locator;

    //===================Variables===================
    readonly tabs = {
        ads: 'إعلانات العروض',
        whatsapp: 'أيقونة واتساب',
        privacy: 'سياسة الخصوصية',
    };

    readonly colorLabels = {
        adBackground: 'لون خلفية الإعلان',
        buttonBackground: 'لون خلفية الزر',
    };

    //===================Constructor===================
    constructor(page: Page) {
        this.page = page;
        // SEEN on stg: the phone preview has its own <main>, so we use the main of the page only
        this.main = page.locator('main[data-slot="sidebar-inset"]');
        this.pluginsAds_lnk = page.getByRole('link', { name: 'الإضافات والإعلانات' }).filter({ visible: true }).first();
        this.toast = page.locator('[data-sonner-toast]').last();

        this.Save_btn = this.main.getByRole('button', { name: 'حفظ التغييرات' });
        // SEEN on stg: the WhatsApp tab and the privacy tab BOTH have id="isEnabled-switch",
        // so we take the visible one (the tab that is open now)
        this.enabled_switch = this.main.locator('#isEnabled-switch').filter({ visible: true });

        this.addAd_btn = this.main.getByRole('button', { name: /إضافة إعلان/ });
        // SEEN on stg: every ad card has ONE "تكرار" button, so we count the ads with it
        this.adCards = this.main.getByRole('button', { name: 'تكرار' });
        this.deleteDialog = page.getByRole('alertdialog');
        this.adImage_file = this.main.locator('input[type="file"]');
        this.whatsappPreviewIcon = this.main.getByRole('button', { name: 'Drag WhatsApp icon' }).locator('img');

        this.adName_tb = this.main.locator('#name-input');
        this.adDestinationUrl_tb = this.main.locator('input[name="destinationUrl"]');
        this.adDelaySeconds_tb = this.main.locator('#delaySeconds-input');
        this.adTitle_tb = this.main.locator('#title-input');
        this.adDescription_tb = this.main.locator('#description-input');
        this.adButtonEnabled_switch = this.main.locator('#buttonEnabled-switch');
        this.adButtonText_tb = this.main.locator('#buttonText-input');
        this.adButtonUrl_tb = this.main.locator('input[name="buttonUrl"]');
        this.SaveAd_btn = this.main.getByRole('button', { name: 'حفظ الإعلان' });

        this.whatsappPhone_tb = this.main.locator('#phoneNumber-tel');
        this.whatsappMovement_switch = this.main.locator('#enableMovement-switch');
        this.whatsappRightPadding_tb = this.main.locator('#rightPadding-input');
        this.whatsappBottomPadding_tb = this.main.locator('#bottomPadding-input');

        // SEEN on stg: a rich text editor (tiptap)
        this.privacyEditor = this.main.locator('.ProseMirror[contenteditable="true"]');
    }

    //===================Methods===================
    tab(name: string): Locator {
        return this.main.getByRole('button', { name, exact: true });
    }

    text(text: string): Locator {
        return this.main.getByText(text);
    }

    toast(text: string): Locator {
        return this.page.getByText(text);
    }

    // رسالة خطأ تحت الخانة (أول واحدة)
    fieldMessage(text: string): Locator {
        return this.main.getByRole('alert').filter({ hasText: text }).first();
    }

    templateButton(name: string): Locator {
        return this.main.getByRole('button', { name });
    }

    adImage(adName: string): Locator {
        return this.adCard(adName).locator('img');
    }

    adEdit_btn(adName: string): Locator {
        return this.adCard(adName).getByRole('button', { name: 'تعديل' });
    }

    adDuplicate_btn(adName: string): Locator {
        return this.adCard(adName).getByRole('button', { name: 'تكرار' });
    }

    adCheckbox(): Locator {
        return this.main.getByRole('checkbox').first();
    }

    deleteSelected_btn(): Locator {
        return this.main.getByRole('button', { name: 'حذف المحدد' });
    }

    //-------------------Locators with a value-------------------
    // the color field = the hex text box after its label (SEEN on stg: no id / name, the label ends with "*")
    // خانة لون باسمها
    colorInput(label: string): Locator {
        return this.main.getByText(new RegExp(`^${label}\\s*\\*?$`)).first().locator('xpath=following::input[@type="text"][1]');
    }

    // the WhatsApp icon shapes are images: "شكل الأيقونة style1" / style2 / style3
    // شكل أيقونة الواتساب برقمه
    whatsappShape(styleNumber: number): Locator {
        return this.main.getByRole('button', { name: `شكل الأيقونة style${styleNumber}` });
    }

    // SEEN on stg: card = [ h3 (name) + switch ] + [ تعديل , تكرار , delete (icon, no name) ]
    // كارت الإعلان باسمه
    adCard(adName: string): Locator {
        return this.main.locator('div')
            .filter({ has: this.page.getByRole('heading', { name: adName, exact: true }) })
            .filter({ has: this.page.getByRole('button', { name: 'تكرار' }) })
            .last();
    }

    // الـ switch بتاع الإعلان
    adSwitch(adName: string): Locator {
        return this.adCard(adName).getByRole('switch');
    }

    // SEEN on stg: the delete button has NO name, it is the alert-dialog trigger of the card
    // زرار مسح الإعلان
    adDeleteButton(adName: string): Locator {
        return this.adCard(adName).locator('[data-slot="alert-dialog-trigger"]');
    }

    //-------------------Actions-------------------
    // from the dashboard: click "الإضافات والإعلانات" in the side bar
    // بيفتح صفحة الإضافات والإعلانات
    async open() {
        await this.page.goto(paths.merchantHomePath);
        await this.pluginsAds_lnk.click();
        await expect(this.page).toHaveURL(new RegExp(paths.pluginsAdsPath));
        await expect(this.addAd_btn.or(this.Save_btn)).toBeVisible({ timeout: 30000 });   // SEEN on stg: sometimes slow
    }

    // بيفتح تاب
    // SEEN on stg: تاب الواتساب وسياسة الخصوصية بيفتحوا والـ switch مقفول، وبعد ثانية الإعدادات
    // بتيجي من السيرفر وتغيّره. فبنستنى الإعدادات الأول، عشان التست ما يدوسش على الـ switch قبلها
    async openTab(tabName: string) {
        const tab = this.main.getByRole('button', { name: tabName, exact: true });
        if (tabName === this.tabs.ads) {
            await tab.click();
            return;
        }
        const settingsLoaded = this.page.waitForResponse(r => /whatsapp-settings|privacy/.test(r.url()), { timeout: 10000 })
            .catch(() => {});                                // لو كانت جت قبل كده، نكمل
        await tab.click();
        await settingsLoaded;
    }

    // بيعمل reload للصفحة
    async reload() {
        await this.page.reload();
        await expect(this.main.getByRole('button', { name: this.tabs.ads, exact: true })).toBeVisible();
    }

    // turn a switch ON (click only if it is OFF)
    // بيشغّل switch لو كان مقفول
    async switchOn(toggle: Locator) {
        if ((await toggle.getAttribute('aria-checked')) !== 'true') await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
    }

    // choose a radio option by clicking its text (like a user), then check it is selected
    // SEEN on stg: clicking the small hidden radio circle directly does not always select it
    // بيختار اختيار (radio) بالنص بتاعه
    async chooseOption(optionText: string) {
        // NOTE: the locator inside "has" is searched INSIDE the label, so it must not start from main
        await this.main.locator('label').filter({ has: this.page.getByRole('radio', { name: optionText }) }).click();
        await expect(this.main.getByRole('radio', { name: optionText })).toBeChecked();
    }

    // بيغيّر لون
    async setColor(label: string, hex: string) {
        const input = this.colorInput(label);
        await input.fill(hex);
        await input.press('Tab');
    }

    // click a save button and wait for the server to answer (a request that is not GET, and has urlPart in its url)
    // if nothing comes back in time, a field error blocked the save (or the server is slow)
    // بيدوس حفظ ويستنى رد السيرفر
    async clickAndWaitForSave(saveButton: Locator, timeout = 15000, urlPart = '/api/'): Promise<Response> {
        const saved = this.page.waitForResponse(response =>
            response.url().includes(urlPart) && response.request().method() !== 'GET', { timeout });
        await saveButton.click();
        return await saved.catch(async () => {
            const errors = await this.main.getByRole('alert').allInnerTexts();
            throw new Error(`no answer from the server in ${timeout / 1000}s. Errors on the page: ${JSON.stringify(errors)}`);
        });
    }

    // بيحفظ ويتأكد إن الحفظ نجح
    async saveAndCheck(saveButton: Locator, timeout = 15000, urlPart = '/api/') {
        const response = await this.clickAndWaitForSave(saveButton, timeout, urlPart);
        if (!response.ok()) {
            throw new Error(`save failed with status ${response.status()}: ${await response.text()}`);
        }
        return response;
    }

    //---------- إعلانات العروض ----------
    // بيفتح فورم إعلان جديد
    async startNewAd() {
        await this.openTab(this.tabs.ads);
        await this.addAd_btn.click();
        await expect(this.page).toHaveURL(new RegExp(paths.createAdPath));
        await expect(this.SaveAd_btn).toBeVisible();
    }

    // SEEN on stg: the fields depend on the template:
    // القالب1 (text) = title + description | القالب2 (image) = image | القالب الثالث (image + header) = title + image
    // بيملى بيانات الإعلان
    async fillAd(ad: {
        template: string; name: string; size: string; backgroundColor: string; destinationUrl: string;
        timing: string; delaySeconds?: string; title?: string; description?: string; image?: string;
        buttonText: string; buttonUrl: string; buttonColor: string;
    }) {
        await this.main.getByRole('button', { name: ad.template }).click();
        await this.adName_tb.fill(ad.name);
        await this.chooseOption(ad.size);
        await this.setColor(this.colorLabels.adBackground, ad.backgroundColor);
        await this.adDestinationUrl_tb.fill(ad.destinationUrl);
        await this.chooseOption(ad.timing);
        if (ad.delaySeconds) await this.adDelaySeconds_tb.fill(ad.delaySeconds);
        if (ad.title !== undefined) await this.adTitle_tb.fill(ad.title);
        if (ad.description !== undefined) await this.adDescription_tb.fill(ad.description);
        if (ad.image) await this.adImage_file.setInputFiles(ad.image);
        await this.switchOn(this.adButtonEnabled_switch);
        await this.adButtonText_tb.fill(ad.buttonText);
        await this.adButtonUrl_tb.fill(ad.buttonUrl);
        await this.setColor(this.colorLabels.buttonBackground, ad.buttonColor);
    }

    // SEEN on stg: an ad WITH an image stays on "Loading" for a long time (the image upload is slow),
    // so for image ads use a bigger timeout. We wait for the ad request itself (url has "advertisements")
    // بيحفظ الإعلان ويستنى السيرفر
    async saveAd(timeout = 15000) {
        const response = await this.saveAndCheck(this.SaveAd_btn, timeout, 'advertisements');
        // after save the website goes back to the ads list
        await expect(this.page).not.toHaveURL(/offers-ads\/(create|\d+\/edit)/);
        return response;
    }

    // create a full ad from the list page (used by the tests that need an ad to edit / duplicate / delete)
    // بيعمل إعلان جديد كامل (فتح + ملء + حفظ)
    async createAd(ad: Parameters<MerchantPluginsAdsPage['fillAd']>[0], timeout = 15000) {
        await this.open();
        await this.startNewAd();
        await this.fillAd(ad);
        await this.saveAd(timeout);
    }

    // بيفتح قايمة الإعلانات
    async openAdsList() {
        await this.open();
        await this.openTab(this.tabs.ads);
        await expect(this.addAd_btn).toBeVisible();
    }

    // SEEN on stg: "تعديل" opens /plugins-and-ads/offers-ads/<id>/edit with the saved data
    // بيفتح إعلان للتعديل
    async openAdForEdit(adName: string) {
        await this.adCard(adName).getByRole('button', { name: 'تعديل' }).click();
        await expect(this.page).toHaveURL(/offers-ads\/\d+\/edit/);
        await expect(this.adName_tb).toHaveValue(adName);
    }

    // ADJUST: what "تكرار" does is not checked yet. It can:
    // (a) send a request and add a copy to the list, or (b) open a form with the data that must be saved
    // بيكرر إعلان
    async duplicateAd(adName: string) {
        // each wait gives 'none' after 15s, so the first real result wins
        const serverAnswer = this.page.waitForResponse(r =>
            r.url().includes('advertisements') && r.request().method() !== 'GET', { timeout: 15000 })
            .then(() => 'copied', () => 'none');
        const formOpened = this.SaveAd_btn.waitFor({ state: 'visible', timeout: 15000 })
            .then(() => 'form', () => 'none');
        await this.adCard(adName).getByRole('button', { name: 'تكرار' }).click();
        const result = await Promise.race([serverAnswer, formOpened]);
        if (result === 'none') throw new Error('"تكرار" did nothing in 15s (no request and no form)');
        if (result === 'form') await this.saveAd();
    }

    // SEEN on stg: a popup "هل أنت متأكد من حذف الإعلان؟" with "حذف" / "الرجوع"
    // بيمسح إعلان (أو يدوس الرجوع)
    // بيمسح كل إعلانات التست (اسمها بيبدأ بـ "QA")، عشان خطة الاشتراك ليها حد أقصى للإعلانات
    async deleteTestAds() {
        await this.open();
        await this.openTab(this.tabs.ads);
        await expect(this.addAd_btn).toBeVisible();
        await this.page.waitForTimeout(2000);                // لحد ما قايمة الإعلانات تتحمل
        const names = await this.main.getByRole('heading').filter({ hasText: /^QA/ }).allInnerTexts();
        for (const name of new Set(names.map(n => n.trim()))) {
            while (await this.adCard(name).count()) {        // ممكن يكون فيه أكتر من إعلان بنفس الاسم (تكرار)
                await this.deleteAd(name);
            }
        }
    }

    // بيمسح كل الإعلانات (مسموح في الإضافات والإعلانات بس): عشان "لا توجد إعلانات" وحد التفعيل
    async deleteAllAds() {
        await this.openAdsList();
        await this.page.waitForTimeout(2000);                // لحد ما قايمة الإعلانات تتحمل
        const deleteButtons = this.main.locator('[data-slot="alert-dialog-trigger"]');
        for (let i = 0; i < 30 && await deleteButtons.count(); i++) {
            await deleteButtons.first().click();
            await this.saveAndCheck(this.deleteDialog.getByRole('button', { name: 'حذف' }));
            await expect(this.deleteDialog).toBeHidden();
        }
    }

    async deleteAd(adName: string, confirm = true) {
        await this.adDeleteButton(adName).click();
        await expect(this.deleteDialog).toContainText('هل أنت متأكد من حذف الإعلان؟');
        if (confirm) {
            await this.saveAndCheck(this.deleteDialog.getByRole('button', { name: 'حذف' }));
        } else {
            await this.deleteDialog.getByRole('button', { name: 'الرجوع' }).click();
        }
        await expect(this.deleteDialog).toBeHidden();
    }

    // turn the ad ON / OFF from the switch in its card, and return the server answer
    // بيشغّل أو يوقف إعلان
    async setAdActive(adName: string, active: boolean): Promise<Response | null> {
        const toggle = this.adSwitch(adName);
        if ((await toggle.getAttribute('aria-checked')) === String(active)) return null;
        return await this.clickAndWaitForSave(toggle);
    }

    //---------- أيقونة واتساب ----------
    // turn a switch OFF (click only if it is ON)
    // بيقفل switch لو كان شغال
    async switchOff(toggle: Locator) {
        if ((await toggle.getAttribute('aria-checked')) === 'true') await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
    }

    // SEEN on stg: when "تفعيل الحركة" is ON, the 2 padding fields are hidden,
    // so the paddings are filled only when the movement is OFF
    // بيملى بيانات الواتساب
    async setWhatsapp(data: { phone: string; shape: number; movement: boolean; rightPadding: string; bottomPadding: string }) {
        await this.openTab(this.tabs.whatsapp);
        await this.switchOn(this.enabled_switch);
        await this.whatsappPhone_tb.fill(data.phone);
        await this.whatsappShape(data.shape).click();
        if (data.movement) {
            await this.switchOn(this.whatsappMovement_switch);
        } else {
            await this.switchOff(this.whatsappMovement_switch);
            await this.whatsappRightPadding_tb.fill(data.rightPadding);
            await this.whatsappBottomPadding_tb.fill(data.bottomPadding);
        }
    }

    //---------- سياسة الخصوصية ----------
    // turn the policy ON and replace all the text in the editor
    // بيكتب نص سياسة الخصوصية
    async setPrivacyPolicy(text: string) {
        await this.openTab(this.tabs.privacy);
        await this.switchOn(this.enabled_switch);
        await this.privacyEditor.click();
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Delete');
        await this.privacyEditor.pressSequentially(text);
    }

    // add a new word at the end of the text, select it and click a toolbar button (Bold / Italic / Underline / H2 ...)
    // SEEN on stg: the toolbar buttons have aria-label: Bold, Italic, Underline, H1, H2, H3, P, ...
    // بيكتب كلمة بتنسيق (Bold / Italic / Underline)
    async addFormattedWord(word: string, toolbarButton: string) {
        await this.privacyEditor.click();
        await this.page.keyboard.press('Control+End');
        await this.page.keyboard.type(` ${word}`);
        for (let i = 0; i < word.length; i++) await this.page.keyboard.press('Shift+ArrowLeft');
        await this.main.getByRole('button', { name: toolbarButton, exact: true }).click();
    }

    //-------------------Assertions-------------------
    // بيتأكد إن الإعلان في القايمة
    async assertAdInList(adName: string) {
        await this.openTab(this.tabs.ads);
        await expect(this.adCard(adName)).toBeVisible();
    }

    // بيتأكد من بيانات الواتساب
    async assertWhatsapp(data: { phone: string; movement: boolean; rightPadding: string; bottomPadding: string }) {
        await this.openTab(this.tabs.whatsapp);
        await expect(this.enabled_switch).toHaveAttribute('aria-checked', 'true');
        // the website can show the number with spaces, so we compare the digits only
        await expect(this.whatsappPhone_tb).toHaveValue(new RegExp(data.phone.replace(/\D/g, '').split('').join('\\s*')));
        await expect(this.whatsappMovement_switch).toHaveAttribute('aria-checked', String(data.movement));
        if (!data.movement) {
            await expect(this.whatsappRightPadding_tb).toHaveValue(data.rightPadding);
            await expect(this.whatsappBottomPadding_tb).toHaveValue(data.bottomPadding);
        }
    }

    // SEEN on stg: the selected shape has NO aria state (only a color), so we check the preview icon:
    // style1..5 = /images/WHATSAPP_ONE..FIVE.png
    // بيتأكد من شكل أيقونة الواتساب في المعاينة
    async assertWhatsappShape(styleNumber: number) {
        const names = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
        await expect(this.whatsappPreviewIcon).toHaveAttribute('src', new RegExp(`WHATSAPP_${names[styleNumber - 1]}\\.png`));
    }

    // بيتأكد إن الـ switch شغال أو مقفول
    async assertSwitch(toggle: Locator, on: boolean) {
        await expect(toggle).toHaveAttribute('aria-checked', String(on));
    }

    // the word is shown with the format, for example toolbarTag = 'strong' for Bold, 'h2' for H2
    // بيتأكد من تنسيق الكلمة
    async assertFormattedWord(word: string, tag: string) {
        await expect(this.privacyEditor.locator(tag, { hasText: word })).toBeVisible();
    }

    // بيتأكد من نص سياسة الخصوصية
    async assertPrivacyPolicy(text: string) {
        await this.openTab(this.tabs.privacy);
        await expect(this.enabled_switch).toHaveAttribute('aria-checked', 'true');
        await expect(this.privacyEditor).toContainText(text);
    }

    // بيتأكد من رسالة (toast) بتظهر بعد العملية
    async assertMessage(text: string) {
        await expect(this.page.locator('[data-sonner-toast]').filter({ hasText: text }).first()).toBeVisible();
    }

    // بيتأكد من رسالة الخطأ
    async assertFieldError(message: string) {
        await expect(this.main.getByRole('alert').filter({ hasText: message }).first()).toBeVisible();
    }
}
