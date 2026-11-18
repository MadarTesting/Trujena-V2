# أوامر التشغيل

انسخ الأمر والصقه في التيرمنال، وأنت جوه فولدر المشروع.

- `--headed` = المتصفح يظهر قدامك. لو شلته، التستات تشتغل من غير ما تشوف المتصفح.
- في آخر الـ run بيطلع **TEST REPORT** في التيرمنال: عدد الـ PASSED والـ FAILED والـ SKIPPED وأسماء التستات. وكل تست فشل بيبقى جنبه مكان الـ screenshot والفيديو بتوعه.
- بعد كده تقرير HTML بيفتح في المتصفح لوحده. **سيب التيرمنال شغال وإنت بتتفرج على التقرير**: الصور والفيديوهات بتتحمّل منه، ولو قفلته بتظهر فاضية. لما تخلص اضغط `Ctrl + C`.
- لو قفلته وعايز التقرير تاني: `npx playwright show-report`
- لو مش عايز التقرير يفتح، حط الأمر ده الأول (PowerShell): `$env:PW_TEST_HTML_REPORT_OPEN="never";`
- التيرمنال بيطبع التستات اللي فشلت بس، وتحت كل واحد الـ APIs بتاعته: الـ request والـ status code والـ payload والـ preview.
  لو عايز تشوف كل API بيبعت داتا وقت ما التستات شغالة، حط الأمر ده الأول: `$env:API_LOG="yes";`

---

## كل التستات (UI + API)
```
npx playwright test
```

## تستات الـ UI بس (المتصفح)
```
npx playwright test --project=chromium --headed
```

## تستات الـ API بس (من غير متصفح، فمفيش --headed)
```
npm run test:api
npm run test:api:auth        الدخول والخروج والملف الشخصي
npm run test:api:admin       كل endpoints الأدمن
npm run test:api:merchant    كل endpoints التاجر
```

### API: ملف واحد
```
npx playwright test api/tests/auth/Login.api.spec.ts
npx playwright test api/tests/admin/AdminActivityLogs.api.spec.ts
npx playwright test api/tests/admin/AdminAppRequests.api.spec.ts
npx playwright test api/tests/admin/AdminDashboard.api.spec.ts
npx playwright test api/tests/admin/AdminMerchants.api.spec.ts
npx playwright test api/tests/admin/AdminNotifications.api.spec.ts
npx playwright test api/tests/admin/AdminRoles.api.spec.ts
npx playwright test api/tests/admin/AdminSupport.api.spec.ts
npx playwright test api/tests/admin/AdminUsers.api.spec.ts
npx playwright test api/tests/merchant/MerchantAdvertisements.api.spec.ts
npx playwright test api/tests/merchant/MerchantAppConfig.api.spec.ts
npx playwright test api/tests/merchant/MerchantAppRequest.api.spec.ts
npx playwright test api/tests/merchant/MerchantDashboard.api.spec.ts
npx playwright test api/tests/merchant/MerchantNotifications.api.spec.ts
npx playwright test api/tests/merchant/MerchantPushNotifications.api.spec.ts
npx playwright test api/tests/merchant/MerchantSubscription.api.spec.ts
```

### API: كل ملفات الأدمن / كل ملفات التاجر
```
npx playwright test api/tests/admin
npx playwright test api/tests/merchant
```

## الدخول (login)
```
npx playwright test ui/tests/login.spec.ts --headed
```

## رحلة الطلب (lifecycle)
كل run الأدمن بيضيف **تاجر QA جديد** من إدارة العملاء (QA Lifecycle ...) وطلبه بيبدأ "جديد"، فتقدر تشغّله كل مرة.
وبيضيف تاجر تاني (QA LcReject ...) لتست الرفض. الطلبات التانية محمية، ومفيش حاجة بتتمسح.
```
npx playwright test ui/tests/lifecycle.spec.ts --headed
```

## إعدادات التصميم
```
npx playwright test ui/tests/designSettings.spec.ts --headed
```

## الإضافات والإعلانات
```
npx playwright test ui/tests/pluginsAds.spec.ts --headed
```

## إدارة الإشعارات
```
npx playwright test ui/tests/notifications.spec.ts --headed
```

## الدعم والتواصل
```
npx playwright test ui/tests/support.spec.ts --headed
```

## اشتراكي
```
npx playwright test ui/tests/subscription.spec.ts --headed
```

## الملف الشخصي
```
npx playwright test ui/tests/profile.spec.ts --headed
```

## تسجيل الخروج
```
npx playwright test ui/tests/logout.spec.ts --headed
```

## إدارة العملاء (الأدمن)
```
npx playwright test ui/tests/adminCustomers.spec.ts --headed
```

## إدارة الطلبات (الأدمن)
بيغيّر حالة طلب عميل التست بس (الطلبات التانية محمية).
```
npx playwright test ui/tests/adminOrders.spec.ts --headed
```

## إدارة الإشعارات (الأدمن)
بيبعت إشعار للتاجر بتاع التست بس (QA Customer 853019 edited) ويشوفه عنده في أيقونة الإشعارات.
```
npx playwright test ui/tests/adminNotifications.spec.ts --headed
```

## الدعم والتواصل (الأدمن)
التاجر بيبعت **رسالة دعم جديدة** كل run، والأدمن بيغيّر حالة الرسالة دي بس لـ "تم الاطلاع" (الرسايل التانية محمية).
التاجر مسموحله رسالة واحدة كل 5 دقايق: لو شغّلته تاني بسرعة، أول تست بيستنى ويحاول كل دقيقة (لحد 6 دقايق) وبعدين يكمل عادي.
```
npx playwright test ui/tests/adminSupport.spec.ts --headed
```

## إدارة المستخدمين (الأدمن)
بيعمل **مستخدم تست جديد** كل run (QA User ...) ويجرب عليه (دخول، تغيير باسورد، تعطيل) ويمسحه في الآخر. المستخدمين التانيين محميين.
```
npx playwright test ui/tests/adminUsers.spec.ts --headed
```

## الأدوار والصلاحيات (الأدمن)
بيعمل **دور تست جديد** كل run (QA Role ...) ويجرب عليه ويمسحه في الآخر. الأدوار التانية محمية ومحدش بيتغير.
```
npx playwright test ui/tests/adminRoles.spec.ts --headed
```

## سجل النشاطات (الأدمن)
عرض بس: بيقرا السجل ويجرب البحث والفلاتر، ومش بيغير أي حاجة.
```
npx playwright test ui/tests/adminActivityLog.spec.ts --headed
```

## الملف الشخصي (الأدمن)
عرض بس: بيفتح الصفحة والنوافذ ويقفلها من غير حفظ. أي طلب بيغيّر داتا بيتقفل، فالاسم والباسورد والإيميل زي ما هم.
```
npx playwright test ui/tests/adminProfile.spec.ts --headed
```

## تسجيل الخروج (الأدمن)
كل تست بيعمل دخول جديد في متصفح لوحده ويخرج منه، فالجلسة المحفوظة للتستات التانية ما بتتأثرش. مفيش داتا بتتغير.
```
npx playwright test ui/tests/adminLogout.spec.ts --headed
```

## إضافة عميل وتجربة السيناريوهات عليه (الأدمن)
⚠️ كل run بيضيف **عميل QA جديد** في الداشبورد (العملاء التانيين محميين ومحدش بيتغير).
```
npx playwright test ui/tests/adminAddCustomer.spec.ts --headed
```

---

## التستات المقفولة (محتاجة موافقة)

### تغيير باسورد التاجر فعلًا
PowerShell:
```
$env:CHANGE_PASSWORD="yes"; npx playwright test ui/tests/profile.spec.ts --headed; Remove-Item Env:CHANGE_PASSWORD
```
Git Bash:
```
CHANGE_PASSWORD=yes npx playwright test ui/tests/profile.spec.ts --headed
```

---

## أوامر تانية مفيدة

### تشغيل تست واحد بس (بجزء من اسمه)
```
npx playwright test ui/tests/profile.spec.ts --headed -g "wrong current password"
```

### تشغيل تست واحد بس (برقم السطر بتاعه في الملف)
```
npx playwright test ui/tests/logout.spec.ts:50 --headed
```

### إعادة التستات اللي فشلت في آخر run بس
```
npx playwright test --last-failed --headed
```

### عرض أسماء التستات من غير ما تشغّلها
```
npx playwright test --list
```

### التقارير
تقرير Playwright:
```
npx playwright show-report
```
تقرير Allure:
```
npm run allure:generate; npm run allure:open
```

### فتح الـ trace بتاع تست فشل
```
npx playwright show-trace test-results/<اسم فولدر التست>/trace.zip
```
