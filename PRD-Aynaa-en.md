# Product Requirements Document (PRD) - "Aynaa Salsabeela" 🛡️

## 1. Overview
"Aynaa Salsabeela" is a family protection and self-accountability application that operates on an **Offline-First Local Filtering** mechanism. The app downloads blocklists from the backend and caches them locally to filter content (keywords, URLs, apps) directly on the device. It features a strict tamper-proof system that prevents uninstallation or deactivation without a formal, manually reviewed request.

## 2. Core Mechanics
- **Authentication:** No traditional login. The app generates a Unique Identifier (UID) for each device upon activation.
- **Offline-First (Local Cache):** Blocklists are stored in a local SQLite database to ensure zero-latency filtering and continuous protection without an internet connection.
- **Privacy-Centric:** The app does not log or upload user browsing activity to the server.
- **Tamper-Proofing:** Relies on Android's `Device Admin` and `Accessibility Services`. Deactivating the protection requires human review via an "Uninstall Request".

## 3. Features & User Stories

### A. Android Client (User App)
- **Activation & Permissions:** As a user, I want to activate the app so that device permissions (Accessibility & Device Admin) are locked to prevent uninstallation.
- **Local Filter Engine:** As a user, I want the app to locally block any URLs or apps containing restricted keywords to maintain a safe environment.
- **Custom Filtering (Local Rules):** - *Blacklist:* I can add custom websites to my local blacklist (applied immediately).
  - *Whitelist:* I can request to whitelist a blocked website (sent to the backend as a pending request).
- **Uninstall Request (The Escape Hatch):** As a user, I want to submit a formal uninstall request providing my (Name, Age, ID Photo, and Reason), so that the admin can review my request and issue an unlock OTP or approve the uninstallation.

### B. Admin Dashboard (Backend Management)
- **Global Lists Management:** As an admin, I want to perform CRUD operations on global blocklists (keywords, domains, apps) to update the central database.
- **Whitelist Reviews:** As an admin, I want to review pending whitelist requests to approve or reject them.
- **Uninstall Reviews:** As an admin, I want to view a table of uninstall requests (including the user's ID photo and reason) to make a calculated decision to grant or deny the unlock action.

## 4. Tech Stack
- **Mobile Client:** Android (Kotlin) + SQLite + Device Admin / Accessibility APIs.
- **Backend API:** Node.js with Express.js.
- **Database:** MongoDB (using Mongoose).
- **File Storage:** Cloudflare R2 (for secure storage of ID photos from uninstall requests).

## 5. System Architecture & Data Flow

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