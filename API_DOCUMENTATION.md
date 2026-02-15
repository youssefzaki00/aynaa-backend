# Wekayaa Admin Dashboard - API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All admin endpoints require the `x-admin-key` header:
```
x-admin-key: your-admin-key-here
```

---

## 📊 Categories Management

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
All admin endpoints require the `x-admin-key` header. Set this in your axios/fetch config:

```javascript
// Axios example
axios.defaults.headers.common['x-admin-key'] = 'your-admin-key';

// Fetch example
fetch(url, {
  headers: {
    'x-admin-key': 'your-admin-key',
    'Content-Type': 'application/json'
  }
})
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
// Get all categories
const getCategories = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/v1/admin/categories', {
      headers: {
        'x-admin-key': 'your-admin-key'
      }
    });
    const data = await response.json();
    console.log(data.data.categories);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Create a keyword
const createKeyword = async (word, categoryId) => {
  try {
    const response = await fetch('http://localhost:5000/api/v1/admin/keywords', {
      method: 'POST',
      headers: {
        'x-admin-key': 'your-admin-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ word, categoryId })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Review suggestion
const reviewSuggestion = async (suggestionId, status) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/v1/admin/suggestions/review/${suggestionId}`,
      {
        method: 'PATCH',
        headers: {
          'x-admin-key': 'your-admin-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```
