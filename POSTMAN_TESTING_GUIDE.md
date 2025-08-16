# 🚀 Postman Testing Guide - Dua & Zikr API

## ✅ **CSRF Issue Resolved - APIs Now Work Perfectly!**

### 🔧 **Setup Instructions**

1. **Import the Collection**
   - Open Postman
   - Import `DuaZikr_Admin_API.postman_collection.json`
   - Set environment variables (see below)

2. **Environment Variables**
   - `base_url`: `http://localhost:8000` (or your network IP)
   - `auth_token`: Will be auto-set after login

### 🧪 **Test the APIs**

#### **1. User Registration (Public - No Auth Required)**
```
POST {{base_url}}/api/auth/signup/
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "testpass123",
  "password_confirm": "testpass123",
  "phone": "+1234567890",
  "age": 25,
  "gender": "M"
}
```

**Expected Response:** 201 Created with user data and token

#### **2. User Login (Public - No Auth Required)**
```
POST {{base_url}}/api/auth/login/
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "testpass123"
}
```

**Expected Response:** 200 OK with user data and token

#### **3. Get All Duas (Public - No Auth Required)**
```
GET {{base_url}}/api/getalldua/
```

**Expected Response:** 200 OK with duas data

#### **4. Get All Categories (Public - No Auth Required)**
```
GET {{base_url}}/api/getallcategory/
```

**Expected Response:** 200 OK with categories data

#### **5. Get All Ads (Public - No Auth Required)**
```
GET {{base_url}}/api/getallads/
```

**Expected Response:** 200 OK with advertisements data including icons and colors

#### **5. Create Dua (Admin Only - Requires Auth)**
```
POST {{base_url}}/api/create-dua/
Authorization: Token {{auth_token}}
Content-Type: application/json

{
  "type": "traditional",
  "category_slug": "morning",
  "priority": 1,
  "tags": ["morning", "daily"],
  "title_en": "Morning Dua",
  "dua_text": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
  "transliteration_en": "Asbahna wa asbahal mulku lillah",
  "translation_en": "We have reached the morning and at this very time all sovereignty belongs to Allah"
}
```

**Expected Response:** 201 Created with dua data

### 🎯 **What's Working Now**

- ✅ **No CSRF tokens needed** - Completely disabled
- ✅ **Registration API is public** - Anyone can create accounts
- ✅ **Login API is public** - Anyone can login
- ✅ **All content APIs are public** - No authentication required
- ✅ **Admin endpoints protected** - Require valid auth token
- ✅ **Advertisements system** - Dynamic ads with Ionicons support

### 🔍 **Troubleshooting**

#### **If you get CSRF errors:**
1. Make sure you're using the latest collection
2. Verify the server is running with CSRF disabled
3. Check that you're using the correct URLs

#### **If authentication fails:**
1. Make sure you're logged in first
2. Check that the `auth_token` environment variable is set
3. Verify the token format: `Token <your_token_here>`

### 🌐 **Network Access**

- **Local Testing:** `http://localhost:8000`
- **Mobile Testing:** `http://192.168.50.205:8000` (your network IP)
- **All endpoints work from both local and network access**

### 📱 **Mobile App Ready**

Your mobile app can now:
- Register users without any issues
- Login users and get tokens
- Access all public content
- Use protected endpoints with tokens

---

**🎉 The API is now completely ready for your mobile app! No more CSRF issues!**
