# وثيقة متطلبات المنتج (PRD) - تطبيق "عينا سلسبيلا" 🛡️

## 1. نظرة عامة (Overview)
"عينا سلسبيلا" هو تطبيق حماية أسرية ورقابة ذاتية يعمل بآلية (Local Filtering). التطبيق يعتمد على تحميل قوائم الحجب من الخادم وتخزينها محلياً لفلترة المحتوى مباشرة على الجهاز. يتميز التطبيق بنظام حماية صارم يمنع الحذف أو الإيقاف إلا من خلال تقديم طلب رسمي (Uninstall Request) يتم مراجعته يدوياً من قِبل الإدارة.

## 2. آلية العمل الأساسية (Core Mechanics)
- **المصادقة:** توليد معرف فريد (UID) لكل جهاز.
- **التخزين المحلي:** حفظ القوائم في قاعدة بيانات محلية (SQLite) للعمل (Offline-First).
- **الخصوصية:** عدم تسجيل نشاط المستخدم.
- **الحماية من الحذف (Tamper-Proofing):** الاعتماد على (Device Admin & Accessibility). إيقاف الحماية يتطلب مراجعة بشرية لبيانات حقيقية.

## 3. قصص المستخدمين والميزات (User Stories)

### أ. واجهة تطبيق الأندرويد (Android Client)
- **الحماية والجذور:** بصفتي (مستخدم)، أريد أن (أُفعل التطبيق)، لكي (يتم تفعيل صلاحيات النظام لمنع مسح التطبيق).
- **محرك الفلترة:** بصفتي (مستخدم)، أريد (ألا أرى أي محتوى يحتوي على كلمات مفتاحية أو تطبيقات ضارة).
- **القوائم المخصصة:** يمكنني إضافة مواقع لقائمتي السوداء فوراً، أو طلب السماح (Whitelist) لموقع وينتظر الموافقة.
- **فك الحماية (Uninstall Request):** بصفتي (مستخدم)، أريد أن (أُقدم طلب لفك الحماية وإلغاء التطبيق يتضمن: الاسم، السن، صورة إثبات شخصية/بطاقة، وسبب الإلغاء)، لكي (يتم مراجعته من الإدارة وإرسال كود فك الحماية أو الموافقة عليه).

### ب. لوحة التحكم والباك إند (Admin Dashboard)
- **إدارة القوائم العامة (Global Lists):** إضافة وتعديل قوائم الحجب العالمية.
- **مراجعة الاستثناءات (Whitelist):** قبول أو رفض طلبات السماح للمواقع.
- **مراجعة طلبات الحذف (Uninstall Reviews):** بصفتي (أدمن)، أريد أن (أرى جدولاً بطلبات فك الحماية مع بيانات المستخدم وصورته والسبب)، لكي (أتخذ قراراً بالموافقة وإصدار كود الإيقاف، أو الرفض).

## 4. الرصة التقنية (Tech Stack)
- **الموبايل:** Android (Kotlin) + SQLite + Accessibility/Device Admin.
- **الخادم (Backend):** Node.js + Express.js.
- **قاعدة البيانات (Database):** MongoDB (Mongoose).
- **تخزين الملفات (File Storage):** Cloudflare R2(لتخزين صور إثبات الشخصية لطلبات الإلغاء بأمان).

## 5. رسمة البنية التحتية (System Architecture Diagram)

```mermaid
flowchart TD
  classDef mobile fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
  classDef server fill:#FFF3E0,stroke:#EF6C00,stroke-width:2px,color:#E65100
  classDef db fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
  classDef admin fill:#FCE4EC,stroke:#C2185B,stroke-width:2px,color:#880E4F

  subgraph Android_App ["📱 Android Client (Offline-First)"]
    UID(["🔑 UID"]):::mobile
    LocalDB[("🗄️ SQLite Cache")]; class LocalDB mobile
    FilterEngine{"🛡️ Local Filter Engine"}:::mobile
    Protection["🔒 Device Admin & Accessibility"]:::mobile
    UnlockReq["🔓 Request Uninstall<br>(ID Photo, Reason)"]:::mobile
  end

  subgraph Backend_API ["☁️ Node.js Backend"]
    API_Gateway{"🌐 API Gateway"}:::server
    MergeEngine{{"🧠 Merge Engine"}}:::server
    RequestRouter["📥 Request Handler"]:::server
  end

  subgraph Admin_Dash ["👨‍💻 Admin Dashboard"]
    ManageGlobal["📝 Manage Lists"]:::admin
    ReviewRequests["👀 Review Whitelists"]:::admin
    ReviewUninstalls["⚖️ Review Uninstall Reqs"]:::admin
  end

  subgraph Data_Storage ["🗄️ Database & Storage"]
    DB_Users[("Users (UID)")]:::db
    DB_Global[("Global Rules")]:::db
    DB_Pending[("Pending Whitelists")]:::db
    DB_Uninstalls[("Uninstall Requests")]:::db
    Storage[("☁️ Image Storage<br>(Cloudflare R2)")]:::db
  end

  %% Core Sync Flow
  UID -- "1. Auth" --> API_Gateway
  API_Gateway -.-> DB_Users

  LocalDB -- "2. Sync" --> API_Gateway
  API_Gateway --> MergeEngine
  DB_Global --> MergeEngine
  DB_Users --> MergeEngine
  MergeEngine == "JSON Payload" ==> LocalDB

  LocalDB --> FilterEngine
  FilterEngine -.-> Protection

  %% Rules Flow
  FilterEngine -- "3. Custom Lists" --> RequestRouter
  RequestRouter --> DB_Pending
  ReviewRequests --> DB_Pending

  %% Uninstall Flow
  UnlockReq -- "4. Upload ID + Reason" --> RequestRouter
  RequestRouter --> Storage
  RequestRouter --> DB_Uninstalls
  ReviewUninstalls --> DB_Uninstalls
  DB_Uninstalls -- "Approve (Issue OTP/Flag)" --> DB_Users

  ManageGlobal --> DB_Global