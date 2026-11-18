# مشروع أتمتة تروجينا (Trujena Automation)

## ملخص المشروع
**تروجينا** منصة بتحوّل متجر التاجر الإلكتروني (زي سلة) لتطبيق موبايل. المشروع ده بيختبرها **أوتوماتيك** على بيئة staging، من ناحية **التاجر** ومن ناحية **الأدمن**، من المتصفح (**UI**) ومن السيرفر مباشرة (**API**).

| الموقع | الرابط |
|---|---|
| موقع التاجر (لوحة التحكم) | https://stg.trujena.com |
| موقع الأدمن | https://admin.stg.trujena.com |
| السيرفر (API) | https://server.stg.trujena.com |

**بالأرقام:** **388 تست** في **35 ملف**، مكتوبين بـ **Playwright + TypeScript**:
| النوع | التستات | الملفات | الفولدر |
|---|---|---|---|
| **UI** (متصفح) | 328 | 19 | `ui/` |
| **API** (من غير متصفح) | 60 | 16 | `api/` |

**بيغطي إيه:**
| الجزء | الموديولات |
|---|---|
| **التاجر** | الدخول، إعدادات التصميم، الإضافات والإعلانات، الإشعارات، الدعم والتواصل، اشتراكي، الملف الشخصي، تسجيل الخروج |
| **الأدمن** | إدارة العملاء، إدارة الطلبات، الإشعارات، الدعم والتواصل، سجل النشاطات، إدارة المستخدمين، الأدوار والصلاحيات، الملف الشخصي، تسجيل الخروج |
| **الاتنين مع بعض** | رحلة الطلب كاملة (lifecycle): الأدمن بيعمل تاجر جديد، وطلبه بيمشي من "جديد" لحد "تم النشر"، والتاجر بيتأكد من كل حالة |
| **API** | الـ endpoints اللي في الـ Swagger (`requirements/API.md`): الدخول، الأدمن، التاجر |

**إزاي التستات مكتوبة:**
- **من الريكوايرمنت:** كل موديول ليه ملف ريكوايرمنت في `requirements/`، والتستات مكتوبة على الـ Main flow والـ Alternatives والـ Business rules بتاعته. التست اللي بيفشل بيطلّع bug أو حاجة ناقصة في الموقع.
- **مش بيبوظ الداتا الموجودة:** التستات بتعمل داتا QA جديدة كل run (زي `QA User 123456`) وبتجرب عليها هي بس، والداتا التانية محمية (`utils/customerGuard.ts`). الاستثناء الوحيد: تستات الإعلانات بتمسح كل الإعلانات في حساب التاجر.
- **الفشل واضح:** لو تست فشل، الترمنال بيطبع السبب، والـ API اللي فشلت (الـ endpoint، والـ status، والـ payload، والـ response)، ومعاه screenshot وفيديو.
- **بيشتغل على GitHub:** من تاب Actions ← Playwright Tests ← Run workflow (`.github/workflows/playwright.yml`).

**أسرع طريقة تشغّل بيها:**
```
npm install
npm run test:api                                        تستات الـ API (أسرع حاجة)
npx playwright test ui/tests/support.spec.ts --headed   ملف UI واحد والمتصفح ظاهر
```
(قبلها اكتب الإيميلات والباسوردات في `.env`، الخطوات تحت. وكل أوامر التشغيل في `COMMANDS.md`.)

---

## 1. التجهيز أول مرة
```
npm install
copy .env.example .env        (على ويندوز)   أو   cp .env.example .env
```
بعد كده اكتب بياناتك في ملف `.env`:

| المتغير | معناه |
|---|---|
| `MERCHANT_URL` / `ADMIN_URL` | رابط موقع التاجر وموقع الأدمن |
| `MERCHANT_EMAIL` / `MERCHANT_PASSWORD` | حساب التاجر اللي التستات بتشتغل بيه |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | حساب الأدمن |

> **`.env` مش بيترفع على GitHub** (موجود في `.gitignore`). على GitHub Actions القيم دي بتتحط في **Settings ← Secrets and variables ← Actions** بنفس الأسامي.

> **ملحوظة:** تستات الـ UI بتشتغل على **Google Chrome المتسطب على الجهاز** (`channel: 'chrome'`)، لأن Windows Application Control بيمنع الـ Chromium اللي Playwright بينزّله. فمش محتاج `npx playwright install`، بس لازم Chrome يكون متسطب.

---

## 2. التشغيل

### الكل / الـ UI بس / الـ API بس
```
npm test                       كل التستات (UI + API)
npm run test:ui                تستات الـ UI بس
npm run test:headed            كل التستات والمتصفح ظاهر
npm run test:api               تستات الـ API بس
```

### الـ API
| الأمر | بيشغّل |
|---|---|
| `npm run test:api` | كل تستات الـ API |
| `npm run test:api:auth` | الدخول والخروج والملف الشخصي |
| `npm run test:api:admin` | كل endpoints الأدمن |
| `npm run test:api:merchant` | كل endpoints التاجر |

ملف API واحد:
```
npx playwright test api/tests/admin/AdminRoles.api.spec.ts
```

### الـ UI: موديول واحد
| الأمر | الموديول |
|---|---|
| `npm run test:smoke` | اللوجين الصح + الرحلة الكاملة |
| `npm run test:lifecycle` | رحلة الطلب (أدمن + تاجر) |
| `npm run test:design` | إعدادات التصميم |
| `npm run test:plugins` | الإضافات والإعلانات |
| `npm run test:notifications` | إدارة الإشعارات (التاجر) |
| `npm run test:support` | الدعم والتواصل (التاجر) |
| `npm run test:subscription` | اشتراكي |
| `npm run test:profile` | الملف الشخصي (التاجر) |
| `npm run test:logout` | تسجيل الخروج (التاجر) |
| `npm run test:customers` | إدارة العملاء |
| `npm run test:orders` | إدارة الطلبات |
| `npm run test:admin-notifications` | الإشعارات (الأدمن) |
| `npm run test:admin-support` | الدعم والتواصل (الأدمن) |
| `npm run test:activity-log` | سجل النشاطات |
| `npm run test:users` | إدارة المستخدمين |
| `npm run test:roles` | الأدوار والصلاحيات |
| `npm run test:admin-profile` | الملف الشخصي (الأدمن) |
| `npm run test:admin-logout` | تسجيل الخروج (الأدمن) |

ملف UI واحد والمتصفح ظاهر:
```
npx playwright test ui/tests/profile.spec.ts --headed
```

### التقارير
```
npm run report               تقرير Playwright (HTML)
npm run allure:generate      يعمل تقرير Allure
npm run allure:open          يفتح تقرير Allure
```
> لو شغّلت بـ `--reporter=list`، نتايج Allure **مش هتتسجل**. عشان يطلع تقرير Allure شغّل من غير `--reporter`.

---

## 3. شكل المشروع
```
trujina-automation-v2/
├── ui/                     تستات المتصفح
│   ├── pages/              الـ Page Objects (كل صفحة ليها ملف فيه الـ locators والـ methods)
│   │   ├── POManager.ts    بيجمع كل الصفحات في مكان واحد
│   │   ├── auth/           صفحة الدخول (مشتركة بين التاجر والأدمن)
│   │   ├── admin/          صفحات الأدمن
│   │   └── merchant/       صفحات التاجر
│   └── tests/              التستات (ملف لكل موديول)
├── api/                    تستات الـ API
│   ├── pages/apiFixtures.ts   login + adminApi / merchantApi / guestApi
│   └── tests/
│       ├── auth/           الدخول والخروج والملف الشخصي
│       ├── admin/          endpoints الأدمن (ملف لكل endpoint)
│       └── merchant/       endpoints التاجر (ملف لكل endpoint)
├── testData/               الداتا اللي التستات بتستخدمها (Data-Driven)
│   └── files/              الملفات اللي بتترفع في التستات (صور، APK، AAB)
├── requirements/           الريكوايرمنت بتاعة كل صفحة + API.md (ملخص الـ Swagger)
├── fixtures/fixtures.ts    متصفح للأدمن، ومتصفح للتاجر، ورقم الطلب
├── global/                 global-setup (لوجين مرة واحدة) و global-teardown
├── utils/                  حماية الداتا (customerGuard) وتسجيل الـ APIs (apiLogger)
├── reporters/              شكل التقرير في الترمنال
├── playwright.config.ts    إعدادات التشغيل (project "chromium" = UI، project "api" = API)
├── .github/workflows/      تشغيل التستات على GitHub
├── TestCases.xlsx          كل التست كيسز (العنوان + السيناريو + النتيجة المتوقعة)
└── .env                    الإيميلات والباسوردات (محلي بس)
```

### القاعدة اللي ماشيين عليها
كل موديول UI ليه **3 ملفات**:

| الملف | مكانه | مثال |
|---|---|---|
| الصفحة (locators + methods) | `ui/pages/merchant/` | `MerchantProfilePage.ts` |
| التستات | `ui/tests/` | `profile.spec.ts` |
| الداتا | `testData/` | `profile.ts` |

- ولو الموديول ليه ريكوايرمنت بتبقى في `requirements/` بنفس اسم الصفحة، زي `MerchantProfilePage.md`.
- **الـ locators في الـ pages بس**، والتستات بتنادي عليها بالاسم (`customers.name_tb`).
- تستات الـ API: ملف لكل endpoint، بنفس تسمية الـ pages (`AdminRoles.api.spec.ts`).

---

## 4. الصفحات (ui/pages)

### auth
| الملف | الشغل بتاعه |
|---|---|
| `LoginPage.ts` | فورم الدخول (نفسها للتاجر والأدمن) |

### admin
| الملف | الصفحة في الموقع |
|---|---|
| `AdminCustomersPage.ts` | إدارة العملاء (الجدول، البحث، الفلاتر، عميل التست) |
| `AdminAddCustomerPage.ts` | فورم إضافة عميل (3 خطوات) |
| `AdminRequestPage.ts` | إدارة الطلبات وتفاصيل الطلب وتغيير حالته |
| `AdminConfigPage.ts` | تهيئة التطبيق |
| `AdminPublishPage.ts` | روابط المتاجر وقت النشر |
| `AdminNotificationsPage.ts` | الإشعارات |
| `AdminSupportPage.ts` | الدعم والتواصل |
| `AdminActivityLogPage.ts` | سجل النشاطات |
| `AdminUsersPage.ts` | إدارة المستخدمين |
| `AdminRolesPage.ts` | الأدوار والصلاحيات |
| `AdminProfilePage.ts` | الملف الشخصي |
| `AdminLogoutPage.ts` | تسجيل الخروج |

### merchant
| الملف | الصفحة في الموقع |
|---|---|
| `MerchantAppPage.ts` | إدارة التطبيق (رقم الطلب، الحالة، روابط المتاجر) |
| `MerchantReviewPage.ts` | مراجعة التطبيق (طلب تعديل / تأكيد النشر) |
| `MerchantDesignSettingsPage.ts` | إعدادات التصميم |
| `MerchantPluginsAdsPage.ts` | الإضافات والإعلانات (إعلانات، واتساب، سياسة الخصوصية) |
| `MerchantNotificationsPage.ts` | إدارة الإشعارات (مسودات وإرسال) |
| `MerchantSupportPage.ts` | الدعم والتواصل |
| `MerchantSubscriptionPage.ts` | اشتراكي |
| `MerchantProfilePage.ts` | الملف الشخصي (تعديل الاسم والصورة، تغيير الباسورد) |
| `MerchantLogoutPage.ts` | تسجيل الخروج |

التستات بتوصل للصفحات عن طريق `POManager`، مثلًا:
```ts
const profile = merchantPO.getMerchantProfilePage();
```

---

## 5. التستات

### UI (ui/tests)
| الملف | عدد التستات | بيختبر إيه |
|---|---|---|
| `login.spec.ts` | 15 | دخول صح، باسورد غلط، إيميل مش متسجل، فورم ناقصة، التاجر مش بيدخل موقع الأدمن |
| `lifecycle.spec.ts` | 5 | رحلة الطلب كاملة على تاجر جديد كل run، والرفض |
| `designSettings.spec.ts` | 10 | أقسام التصميم، المعاينة، رفض لينك من برا المتجر، آخر تصميم محفوظ |
| `pluginsAds.spec.ts` | 35 | الإعلانات (إضافة/تعديل/تكرار/حذف/تفعيل)، الواتساب، سياسة الخصوصية |
| `notifications.spec.ts` | 10 | المسودات، المعاينة، الإرسال، قاعدة "إشعار كل 4 ساعات" |
| `support.spec.ts` | 7 | فورم الدعم، الأخطاء، الإرسال، قاعدة "رسالة كل 5 دقايق" |
| `subscription.spec.ts` | 5 | بيانات الاشتراك، الحالة، الأيام المتبقية، مفيش زرار تجديد |
| `profile.spec.ts` | 21 | الشريط العلوي، تعديل الاسم والصورة، تغيير الباسورد، الخروج |
| `logout.spec.ts` | 8 | نافذة التأكيد، الرجوع، تأكيد، مفيش دخول لأي صفحة بعد الخروج |
| `adminCustomers.spec.ts` | 34 | جدول العملاء، البحث، الفلاتر، العرض والتعديل والحذف (من غير تغيير)، فورم الإضافة |
| `adminAddCustomer.spec.ts` | 8 | إضافة عميل QA والتعديل عليه وحذفه |
| `adminOrders.spec.ts` | 35 | رحلة الطلب عند الأدمن، الجدول، البحث، الفلاتر، الرفض |
| `adminNotifications.spec.ts` | 22 | إرسال إشعار، العرض والنسخ وإعادة الإرسال والحذف، الجدول والفلاتر |
| `adminSupport.spec.ts` | 22 | رسالة من التاجر، التفاصيل، تغيير الحالة، الجدول والفلاتر |
| `adminActivityLog.spec.ts` | 19 | السجل، البحث، الفلاتر، العمليات اتسجلت |
| `adminUsers.spec.ts` | 33 | مستخدم QA (إضافة، دخول، تعديل، تعطيل، حذف)، الجدول والفلاتر |
| `adminRoles.spec.ts` | 15 | دور QA (إضافة، تكرار، تعديل، حذف)، السوبر أدمن |
| `adminProfile.spec.ts` | 14 | الشريط العلوي، صفحة الملف الشخصي، النوافذ (من غير تغيير) |
| `adminLogout.spec.ts` | 10 | نافذة التأكيد، الإلغاء، الخروج، مفيش دخول بعد الخروج |

### API (api/tests)
| الملف | عدد التستات | بيختبر إيه |
|---|---|---|
| `auth/Login.api.spec.ts` | 6 | دخول الأدمن والتاجر، إيميل غلط، الملف الشخصي، من غير توكن، الخروج |
| `admin/AdminActivityLogs.api.spec.ts` | 5 | السجل، الفلتر، أنواع العمليات، 401، 403 |
| `admin/AdminAppRequests.api.spec.ts` | 5 | الطلبات، الفلتر، الحالات، طلب مش موجود (404) |
| `admin/AdminDashboard.api.spec.ts` | 4 | الإحصائيات، أحدث العملاء، الطلبات، الإيرادات |
| `admin/AdminMerchants.api.spec.ts` | 4 | العملاء الفعليين والمحتملين، الفلتر، عميل مش موجود (404) |
| `admin/AdminNotifications.api.spec.ts` | 4 | الإشعارات، المستلمين، إشعار مش موجود (404) |
| `admin/AdminRoles.api.spec.ts` | 4 | الأدوار، الصلاحيات، دور QA (إضافة، تكرار 409، تعديل، حذف) |
| `admin/AdminSupport.api.spec.ts` | 4 | رسائل الدعم وتواصل معنا، الفلتر، رسالة مش موجودة (404) |
| `admin/AdminUsers.api.spec.ts` | 4 | المستخدمين، الفلتر، مستخدم مش موجود (404)، توكن التاجر (403) |
| `merchant/Merchant*.api.spec.ts` | 20 | طلب التطبيق، إعدادات التطبيق، الإعلانات، إشعارات التطبيق، الاشتراك، لوحة التحكم، الجرس |

> تستات الـ API بتقرا بس (GET)، والطلبات اللي بتغيّر بتتبعت على id مش موجود (404) أو على دور QA بيتعمل ويتمسح في نفس التست.

### أسماء التستات
- `[Positive]`: السيناريو الصح.
- `[Negative]`: داتا غلط، أو زرار رجوع، أو business rule المفروض يمنع حاجة.
- `[Alternative]`: الـ alternative flow اللي في الريكوايرمنت.

### التستات اللي متقفلة
| الحالة | معناها |
|---|---|
| `test.fixme` | مش هينفع يتعمل دلوقتي (محتاج طلب تاني، أو الريكوايرمنت مش محددة) |
| `CHANGE_PASSWORD=yes` | تست **بيغيّر باسورد التاجر فعلًا**، مش بيشتغل غير لو طلبته |

مثال (في Git Bash):
```
CHANGE_PASSWORD=yes npx playwright test ui/tests/profile.spec.ts --headed
```

> تستات إرسال الإشعار عند التاجر بتبعت إشعار حقيقي، والموقع بيسمح بإشعار واحد كل 4 ساعات.

---

## 6. الأفكار المستخدمة بلغة بسيطة
| الاسم | يعني إيه | فين في المشروع |
|---|---|---|
| **POM** | كل صفحة ليها ملف فيه أزرارها والحاجات اللي بتتعمل فيها | `ui/pages/` |
| **POManager** | مكان واحد بيرجّعلك أي صفحة | `ui/pages/POManager.ts` |
| **Data-Driven** | الداتا في ملفات لوحدها، والتست بيلف عليها (لو عايز حالة جديدة تزودها في الداتا بس) | `testData/` |
| **Fixtures (UI)** | `merchantPO` متصفح التاجر، `adminPO` متصفح الأدمن، `requestNumber` رقم الطلب | `fixtures/fixtures.ts` |
| **Fixtures (API)** | `adminApi` بتوكن الأدمن، `merchantApi` بتوكن التاجر، `guestApi` من غير توكن | `api/pages/apiFixtures.ts` |
| **Global Setup** | بيعمل لوجين مرة واحدة قبل كل التستات ويحفظ الجلسة | `global/global-setup.ts` |
| **Global Teardown** | بيمسح ملفات الجلسات المحفوظة بس (**مفيش داتا بتتمسح من السيستم**) | `global/global-teardown.ts` |
| **SEEN** | كلمة جنب الـ locator أو الداتا، معناها إنها اتشافت على الموقع الحقيقي | في الكود |

---

## 7. حاجات مهمة لازم تعرفها
- **التستات بتشتغل واحد ورا واحد** (`workers: 1`)، لأن كلها بتستخدم نفس حساب التاجر.
- **مفيش retry** (`retries: 0`)، لأن الإعادة ممكن تحاول تغيّر حالة اتغيرت خلاص.
- **رحلة الطلب (lifecycle):** كل run بيعمل تاجر QA جديد من الأدمن، فينفع تشغّلها كذا مرة.
- **إضافة عميل على staging بطيئة** (ممكن دقيقتين)، عشان كده التست بيستنى رد السيرفر لحد 150 ثانية.
- **الإعلانات والإشعارات:** التستات بتعمل داتا جديدة باسم فيه رقم مختلف كل مرة (`runId`)، وبتمسح الحاجات المؤقتة اللي عملتها.
- **الملف الشخصي:** تست تغيير الاسم بيرجّع الاسم القديم في الآخر، والباسورد **مش بيتغير** غير لو شغّلت بـ `CHANGE_PASSWORD=yes`.
- **تسجيل الخروج:** كل تست خروج بيعمل دخول في متصفح جديد، عشان ما يقفلش الجلسة اللي التستات التانية شغالة بيها.
- **رفع الصور على staging بطيء** (أحيانًا أكتر من دقيقة)، عشان كده تستات الصور ليها timeout أطول.
- **لو التست فشل** هتلاقي screenshot وفيديو و trace في `test-results/`. عشان تفتح الـ trace:
  ```
  npx playwright show-trace test-results/<اسم التست>/trace.zip
  ```
