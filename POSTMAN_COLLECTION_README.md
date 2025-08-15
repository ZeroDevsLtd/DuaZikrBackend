# 📚 Dua & Zikr Admin API - Postman Collection

## 🎯 Overview

This Postman collection provides a complete testing environment for the Dua & Zikr Backend API, with special focus on admin functionality for managing duas, categories, and user management.

## 🚀 Quick Start

### 1. Import the Collection
1. Download `DuaZikr_Admin_API.postman_collection.json`
2. Open Postman
3. Click "Import" → "Upload Files" → Select the JSON file
4. The collection will be imported with all endpoints organized

### 2. Set Up Environment Variables
The collection uses two environment variables:
- `{{base_url}}`: Set to `http://localhost:8000` (or your server URL)
- `{{auth_token}}`: Will be automatically set after login

### 3. Start Testing
1. **First**: Run "Admin Login" to get authentication token
2. **Then**: Use any admin endpoints that require authentication

## 🔐 Authentication Flow

### Step 1: Admin Login
```
POST {{base_url}}/api/auth/login/
Body: {
  "email": "admin@example.com",
  "password": "123"
}
```

**Response**: You'll receive a token that's automatically saved to `{{auth_token}}`

### Step 2: Use Admin Endpoints
All admin endpoints now automatically include:
```
Authorization: Token {{auth_token}}
```

## 👑 Admin Dua Management

### Creating New Duas

#### Option 1: Use Pre-configured Templates
- **"Create New Dua"**: Complete example with all fields filled
- **"Create Dua - Simple Template"**: Easier to modify template
- **"Quranic Dua Template"**: Template for Quranic duas
- **"Hadith Dua Template"**: Template for Hadith-based duas

#### Option 2: Create Custom Dua
1. Copy any template request
2. Modify the fields as needed
3. Send the request

### Required Fields for Dua Creation
```json
{
  "type": "quranic|hadith|traditional",
  "category": 1,  // Category ID from /api/getallcategory/
  "priority": 1,
  "tags": ["tag1", "tag2"],
  "title_en": "English Title",
  "title_bn": "বাংলা শিরোনাম",
  "title_ar": "العنوان العربي",
  "title_ur": "اردو عنوان",
  "title_de": "Deutscher Titel",
  "title_es": "Título en Español",
  "title_id": "Judul dalam Bahasa Indonesia",
  "dua_text": "Arabic text here",
  "transliteration_en": "English transliteration",
  "translation_en": "English translation",
  "explanation_en": "English explanation",
  "benefits_en": "English benefits"
}
```

### Multi-language Fields
Each dua supports 7 languages:
- **English (en)** - Primary language
- **Bengali (bn)** - বাংলা
- **Arabic (ar)** - العربية
- **Urdu (ur)** - اردو
- **German (de)** - Deutsch
- **Spanish (es)** - Español
- **Indonesian (id)** - Bahasa Indonesia

**Note**: You only need to fill the languages you want to support. Empty fields will be stored as empty strings.

## 📋 Available Categories

Use these category IDs when creating duas:

| ID | Category | Slug |
|----|----------|------|
| 1 | Salah | salah |
| 2 | Morning | morning |
| 3 | Evening | evening |
| 4 | Sleep | sleep |
| 5 | Ramadan | ramadan |
| 6 | Food & Drink | food-drink |
| 7 | Illness | illness |
| 8 | Ruqyah | ruqyah |
| 9 | Family | family |
| 10 | Rizq | rizq |
| 11 | Gratitude | gratitude |
| 12 | Purification | purification |
| 13 | Hajj & Umrah | hajj-umrah |
| 14 | Travel | travel |
| 15 | Nature | nature |

## 🔓 Public Endpoints (No Auth Required)

### Test These First
- **Get All Duas**: `/api/getalldua/`
- **Get All Categories**: `/api/getallcategory/`
- **Health Check**: `/health/`

### Search & Filter
- **Search Duas**: `/api/search/?q=search_term`
- **Filter by Category**: `/api/filter/?category=category_slug`

## 🔒 Protected Endpoints (Auth Required)

### User Management
- **Get Profile**: `/api/auth/profile/`
- **Update Profile**: `/api/auth/profile/` (PUT)
- **Change Password**: `/api/auth/change-password/`
- **User Info**: `/api/auth/me/`
- **Logout**: `/api/auth/logout/`

## 👑 Admin Endpoints (Staff Only)

### Dua Management
- **Create Dua**: `/api/create-dua/` (POST)
  - Requires: `Authorization: Token {{auth_token}}`
  - Body: Complete dua data in JSON format

### Admin Interface
- **Django Admin**: `/admin/`
  - Username: `admin@example.com`
  - Password: `123`

## 📝 Sample Dua Creation Workflow

### 1. Login as Admin
```
POST {{base_url}}/api/auth/login/
Body: {
  "email": "admin@example.com",
  "password": "123"
}
```

### 2. Create a New Dua
```
POST {{base_url}}/api/create-dua/
Headers: {
  "Authorization": "Token {{auth_token}}",
  "Content-Type": "application/json"
}
Body: [Use any template from the collection]
```

### 3. Verify Creation
```
GET {{base_url}}/api/getalldua/
```
Check if your new dua appears in the list.

## 🎨 Customization Tips

### Modify Templates
1. **Copy a template request**
2. **Change the fields** you want to modify
3. **Keep the structure** intact
4. **Test with a small change first**

### Common Modifications
- **Change category**: Update `"category": 1` to desired category ID
- **Add/remove tags**: Modify `"tags": ["tag1", "tag2"]`
- **Update priority**: Change `"priority": 1` (1=highest, 5=lowest)
- **Modify difficulty**: Change `"difficulty": "beginner"` (beginner/intermediate/advanced)

### Language Support
- **Full support**: Fill all 7 language fields
- **Partial support**: Fill only the languages you need
- **English only**: Fill only `title_en`, `translation_en`, etc.

## 🧪 Testing Scenarios

### Scenario 1: Create Quranic Dua
1. Use "Quranic Dua Template"
2. Modify Arabic text and translations
3. Set appropriate category (e.g., 1 for Salah)
4. Send request
5. Verify in `/api/getalldua/`

### Scenario 2: Create Morning Dua
1. Use "Hadith Dua Template"
2. Set category to 2 (Morning)
3. Add appropriate tags: `["morning", "daily", "protection"]`
4. Set `when_to_recite` to `["Morning"]`
5. Send request

### Scenario 3: Bulk Dua Creation
1. Copy a working request
2. Modify the data for each new dua
3. Send multiple requests
4. Verify all appear in the list

## ⚠️ Important Notes

### Authentication
- **Admin access required** for creating duas
- **Token expires** when you logout
- **Re-login** if you get 401/403 errors

### Data Validation
- **Required fields**: type, category, priority, title_en, dua_text
- **Category must exist**: Use valid category IDs
- **Language fields**: Can be empty but structure must be maintained

### Error Handling
- **400 Bad Request**: Check your JSON format and required fields
- **401 Unauthorized**: Re-login to get fresh token
- **403 Forbidden**: Ensure you're logged in as admin
- **500 Server Error**: Check server logs

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid token" error
- Re-run the "Admin Login" request
- Check if token was automatically set

#### 2. "Category not found" error
- Verify category ID exists in `/api/getallcategory/`
- Use valid category IDs (1-15)

#### 3. "Permission denied" error
- Ensure you're logged in as admin
- Check if user has `is_staff=True`

#### 4. JSON parsing errors
- Validate JSON format
- Check for missing quotes or commas
- Use Postman's JSON validation

### Debug Steps
1. **Check server logs** for detailed error messages
2. **Verify authentication** with a simple GET request
3. **Test with minimal data** first
4. **Use Postman console** to see request/response details

## 📚 Additional Resources

### API Documentation
- **Root Page**: `{{base_url}}/` - Complete API overview
- **Health Check**: `{{base_url}}/health/` - API status
- **API Info**: `{{base_url}}/api/info/` - Detailed statistics

### Admin Interface
- **Django Admin**: `{{base_url}}/admin/` - Web-based content management
- **Username**: `admin@example.com`
- **Password**: `123`

### Sample Data
- **Existing Duas**: Check `/api/getalldua/` for examples
- **Categories**: Check `/api/getallcategory/` for available categories
- **Templates**: Use the pre-configured templates in the collection

## 🎉 Success Metrics

After successful setup, you should be able to:
- ✅ **Login as admin** and get authentication token
- ✅ **Create new duas** with multi-language support
- ✅ **View all duas** in the public API
- ✅ **Manage content** through Django admin
- ✅ **Test all endpoints** without errors

---

**🕌 Built with ❤️ by ZeroDevs Team**

**Need Help?** Check the main README.md for project setup and troubleshooting.
