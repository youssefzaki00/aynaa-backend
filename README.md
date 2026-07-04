# aynaa Backend API

Production-ready REST API for **aynaa** - Parental Control & Content Filtering Android App.

## 🚀 Features

- ✅ Device synchronization with keyword and whitelist management
- ✅ Uninstall request handling with image proof (Cloudflare R2)
- ✅ Community suggestion system
- ✅ Admin panel endpoints for reviewing requests
- ✅ Two-tier rate limiting (Global: 100/15min, Strict: 3/hour)
- ✅ API key authentication (Client + Admin)
- ✅ Automatic R2 storage cleanup after request review
- ✅ Comprehensive error handling

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Storage:** Cloudflare R2 (@aws-sdk/client-s3)
- **Security:** Helmet, CORS, express-rate-limit
- **File Upload:** Multer (memory storage)
- **Documentation:** Swagger/OpenAPI 3.0 (swagger-ui-express, swagger-jsdoc)

## 📁 Project Structure

```
aynaa-backend/
├── config/              # Database and R2 configuration
├── middleware/          # Auth, upload, rate limiting, error handling
├── models/              # Mongoose schemas
├── routes/              # API routes
├── controllers/         # Business logic
├── utils/               # Helper functions
├── .env.example         # Environment variables template
├── server.js            # Express server
└── scripts/             # Utility scripts (e.g., seeding)
```

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd aynaa-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Server
PORT=5000
NODE_ENV=development

# Clustering (optional) — the app uses Node's built-in `cluster` module to
# fork one worker per CPU core. Defaults to enabled. Set to "false" to run
# as a single process (e.g. if you manage multi-core scaling with PM2's
# own cluster mode instead — see the Deployment section below).
ENABLE_CLUSTER=true

# MongoDB
MONGODB_URI=your-mongodb-connection-string
# MONGO_MAX_POOL_SIZE / MONGO_MIN_POOL_SIZE are the TOTAL connection budget
# for the whole server. When clustering is enabled, each worker automatically
# divides these by the number of CPU cores so the total stays roughly the same.
# MONGO_MAX_POOL_SIZE=200
# MONGO_MIN_POOL_SIZE=10

# API Keys
API_SECRET_KEY=your-client-api-key
ADMIN_API_KEY=your-admin-api-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=aynaa-uploads
R2_PUBLIC_URL=https://your-r2-public-url.com
```

### 4. Seed the database (Optional)

```bash
npm run seed
```

This will populate the database with:
- 5 default categories (PORN, GAMBLING, ATHEISM, VIOLENCE, OTHER)

### 5. Start the server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## � API Documentation

The API is fully documented using Swagger/OpenAPI 3.0 specification.

### Access API Documentation

Once the server is running, visit:
- **Development:** `http://localhost:5000/api-docs`
- **Production:** `https://your-domain.com/api-docs`

The interactive Swagger UI allows you to:
- View all available endpoints
- Test API calls directly from the browser
- See request/response schemas
- Authenticate with API keys and JWT tokens

### Documented Modules

The following route modules are fully documented:
- **Authentication** (`/auth/*`) - User registration, login, and profile
- **Keywords** (`/keywords/*`) - Keyword management (Admin only)
- **Sites** (`/sites/*`) - Site blocking management

## �📡 API Endpoints

### 🔓 Public Routes

#### Health Check
```
GET /api/v1/health
```

### 🔐 Client Routes (Requires `x-api-key` header)

#### Sync Device
```
POST /api/v1/sync
Content-Type: application/json
x-api-key: your-api-key

Body:
{
  "deviceId": "unique-device-id",
  "metadata": {
    "model": "Samsung Galaxy",
    "androidVersion": "13"
  },
  "fcmToken": "firebase-token"
}
```

#### Submit Uninstall Request (Rate Limited: 3/hour)
```
POST /api/v1/uninstall/request
Content-Type: multipart/form-data
x-api-key: your-api-key

Body:
- deviceId: string
- reason: string
- images: [file1.jpg, file2.png] (max 5, 5MB each)
```

#### Check Uninstall Status
```
GET /api/v1/uninstall/status?deviceId=xxx
x-api-key: your-api-key
```

#### Submit Suggestion (Rate Limited: 3/hour)
```
POST /api/v1/suggestions
Content-Type: application/json
x-api-key: your-api-key

Body:
{
  "deviceId": "unique-device-id",
  "type": "BLOCK_WORD", // or UNBLOCK_WORD, WHITELIST_APP
  "content": "badword",
  "note": "Optional note"
}
```

### 🛡️ Admin Routes (Requires `x-admin-key` header)

#### Get All Uninstall Requests
```
GET /api/v1/uninstall/admin/requests?status=PENDING&page=1&limit=20
x-admin-key: your-admin-key
```

#### Review Uninstall Request
```
PATCH /api/v1/uninstall/admin/review/:id
Content-Type: application/json
x-admin-key: your-admin-key

Body:
{
  "status": "APPROVED", // or REJECTED
  "adminNote": "Optional note"
}
```

#### Get All Suggestions
```
GET /api/v1/suggestions/admin?status=PENDING&type=BLOCK_WORD&page=1&limit=20
x-admin-key: your-admin-key
```

#### Review Suggestion
```
PATCH /api/v1/suggestions/admin/review/:id
Content-Type: application/json
x-admin-key: your-admin-key

Body:
{
  "status": "APPROVED" // or REJECTED
}
```

### ⚙️ Customization Routes

#### Submit Device Customization Request
```
POST /api/v1/customization/request
Content-Type: application/json
x-api-key: your-api-key

Body:
{
  "deviceId": "unique-device-id",
  "type": "CUSTOM_BLOCK_KEYWORD", // CUSTOM_ALLOW_KEYWORD, CUSTOM_WHITELIST_APP, CUSTOM_BLACKLIST_APP
  "content": "keyword_or_package_name",
  "reason": "Reason for request", 
  "appName": "Optional App Name"
}
```

#### Check Customization Status
```
GET /api/v1/customization/status?deviceId=xxx
x-api-key: your-api-key
```

#### Admin: List Customization Requests
```
GET /api/v1/admin/customization/requests?status=PENDING
x-admin-key: your-admin-key
```

#### Admin: Review Customization Request
*Approving a request automatically updates the device's configuration.*
```
PATCH /api/v1/admin/customization/review/:id
Content-Type: application/json
x-admin-key: your-admin-key

Body:
{
  "status": "APPROVED",
  "adminNote": "Approved and applied."
}
```

## 🔒 Security Features

- **Helmet:** Security headers
- **CORS:** Cross-origin resource sharing
- **Rate Limiting:**
  - Global: 100 requests per 15 minutes
  - Strict: 3 requests per hour (uninstall/suggestions)
- **API Key Authentication:** Separate keys for clients and admins
- **Input Validation:** Mongoose schema validation
- **File Upload Limits:** Max 5MB per image, max 5 images

## 💾 Storage Optimization

- Images are uploaded to Cloudflare R2 during uninstall request submission
- **Automatic cleanup:** Images are deleted from R2 when the request is approved/rejected
- Only R2 public URLs are stored in the database

## 🗃️ Database Models

### Device
- `deviceId` (String, unique, indexed)
- `fcmToken` (String)
- `metadata` (Object)
- `lastSeen` (Date)
- `isBanned` (Boolean)

### Keyword
- `word` (String, unique)
- `category` (Enum: PORN, GAMBLING, ATHEISM, VIOLENCE, OTHER)
- `isEnabled` (Boolean)

### GlobalWhitelist
- `packageName` (String, unique)
- `appName` (String)

### UninstallRequest
- `deviceId` (Ref: Device)
- `status` (Enum: PENDING, APPROVED, REJECTED)
- `reason` (String)
- `imageUrls` (Array of Strings)
- `adminNote` (String)
- `unlockCode` (String, generated on approval)
- `reviewedAt` (Date)

### Suggestion
- `deviceId` (Ref: Device)
- `type` (Enum: BLOCK_WORD, UNBLOCK_WORD, WHITELIST_APP)
- `content` (String)
- `note` (String)
- `status` (Enum: PENDING, APPROVED, REJECTED)

### CustomizationRequest
- `deviceId` (String, Ref: Device)
- `type` (Enum: CUSTOM_BLOCK_KEYWORD, CUSTOM_ALLOW_KEYWORD, CUSTOM_WHITELIST_APP, CUSTOM_BLACKLIST_APP)
- `content` (String)
- `reason` (String)
- `status` (Enum: PENDING, APPROVED, REJECTED)
- `adminNote` (String)
- `reviewedAt` (Date)

## 🧪 Testing

Use tools like **Postman** or **Thunder Client** to test the API endpoints.

**Sample Headers:**
```
x-api-key: your-api-key
x-admin-key: your-admin-key
Content-Type: application/json
```

## 🚢 Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like **PM2**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name aynaa-api
   pm2 save
   ```
3. Set up a reverse proxy (Nginx/Apache)
4. Enable HTTPS

### ⚡ Multi-core Scaling (Clustering)

The app forks one worker process per CPU core automatically via Node's built-in
`cluster` module, so it uses all available cores on the machine out of the box —
no extra setup needed.

**Important:** don't combine this with PM2's own cluster mode, or you'll end up
multiplying workers on top of workers (e.g. 4 cores × PM2 `-i max` = 16
processes, each opening its own MongoDB pool). Pick one of the following:

- **Recommended:** keep PM2 in fork mode (as shown above, `pm2 start server.js`)
  and let the app's built-in cluster module handle multi-core usage.
- **Alternative:** if you'd rather have PM2 manage the workers, set
  `ENABLE_CLUSTER=false` in your environment and use PM2 cluster mode instead
  (`pm2 start server.js -i max`).

## 📝 License

ISC

## 👨‍💻 Author

Built for aynaa - Parental Control & Content Filtering App

---

**Need help?** Check the logs or contact the development team.
