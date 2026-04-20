# aynaa Admin Dashboard - API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

### Admin Access
1. **Login** to get a JWT token: `POST /api/v1/auth/login`
2. **Include Token** in the header for all admin requests:
```http
Authorization: Bearer <your-jwt-token>
```

```

---

## � Getting Started

### Creating Your First Admin User

Before you can use the API, you need to create an admin user. **There is no public registration endpoint** for security reasons.

**Run this command in your terminal:**
```bash
npm run create-admin <username> <password>
```

**Example:**
```bash
npm run create-admin admin MySecurePassword123
```

**Important Notes:**
- Username will be automatically converted to lowercase
- Password must be at least 8 characters
- The script will hash your password securely using bcrypt
- You can create multiple admin users with different usernames

### Your First Login

After creating an admin user, test the login:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"MySecurePassword123"}'
```

You'll receive a response with your JWT token:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "admin": {
      "id": "...",
      "username": "admin",
      "role": "superadmin"
    }
  }
}
```

Save this token - you'll need it for all admin requests!

---

## �🔐 Auth Endpoints

### 1. Admin Login
```http
POST /auth/login
```

**Description:** Authenticate an admin user and receive a JWT token for subsequent requests.

**Request Body:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "65ae1234567890abcdef1234",
      "username": "admin",
      "role": "superadmin"
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Missing credentials:
```json
{
  "success": false,
  "message": "Please provide username and password"
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Notes:**
- Username is case-insensitive (automatically converted to lowercase)
- Token expires in 30 days
- Store the token securely and include it in all subsequent admin requests

---

### 2. Get Current Admin Profile
```http
GET /auth/me
```

**Description:** Retrieve the currently authenticated admin's profile information.

**Headers:**
```http
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin profile retrieved",
  "data": {
    "admin": {
      "id": "65ae1234567890abcdef1234",
      "username": "admin",
      "role": "superadmin",
      "lastLogin": "2024-02-15T21:30:00.000Z"
    }
  }
}
```

**Error Responses:**

**401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

## 📊 Categories Management

> **⚠️ Authentication Required:** All endpoints in this section require a valid JWT token in the `Authorization: Bearer <token>` header.

### 1. Get All Categories
```http
GET /admin/categories?page=1&limit=20&isActive=true
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page
- `isActive` (optional) - Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "id": "uuid-here",
        "name": "PORN",
        "displayName": "Pornography",
        "description": "Adult and pornographic content",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 2. Get Single Category
```http
GET /admin/categories/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "category": {
      "id": "uuid-here",
      "name": "PORN",
      "displayName": "Pornography",
      "description": "Adult content",
      "isActive": true,
      "keywordCount": 150,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 3. Create Category
```http
POST /admin/categories
```

**Request Body:**
```json
{
  "name": "DRUGS",
  "displayName": "Drugs & Narcotics",
  "description": "Drug-related content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category": {
      "id": "new-uuid",
      "name": "DRUGS",
      "displayName": "Drugs & Narcotics",
      "description": "Drug-related content",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 4. Update Category
```http
PATCH /admin/categories/:id
```

**Request Body:**
```json
{
  "displayName": "Updated Display Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "category": {
      "id": "uuid-here",
      "name": "PORN",
      "displayName": "Updated Display Name",
      "description": "Updated description",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### 5. Toggle Category Status
```http
PATCH /admin/categories/:id/toggle
```

**Response:**
```json
{
  "success": true,
  "message": "Category toggled successfully",
  "data": {
    "category": {
      "id": "uuid-here",
      "name": "PORN",
      "displayName": "Pornography",
      "description": "Adult content",
      "isActive": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### 6. Delete Category
```http
DELETE /admin/categories/:id
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "deletedCategory": {
      "id": "uuid-here",
      "name": "CUSTOM",
      "displayName": "Custom Category"
    }
  }
}
```

**Response (Error - has keywords):**
```json
{
  "success": false,
  "message": "Cannot delete category. 25 keyword(s) are using this category. Please reassign or delete those keywords first."
}
```

---

## 🔑 Keywords Management

> **⚠️ Authentication Required:** All endpoints in this section require a valid JWT token in the `Authorization: Bearer <token>` header.

### 1. Get All Keywords
```http
GET /admin/keywords?page=1&limit=50&categoryId=uuid-here&isEnabled=true
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50, max: 100)
- `categoryId` (optional) - Filter by category
- `isEnabled` (optional) - Filter by enabled status

**Response:**
```json
{
  "success": true,
  "message": "Keywords retrieved successfully",
  "data": {
    "keywords": [
      {
        "id": "keyword-uuid",
        "word": "porn",
        "category": {
          "id": "category-uuid",
          "name": "PORN",
          "displayName": "Pornography"
        },
        "isEnabled": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Create Keyword
```http
POST /admin/keywords
```

**Request Body:**
```json
{
  "word": "badword",
  "categoryId": "category-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Keyword created successfully",
  "data": {
    "keyword": {
      "id": "new-keyword-uuid",
      "word": "badword",
      "category": {
        "id": "category-uuid",
        "name": "PORN",
        "displayName": "Pornography"
      },
      "isEnabled": true
    }
  }
}
```

### 3. Update Keyword
```http
PATCH /admin/keywords/:id
```

**Request Body:**
```json
{
  "word": "updatedword",
  "categoryId": "new-category-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Keyword updated successfully",
  "data": {
    "keyword": {
      "id": "keyword-uuid",
      "word": "updatedword",
      "category": {
        "id": "category-uuid",
        "name": "VIOLENCE",
        "displayName": "Violence"
      },
      "isEnabled": true
    }
  }
}
```

### 4. Toggle Keyword Status
```http
PATCH /admin/keywords/:id/toggle
```

**Response:**
```json
{
  "success": true,
  "message": "Keyword toggled successfully",
  "data": {
    "keyword": {
      "id": "keyword-uuid",
      "word": "porn",
      "category": {
        "id": "category-uuid",
        "name": "PORN",
        "displayName": "Pornography"
      },
      "isEnabled": false
    }
  }
}
```

### 5. Delete Keyword
```http
DELETE /admin/keywords/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Keyword deleted successfully",
  "data": {
    "deletedKeyword": {
      "id": "keyword-uuid",
      "word": "porn"
    }
  }
}
```

---

## 📱 Whitelist Management

> **⚠️ Authentication Required:** All endpoints in this section require a valid JWT token in the `Authorization: Bearer <token>` header.

### 1. Get All Whitelist Apps
```http
GET /admin/whitelist?page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "message": "Whitelist retrieved successfully",
  "data": {
    "whitelist": [
      {
        "id": "whitelist-uuid",
        "packageName": "com.whatsapp",
        "appName": "WhatsApp",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 50,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 2. Add to Whitelist
```http
POST /admin/whitelist
```

**Request Body:**
```json
{
  "packageName": "com.google.android.youtube",
  "appName": "YouTube"
}
```

**Response:**
```json
{
  "success": true,
  "message": "App added to whitelist successfully",
  "data": {
    "app": {
      "id": "new-whitelist-uuid",
      "packageName": "com.google.android.youtube",
      "appName": "YouTube"
    }
  }
}
```

### 3. Update Whitelist App
```http
PATCH /admin/whitelist/:id
```

**Request Body:**
```json
{
  "packageName": "com.whatsapp.updated",
  "appName": "WhatsApp Business"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Whitelist app updated successfully",
  "data": {
    "app": {
      "id": "whitelist-uuid",
      "packageName": "com.whatsapp.updated",
      "appName": "WhatsApp Business"
    }
  }
}
```

### 4. Remove from Whitelist
```http
DELETE /admin/whitelist/:id
```

**Response:**
```json
{
  "success": true,
  "message": "App removed from whitelist successfully",
  "data": {
    "deletedApp": {
      "id": "whitelist-uuid",
      "packageName": "com.whatsapp",
      "appName": "WhatsApp"
    }
  }
}
```

---

## 💡 Suggestions Management

> **⚠️ Authentication Required:** Admin endpoints require JWT token. Public submission uses `x-api-key`.

### 1. Get All Suggestions
```http
GET /admin/suggestions?status=PENDING&type=BLOCK_WORD&page=1&limit=20
```

**Query Parameters:**
- `status` (optional) - PENDING, APPROVED, REJECTED
- `type` (optional) - BLOCK_WORD, UNBLOCK_WORD, WHITELIST_APP
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Suggestions retrieved",
  "data": {
    "suggestions": [
      {
        "id": "suggestion-uuid",
        "deviceId": {
          "deviceId": "device-123"
        },
        "type": "BLOCK_WORD",
        "content": "badword",
        "note": "User submitted this word",
        "status": "PENDING",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Review Suggestion
```http
PATCH /admin/suggestions/review/:id
```

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Suggestion reviewed successfully",
  "data": {
    "suggestionId": "suggestion-uuid",
    "status": "APPROVED"
  }
}
```

---

## 🎨 Customization Requests Management

> **⚠️ Authentication Required:** Admin endpoints require JWT token. Public submission uses `x-api-key`.

### 1. Get All Customization Requests
```http
GET /admin/customization/requests?status=PENDING&type=CUSTOM_BLOCK_KEYWORD&deviceId=device-123&page=1&limit=20
```

**Query Parameters:**
- `status` (optional) - PENDING, APPROVED, REJECTED
- `type` (optional) - CUSTOM_BLOCK_KEYWORD, CUSTOM_ALLOW_KEYWORD, CUSTOM_WHITELIST_APP, CUSTOM_BLACKLIST_APP
- `deviceId` (optional) - Filter by device
- `page`, `limit` (optional)

**Response:**
```json
{
  "success": true,
  "message": "Requests retrieved",
  "data": {
    "requests": [
      {
        "id": "request-uuid",
        "deviceId": "device-123",
        "type": "CUSTOM_BLOCK_KEYWORD",
        "content": "customword",
        "appName": null,
        "reason": "This word is inappropriate for my child",
        "status": "PENDING",
        "adminNote": null,
        "reviewedAt": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Review Customization Request
```http
PATCH /admin/customization/review/:id
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "adminNote": "Request approved and applied to device"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request reviewed successfully",
  "data": {
    "requestId": "request-uuid",
    "status": "APPROVED"
  }
}
```

**Note:** Approving automatically updates the device's custom configuration.

---

## 🗑️ Uninstall Requests Management

> **⚠️ Authentication Required:** Admin endpoints require JWT token. Public submission uses `x-api-key`.

### 1. Get All Uninstall Requests
```http
GET /admin/uninstall/requests?status=PENDING&page=1&limit=20
```

**Query Parameters:**
- `status` (optional) - PENDING, APPROVED, REJECTED
- `page`, `limit` (optional)

**Response:**
```json
{
  "success": true,
  "message": "Uninstall requests retrieved",
  "data": {
    "requests": [
      {
        "id": "uninstall-uuid",
        "deviceId": {
          "deviceId": "device-123",
          "metadata": {
            "model": "Samsung Galaxy",
            "androidVersion": "13"
          }
        },
        "reason": "Child is old enough now",
        "imageUrls": [
          "https://r2-url.com/image1.jpg",
          "https://r2-url.com/image2.jpg"
        ],
        "status": "PENDING",
        "adminNote": null,
        "unlockCode": null,
        "reviewedAt": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 2. Review Uninstall Request
```http
PATCH /admin/uninstall/review/:id
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "adminNote": "Verified and approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Uninstall request reviewed successfully",
  "data": {
    "requestId": "uninstall-uuid",
    "status": "APPROVED",
    "unlockCode": "A1B2C3D4",
    "adminNote": "Verified and approved"
  }
}
```

**Note:** 
- Unlock code is auto-generated only when status is APPROVED
- Images are automatically deleted from R2 storage after review

---

## ⚠️ Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation error, missing fields)
- `401` - Unauthorized (missing admin key)
- `403` - Forbidden (invalid admin key)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

**Example Error Responses:**

```json
// Missing required fields
{
  "success": false,
  "message": "Missing required fields: name, displayName"
}

// Resource not found
{
  "success": false,
  "message": "Category not found"
}

// Cannot delete (constraint violation)
{
  "success": false,
  "message": "Cannot delete category. 25 keyword(s) are using this category. Please reassign or delete those keywords first."
}

// Authentication error
{
  "success": false,
  "message": "Invalid admin key."
}
```

---

## 📋 General Notes

### Pagination
All list endpoints support pagination with consistent query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

All paginated responses include:
```json
{
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Authentication
All admin endpoints (except `/auth/login`) require a valid JWT token in the `Authorization` header.

**How to authenticate:**
1. Login via `POST /auth/login` to get your token
2. Include the token in all subsequent requests

**Example with Axios:**
```javascript
// After login, store the token
const token = loginResponse.data.token;

// Set default header for all requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Or per-request
axios.get('/admin/categories', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Example with Fetch:**
```javascript
fetch('http://localhost:5000/api/v1/admin/categories', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### CORS
The API supports CORS. Configure allowed origins in the `.env` file:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Rate Limiting
- Global: 100 requests per 15 minutes
- This applies to all admin endpoints

---

## 🚀 Quick Start Example

```javascript
// 1. Login to get token
const login = async (username, password) => {
  const response = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  return data.data.token;
};

// 2. Use token for requests
const getCategories = async (token) => {
  const response = await fetch('http://localhost:5000/api/v1/admin/categories', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log(data);
};
```
